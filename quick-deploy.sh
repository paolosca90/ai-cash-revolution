#!/bin/bash

# AI Cash R-evolution Quick Deployment Script (No Docker)
set -e

echo "🚀 AI Cash R-evolution Quick Deploy Started"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if domain is provided
if [ "$#" -ne 1 ]; then
    print_error "Usage: $0 <your-domain.com>"
    print_warning "Example: $0 ai.cash-revolution.com"
    exit 1
fi

DOMAIN=$1
APP_DIR="/var/www/ai-cash-revolution"

print_status "Deploying AI Cash R-evolution to: $DOMAIN"

# Check if running as regular user (will sudo when needed)
if [[ $EUID -eq 0 ]]; then
   print_warning "Running as root. Consider running as regular user with sudo access."
fi

# Create application directory
print_status "Setting up application directory..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:www-data $APP_DIR

# Copy application files
print_status "Copying application files..."
cp -r . $APP_DIR/
cd $APP_DIR

# Update domain in configuration files
print_status "Updating domain configuration..."
sed -i "s/ai\.cash-revolution\.com/$DOMAIN/g" .env.production
sed -i "s/ai\.cash-revolution\.com/$DOMAIN/g" frontend/.env.production

# Install backend dependencies
print_status "Installing backend dependencies..."
cd $APP_DIR/backend
npm install --production

# Build frontend
print_status "Building frontend..."
cd $APP_DIR/frontend
npm install
npm run build

# Copy built frontend to backend/dist
print_status "Copying frontend build..."
cp -r dist/* ../backend/dist/

# Setup database
print_status "Setting up database..."
cd $APP_DIR
sudo -u postgres createdb aicash_revolution || echo "Database already exists"
sudo -u postgres psql aicash_revolution < init-database.sql

# Hash admin password properly
ADMIN_HASH=$(node -e "console.log(require('bcrypt').hashSync('CashRev2025!SecureAdmin#', 12))")
sudo -u postgres psql aicash_revolution -c "UPDATE admin_users SET password_hash = '$ADMIN_HASH' WHERE email = 'admin@$DOMAIN';"

print_success "Database configured"

# Start application with PM2
print_status "Starting application..."
cd $APP_DIR/backend

# Kill existing processes
pm2 delete ai-cash-revolution || echo "No existing process found"

# Start with PM2
pm2 start server.js --name "ai-cash-revolution" --env production

# Save PM2 configuration
pm2 save
pm2 startup

print_success "Application started with PM2"

# Configure Nginx
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/ai-cash-revolution > /dev/null <<EOF
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API and auth routes
    location ~ ^/(api|auth|login|register)/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Static files and main app
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:4000;
        access_log off;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/ai-cash-revolution /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
sudo nginx -t && sudo systemctl reload nginx

print_success "Nginx configured"

# Get SSL certificate
print_status "Obtaining SSL certificate..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --agree-tos --non-interactive --register-unsafely-without-email

print_success "SSL certificate obtained"

# Setup automatic renewals and backups
print_status "Setting up automation..."

# SSL renewal
(sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx") | sudo crontab -

# Database backup
sudo tee /usr/local/bin/aicash-backup.sh > /dev/null <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/ai-cash-revolution"
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump aicash_revolution | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete
echo "Backup completed: $DATE"
EOF

sudo chmod +x /usr/local/bin/aicash-backup.sh
(sudo crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/aicash-backup.sh") | sudo crontab -

print_success "Automation configured"

# Health check
print_status "Performing health check..."
sleep 5

if curl -f -k https://$DOMAIN/health >/dev/null 2>&1; then
    print_success "✅ Application is healthy and responding!"
else
    print_warning "⚠️  Health check failed. Checking PM2 status..."
    pm2 list
    pm2 logs ai-cash-revolution --lines 10
fi

# Final status
echo ""
echo "========================================================================================"
print_success "🎉 AI Cash R-evolution deployment completed!"
echo "========================================================================================"
print_status "🌐 Your application: https://$DOMAIN"
print_status "🔧 Admin panel: https://$DOMAIN/admin"
print_status "👤 Admin login: admin@$DOMAIN"
print_status "🔑 Admin password: CashRev2025!SecureAdmin#"
echo ""
print_warning "🚨 SECURITY REMINDERS:"
echo "   1. Change admin password immediately!"
echo "   2. Update Stripe keys in .env.production"
echo "   3. Update SendGrid API key in .env.production"
echo "   4. Configure MT5 server details"
echo ""
print_status "📊 Management Commands:"
echo "   - View app logs: pm2 logs ai-cash-revolution"
echo "   - Restart app: pm2 restart ai-cash-revolution"
echo "   - Check status: pm2 list"
echo "   - Check nginx: sudo systemctl status nginx"
echo "   - Manual backup: sudo /usr/local/bin/aicash-backup.sh"
echo "========================================================================================"