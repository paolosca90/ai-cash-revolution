#!/bin/bash

# AI Cash R-evolution Quick Update Script
set -e

echo "🔄 Updating AI Cash R-evolution..."

# Get current directory
APP_DIR=$(pwd)

# Pull latest changes
echo "📥 Pulling latest changes from Git..."
git pull origin main

# Check if backend files changed
if git diff HEAD~1 --name-only | grep -q "backend/"; then
    echo "📦 Backend files changed, installing dependencies..."
    cd backend && npm install --production
    cd $APP_DIR
fi

# Check if frontend files changed
if git diff HEAD~1 --name-only | grep -q "frontend/"; then
    echo "🏗️ Frontend files changed, rebuilding..."
    cd frontend
    npm install
    npm run build
    
    # Copy build to backend/dist
    echo "📁 Copying frontend build to backend..."
    cp -r dist/* ../backend/dist/
    cd $APP_DIR
fi

# Restart application
echo "🔄 Restarting application..."
pm2 restart ai-cash-revolution

# Wait for restart
sleep 3

# Check status
echo "📊 Application status:"
pm2 list | grep ai-cash-revolution

# Show recent logs
echo "📋 Recent logs:"
pm2 logs ai-cash-revolution --lines 5

# Health check
echo "🔍 Health check..."
sleep 2
if curl -f -s http://localhost:4000/health > /dev/null; then
    echo "✅ Application is healthy!"
else
    echo "⚠️ Health check failed, check logs:"
    pm2 logs ai-cash-revolution --lines 20
fi

echo "🎉 Update completed!"