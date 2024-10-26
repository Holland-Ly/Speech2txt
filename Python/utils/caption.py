import os
from utils.file_operations import get_caption_file_path, get_output_file_path
from utils.ffmpeg_operations import create_ffmpeg_stream, run_ffmpeg_stream

def add_captions_to_video(video_file, video_folder, caption_folder, output_folder):
    video_path = os.path.join(video_folder, video_file)
    caption_file = get_caption_file_path(video_file, caption_folder)
    output_path = get_output_file_path(video_file, output_folder)

    if not os.path.exists(caption_file):
        print(f"No caption file found for {video_file}. Skipping...")
        return

    stream = create_ffmpeg_stream(video_path, caption_file, output_path)
    run_ffmpeg_stream(stream)