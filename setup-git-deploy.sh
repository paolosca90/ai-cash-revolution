#!/bin/bash

# Setup Git-based deployment system
echo "🚀 Setting up Git-based deployment system..."

DOMAIN=$1
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <your-domain.com>"
    exit 1
fi

APP_DIR="/var/www/ai-cash-revolution"

echo "📁 Setting up Git repository..."

# Make scripts executable
chmod +x $APP_DIR/update.sh
chmod +x $APP_DIR/setup-git-deploy.sh

# Configure Git (if first time)
if [ ! -f ~/.gitconfig ]; then
    git config --global user.name "AI Cash R-evolution Server"
    git config --global user.email "admin@ai.cash-revolution.com"
fi

# Initialize git repo if not exists
if [ ! -d "$APP_DIR/.git" ]; then
    cd $APP_DIR
    git init
    git branch -M main
    
    # Add all files to git
    git add .
    git commit -m "Initial AI Cash R-evolution deployment"
fi

# Setup webhook service
echo "🔗 Setting up webhook service..."

# Install webhook dependencies
cd $APP_DIR
npm install express --save

# Start webhook with PM2
pm2 delete ai-cash-webhook 2>/dev/null || true
pm2 start webhook.js --name "ai-cash-webhook"
pm2 save

# Configure firewall for webhook port
if command -v ufw &> /dev/null; then
    ufw allow 3001
fi

echo "✅ Git deployment system setup complete!"
echo ""
echo "🎯 Usage Instructions:"
echo ""
echo "1️⃣ Setup your GitHub repository:"
echo "   git remote add origin https://github.com/USERNAME/ai-cash-revolution.git"
echo "   git push -u origin main"
echo ""
echo "2️⃣ Manual updates:"
echo "   ./update.sh"
echo ""
echo "3️⃣ Automatic webhook deployment:"
echo "   GitHub → Settings → Webhooks → Add webhook"
echo "   URL: https://$DOMAIN:3001/webhook"
echo "   Content type: application/json"
echo "   Secret: ai-cash-revolution-webhook-2025"
echo "   Events: Just the push event"
echo ""
echo "4️⃣ Test webhook:"
echo "   curl https://$DOMAIN:3001/webhook/health"
echo ""
echo "📊 Monitor deployment:"
echo "   pm2 logs ai-cash-revolution"
echo "   pm2 logs ai-cash-webhook"
echo "   tail -f /var/log/ai-cash-deploys.log"