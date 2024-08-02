# Speech2txt

This Python script transcribes video and audio files using speech recognition. It supports various audio and video formats and provides the transcribed text as output.

## Features

- Transcribes audio from video files (mp4, avi, mov, mkv, flv, wmv, webm)
- Transcribes audio files directly (mp3, wav, flac, aac, ogg, wma)
- Splits audio into chunks based on silence for improved transcription
- Generates a text file with the transcribed captions
- Configurable logging for monitoring the transcription process

## Requirements

- Python 3.8+
- moviepy
- SpeechRecognition
- pydub
- ffmpeg (for audio/video file support)

## Installation

1. Clone the repository:

git clone https://github.com/yourusername/video-audio-transcription.git
text

2. Install the required dependencies:

pip install -r requirements.txt
text

3. Install ffmpeg:

- For macOS (using Homebrew):
  ```
  brew install ffmpeg
  ```
- For Linux (using apt):
  ```
  sudo apt install ffmpeg
  ```
- For Windows, download the ffmpeg binaries from the official website and add the bin directory to your system's PATH.

## Usage

1. Place the video or audio files you want to transcribe in the `job` folder (or specify a different folder using the `--folder` argument).

2. Run the script:

python main.py [--folder FOLDER] [--log]
text

Arguments:

- `--folder FOLDER`: Specify the folder containing the video/audio files (default: 'job').
- `--log`: Enable logging for monitoring the transcription process (default: True).

3. The script will process each video/audio file in the specified folder and generate a corresponding text file with the transcribed captions in the `caption` folder.

## Folder Structure

The script creates the following folders:

- `audio`: Stores the extracted audio files from video files.
- `video`: Stores the video files (if any).
- `caption`: Stores the generated text files with transcribed captions.
- `audio-chunks`: Stores the audio chunks created during the transcription process.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.As a hobbyist maintainer, I deeply appreciate all contributions to this project. While I cannot guarantee immediate responses or fixes, I will do my best to review and address issues and pull requests as time allows. Thank you for your understanding and support!

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgements

- [MoviePy](https://zulko.github.io/moviepy/) - Python library for video editing.
- [SpeechRecognition](https://pypi.org/project/SpeechRecognition/) - Library for performing speech recognition with support for several engines and APIs.
- [Pydub](https://github.com/jiaaro/pydub) - Python library for audio manipulation.
- The code is written with support of perplexity.ai
