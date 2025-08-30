#!/bin/bash

# CORS Fix Verification Script
# Run this script to verify the CORS configuration is working

echo "🔍 CORS Fix Verification Script"
echo "================================"
echo ""

# Check if backend files exist
echo "📁 Checking backend files..."
if [ -f "express-backend/api/index.js" ]; then
    echo "✅ express-backend/api/index.js exists"
else
    echo "❌ express-backend/api/index.js missing"
    exit 1
fi

if [ -f "express-backend/vercel.json" ]; then
    echo "✅ express-backend/vercel.json exists"
else
    echo "❌ express-backend/vercel.json missing" 
    exit 1
fi

# Check if frontend file exists
echo ""
echo "📁 Checking frontend files..."
if [ -f "frontend/lib/api-client.ts" ]; then
    echo "✅ frontend/lib/api-client.ts exists"
else
    echo "❌ frontend/lib/api-client.ts missing"
    exit 1
fi

# Check CORS configuration
echo ""
echo "🔧 Verifying CORS configuration..."

if grep -q "corsOptions" express-backend/api/index.js; then
    echo "✅ CORS options configured in backend"
else
    echo "❌ CORS options missing in backend"
    exit 1
fi

if grep -q "Access-Control-Allow-Origin" express-backend/vercel.json; then
    echo "✅ CORS headers configured in vercel.json"
else
    echo "❌ CORS headers missing in vercel.json"
    exit 1
fi

if grep -q "ai-cash-revolution-frontend.vercel.app" express-backend/api/index.js; then
    echo "✅ Production frontend URL configured"
else
    echo "❌ Production frontend URL missing"
    exit 1
fi

# Check port configuration
echo ""
echo "🔌 Checking port configuration..."
if grep -q "localhost:3002" frontend/lib/api-client.ts; then
    echo "✅ Correct localhost port (3002) configured"
else
    echo "❌ Incorrect localhost port configuration"
    exit 1
fi

echo ""
echo "🎉 All CORS configuration checks passed!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy backend: cd express-backend && vercel --prod"
echo "2. Deploy frontend: cd frontend && vercel --prod"
echo "3. Test the deployed application"
echo ""
echo "🔗 Endpoints that should work:"
echo "- /api/analysis/top-signals"
echo "- /api/ml/analytics"  
echo "- /api/analysis/performance"
echo "- /api/analysis/history"
echo ""
echo "For detailed testing, see CORS_FIX_GUIDE.md"