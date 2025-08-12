#!/bin/bash

# Start backend server
echo "Starting backend server..."
cd server && npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend server
echo "Starting frontend server..."
cd .. && npm run dev:frontend &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

# Function to kill both servers
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Set up trap to cleanup on exit
trap cleanup EXIT

echo "Servers are running. Press Ctrl+C to stop."
echo "Frontend: http://localhost:5173 or http://localhost:5174"
echo "Backend: http://localhost:4001"

# Wait indefinitely
wait