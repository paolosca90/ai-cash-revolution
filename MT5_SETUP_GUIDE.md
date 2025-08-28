# AI Cash R-evolution MT5 Setup Guide

## Overview
This guide explains how to connect your AI Cash R-evolution platform to MetaTrader 5 for automated trading.

## Requirements
- MetaTrader 5 terminal installed
- Valid MT5 broker account
- VPS or dedicated server (recommended)
- Python 3.8+ (for MT5 Python API)

## Setup Steps

### 1. MetaTrader 5 Installation

#### On Windows VPS:
1. Download MT5 from your broker's website
2. Install and log in with your credentials
3. Enable algorithmic trading: Tools → Options → Expert Advisors
4. Check "Allow automated trading" and "Allow DLL imports"

#### On Linux VPS (using Wine):
```bash
# Install Wine
sudo apt update
sudo apt install wine

# Download and install MT5 through Wine
# Follow your broker's specific instructions
```

### 2. Python MT5 Integration

Install the required Python packages:
```bash
pip install MetaTrader5 requests numpy pandas
```

### 3. Environment Configuration

Update your `.env.production` file with your actual MT5 credentials:

```bash
# MT5 Configuration
MT5_HOST=your_vps_ip_or_domain.com
MT5_PORT=8080
MT5_SERVER=YourBroker-MT5Server
MT5_LOGIN=12345678
MT5_PASSWORD=your_secure_password
MT5_TERMINAL_PATH=/path/to/terminal64.exe
MT5_PYTHON_ENABLED=true
```

### 4. Network Configuration

#### Firewall Settings:
- Open port 8080 for MT5 API communication
- Allow connections from your web application server

#### Security Settings:
- Use strong passwords
- Enable 2FA if available
- Whitelist specific IP addresses

### 5. Testing the Connection

Use the built-in connection test in the AI Cash R-evolution dashboard:

1. Navigate to Settings → MT5 Configuration
2. Enter your MT5 credentials
3. Click "Test Connection"
4. Verify the connection status

### 6. Production Deployment

#### VPS Recommendations:
- **Minimum specs**: 2GB RAM, 2 CPU cores, 20GB SSD
- **Recommended specs**: 4GB RAM, 4 CPU cores, 50GB SSD
- **Location**: Close to your broker's servers for low latency

#### Popular VPS Providers:
- ForexVPS
- VPSForexTrader
- Amazon EC2
- Google Cloud Platform
- DigitalOcean

### 7. Monitoring and Maintenance

#### Health Checks:
The platform automatically monitors:
- MT5 connection status
- Account balance and equity
- Active positions
- Trading permissions

#### Logs:
Monitor the following log files:
- `/app/logs/mt5-connection.log`
- `/app/logs/trading-operations.log`
- MetaTrader 5 terminal logs

### 8. Troubleshooting

#### Common Issues:

**Connection Refused:**
- Check firewall settings
- Verify MT5 terminal is running
- Confirm login credentials

**Authentication Failed:**
- Verify account number and password
- Check server name spelling
- Ensure account has API access enabled

**Trading Disabled:**
- Enable algorithmic trading in MT5
- Check account permissions with broker
- Verify sufficient account balance

**High Latency:**
- Use VPS close to broker servers
- Optimize network settings
- Consider dedicated servers for high-frequency trading

### 9. Security Best Practices

1. **Never store passwords in plain text**
2. **Use environment variables for credentials**
3. **Enable MT5 terminal logging for auditing**
4. **Regularly update passwords**
5. **Monitor account activity daily**
6. **Set up account balance alerts**

### 10. Support

For technical support with MT5 integration:
- Check the platform logs first
- Test connection using the built-in tester
- Contact support with specific error messages
- Include MT5 terminal logs if available

## Production Checklist

- [ ] MT5 terminal installed and configured
- [ ] Python MT5 library installed
- [ ] Environment variables updated
- [ ] Firewall configured
- [ ] Connection test successful
- [ ] Automated trading enabled
- [ ] Monitoring configured
- [ ] Backup procedures in place

---

**⚠️ Important**: Never share your MT5 credentials. The AI Cash R-evolution platform stores passwords securely and never logs them in plain text.