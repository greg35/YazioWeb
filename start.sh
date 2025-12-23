#!/bin/bash

# Define ports
BACKEND_PORT=8000
FRONTEND_PORT=5173

# Function to kill process on a specific port
kill_process_on_port() {
    local port=$1
    local pid=$(lsof -t -i:$port)
    if [ -n "$pid" ]; then
        echo "Killing process on port $port (PID: $pid)..."
        kill -9 $pid
    else
        echo "No process found on port $port."
    fi
}

# Kill existing processes
echo "Checking for existing processes..."
kill_process_on_port $BACKEND_PORT
kill_process_on_port $FRONTEND_PORT

# Start Backend
echo "Starting Backend..."
cd backend
# Check if virtual environment exists, if so activate it (optional, assuming system python or user handles env)
# For now, using python3 directly as per plan
python3 main.py &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Backend running with PID: $BACKEND_PID"
echo "Frontend running with PID: $FRONTEND_PID"

# Trap SIGINT (Ctrl+C) to kill both processes
trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT

# Wait for processes
wait
