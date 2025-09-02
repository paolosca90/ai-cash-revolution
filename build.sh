#!/bin/bash

# Build script for Vercel deployment
echo "🚀 Starting AI Trading Boost build process..."

# Navigate to frontend directory
cd frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ -d "dist" ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Build output directory: frontend/dist"
    echo "🔗 Ready for Vercel deployment"
else
    echo "❌ Build failed!"
    exit 1
fi

echo "🎉 Build process completed!"