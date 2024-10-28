#!/bin/bash

# Navigate to the React app directory
cd "$(dirname "$0")/webapp/video2txt"

# Check if node_modules exists, if not run npm install
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the React development server
echo "Starting React development server..."
npm start