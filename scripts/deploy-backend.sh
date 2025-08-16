#!/bin/bash

# Backend Deployment Script for Fly.io
# This script deploys the clean backend to Fly.io from the new repository

set -e  # Exit on any error

echo "🚀 Starting Backend Deployment Process..."
echo "📦 Repository: https://github.com/dhatzige/Career_Services_Personal_CRM_v1"
echo ""

# Verify we're in the right repository
CURRENT_REMOTE=$(git remote get-url origin)
EXPECTED_REMOTE="https://github.com/dhatzige/Career_Services_Personal_CRM_v1.git"

if [ "$CURRENT_REMOTE" != "$EXPECTED_REMOTE" ]; then
    echo "❌ Error: Wrong repository!"
    echo "   Current: $CURRENT_REMOTE"
    echo "   Expected: $EXPECTED_REMOTE"
    exit 1
fi

echo "✅ Repository verified: Clean codebase"
echo ""

# Check if we have uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "❌ Error: You have uncommitted changes. Please commit first."
    git status --short
    exit 1
fi

echo "✅ No uncommitted changes"
echo ""

# Test backend build
echo "🔨 Testing backend build..."
cd backend
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Backend build successful"
else
    echo "❌ Backend build failed"
    exit 1
fi

cd ..
echo ""

# Check if Fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI not found. Installing..."
    echo "📥 Please install Fly CLI:"
    echo "   → macOS: brew install flyctl"
    echo "   → Linux: curl -L https://fly.io/install.sh | sh"
    echo "   → Windows: powershell -Command \"iwr https://fly.io/install.ps1 -useb | iex\""
    echo ""
    echo "After installation, run: fly auth login"
    exit 1
fi

echo "✅ Fly CLI found"
echo ""

# Check if logged in to Fly.io
if ! fly auth whoami &> /dev/null; then
    echo "❌ Not logged in to Fly.io"
    echo "Please run: fly auth login"
    exit 1
fi

echo "✅ Authenticated with Fly.io"
echo ""

echo "🎯 Backend is ready for deployment!"
echo ""
echo "📋 DEPLOYMENT OPTIONS:"
echo ""
echo "Option A: 🔄 Update Existing App (Recommended)"
echo "   → This will update your existing Fly.io app with the clean codebase"
echo "   → Same URL: https://career-services-personal-crm.fly.dev"
echo "   → Command: cd backend && fly deploy"
echo ""
echo "Option B: 🆕 Create New App"
echo "   → This will create a fresh Fly.io app"
echo "   → New URL will be generated"
echo "   → Command: cd backend && fly launch --copy-config --name career-services-crm-v2"
echo ""
echo "💡 RECOMMENDED: Option A (Update existing app)"
echo "   ✅ Keeps same URL"
echo "   ✅ Preserves persistent volume with database"
echo "   ✅ No CORS changes needed"
echo ""
echo "🚀 Ready to deploy! Choose your option:"
echo "   cd backend && fly deploy  # Option A"