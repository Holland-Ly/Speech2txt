import moviepy.editor as mp
import speech_recognition as sr 
import os 
import argparse
from pydub import AudioSegment
from pydub.silence import split_on_silence
import logging
from tqdm import tqdm
import traceback

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def init_folders(source, display_logging):
    folders = ['audio', 'video', 'caption', source]
    for folder in folders:
        os.makedirs(folder, exist_ok=True)
    if display_logging:
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    else:
        logging.disable(logging.CRITICAL)
    return source

def is_audio_file(filename):
    audio_extensions = {'.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'}
    return os.path.splitext(filename)[1].lower() in audio_extensions

def is_video_file(filename):
    video_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.webm'}
    return os.path.splitext(filename)[1].lower() in video_extensions

def transcribe_audio(path):
    r = sr.Recognizer()
    
    with sr.AudioFile(path) as source:
        audio_listened = r.record(source)
        try:
            text = r.recognize_whisper(audio_listened)
            return text
        except sr.UnknownValueError:
            logging.warning(f"Could not understand audio in {path}")
            return ""

def get_large_audio_transcription_on_silence(path):
    try:
        logging.info(f"Starting transcription for {path}")
        sound = AudioSegment.from_file(path)
        logging.info(f"Audio file loaded successfully")
        
        logging.info("Splitting audio on silence")
        chunks = split_on_silence(sound,
            min_silence_len=500,
            silence_thresh=sound.dBFS-14,
            keep_silence=500
        )
        
        logging.info(f"Audio split into {len(chunks)} chunks")
        
        folder_name = "audio-chunks"
        sub_folder_name = os.path.join(folder_name, os.path.splitext(os.path.basename(path))[0])
        os.makedirs(sub_folder_name, exist_ok=True)
        
        whole_text = []
        current_time = 0
        
        for i, audio_chunk in tqdm(enumerate(chunks, start=1), total=len(chunks), desc="Processing and transcribing chunks"):
            try:
                chunk_filename = os.path.join(sub_folder_name, f"chunk{i}.wav")
                audio_chunk.export(chunk_filename, format="wav")
                
                text = transcribe_audio(chunk_filename)
                if text:
                    start_time = current_time
                    end_time = current_time + len(audio_chunk) / 1000
                    whole_text.append((start_time, end_time, text.capitalize()))
                    logging.info(f"Transcribed chunk {i}: {text}")
                else:
                    logging.warning(f"No text transcribed for chunk {i}")
                
                current_time += len(audio_chunk) / 1000
            except Exception as e:
                logging.error(f"Error processing chunk {i}: {str(e)}")
                logging.error(traceback.format_exc())
        
        return whole_text
    except Exception as e:
        logging.error(f"Error in get_large_audio_transcription_on_silence: {str(e)}")
        logging.error(traceback.format_exc())
        return []

def format_timestamp(seconds):
    milliseconds = int((seconds - int(seconds)) * 1000)
    minutes, seconds = divmod(int(seconds), 60)
    hours, minutes = divmod(minutes, 60)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{milliseconds:03d}"

def create_srt_file(transcription, output_path):
    with open(output_path, 'w', encoding='utf-8') as srt_file:
        for i, (start, end, text) in enumerate(transcription, start=1):
            start_formatted = format_timestamp(start)
            end_formatted = format_timestamp(end)
            srt_file.write(f"{i}\n{start_formatted} --> {end_formatted}\n{text}\n\n")

def process_file(path, output):
    if is_video_file(path):
        video = mp.VideoFileClip(path)
        audio_filename = os.path.splitext(os.path.basename(path))[0] + '.wav'
        audio_output = os.path.join('audio', audio_filename)
        video.audio.write_audiofile(audio_output)
    elif is_audio_file(path):
        audio_output = path
    else:
        logging.warning(f"Unsupported file type: {path}")
        return

    logging.info(f'Transcribing {path}')
    transcription = get_large_audio_transcription_on_silence(audio_output)
    
    # Create TXT file
    txt_output = output + '.txt'
    with open(txt_output, "w") as text_file:
        for start, end, text in transcription:
            text_file.write(f"[{format_timestamp(start)}] {text}\n")
    
    # Create SRT file
    srt_output = output + '.srt'
    create_srt_file(transcription, srt_output)
    
    logging.info(f'Completed captions for {path}')

def main(source, log):
    folder_path = init_folders(source, log)
    if not os.listdir(folder_path):
        logging.warning('The job folder is empty!')
        return

    files = [f for f in os.listdir(folder_path) if is_audio_file(f) or is_video_file(f)]
    for filename in tqdm(files, desc="Processing files"):
        path = os.path.join(folder_path, filename)
        caption_filename = os.path.splitext(filename)[0]
        output = os.path.join('caption', caption_filename)
        process_file(path, output)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Transcribe video and audio files")
    parser.add_argument("--folder", help="folder of the video", default='job')
    parser.add_argument("--log", action="store_true", help="display logging information",default=True)
    args = parser.parse_args()
    main(args.folder,args.log)
