# Speech2txt

A web application that transcribes video files into text using speech recognition. Upload videos through a user-friendly interface and get transcribed captions in SRT format.

## Features

- Web-based interface for easy video upload
- Supports multiple video formats (mp4, avi, mov, mkv, flv, wmv, webm)
- Real-time progress tracking during transcription
- Downloads captions in SRT format
- Docker support for easy deployment

## Prerequisites

- Docker and Docker Compose
- Git

## Quick Start

1. Clone the repository:

```bash
git clone https://github.com/yourusername/speech2txt.git
cd speech2txt

```

3. Access the web interface at: http://localhost:3000

## Manual Installation

If you prefer to run without Docker:

1. Set up the Python backend:

```bash
cd Python
python -m venv venv
source venv/bin/activate # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. Set up the React frontend:

```bash
cd webapp/video2txt
npm install
```

3. Start the application:

````bash
On macOS/Linux
./start.sh
On Windows (run these in separate terminals)
cd Python && python main.py
cd webapp/video2txt && npm start```
````

## Usage

1. Open the web interface (http://localhost:3000)
2. Drag and drop video files or click to select files
3. Click "Upload" to start the transcription process
4. Monitor the progress in real-time
5. Download the SRT file when processing is complete

## Project Structure

- `/Python` - Backend Flask application
  - `/utils` - Video processing and transcription logic
  - `main.py` - Flask server
- `/webapp/video2txt` - React frontend application
  - `/src` - React components and logic
  - `/public` - Static assets

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Built with Flask and React
- Uses OpenAI Whisper for speech recognition
- MoviePy for video processing
- FFmpeg for media handling
