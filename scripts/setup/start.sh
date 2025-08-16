#!/bin/bash

echo "🚀 Starting Career Services CRM"
echo "=============================="
echo ""

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Check if backend port is in use
if check_port 3001; then
    echo "⚠️  Port 3001 is already in use. Please stop the existing process."
    exit 1
fi

# Check if frontend port is in use
if check_port 5173; then
    echo "⚠️  Port 5173 is already in use. Please stop the existing process."
    exit 1
fi

# Start backend
echo "📦 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Start frontend
echo "🎨 Starting frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Career Services CRM is running!"
echo ""
echo "📍 Frontend: http://localhost:5173"
echo "📍 Backend API: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to handle shutdown
shutdown() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handlers
trap shutdown SIGINT SIGTERM

# Wait for processes
wait