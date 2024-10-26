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

def create_txt_file(transcription, output_path):
    with open(output_path, "w") as text_file:
        for start, end, text in transcription:
            text_file.write(f"[{format_timestamp(start)}] {text}\n")
