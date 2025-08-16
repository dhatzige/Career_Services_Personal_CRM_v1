#!/bin/bash

echo "🚀 Starting Career Services CRM (Port 4001)"
echo "=========================================="
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
if check_port 4001; then
    echo "⚠️  Port 4001 is already in use. Please stop the existing process."
    exit 1
fi

# Check if frontend port is in use
if check_port 5173; then
    echo "⚠️  Port 5173 is already in use. Please stop the existing process."
    exit 1
fi

# Start backend
echo "📦 Starting backend server on port 4001..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Start frontend
echo "🎨 Starting frontend on port 5173..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Career Services CRM is running!"
echo ""
echo "📍 Frontend: http://localhost:5173"
echo "📍 Backend API: http://localhost:4001"
echo ""
echo "ℹ️  Note: Your main project can continue running on ports 3000/3001"
echo ""
echo "Press Ctrl+C to stop Career Services CRM"
echo ""

# Function to handle shutdown
shutdown() {
    echo ""
    echo "🛑 Shutting down Career Services CRM..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Career Services CRM stopped"
    exit 0
}

# Set up signal handlers
trap shutdown SIGINT SIGTERM

# Wait for processes
wait