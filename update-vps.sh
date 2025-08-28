#!/bin/bash

# AI Cash R-evolution - Quick Update VPS
# For daily development updates (super fast!)

set -e

# Configuration
VPS_IP="154.61.187.189"
VPS_USER="Administrator"
SSH_PORT="8467"

echo "⚡ Quick VPS Update"
echo "==================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

# Check if VPS IP is set
if [ "$VPS_IP" = "YOUR_VPS_IP_HERE" ]; then
    print_error "Please edit update-vps.sh and set your VPS IP address"
    exit 1
fi

# Step 1: Push changes to GitHub
print_status "Pushing changes to GitHub..."
git add .
git commit -m "Quick update: $(date '+%Y-%m-%d %H:%M:%S')"
git push origin main

# Step 2: Update VPS (super fast!)
print_status "Updating VPS..."

ssh -p $SSH_PORT $VPS_USER@$VPS_IP << 'EOF'
cd /var/www/ai-cash-revolution

echo "📥 Pulling latest changes..."
git pull origin main

# Check what changed and update only if needed
if git diff HEAD~1 --name-only | grep -q "backend/"; then
    echo "📦 Backend changed, updating dependencies..."
    cd backend && npm install --production && cd ..
fi

if git diff HEAD~1 --name-only | grep -q "frontend/"; then
    echo "🏗️ Frontend changed, rebuilding..."
    cd frontend && npm install && npm run build && cd ..
    cp -r frontend/dist/* backend/dist/
fi

echo "🔄 Restarting application..."
pm2 restart ai-cash-revolution

echo "✅ Update completed!"
pm2 list | grep ai-cash-revolution
EOF

print_success "🎉 VPS updated successfully!"
print_success "🌐 Check: https://ai.cash-revolution.com"

echo ""
echo "⚡ Total time: ~30 seconds"
echo "🔄 For future updates, just run: ./update-vps.sh"