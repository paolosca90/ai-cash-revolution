# 🚀 AI Cash R-evolution - Deployment Instructions (No Docker)

## Quick Start (Recommended)

1. **Upload the entire project folder** to your VPS
2. **Run the quick deployment script**:
   ```bash
   chmod +x quick-deploy.sh
   sudo ./quick-deploy.sh ai.cash-revolution.com
   ```

That's it! The script will automatically:
- Install all dependencies (Node.js, PostgreSQL, Redis, Nginx, PM2)
- Configure the database
- Build and start the application
- Configure Nginx with SSL certificates
- Set up automated backups and SSL renewal

---

## Manual Setup (Advanced Users)

### Prerequisites Installation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git nginx postgresql postgresql-contrib redis-server nodejs npm certbot python3-certbot-nginx build-essential

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2
```

### Database Setup

```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

```sql
CREATE DATABASE aicash_revolution;
CREATE USER aicash WITH ENCRYPTED PASSWORD 'secure_password_2025!';
GRANT ALL PRIVILEGES ON DATABASE aicash_revolution TO aicash;
\q
```

```bash
# Initialize database structure
sudo -u postgres psql aicash_revolution < init-database.sql
```

### Application Setup

```bash
# Create app directory
sudo mkdir -p /var/www/ai-cash-revolution
sudo chown -R $USER:www-data /var/www/ai-cash-revolution

# Copy files
cp -r . /var/www/ai-cash-revolution/
cd /var/www/ai-cash-revolution

# Install backend dependencies
cd backend
npm install --production

# Build frontend
cd ../frontend
npm install
npm run build

# Copy frontend build to backend
cp -r dist/* ../backend/dist/
```

### Start Application

```bash
cd /var/www/ai-cash-revolution/backend

# Start with PM2
pm2 start server.js --name "ai-cash-revolution" --env production
pm2 save
pm2 startup
```

### Nginx Configuration

```bash
# Create nginx config (replace DOMAIN with your domain)
sudo nano /etc/nginx/sites-available/ai-cash-revolution
```

Copy the nginx configuration from `quick-deploy.sh` script.

```bash
# Enable site
sudo ln -sf /etc/nginx/sites-available/ai-cash-revolution /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## Configuration Files

### Environment Variables

Update these files with your production values:

**`.env.production`**:
```env
# Update these values:
STRIPE_SECRET_KEY=sk_live_your_real_stripe_key
SENDGRID_API_KEY=SG.your_real_sendgrid_key
MT5_HOST=your_mt5_server_ip
MT5_LOGIN=your_mt5_account
MT5_PASSWORD=your_mt5_password
```

**`frontend/.env.production`**:
```env
VITE_CLIENT_TARGET=https://your-domain.com
VITE_API_URL=https://your-domain.com
```

---

## Management Commands

### PM2 Process Management
```bash
pm2 list                    # Show all processes
pm2 logs ai-cash-revolution # View logs
pm2 restart ai-cash-revolution # Restart app
pm2 stop ai-cash-revolution # Stop app
pm2 monit                   # Monitor resources
```

### Database Management
```bash
# Connect to database
sudo -u postgres psql aicash_revolution

# Create backup
sudo -u postgres pg_dump aicash_revolution > backup.sql

# Restore backup
sudo -u postgres psql aicash_revolution < backup.sql
```

### Nginx Management
```bash
sudo systemctl status nginx  # Check status
sudo systemctl restart nginx # Restart nginx
sudo nginx -t               # Test configuration
sudo systemctl reload nginx  # Reload config
```

### SSL Certificate Management
```bash
sudo certbot certificates    # List certificates
sudo certbot renew          # Renew certificates
sudo certbot revoke --cert-path /path/to/cert # Revoke certificate
```

---

## Monitoring & Troubleshooting

### Log Files
- **Application logs**: `pm2 logs ai-cash-revolution`
- **Nginx access**: `/var/log/nginx/access.log`
- **Nginx error**: `/var/log/nginx/error.log`
- **System logs**: `journalctl -f`

### Health Checks
```bash
curl https://your-domain.com/health     # App health
sudo systemctl status nginx            # Nginx status
sudo systemctl status postgresql       # Database status
sudo systemctl status redis-server     # Redis status
```

### Common Issues

**Application won't start**:
```bash
pm2 logs ai-cash-revolution  # Check logs
pm2 restart ai-cash-revolution
```

**Database connection error**:
```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"
```

**SSL certificate issues**:
```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

**High memory usage**:
```bash
pm2 monit  # Monitor resources
pm2 restart ai-cash-revolution  # Restart if needed
```

---

## Security Checklist

- [ ] Change default admin password
- [ ] Update all API keys in production environment
- [ ] Configure firewall (allow only 22, 80, 443)
- [ ] Enable automatic security updates
- [ ] Set up monitoring and alerts
- [ ] Regular backups tested and working
- [ ] SSL certificates auto-renewing

---

## Backup & Recovery

### Automated Backups
The deployment script sets up automated daily backups at 2:00 AM.

### Manual Backup
```bash
sudo /usr/local/bin/aicash-backup.sh
```

### Recovery
```bash
# Restore database
sudo -u postgres psql aicash_revolution < /var/backups/ai-cash-revolution/db_backup_YYYYMMDD_HHMMSS.sql.gz
```

---

## Updates & Maintenance

### Application Updates
```bash
cd /var/www/ai-cash-revolution
# git pull origin main  # If using git
pm2 restart ai-cash-revolution
```

### System Updates
```bash
sudo apt update && sudo apt upgrade -y
sudo reboot  # If kernel updates
```

---

## Support

For technical support:
1. Check logs first: `pm2 logs ai-cash-revolution`
2. Verify all services are running
3. Test each component individually
4. Check configuration files for typos

**Admin Panel**: https://your-domain.com/admin
**Default Admin**: admin@your-domain.com / CashRev2025!SecureAdmin#

🔥 **Remember to change the default admin password immediately after first login!**