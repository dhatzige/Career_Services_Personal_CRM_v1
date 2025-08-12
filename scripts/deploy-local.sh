#!/bin/bash

# Deploy script for local Docker deployment
# This script builds and runs the Career Services CRM using Docker Compose

set -e

echo "🚀 Starting Career Services CRM Local Deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/data backend/uploads backend/logs

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env file not found. Creating from example..."
    cp backend/.env.example backend/.env 2>/dev/null || echo "❌ No .env.example found. Please create backend/.env manually."
fi

if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from example..."
    cp .env.example .env 2>/dev/null || echo "❌ No .env.example found. Please create .env manually."
fi

# Build Docker images
echo "🏗️  Building Docker images..."
docker-compose build

# Start containers
echo "🚀 Starting containers..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check health status
echo "🏥 Checking health status..."

# Check backend health
if curl -f http://localhost:4001/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    echo "Checking logs..."
    docker-compose logs backend | tail -20
fi

# Check frontend health
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    echo "Checking logs..."
    docker-compose logs frontend | tail -20
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📌 Access the application:"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost:4001/api"
echo "   Health Check: http://localhost:4001/health"
echo ""
echo "📝 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo "   Remove everything: docker-compose down -v"
echo ""