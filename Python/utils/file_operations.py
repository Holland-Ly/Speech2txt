import os

def is_audio_file(filename):
    audio_extensions = {'.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'}
    return os.path.splitext(filename)[1].lower() in audio_extensions

def is_video_file(filename):
    video_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.webm'}
    return os.path.splitext(filename)[1].lower() in video_extensions