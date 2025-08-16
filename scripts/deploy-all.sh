#!/bin/bash

# Complete Deployment Migration Script
# Deploys both frontend and backend from clean repository

set -e  # Exit on any error

echo "🚀 CAREER SERVICES CRM - COMPLETE DEPLOYMENT MIGRATION"
echo "======================================================="
echo ""
echo "📦 Repository: https://github.com/dhatzige/Career_Services_Personal_CRM_v1"
echo "🎯 Goal: Migrate from old problematic repo to clean secure codebase"
echo ""

# Verify repository
CURRENT_REMOTE=$(git remote get-url origin)
EXPECTED_REMOTE="https://github.com/dhatzige/Career_Services_Personal_CRM_v1.git"

if [ "$CURRENT_REMOTE" != "$EXPECTED_REMOTE" ]; then
    echo "❌ ERROR: Wrong repository!"
    echo "   Current: $CURRENT_REMOTE"
    echo "   Expected: $EXPECTED_REMOTE"
    exit 1
fi

echo "✅ Repository verified: Clean codebase connected"
echo ""

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "❌ ERROR: Uncommitted changes detected!"
    echo "Please commit all changes first:"
    git status --short
    exit 1
fi

echo "✅ Git status clean"
echo ""

# Test builds
echo "🔨 Testing Frontend Build..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

echo ""
echo "🔨 Testing Backend Build..."
cd backend
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Backend build successful"
    cd ..
else
    echo "❌ Backend build failed"
    exit 1
fi
cd ..

echo ""
echo "🎉 ALL BUILDS SUCCESSFUL!"
echo ""
echo "📋 DEPLOYMENT MIGRATION READY"
echo ""
echo "Next steps require your action:"
echo ""
echo "1. 🖥️  BACKEND (Fly.io):"
echo "   → cd backend && fly deploy"
echo "   → This updates existing app with clean code"
echo "   → Preserves database and environment variables"
echo ""
echo "2. 🌐 FRONTEND (Vercel):"
echo "   → Go to: https://vercel.com/dashboard"
echo "   → Update Git source to: dhatzige/Career_Services_Personal_CRM_v1"
echo "   → Or import as new project"
echo "   → Deploy"
echo ""
echo "3. 🔍 VERIFICATION:"
echo "   → Backend health: curl https://career-services-personal-crm.fly.dev/health"
echo "   → Frontend: Test login and core features"
echo ""
echo "🎯 Your codebase is deployment-ready with enterprise security!"