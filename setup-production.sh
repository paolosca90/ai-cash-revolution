#!/bin/bash

# AI Cash R-evolution Production Setup (No Docker)
set -e

echo "🚀 AI Cash R-evolution Production Setup Started"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root for system installations"
   exit 1
fi

# Check if domain is provided
if [ "$#" -ne 1 ]; then
    print_error "Usage: $0 <your-domain.com>"
    print_warning "Example: $0 ai.cash-revolution.com"
    exit 1
fi

DOMAIN=$1
print_status "Setting up AI Cash R-evolution for domain: $DOMAIN"

# Update system packages
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
print_status "Installing required packages..."
apt install -y curl wget git nginx postgresql postgresql-contrib redis-server nodejs npm certbot python3-certbot-nginx build-essential

# Install Node.js 18+ (if needed)
print_status "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2 for process management
print_status "Installing PM2..."
npm install -g pm2

# Create application user
print_status "Creating application user..."
if ! id "aicash" &>/dev/null; then
    useradd -m -s /bin/bash aicash
    usermod -aG www-data aicash
fi

# Create application directory
APP_DIR="/var/www/ai-cash-revolution"
print_status "Creating application directory..."
mkdir -p $APP_DIR
chown aicash:www-data $APP_DIR

# Setup PostgreSQL
print_status "Setting up PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE aicash_revolution;
CREATE USER aicash WITH ENCRYPTED PASSWORD 'secure_password_2025!';
GRANT ALL PRIVILEGES ON DATABASE aicash_revolution TO aicash;
ALTER USER aicash CREATEDB;
\q
EOF

print_success "PostgreSQL configured"

# Setup Redis
print_status "Setting up Redis..."
systemctl start redis-server
systemctl enable redis-server

print_success "Redis configured"

# Setup SSL certificates
print_status "Setting up SSL certificates..."
certbot certonly --nginx -d $DOMAIN -d www.$DOMAIN --agree-tos --non-interactive --register-unsafely-without-email

print_success "SSL certificates obtained"

# Create systemd services
print_status "Creating systemd services..."

# Backend service
cat > /etc/systemd/system/aicash-backend.service <<EOF
[Unit]
Description=AI Cash R-evolution Backend
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=aicash
WorkingDirectory=$APP_DIR/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=aicash-backend

[Install]
WantedBy=multi-user.target
EOF

# Frontend service (if separate)
cat > /etc/systemd/system/aicash-frontend.service <<EOF
[Unit]
Description=AI Cash R-evolution Frontend
After=network.target

[Service]
Type=simple
User=aicash
WorkingDirectory=$APP_DIR/frontend
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run preview -- --host 0.0.0.0 --port 3000
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=aicash-frontend

[Install]
WantedBy=multi-user.target
EOF

# Nginx configuration
print_status "Configuring Nginx..."
cat > /etc/nginx/sites-available/ai-cash-revolution <<EOF
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
    
    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers on;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;
    limit_req_zone \$binary_remote_addr zone=api:10m rate=30r/m;

    # API routes
    location /api/ {
        limit_req zone=api burst=10 nodelay;
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

    # Auth routes with stricter rate limiting
    location ~ ^/(login|register|auth) {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://localhost:4000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
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
ln -sf /etc/nginx/sites-available/ai-cash-revolution /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

print_success "Nginx configured"

# Create backup script
cat > /usr/local/bin/aicash-backup.sh <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/ai-cash-revolution"

mkdir -p $BACKUP_DIR

# Database backup
sudo -u postgres pg_dump aicash_revolution | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Application backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C /var/www ai-cash-revolution

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*backup_*.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/aicash-backup.sh

# Setup cron jobs
print_status "Setting up automated tasks..."
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/aicash-backup.sh") | crontab -
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx") | crontab -

print_success "Automated tasks configured"

# Create deployment script
cat > $APP_DIR/deploy.sh <<'EOF'
#!/bin/bash
cd /var/www/ai-cash-revolution

# Pull latest changes (if using git)
# git pull origin main

# Install/update dependencies
cd backend && npm install --production
cd ../frontend && npm install && npm run build

# Restart services
sudo systemctl restart aicash-backend
sudo systemctl reload nginx

echo "Deployment completed!"
EOF

chmod +x $APP_DIR/deploy.sh
chown aicash:www-data $APP_DIR/deploy.sh

print_success "Deployment script created"

# Final instructions
echo ""
echo "========================================================================================"
print_success "🎉 AI Cash R-evolution setup completed!"
echo "========================================================================================"
print_status "Next steps:"
echo "1. Copy your application files to: $APP_DIR"
echo "2. Update environment variables in: $APP_DIR/.env.production"
echo "3. Run: systemctl daemon-reload"
echo "4. Start services: systemctl start aicash-backend"
echo "5. Enable services: systemctl enable aicash-backend"
echo "6. Test: curl https://$DOMAIN/health"
echo ""
print_status "Management commands:"
echo "- View logs: journalctl -u aicash-backend -f"
echo "- Restart backend: systemctl restart aicash-backend"
echo "- Restart nginx: systemctl restart nginx"
echo "- Run backup: /usr/local/bin/aicash-backup.sh"
echo "========================================================================================"