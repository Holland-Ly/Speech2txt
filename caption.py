import os
from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip
from tqdm import tqdm
import ffmpeg

def add_captions_to_video(video_folder, caption_folder, output_folder):
    # Ensure output folder exists
    os.makedirs(output_folder, exist_ok=True)

    # Get list of video files
    video_files = [f for f in os.listdir(video_folder) if f.endswith(('.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.webm'))]

    for video_file in tqdm(video_files, desc="Processing videos"):
        video_path = os.path.join(video_folder, video_file)
        caption_file = os.path.join(caption_folder, os.path.splitext(video_file)[0] + '.srt')
        print(caption_file)
        output_path = os.path.join(output_folder, f"captioned_{video_file}")

        # Check if corresponding caption file exists
        if not os.path.exists(caption_file):
            print(f"No caption file found for {video_file}. Skipping...")
            continue


        video_input_stream = ffmpeg.input(video_path)
        subtitle_input_stream = ffmpeg.input(caption_file)
        output_video = f"output-{video_file}.mp4"
        subtitle_track_title = caption_file.replace(".srt", "")

        stream = ffmpeg.output(video_input_stream, output_video,

                               vf=f"subtitles={caption_file}")
        ffmpeg.run(stream, overwrite_output=True)

if __name__ == "__main__":
    video_folder = "job"
    caption_folder = "caption"
    output_folder = "captioned_videos"
    add_captions_to_video(video_folder, caption_folder, output_folder)
