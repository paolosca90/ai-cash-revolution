#!/bin/bash

# Create minimal deployment package
echo "🚀 Creating minimal deployment package..."

DEPLOY_NAME="ai-cash-revolution-minimal"
rm -rf $DEPLOY_NAME
mkdir -p $DEPLOY_NAME

# Copy essential files only
echo "📁 Copying essential files..."

# Root files
cp quick-deploy.sh $DEPLOY_NAME/
cp setup-production.sh $DEPLOY_NAME/
cp init-database.sql $DEPLOY_NAME/
cp nginx.conf $DEPLOY_NAME/
cp .env.production $DEPLOY_NAME/
cp package.json $DEPLOY_NAME/
cp DEPLOYMENT_INSTRUCTIONS.md $DEPLOY_NAME/
cp MT5_SETUP_GUIDE.md $DEPLOY_NAME/

# Backend (only essential)
mkdir -p $DEPLOY_NAME/backend
cp -r backend/admin $DEPLOY_NAME/backend/
cp -r backend/analysis $DEPLOY_NAME/backend/
cp -r backend/auth $DEPLOY_NAME/backend/
cp -r backend/email $DEPLOY_NAME/backend/
cp -r backend/installer $DEPLOY_NAME/backend/
cp -r backend/ml $DEPLOY_NAME/backend/
cp -r backend/payments $DEPLOY_NAME/backend/
cp -r backend/scheduler $DEPLOY_NAME/backend/
cp -r backend/user $DEPLOY_NAME/backend/
cp backend/package.json $DEPLOY_NAME/backend/
cp backend/tsconfig.json $DEPLOY_NAME/backend/
cp backend/encore.app $DEPLOY_NAME/backend/

# Frontend (only source, not node_modules or dist)
mkdir -p $DEPLOY_NAME/frontend
cp frontend/*.tsx $DEPLOY_NAME/frontend/ 2>/dev/null || true
cp frontend/*.ts $DEPLOY_NAME/frontend/ 2>/dev/null || true
cp frontend/*.html $DEPLOY_NAME/frontend/ 2>/dev/null || true
cp frontend/*.css $DEPLOY_NAME/frontend/ 2>/dev/null || true
cp frontend/*.json $DEPLOY_NAME/frontend/ 2>/dev/null || true
cp frontend/.env.production $DEPLOY_NAME/frontend/
cp -r frontend/components $DEPLOY_NAME/frontend/ 2>/dev/null || true
cp -r frontend/pages $DEPLOY_NAME/frontend/ 2>/dev/null || true
cp -r frontend/hooks $DEPLOY_NAME/frontend/ 2>/dev/null || true
cp -r frontend/lib $DEPLOY_NAME/frontend/ 2>/dev/null || true
cp -r frontend/config $DEPLOY_NAME/frontend/ 2>/dev/null || true

# Create compressed package
echo "📦 Creating compressed package..."
tar -czf ${DEPLOY_NAME}.tar.gz $DEPLOY_NAME/

# Get size info
FULL_SIZE=$(du -sh DEPLOY26-08-2025-main 2>/dev/null | cut -f1 || echo "N/A")
MINIMAL_SIZE=$(du -sh ${DEPLOY_NAME}.tar.gz | cut -f1)

echo "✅ Minimal deployment package created!"
echo "📊 Size comparison:"
echo "   Full folder: $FULL_SIZE"  
echo "   Minimal package: $MINIMAL_SIZE"
echo ""
echo "🚀 Upload command:"
echo "   scp ${DEPLOY_NAME}.tar.gz root@YOUR_VPS_IP:/root/"
echo ""
echo "📋 VPS commands:"
echo "   tar -xzf ${DEPLOY_NAME}.tar.gz"
echo "   cd $DEPLOY_NAME"
echo "   chmod +x quick-deploy.sh"
echo "   sudo ./quick-deploy.sh ai.cash-revolution.com"

# Cleanup
rm -rf $DEPLOY_NAME