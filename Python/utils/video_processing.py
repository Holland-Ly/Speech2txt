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
import json
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

def process_video_with_progress(path, task_id, progress_status):
    temp_files = []  # Keep track of files to cleanup
    try:
        # Extract audio (10%)
        progress_status[task_id].update({
            'percent': 10,
            'message': 'Extracting audio...'
        })
        audio_filename = os.path.splitext(os.path.basename(path))[0] + '.wav'
        audio_output = os.path.join('audio', audio_filename)
        extract_audio_from_video(path, audio_output)
        temp_files.append(audio_output)
        temp_files.append(path)  # Add original video to cleanup

        # Load audio (20%)
        progress_status[task_id].update({
            'percent': 20,
            'message': 'Loading audio...'
        })
        sound = AudioSegment.from_file(audio_output)

        # Split audio (30%)
        progress_status[task_id].update({
            'percent': 30,
            'message': 'Splitting audio...'
        })
        silence_thresh = sound.dBFS - 14
        min_silence_len = 500
        chunks, silences = split_audio_on_silence(sound, min_silence_len=min_silence_len, silence_thresh=silence_thresh)
        
        # Start transcription process (30-90%)
        folder_name = "audio-chunks"
        sub_folder_name = os.path.join(folder_name, os.path.splitext(os.path.basename(path))[0])
        os.makedirs(sub_folder_name, exist_ok=True)

        # Start transcription with progress tracking
        transcription = []
        for progress in transcribe_audio_chunks(sound, chunks, sub_folder_name, silences):
            if progress['type'] == 'progress':
                current_progress = 30 + (progress['chunk'] / progress['total'] * 60)
                progress_status[task_id].update({
                    'percent': int(current_progress),
                    'message': f'Transcribing chunk {progress["chunk"]} of {progress["total"]}...'
                })
            elif progress['type'] == 'text':
                progress_status[task_id].update({
                    'message': f'Transcribed chunk {progress["chunk"]}: {progress["text"][:30]}...'
                })
            elif progress['type'] == 'complete':
                transcription = progress['transcription']
            elif progress['type'] == 'error':
                progress_status[task_id].update({
                    'message': f'Error in chunk {progress["chunk"]}: {progress["message"]}'
                })

        # Update progress based on completion
        progress_status[task_id].update({
            'percent': 90,
            'message': 'Generating caption files...'
        })

        # Generate output files (90-100%)
        caption_filename = os.path.splitext(os.path.basename(path))[0]
        output_path = os.path.join('captions', caption_filename)
        
        create_srt_file(transcription, output_path + '.srt')
        create_txt_file(transcription, output_path + '.txt')

        # Complete
        progress_status[task_id].update({
            'percent': 100,
            'status': 'completed',
            'message': 'Processing completed',
            'download_url': f'/download/{caption_filename}.srt'
        })

        # After successful completion, cleanup files
        for temp_file in temp_files:
            if os.path.exists(temp_file):
                os.remove(temp_file)
        
        # Cleanup audio chunks folder
        chunk_folder = os.path.join('audio-chunks', os.path.splitext(os.path.basename(path))[0])
        if os.path.exists(chunk_folder):
            for chunk_file in os.listdir(chunk_folder):
                os.remove(os.path.join(chunk_folder, chunk_file))
            os.rmdir(chunk_folder)

        # Cleanup empty audio folder
        audio_folder = os.path.dirname(audio_output)
        if os.path.exists(audio_folder) and not os.listdir(audio_folder):
            os.rmdir(audio_folder)

        # Cleanup empty uploads folder
        upload_folder = os.path.dirname(path)
        if os.path.exists(upload_folder) and not os.listdir(upload_folder):
            os.rmdir(upload_folder)

    except Exception as e:
        # Cleanup attempt on error
        for temp_file in temp_files:
            if os.path.exists(temp_file):
                os.remove(temp_file)
        
        progress_status[task_id].update({
            'status': 'error',
            'message': f'Error: {str(e)}',
            'percent': 0
        })
