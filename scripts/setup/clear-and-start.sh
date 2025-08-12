#!/bin/bash

echo "🧹 Clearing and Starting Career Services CRM"
echo "==========================================="
echo ""

# Kill any existing processes
echo "🛑 Stopping any existing processes..."
pkill -f "node" || true
sleep 2

# Clear frontend cache
echo "🗑️  Clearing frontend cache..."
rm -rf node_modules/.vite

# Start backend
echo "📦 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Backend is running on port 3001"
else
    echo "❌ Backend failed to start!"
    echo "Check backend/backend.log for errors"
    exit 1
fi

cd ..

# Start frontend
echo "🎨 Starting frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Services started!"
echo ""
echo "📍 Frontend: http://localhost:5173"
echo "📍 Backend API: http://localhost:3001"
echo ""
echo "⚠️  IMPORTANT: Clear your browser cache:"
echo "   1. Open DevTools (F12)"
echo "   2. Go to Application tab"
echo "   3. Click 'Clear site data'"
echo "   4. Refresh the page"
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