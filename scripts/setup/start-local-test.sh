#!/bin/bash

# Career Services CRM - Local Testing Script

echo "🚀 Starting Career Services CRM for Testing..."
echo "============================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please ensure .env file exists with proper configuration"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n🛑 Stopping all services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Set trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Start backend
echo -e "\n📦 Starting Backend Server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if ! curl -s http://localhost:4001/health > /dev/null; then
    echo "❌ Backend failed to start!"
    exit 1
fi
echo "✅ Backend running on http://localhost:4001"

# Start frontend
echo -e "\n🎨 Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 5

echo -e "\n✅ Application is running!"
echo "============================================"
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:4001/api"
echo "📊 Backend Health: http://localhost:4001/health"
echo -e "\nMaster Account Credentials:"
echo "📧 Email: dhatzige@act.edu"
echo "🔑 Password: !)DQeop4"
echo -e "\n📋 Testing Checklist: testing-checklist.md"
echo "============================================"
echo -e "\nPress Ctrl+C to stop all services"

# Keep script running
wait