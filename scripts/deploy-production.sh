#!/bin/bash

# Production deployment script for Career Services CRM
# This script helps deploy to Railway (backend) and Vercel (frontend)

set -e

echo "🚀 Career Services CRM Production Deployment"
echo "==========================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists railway; then
    echo "❌ Railway CLI not installed."
    echo "👉 Install it with: npm install -g @railway/cli"
    exit 1
fi

if ! command_exists vercel; then
    echo "❌ Vercel CLI not installed."
    echo "👉 Install it with: npm install -g vercel"
    exit 1
fi

# Deploy Backend to Railway
deploy_backend() {
    echo ""
    echo "🚂 Deploying Backend to Railway..."
    echo "================================="
    
    cd backend
    
    # Check if logged in to Railway
    if ! railway whoami &> /dev/null; then
        echo "📝 Please log in to Railway:"
        railway login
    fi
    
    # Initialize Railway project if needed
    if [ ! -f ".railway.json" ]; then
        echo "🏗️  Initializing Railway project..."
        railway init
    fi
    
    # Deploy to Railway
    echo "🚀 Deploying to Railway..."
    railway up
    
    # Get deployment URL
    echo ""
    echo "✅ Backend deployed!"
    echo "🔗 Backend URL: $(railway open -c)"
    
    cd ..
}

# Deploy Frontend to Vercel
deploy_frontend() {
    echo ""
    echo "▲ Deploying Frontend to Vercel..."
    echo "================================="
    
    # Check if logged in to Vercel
    if ! vercel whoami &> /dev/null; then
        echo "📝 Please log in to Vercel:"
        vercel login
    fi
    
    # Build the frontend
    echo "🏗️  Building frontend..."
    npm run build
    
    # Deploy to Vercel
    echo "🚀 Deploying to Vercel..."
    vercel --prod
    
    echo ""
    echo "✅ Frontend deployed!"
}

# Main deployment flow
echo ""
echo "What would you like to deploy?"
echo "1) Backend only (Railway)"
echo "2) Frontend only (Vercel)"
echo "3) Both Backend and Frontend"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        deploy_backend
        ;;
    2)
        deploy_frontend
        ;;
    3)
        deploy_backend
        deploy_frontend
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📝 Post-deployment checklist:"
echo "   ✓ Update environment variables in Railway dashboard"
echo "   ✓ Update VITE_API_URL in Vercel to point to Railway backend"
echo "   ✓ Set up custom domains if needed"
echo "   ✓ Configure monitoring and alerts"
echo "   ✓ Test all features in production"
echo ""