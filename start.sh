#!/bin/bash

# Create necessary directories if they don't exist
mkdir -p Python/uploads Python/captions Python/audio Python/audio-chunks

# Function to start Python backend
start_Python() {
    cd Python
    source venv/bin/activate
    python main.py
}

# Function to start React frontend
start_React() {
    cd webapp/video2txt
    npm start
}

# Open new terminal for backend (for macOS)
osascript -e 'tell app "Terminal"
    do script "cd '$(pwd)' && source start_Python.sh"
end tell'

# Open new terminal for frontend (for macOS)
osascript -e 'tell app "Terminal"
    do script "cd '$(pwd)' && source start_React.sh"
end tell'