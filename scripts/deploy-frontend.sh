#!/bin/bash

# Frontend Deployment Script for Vercel
# This script deploys the clean frontend to Vercel from the new repository

set -e  # Exit on any error

echo "🚀 Starting Frontend Deployment Process..."
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

# Test frontend build
echo "🔨 Testing frontend build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

echo ""
echo "🎯 Frontend is ready for deployment!"
echo ""
echo "📋 NEXT STEPS (Manual Actions Required):"
echo ""
echo "1. 🌐 Connect Vercel to New Repository:"
echo "   → Go to: https://vercel.com/dashboard"
echo "   → Click 'Import Project'"
echo "   → Select: dhatzige/Career_Services_Personal_CRM_v1"
echo "   → Framework: Vite"
echo "   → Root Directory: ./ (default)"
echo ""
echo "2. ⚙️ Configure Environment Variables:"
echo "   → Copy from your current Vercel deployment:"
echo "   → VITE_SUPABASE_URL"
echo "   → VITE_SUPABASE_ANON_KEY"
echo "   → VITE_API_URL (should be: https://career-services-personal-crm.fly.dev)"
echo "   → VITE_SENTRY_DSN"
echo ""
echo "3. 🚀 Deploy:"
echo "   → Click 'Deploy'"
echo "   → Wait for deployment to complete"
echo "   → Test the new URL"
echo ""
echo "4. 🔧 Update Backend CORS (if frontend URL changes):"
echo "   → Update FRONTEND_URL in backend environment variables"
echo "   → Redeploy backend if needed"
echo ""
echo "📍 Current Backend URL: https://career-services-personal-crm.fly.dev"
echo "📍 Backend Health Check: https://career-services-personal-crm.fly.dev/health"
echo ""
echo "✅ Ready for deployment!"