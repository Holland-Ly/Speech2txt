FROM python:3.9-slim

WORKDIR /app

# Install system dependencies for pydub
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create necessary directories
RUN mkdir -p uploads captions audio audio-chunks

EXPOSE 5000

CMD ["python", "main.py"]