import os
import uuid
import json
import time
from threading import Thread, Event
from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
from werkzeug.utils import secure_filename
from utils.video_processing import process_video_with_progress

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3001", "http://localhost:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Disposition"],
        "supports_credentials": True
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
paused_tasks = {}

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
    print(request.files['video'])
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
            'message': 'Starting processing...',
            'file_info': {
                'video_path': video_path,
                'audio_path': os.path.join(app.config['AUDIO_FOLDER'], filename),
                'caption_path': os.path.join(app.config['CAPTION_FOLDER'], filename)
            }
        }
        
        thread = Thread(target=process_video_with_progress, 
                       args=(video_path, task_id, progress_status, paused_tasks))
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

@app.route('/', methods=['GET'])
def index():
    return jsonify({"message": "Hello, World!"}), 200

@app.route('/pause/<task_id>', methods=['POST'])
def pause_task(task_id):
    try:
        data = request.get_json()
        paused = data.get('paused', False)
        
        if task_id not in progress_status:
            return jsonify({'error': 'Task not found'}), 404
            
        if paused:
            paused_tasks[task_id] = Event()
            progress_status[task_id]['message'] = 'Paused'
        else:
            if task_id in paused_tasks:
                paused_tasks[task_id].set()
                del paused_tasks[task_id]
                progress_status[task_id]['message'] = 'Processing...'
            
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/delete/<task_id>', methods=['POST'])
def delete_task(task_id):
    try:
        if task_id not in progress_status:
            return jsonify({'error': 'Task not found'}), 404
            
        # Get the file paths before deleting status
        file_info = progress_status[task_id].get('file_info', {})
        video_path = file_info.get('video_path')
        audio_path = file_info.get('audio_path')
        caption_path = file_info.get('caption_path')
        
        # Remove from progress tracking
        if task_id in progress_status:
            del progress_status[task_id]
        
        # Remove from paused tasks if exists
        if task_id in paused_tasks:
            paused_tasks[task_id].set()  # Set event before deleting to prevent hanging
            del paused_tasks[task_id]
            
        # Delete associated files
        for path in [video_path, audio_path, caption_path]:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except OSError as e:
                    print(f"Error deleting file {path}: {e}")
                    
        # Clean up any .srt and .txt files
        if caption_path:
            base_path = os.path.splitext(caption_path)[0]
            for ext in ['.srt', '.txt']:
                full_path = base_path + ext
                if os.path.exists(full_path):
                    try:
                        os.remove(full_path)
                    except OSError as e:
                        print(f"Error deleting file {full_path}: {e}")
                
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Create necessary directories if they don't exist
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(CAPTION_FOLDER, exist_ok=True)
    os.makedirs(AUDIO_FOLDER, exist_ok=True)
    # Run the Flask app
    app.run(host='0.0.0.0', port=5001, debug=True, threaded=True)
