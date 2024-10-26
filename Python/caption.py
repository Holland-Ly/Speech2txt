import os
from tqdm import tqdm
import ffmpeg

def add_captions_to_video(video_folder='video', caption_folder='caption', output_folder='captioned_videos'):
    # Ensure output folder exists
    os.makedirs(output_folder, exist_ok=True)

    # Get list of video files
    video_files = [f for f in os.listdir(video_folder) if f.endswith(('.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.webm'))]

    for video_file in tqdm(video_files, desc="Processing videos"):
        video_path = os.path.join(video_folder, video_file)
        caption_file = os.path.join(caption_folder, os.path.splitext(video_file)[0] + '.srt')
        
        # Generate output filename (same as input, but with .mp4 extension)
        output_filename = f"{os.path.splitext(video_file)[0]}.mp4"
        output_path = os.path.join(output_folder, output_filename)

        # Check if corresponding caption file exists
        if not os.path.exists(caption_file):
            print(f"No caption file found for {video_file}. Skipping...")
            continue

        video_input_stream = ffmpeg.input(video_path)
        subtitle_input_stream = ffmpeg.input(caption_file)

        stream = ffmpeg.output(video_input_stream, output_path,
                               vf=f"subtitles={caption_file}",
                               vcodec='libx264',
                               acodec='aac')
        ffmpeg.run(stream, overwrite_output=True)

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Add captions to video files.")
    parser.add_argument("--video_folder", default="video", help="Folder containing input video files")
    parser.add_argument("--caption_folder", default="caption", help="Folder containing input caption files")
    parser.add_argument("--output_folder", default="captioned_videos", help="Folder for output captioned videos")

    args = parser.parse_args()

    add_captions_to_video(args.video_folder, args.caption_folder, args.output_folder)
