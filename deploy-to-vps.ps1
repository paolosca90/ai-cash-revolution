# AI Cash R-evolution - Windows PowerShell Deploy Script
# Run this from PowerShell to deploy everything automatically

# Configuration
$VPS_IP = "154.61.187.189"
$VPS_USER = "Administrator"  
$SSH_PORT = "8467"
$DOMAIN = "ai.cash-revolution.com"

Write-Host "🚀 AI Cash R-evolution - Auto Deploy to VPS" -ForegroundColor Green
Write-Host "================================================"

# Colors for output
function Write-Status($message) { Write-Host "[INFO] $message" -ForegroundColor Blue }
function Write-Success($message) { Write-Host "[SUCCESS] $message" -ForegroundColor Green }
function Write-Error($message) { Write-Host "[ERROR] $message" -ForegroundColor Red }

# Check if we have git
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git is not installed. Please install Git first."
    exit 1
}

# Step 1: Push changes to GitHub
Write-Status "Checking for local changes..."
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Status "Found local changes, committing to GitHub..."
    git add .
    git commit -m "Auto-deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    git push origin main
    Write-Success "Changes pushed to GitHub"
} else {
    Write-Status "No local changes found"
}

# Step 2: Create temporary batch file for SSH commands (Windows workaround)
$sshCommands = @'
# Install basic tools
sudo apt update
sudo apt install -y curl wget git

# Install Node.js and dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt-get install -y nodejs nginx postgresql postgresql-contrib redis-server build-essential
sudo npm install -g pm2

# Clone or update repository  
sudo mkdir -p /var/www/ai-cash-revolution
cd /var/www/ai-cash-revolution
sudo git clone https://github.com/paolosca90/ai-cash-revolution.git . || sudo git pull origin main

# Setup database
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo -u postgres psql -c "CREATE DATABASE IF NOT EXISTS aicash_revolution;"
sudo -u postgres psql -c "CREATE USER IF NOT EXISTS aicash WITH ENCRYPTED PASSWORD 'secure_password_2025!';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE aicash_revolution TO aicash;"

# Install and build
cd backend && sudo npm install --production
cd ../frontend && sudo npm install && sudo npm run build
sudo cp -r dist/* ../backend/dist/

# Start with PM2
cd /var/www/ai-cash-revolution
sudo pm2 delete ai-cash-revolution 2>/dev/null || true
cd backend && sudo pm2 start server.js --name "ai-cash-revolution"
sudo pm2 save
sudo pm2 startup

echo "✅ Deployment completed!"
'@

Write-Status "Deployment commands prepared"
Write-Host ""
Write-Host "🔧 MANUAL STEPS REQUIRED:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Connect to your VPS using Remote Desktop or SSH:" -ForegroundColor White
Write-Host "   IP: $VPS_IP" -ForegroundColor Cyan
Write-Host "   Port: $SSH_PORT" -ForegroundColor Cyan  
Write-Host "   User: $VPS_USER" -ForegroundColor Cyan
Write-Host "   Password: d7Y*8R9cX9Qy" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Open terminal/command prompt on VPS and run these commands:" -ForegroundColor White
Write-Host ""
Write-Host $sshCommands -ForegroundColor Gray
Write-Host ""
Write-Host "3. Copy your .env.production file to VPS:" -ForegroundColor White
Write-Host "   From: $PWD\.env.production" -ForegroundColor Cyan
Write-Host "   To: /var/www/ai-cash-revolution/.env.production" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Restart the application:" -ForegroundColor White
Write-Host "   sudo pm2 restart ai-cash-revolution" -ForegroundColor Gray
Write-Host ""
Write-Success "Your code is ready on GitHub!"
Write-Success "Follow the manual steps above to complete the deployment."
Write-Host ""
Write-Host "🌐 After deployment, your app will be at: http://$VPS_IP:4000" -ForegroundColor Green