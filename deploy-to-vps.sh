#!/bin/bash

# AI Cash R-evolution - One-Click Deploy to VPS
# Run this from your PC to deploy everything automatically

set -e

# Configuration
VPS_IP="154.61.187.189"
VPS_USER="Administrator"
SSH_PORT="8467"
DOMAIN="ai.cash-revolution.com"
PROJECT_NAME="ai-cash-revolution"

echo "🚀 AI Cash R-evolution - Auto Deploy to VPS"
echo "================================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if VPS IP is set
if [ "$VPS_IP" = "YOUR_VPS_IP_HERE" ]; then
    print_error "Please edit deploy-to-vps.sh and set your VPS IP address"
    echo "Change VPS_IP=\"YOUR_VPS_IP_HERE\" to VPS_IP=\"123.123.123.123\""
    exit 1
fi

# Check if we can connect to VPS
print_status "Testing VPS connection..."
if ! ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -p $SSH_PORT $VPS_USER@$VPS_IP "echo 'Connection OK'" > /dev/null 2>&1; then
    print_error "Cannot connect to VPS. Please check:"
    echo "1. VPS IP is correct: $VPS_IP"
    echo "2. SSH key is setup or you can login with password"
    echo "3. VPS is running and accessible"
    exit 1
fi
print_success "VPS connection successful"

# Step 1: Commit and push to GitHub (if changes exist)
print_status "Checking for local changes..."
if ! git diff-index --quiet HEAD --; then
    print_status "Found local changes, committing to GitHub..."
    git add .
    git commit -m "Auto-deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    git push origin main
    print_success "Changes pushed to GitHub"
else
    print_status "No local changes found"
fi

# Step 2: Create deployment script for VPS
print_status "Creating VPS deployment script..."
cat > temp_vps_deploy.sh << 'EOF'
#!/bin/bash

set -e

DOMAIN="ai.cash-revolution.com"
APP_DIR="/var/www/ai-cash-revolution"
PROJECT_NAME="ai-cash-revolution"

echo "🔄 Starting VPS deployment..."

# Install system dependencies if first time
if ! command -v node &> /dev/null; then
    echo "📦 Installing system dependencies..."
    apt update
    apt install -y curl wget git nginx postgresql postgresql-contrib redis-server nodejs npm certbot python3-certbot-nginx build-essential
    
    # Install Node.js 18+
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # Install PM2
    npm install -g pm2
    
    echo "✅ System dependencies installed"
fi

# Create app directory if doesn't exist
mkdir -p $APP_DIR
cd $APP_DIR

# Clone or pull repository
if [ ! -d ".git" ]; then
    echo "📥 Cloning repository..."
    git clone https://github.com/paolosca90/ai-cash-revolution.git .
else
    echo "🔄 Pulling latest changes..."
    git pull origin main
fi

# Setup database if first time
if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw aicash_revolution; then
    echo "🗄️ Setting up database..."
    systemctl start postgresql
    systemctl enable postgresql
    
    sudo -u postgres psql << 'DBEOF'
CREATE DATABASE aicash_revolution;
CREATE USER aicash WITH ENCRYPTED PASSWORD 'secure_password_2025!';
GRANT ALL PRIVILEGES ON DATABASE aicash_revolution TO aicash;
ALTER USER aicash CREATEDB;
\q
DBEOF
    
    sudo -u postgres psql aicash_revolution < init-database.sql
    echo "✅ Database configured"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install --production

# Build and install frontend
echo "🏗️ Building frontend..."
cd ../frontend && npm install && npm run build

# Copy frontend build to backend
cp -r dist/* ../backend/dist/

# Start/restart application with PM2
echo "🔄 Starting application..."
cd $APP_DIR

# Stop existing processes
pm2 delete $PROJECT_NAME 2>/dev/null || true
pm2 delete "${PROJECT_NAME}-webhook" 2>/dev/null || true

# Start main application
cd backend
pm2 start server.js --name "$PROJECT_NAME" --env production

# Start webhook for auto-deploy
cd $APP_DIR
npm install express --save 2>/dev/null || true
pm2 start webhook.js --name "${PROJECT_NAME}-webhook"

# Save PM2 configuration
pm2 save
pm2 startup ubuntu -u root --hp /root

# Configure Nginx if first time
if [ ! -f "/etc/nginx/sites-available/$PROJECT_NAME" ]; then
    echo "⚙️ Configuring Nginx..."
    
    # Create nginx config
    cat > /etc/nginx/sites-available/$PROJECT_NAME << 'NGINXEOF'
server {
    listen 80;
    server_name ai.cash-revolution.com www.ai.cash-revolution.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ai.cash-revolution.com www.ai.cash-revolution.com;

    # SSL configuration (will be added by certbot)
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API and auth routes
    location ~ ^/(api|auth|login|register)/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Main application
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://localhost:4000;
        access_log off;
    }
}
NGINXEOF

    # Enable site
    ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx config
    nginx -t && systemctl reload nginx
    
    # Get SSL certificate
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --agree-tos --non-interactive --register-unsafely-without-email
    
    echo "✅ Nginx and SSL configured"
fi

# Setup automatic backups if first time
if [ ! -f "/usr/local/bin/aicash-backup.sh" ]; then
    echo "💾 Setting up automated backups..."
    
    cat > /usr/local/bin/aicash-backup.sh << 'BACKUPEOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/ai-cash-revolution"
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump aicash_revolution | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete
echo "Backup completed: $DATE"
BACKUPEOF

    chmod +x /usr/local/bin/aicash-backup.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/aicash-backup.sh") | crontab -
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx") | crontab -
    
    echo "✅ Automated backups configured"
fi

# Health check
echo "🔍 Performing health check..."
sleep 5

if curl -f -s http://localhost:4000/health > /dev/null; then
    echo "✅ Application is healthy!"
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo "🌐 Your app: https://$DOMAIN"
    echo "🔧 Admin: https://$DOMAIN/admin"
    echo ""
    echo "📊 Status:"
    pm2 list
else
    echo "⚠️ Health check failed, checking logs..."
    pm2 logs $PROJECT_NAME --lines 20
fi
EOF

# Step 3: Upload deployment script and .env.production to VPS
print_status "Uploading deployment files to VPS..."

scp -P $SSH_PORT temp_vps_deploy.sh $VPS_USER@$VPS_IP:/tmp/vps_deploy.sh
scp -P $SSH_PORT .env.production $VPS_USER@$VPS_IP:/tmp/env_production

# Step 4: Execute deployment on VPS
print_status "Executing deployment on VPS..."

ssh -p $SSH_PORT $VPS_USER@$VPS_IP << 'SSHEOF'
chmod +x /tmp/vps_deploy.sh
/tmp/vps_deploy.sh

# Copy environment file with real API keys
if [ -f "/var/www/ai-cash-revolution/.env.production" ]; then
    cp /tmp/env_production /var/www/ai-cash-revolution/.env.production
    echo "✅ Environment file updated with real API keys"
fi

# Restart to use new environment
cd /var/www/ai-cash-revolution
pm2 restart ai-cash-revolution

echo ""
echo "🎉 VPS deployment completed!"
echo "🌐 App URL: https://ai.cash-revolution.com"
echo "🔧 Admin: https://ai.cash-revolution.com/admin"
SSHEOF

# Cleanup
rm -f temp_vps_deploy.sh

print_success "🎉 Deployment completed!"
print_success "🌐 Your app is live at: https://$DOMAIN"
print_success "🔧 Admin panel: https://$DOMAIN/admin"

echo ""
echo "📊 Next steps:"
echo "1. Visit your website to test"
echo "2. Login to admin panel with: admin@$DOMAIN / CashRev2025!SecureAdmin#"
echo "3. For future updates, just run: ./deploy-to-vps.sh"