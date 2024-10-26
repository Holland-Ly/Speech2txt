import os
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from utils.video_processing import process_file

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
CAPTION_FOLDER = 'captions'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'webm'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['CAPTION_FOLDER'] = CAPTION_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'video' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['video']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        video_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(video_path)
        
        # Process the video and generate caption
        caption_filename = os.path.splitext(filename)[0]
        output_path = os.path.join(app.config['CAPTION_FOLDER'], caption_filename)
        process_file(video_path, output_path)
        
        caption_url = f'/download/{caption_filename}.srt'
        return jsonify({'caption_url': caption_url}), 200
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    return send_file(os.path.join(app.config['CAPTION_FOLDER'], filename), as_attachment=True)

if __name__ == '__main__':
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(CAPTION_FOLDER, exist_ok=True)
    app.run(debug=True)