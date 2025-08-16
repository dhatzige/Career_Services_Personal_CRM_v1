#!/bin/bash

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "Port $1 is already in use"
        return 1
    fi
    return 0
}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Personal CRM Development Environment...${NC}"

# Check if ports are available
echo -e "${YELLOW}Checking ports...${NC}"
if ! check_port 3001; then
    echo -e "${RED}Backend port 3001 is already in use. Please stop the existing process.${NC}"
    exit 1
fi

if ! check_port 5173; then
    echo -e "${RED}Frontend port 5173 is already in use. Please stop the existing process.${NC}"
    exit 1
fi

# Set environment variables for backend
export NODE_ENV=development
export SESSION_SECRET=$(openssl rand -base64 32)
export CSRF_SECRET=$(openssl rand -base64 32)

# Kill any existing processes
echo -e "${YELLOW}Cleaning up existing processes...${NC}"
pkill -f "nodemon" || true
pkill -f "vite" || true
sleep 2

# Start backend
echo -e "${GREEN}Starting backend server on port 3001...${NC}"
cd backend

# Create logs directory if it doesn't exist
mkdir -p logs

# Run TypeScript compilation check first
echo -e "${YELLOW}Checking TypeScript compilation...${NC}"
npx tsc --noEmit --skipLibCheck || echo -e "${RED}TypeScript errors detected. Continuing anyway...${NC}"

# Start backend with ts-node-dev for better error handling
npx ts-node-dev --respawn --transpile-only --ignore-watch node_modules src/server.ts > logs/backend.log 2>&1 &
BACKEND_PID=$!

echo -e "${GREEN}Backend starting with PID: $BACKEND_PID${NC}"

# Wait for backend to start
echo -e "${YELLOW}Waiting for backend to start...${NC}"
sleep 5

# Check if backend is running
if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✓ Backend is running!${NC}"
else
    echo -e "${RED}✗ Backend failed to start. Check logs/backend.log for details${NC}"
    tail -20 logs/backend.log
    exit 1
fi

# Start frontend
echo -e "${GREEN}Starting frontend server on port 5173...${NC}"
cd ../
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

echo -e "${GREEN}Frontend starting with PID: $FRONTEND_PID${NC}"

# Wait for frontend to start
echo -e "${YELLOW}Waiting for frontend to start...${NC}"
sleep 5

# Check if frontend is running
if curl -s http://localhost:5173 > /dev/null; then
    echo -e "${GREEN}✓ Frontend is running!${NC}"
else
    echo -e "${RED}✗ Frontend failed to start. Check logs/frontend.log for details${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Development environment is ready!${NC}"
echo -e "${GREEN}   Frontend: http://localhost:5173${NC}"
echo -e "${GREEN}   Backend:  http://localhost:3001${NC}"
echo -e "${GREEN}   Health:   http://localhost:3001/health${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    pkill -f "ts-node-dev" 2>/dev/null
    pkill -f "vite" 2>/dev/null
    echo -e "${GREEN}Servers stopped.${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

# Keep script running and show logs
while true; do
    sleep 1
done