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
            text = r.recognize_google(audio_listened)
            return text
        except sr.UnknownValueError:
            logging.warning(f"Could not understand audio in {path}")
            return ""

def get_large_audio_transcription_on_silence(path):
    try:
        logging.info(f"Starting transcription for {path}")
        sound = AudioSegment.from_file(path)
        logging.info(f"Audio file loaded successfully")
        
        # Split on silence without progress callback
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
        
        # Progress bar for processing chunks
        for i, audio_chunk in tqdm(enumerate(chunks, start=1), total=len(chunks), desc="Processing and transcribing chunks"):
            try:
                chunk_filename = os.path.join(sub_folder_name, f"chunk{i}.wav")
                audio_chunk.export(chunk_filename, format="wav")
                logging.info(f"Exported chunk {i} to {chunk_filename}")
                
                text = transcribe_audio(chunk_filename)
                if text:
                    timestamp = format_timestamp(current_time)
                    whole_text.append(f"[{timestamp}] {text.capitalize()}.")
                    logging.info(f"Transcribed chunk {i}: {text}")
                else:
                    logging.warning(f"No text transcribed for chunk {i}")
                
                current_time += len(audio_chunk) / 1000
            except Exception as e:
                logging.error(f"Error processing chunk {i}: {str(e)}")
                logging.error(traceback.format_exc())
        
        return '\n'.join(whole_text)
    except Exception as e:
        logging.error(f"Error in get_large_audio_transcription_on_silence: {str(e)}")
        logging.error(traceback.format_exc())
        return ""

def format_timestamp(seconds):
    minutes, seconds = divmod(int(seconds), 60)
    hours, minutes = divmod(minutes, 60)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

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
    captions = get_large_audio_transcription_on_silence(audio_output)
    
    with open(output, "w") as text_file:
        text_file.write(captions)
    logging.info(f'Completed captions for {path}')

def main(source,log):
    folder_path = init_folders(source,log)
    if not os.listdir(folder_path):
        logging.warning('The job folder is empty!')
        return

    files = [f for f in os.listdir(folder_path) if is_audio_file(f) or is_video_file(f)]
    for filename in tqdm(files, desc="Processing files"):
        path = os.path.join(folder_path, filename)
        caption_filename = os.path.splitext(filename)[0] + '.txt'
        output = os.path.join('caption', caption_filename)
        process_file(path, output)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Transcribe video and audio files")
    parser.add_argument("--folder", help="folder of the video", default='job')
    parser.add_argument("--log", action="store_true", help="display logging information",default=True)
    args = parser.parse_args()
    main(args.folder,args.log)