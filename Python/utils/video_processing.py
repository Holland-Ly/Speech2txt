import ffmpeg
import os
import logging
import traceback
from pydub import AudioSegment
from pydub.silence import detect_silence, split_on_silence
from utils.audio_processing import extract_audio_from_video, split_audio_on_silence
from utils.transcription import transcribe_audio_chunks
from utils.output_generation import create_srt_file, create_txt_file
from utils.file_operations import is_audio_file, is_video_file

def create_ffmpeg_stream(video_path, caption_file, output_path):
    video_input_stream = ffmpeg.input(video_path)
    subtitle_input_stream = ffmpeg.input(caption_file)

    return ffmpeg.output(video_input_stream, output_path,
                         vf=f"subtitles={caption_file}",
                         vcodec='libx264',
                         acodec='aac')

def run_ffmpeg_stream(stream):
    ffmpeg.run(stream, overwrite_output=True)

def process_file(path, output):
    try:
        logging.info(f"Starting transcription for {path}")
        if is_video_file(path):
            audio_filename = os.path.splitext(os.path.basename(path))[0] + '.wav'
            audio_output = os.path.join('audio', audio_filename)
            extract_audio_from_video(path, audio_output)
        elif is_audio_file(path):
            audio_output = path
        else:
            raise ValueError(f"Unsupported file type: {path}")

        sound = AudioSegment.from_file(audio_output)
        logging.info(f"Audio file loaded successfully, duration: {len(sound)/1000} seconds")

        logging.info("Detecting silence")
        silence_thresh = sound.dBFS - 14
        min_silence_len = 500
        chunks,silences = split_audio_on_silence(sound, min_silence_len=min_silence_len, silence_thresh=silence_thresh)
        logging.info(f"Audio split into {len(chunks)} chunks")

        folder_name = "audio-chunks"
        sub_folder_name = os.path.join(folder_name, os.path.splitext(os.path.basename(path))[0])
        os.makedirs(sub_folder_name, exist_ok=True)

        transcription = transcribe_audio_chunks(sound, chunks, sub_folder_name,silences)
        logging.info(f"Transcription completed, {len(transcription)} segments generated")

        if not transcription:
            logging.warning("No transcription generated")
            return None

        # Create TXT file
        txt_output = output + '.txt'
        create_txt_file(transcription, txt_output)
        logging.info(f"TXT file created: {txt_output}")

        # Create SRT file
        srt_output = output + '.srt'
        create_srt_file(transcription, srt_output)
        logging.info(f"SRT file created: {srt_output}")

        return srt_output

    except Exception as e:
        logging.error(f"Error in process_file: {str(e)}")
        logging.error(traceback.format_exc())
        raise
