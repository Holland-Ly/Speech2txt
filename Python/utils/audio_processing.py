import moviepy.editor as mp
import os
from pydub import AudioSegment
from pydub.silence import detect_silence
import logging

def extract_audio_from_video(video_path, audio_output):
    video = mp.VideoFileClip(video_path)
    video.audio.write_audiofile(audio_output)

def split_audio_on_silence(sound, min_silence_len, silence_thresh):
    silences = detect_silence(sound, min_silence_len=min_silence_len, silence_thresh=silence_thresh)
    
    chunks = []
    start_time = 0
    for silence_start, silence_end in silences:
        chunks.append(sound[start_time:silence_start])
        start_time = silence_end
    chunks.append(sound[start_time:])  # Add the last chunk
    return chunks, silences