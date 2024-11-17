import os
import uuid
import json
import time
from threading import Thread
from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
from werkzeug.utils import secure_filename
from utils.video_processing import process_video_with_progress

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type"]
    }
})

UPLOAD_FOLDER = 'uploads'
CAPTION_FOLDER = 'captions'
AUDIO_FOLDER = 'audio'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'webm'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['CAPTION_FOLDER'] = CAPTION_FOLDER
app.config['AUDIO_FOLDER'] = AUDIO_FOLDER
# Dictionary to store progress status for each task
progress_status = {}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/progress/<task_id>', methods=['GET'])
def get_progress(task_id):
    def generate():
        try:
            while True:
                if task_id in progress_status:
                    progress = progress_status[task_id]
                    data = json.dumps({
                        'progress': progress.get('percent', 0),
                        'status': progress.get('status', 'processing'),
                        'message': progress.get('message', 'Processing...'),
                        'download_url': progress.get('download_url', None),
                          'download_url_audio': progress.get('download_url_audio', None)
                    })
                    yield f"data: {data}\n\n"
                    
                    if progress.get('status') in ['completed', 'error']:
                        break
                time.sleep(1)  # Reduced polling frequency
        except Exception as e:
            print(f"Error in progress stream: {str(e)}")
            yield f"data: {json.dumps({'status': 'error', 'message': str(e)})}\n\n"
    
    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    )

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'video' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['video']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file and allowed_file(file.filename):
        task_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        video_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(video_path)
        
        progress_status[task_id] = {
            'percent': 0,
            'status': 'processing',
            'message': 'Starting processing...'
        }
        
        thread = Thread(target=process_video_with_progress, 
                       args=(video_path, task_id, progress_status))
        thread.daemon = True
        thread.start()
        
        return jsonify({'task_id': task_id}), 200
        
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    try:
        file_path = os.path.join(app.config['CAPTION_FOLDER'], filename)
        if os.path.exists(file_path):
            return send_file(
                file_path,
                as_attachment=True,
                download_name=filename
            )
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        print(f"Error in download: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/download/audio/<filename>', methods=['GET'])
def download_audio(filename):
    print(f"Downloading audio: {filename}")
    try:
        file_path = os.path.join(app.config['AUDIO_FOLDER'], filename)
        if os.path.exists(file_path):
            return send_file(
                file_path,
                as_attachment=True,
                download_name=filename
            )
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        print(f"Error in download: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/update-caption/<file_name>', methods=['POST'])
def update_caption(file_name):
    data = request.json
    content = data.get('content', '')

    # Ensure the file name has the correct .srt extension
    if not file_name.endswith('.srt'):
        file_name = f"{os.path.splitext(file_name)[0]}.srt"

    # Save the updated content to the appropriate file
    caption_path = os.path.join(app.config['CAPTION_FOLDER'], file_name)
    print(f"Updating caption for {caption_path}: {content}")
    with open(caption_path, 'w') as f:
        f.write(content)
    return jsonify({"message": "Caption updated successfully"}), 200

if __name__ == '__main__':
    # Create necessary directories if they don't exist
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(CAPTION_FOLDER, exist_ok=True)
    os.makedirs(AUDIO_FOLDER, exist_ok=True)
    # Run the Flask app
    app.run(host='0.0.0.0', port=5001, debug=True, threaded=True)
