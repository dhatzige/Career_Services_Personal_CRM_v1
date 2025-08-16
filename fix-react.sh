#!/bin/bash

echo "🔧 Fixing React hooks error..."

# Kill all node processes
echo "📌 Killing all node processes..."
pkill -f node || true
pkill -f vite || true
sleep 2

# Clear all caches
echo "🗑️  Clearing all caches..."
rm -rf node_modules
rm -rf dist
rm -rf .vite
rm -rf node_modules/.vite
rm -f package-lock.json

# Reinstall dependencies
echo "📦 Reinstalling dependencies..."
npm install

# Clear npm cache
echo "🧹 Clearing npm cache..."
npm cache clean --force

# Start the dev server
echo "🚀 Starting development server..."
npm run dev