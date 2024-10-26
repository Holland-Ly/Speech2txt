import speech_recognition as sr
import os
import logging
from tqdm import tqdm
from pydub import AudioSegment
import whisper
import traceback

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

def transcribe_audio_chunks(sound, chunks, output_folder,silences):
    whole_text = []
    current_time = 0
    for i, audio_chunk in tqdm(enumerate(chunks, start=1), total=len(chunks), desc="Processing and transcribing chunks"):
        try:
                chunk_filename = os.path.join(output_folder, f"chunk{i}.wav")
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
                
                # Add silence duration if it's not the last chunk
                if i < len(chunks):
                    silence_duration = silences[i-1][1] - silences[i-1][0]
                    current_time += silence_duration / 1000
        except Exception as e:
                logging.error(f"Error processing chunk {i}: {str(e)}")
                logging.error(traceback.format_exc())
        
    return whole_text

