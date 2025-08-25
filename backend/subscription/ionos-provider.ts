// IONOS Cloud API Integration per VPS automatico
import axios from 'axios';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

interface IONOSConfig {
  token: string;
  username: string;
  password: string;
  datacenter_id: string;
}

interface IONOSVPSRequest {
  userId: number;
  email: string;
  planType: 'basic' | 'premium' | 'enterprise';
  mt5Config: {
    login: string;
    password: string;
    server: string;
    broker: string;
  };
}

class IONOSProvider {
  private config: IONOSConfig;
  private baseUrl = 'https://api.ionos.com/cloudapi/v6';
  
  constructor() {
    this.config = {
      token: process.env.IONOS_API_TOKEN!,
      username: process.env.IONOS_USERNAME!,
      password: process.env.IONOS_PASSWORD!,
      datacenter_id: process.env.IONOS_DATACENTER_ID || '' // Verrà creato automaticamente
    };
  }

  private getAuthHeaders() {
    const credentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json'
    };
  }

  // Crea datacenter se non esiste
  async ensureDatacenter(): Promise<string> {
    try {
      if (this.config.datacenter_id) {
        // Verifica se datacenter esiste ancora
        const response = await axios.get(
          `${this.baseUrl}/datacenters/${this.config.datacenter_id}`,
          { headers: this.getAuthHeaders() }
        );
        if (response.data) {
          return this.config.datacenter_id;
        }
      }

      // Crea nuovo datacenter
      const datacenterData = {
        properties: {
          name: 'trading-bot-datacenter',
          description: 'Datacenter per VPS Trading Automatico',
          location: 'de/fra', // Germania - Frankfurt
          version: 1
        }
      };

      console.log('🏢 Creando datacenter IONOS...');
      const response = await axios.post(
        `${this.baseUrl}/datacenters`,
        datacenterData,
        { headers: this.getAuthHeaders() }
      );

      const datacenterId = response.data.id;
      this.config.datacenter_id = datacenterId;
      
      console.log(`✅ Datacenter creato: ${datacenterId}`);
      
      // Aspetta che sia pronto
      await this.waitForDatacenter(datacenterId);
      
      return datacenterId;
    } catch (error: any) {
      console.error('❌ Errore creazione datacenter:', error.response?.data || error.message);
      throw new Error(`Errore datacenter IONOS: ${error.message}`);
    }
  }

  private async waitForDatacenter(datacenterId: string, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(
          `${this.baseUrl}/datacenters/${datacenterId}`,
          { headers: this.getAuthHeaders() }
        );
        
        if (response.data.metadata.state === 'AVAILABLE') {
          console.log('✅ Datacenter pronto');
          return;
        }
        
        console.log(`⏳ Datacenter in preparazione... (${i + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 sec
      } catch (error) {
        console.error('Errore check datacenter:', error);
      }
    }
    throw new Error('Timeout datacenter creation');
  }

  // Crea VPS Windows per Trading
  async createTradingVPS(request: IONOSVPSRequest) {
    try {
      console.log(`🚀 Creando VPS IONOS per utente ${request.userId}...`);
      
      // 1. Assicura datacenter
      const datacenterId = await this.ensureDatacenter();

      // 2. Configura specifiche VPS based on plan
      const vpsSpecs = this.getVPSSpecs(request.planType);
      
      // 3. Genera password amministratore sicura
      const adminPassword = this.generateSecurePassword();

      // 4. Script di configurazione Windows
      const setupScript = this.generateWindowsSetupScript(request.mt5Config, request.userId);
      const encodedScript = Buffer.from(setupScript).toString('base64');

      // 5. Crea server request
      const serverData = {
        properties: {
          name: `trading-bot-user-${request.userId}`,
          cores: vpsSpecs.cores,
          ram: vpsSpecs.ram, // MB
          availabilityZone: 'AUTO',
          vmState: 'RUNNING',
          bootCdrom: null,
          bootVolume: null
        }
      };

      console.log(`📊 Specifiche VPS: ${vpsSpecs.cores} cores, ${vpsSpecs.ram}MB RAM`);
      
      // 6. Crea volume (disk)
      const volumeData = {
        properties: {
          name: `trading-volume-${request.userId}`,
          size: vpsSpecs.diskSize, // GB
          licenceType: 'WINDOWS',
          type: 'SSD',
          imageAlias: 'windows:2019',
          userData: encodedScript, // Script eseguito al primo boot
          imagePassword: adminPassword
        }
      };

      console.log('💾 Creando volume di sistema...');
      const volumeResponse = await axios.post(
        `${this.baseUrl}/datacenters/${datacenterId}/volumes`,
        volumeData,
        { headers: this.getAuthHeaders() }
      );

      const volumeId = volumeResponse.data.id;
      console.log(`✅ Volume creato: ${volumeId}`);

      // Aspetta volume pronto
      await this.waitForResource(datacenterId, 'volumes', volumeId);

      // 7. Crea server con volume
      serverData.properties.bootVolume = { id: volumeId };
      
      console.log('🖥️ Creando server...');
      const serverResponse = await axios.post(
        `${this.baseUrl}/datacenters/${datacenterId}/servers`,
        serverData,
        { headers: this.getAuthHeaders() }
      );

      const serverId = serverResponse.data.id;
      console.log(`✅ Server creato: ${serverId}`);

      // 8. Crea NIC (scheda di rete) con IP pubblico
      const nicData = {
        properties: {
          name: `nic-${request.userId}`,
          dhcp: true,
          lan: 1,
          ips: [] // IP automatico
        }
      };

      console.log('🌐 Configurando rete...');
      const nicResponse = await axios.post(
        `${this.baseUrl}/datacenters/${datacenterId}/servers/${serverId}/nics`,
        nicData,
        { headers: this.getAuthHeaders() }
      );

      const nicId = nicResponse.data.id;

      // 9. Crea IP pubblico
      const ipData = {
        properties: {
          type: 'ipblock',
          location: 'de/fra',
          size: 1,
          name: `ip-trading-${request.userId}`
        }
      };

      const ipResponse = await axios.post(
        `${this.baseUrl}/ipblocks`,
        ipData,
        { headers: this.getAuthHeaders() }
      );

      const publicIP = ipResponse.data.properties.ips[0];
      console.log(`🌍 IP pubblico assegnato: ${publicIP}`);

      // 10. Associa IP pubblico al NIC
      await axios.patch(
        `${this.baseUrl}/datacenters/${datacenterId}/servers/${serverId}/nics/${nicId}`,
        {
          properties: {
            ips: [publicIP]
          }
        },
        { headers: this.getAuthHeaders() }
      );

      // 11. Avvia il provisioning
      console.log('⚡ Avviando provisioning...');
      const provisionResponse = await axios.post(
        `${this.baseUrl}/datacenters/${datacenterId}/provision`,
        {},
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ Provisioning avviato');

      // 12. Salva nel database
      await pool.query(`
        INSERT INTO client_vps_instances (
          client_id, provider, instance_id, ip_address, region, 
          admin_password, monthly_cost, status, created_at,
          datacenter_id, server_id, volume_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, $9, $10, $11)
      `, [
        request.userId, 'ionos', serverId, publicIP, 'de/fra',
        adminPassword, vpsSpecs.monthlyCost, 'provisioning',
        datacenterId, serverId, volumeId
      ]);

      // 13. Monitora setup in background (non bloccante)
      this.monitorVPSSetup(serverId, publicIP, request.userId);

      return {
        success: true,
        provider: 'ionos',
        instance_id: serverId,
        ip_address: publicIP,
        admin_password: adminPassword,
        monthly_cost: vpsSpecs.monthlyCost,
        estimated_ready_time: '8-12 minuti',
        datacenter_id: datacenterId
      };

    } catch (error: any) {
      console.error('❌ Errore creazione VPS IONOS:', error.response?.data || error.message);
      throw new Error(`IONOS VPS creation failed: ${error.message}`);
    }
  }

  private getVPSSpecs(planType: string) {
    const specs = {
      basic: {
        cores: 1,
        ram: 1024,      // 1GB
        diskSize: 25,   // 25GB SSD  
        monthlyCost: 4
      },
      premium: {
        cores: 2,
        ram: 2048,      // 2GB
        diskSize: 50,   // 50GB SSD
        monthlyCost: 8
      },
      enterprise: {
        cores: 2,
        ram: 4096,      // 4GB
        diskSize: 80,   // 80GB SSD
        monthlyCost: 16
      }
    };

    return specs[planType] || specs.basic;
  }

  private generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private generateWindowsSetupScript(mt5Config: any, userId: number): string {
    return `
# Script PowerShell per configurazione automatica Trading Bot
# User ID: ${userId}
# Generated: ${new Date().toISOString()}

# Log everything
Start-Transcript -Path "C:\\setup-log.txt" -Append

Write-Host "=== TRADING BOT SETUP STARTED ===" -ForegroundColor Green

try {
    # 1. Disable Windows Defender (per performance)
    Write-Host "Disabling Windows Defender..."
    Set-MpPreference -DisableRealtimeMonitoring $true -ErrorAction SilentlyContinue

    # 2. Configure Windows Updates (manual)
    Write-Host "Configuring Windows Updates..."
    reg add "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU" /v AUOptions /t REG_DWORD /d 2 /f

    # 3. Install Chocolatey
    Write-Host "Installing Chocolatey package manager..."
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

    # 4. Install Python
    Write-Host "Installing Python 3.11..."
    choco install python311 -y --params "/InstallDir:C:\\Python311" --force

    # Refresh environment
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")

    # 5. Install Python packages
    Write-Host "Installing Python packages..."
    C:\\Python311\\python.exe -m pip install --upgrade pip
    C:\\Python311\\python.exe -m pip install MetaTrader5 flask flask-cors requests schedule

    # 6. Create trading directory
    Write-Host "Creating trading directories..."
    New-Item -ItemType Directory -Force -Path "C:\\TradingBot"
    New-Item -ItemType Directory -Force -Path "C:\\TradingBot\\logs"

    # 7. Download MT5 bridge server
    Write-Host "Downloading MT5 bridge server..."
    $bridgeUrl = "${process.env.DOMAIN || 'https://your-domain.com'}/api/mt5-bridge-server.py"
    try {
        Invoke-WebRequest -Uri $bridgeUrl -OutFile "C:\\TradingBot\\mt5-bridge-server.py" -UseBasicParsing
    } catch {
        Write-Host "Warning: Could not download bridge server from $bridgeUrl"
        # Create basic bridge server locally
        @"
import MetaTrader5 as mt5
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

@app.route('/status', methods=['GET'])
def status():
    if not mt5.initialize():
        return jsonify({'connected': False, 'error': 'MT5 not initialized'})
    
    account_info = mt5.account_info()
    if account_info is None:
        return jsonify({'connected': False, 'error': 'No account info'})
    
    return jsonify({
        'connected': True,
        'login': account_info.login,
        'balance': account_info.balance,
        'server': account_info.server
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=False)
"@ | Out-File -FilePath "C:\\TradingBot\\mt5-bridge-server.py" -Encoding UTF8
    }

    # 8. Create MT5 configuration
    Write-Host "Creating MT5 configuration..."
    $mt5ConfigContent = @"
MT5_LOGIN=${mt5Config.login}
MT5_SERVER=${mt5Config.server}
MT5_BROKER=${mt5Config.broker}
USER_ID=${userId}
API_ENDPOINT=${process.env.DOMAIN || 'https://your-domain.com'}/api
"@
    $mt5ConfigContent | Out-File -FilePath "C:\\TradingBot\\config.env" -Encoding UTF8

    # 9. Create Windows service script
    Write-Host "Creating service runner..."
    @"
import sys
import os
sys.path.append('C:\\TradingBot')
os.chdir('C:\\TradingBot')

# Load environment variables
with open('config.env', 'r') as f:
    for line in f:
        if '=' in line:
            key, value = line.strip().split('=', 1)
            os.environ[key] = value

# Start the bridge server
exec(open('mt5-bridge-server.py').read())
"@ | Out-File -FilePath "C:\\TradingBot\\service-runner.py" -Encoding UTF8

    # 10. Create startup batch file
    Write-Host "Creating startup script..."
    @"
@echo off
cd /d C:\\TradingBot
echo Starting Trading Bot Service...
C:\\Python311\\python.exe service-runner.py > logs\\service.log 2>&1
"@ | Out-File -FilePath "C:\\TradingBot\\start-service.bat" -Encoding ASCII

    # 11. Configure Windows service
    Write-Host "Configuring Windows service..."
    schtasks /create /tn "TradingBotService" /tr "C:\\TradingBot\\start-service.bat" /sc onstart /ru SYSTEM /rl HIGHEST /f

    # 12. Open firewall port
    Write-Host "Configuring firewall..."
    New-NetFirewallRule -DisplayName "Trading Bot API" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow

    # 13. Download MetaTrader 5
    Write-Host "Preparing MetaTrader 5 installer..."
    $mt5Url = "https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe"
    Invoke-WebRequest -Uri $mt5Url -OutFile "C:\\TradingBot\\mt5setup.exe" -UseBasicParsing

    # 14. Create final setup instructions
    @"
=== TRADING BOT SETUP COMPLETED ===

Next steps:
1. Install MetaTrader 5: C:\\TradingBot\\mt5setup.exe
2. Login with your credentials:
   - Login: ${mt5Config.login}
   - Server: ${mt5Config.server}
3. Enable automated trading in MT5
4. The bridge service will start automatically

Service Status: http://localhost:8080/status
Logs: C:\\TradingBot\\logs\\

User ID: ${userId}
Setup completed: ${new Date().toISOString()}
"@ | Out-File -FilePath "C:\\TradingBot\\SETUP-COMPLETE.txt" -Encoding UTF8

    # 15. Signal completion
    Write-Host "=== SETUP COMPLETED SUCCESSFULLY ===" -ForegroundColor Green
    
    # Create completion marker
    "SETUP_COMPLETE_$(Get-Date -Format 'yyyyMMdd_HHmmss')" | Out-File -FilePath "C:\\setup-complete.txt"

} catch {
    Write-Host "=== SETUP FAILED ===" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    $_ | Out-File -FilePath "C:\\setup-error.txt"
}

Stop-Transcript
    `;
  }

  private async waitForResource(datacenterId: string, resourceType: string, resourceId: string, maxAttempts = 60) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(
          `${this.baseUrl}/datacenters/${datacenterId}/${resourceType}/${resourceId}`,
          { headers: this.getAuthHeaders() }
        );
        
        if (response.data.metadata.state === 'AVAILABLE') {
          return;
        }
        
        console.log(`⏳ ${resourceType} ${resourceId} in preparazione... (${i + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 sec
      } catch (error) {
        console.error(`Errore check ${resourceType}:`, error);
      }
    }
    throw new Error(`Timeout waiting for ${resourceType} ${resourceId}`);
  }

  // Monitora setup VPS (non bloccante)
  private async monitorVPSSetup(serverId: string, ipAddress: string, userId: number) {
    console.log(`🔍 Monitoraggio setup VPS ${serverId} per utente ${userId}...`);
    
    // Aspetta che VPS sia accessibile (può richiedere 5-10 minuti)
    let setupComplete = false;
    let attempts = 0;
    const maxAttempts = 40; // 20 minuti max

    while (!setupComplete && attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`⏳ Setup monitoring attempt ${attempts}/${maxAttempts} for VPS ${serverId}`);
        
        // Controlla se setup è completo
        const response = await axios.get(`http://${ipAddress}:8080/status`, { 
          timeout: 10000,
          headers: { 'User-Agent': 'TradingBot-Monitor' }
        });
        
        if (response.status === 200 && response.data.connected) {
          setupComplete = true;
          console.log(`✅ VPS ${serverId} setup completato e MT5 connesso!`);
          
          // Aggiorna database
          await pool.query(`
            UPDATE client_vps_instances 
            SET status = 'active', configured_at = CURRENT_TIMESTAMP
            WHERE instance_id = $1
          `, [serverId]);

          await pool.query(`
            UPDATE client_mt5_configs 
            SET connection_status = 'connected', last_connection_test = CURRENT_TIMESTAMP
            WHERE mt5_host = $1
          `, [ipAddress]);

          // Log success
          await pool.query(`
            INSERT INTO client_activity_logs (client_id, activity_type, description, metadata)
            VALUES ($1, $2, $3, $4)
          `, [userId, 'vps_setup_complete', 'VPS IONOS configurato e MT5 attivo', JSON.stringify({
            server_id: serverId, ip_address: ipAddress, setup_attempts: attempts
          })]);

          break;
        }
      } catch (error) {
        // VPS ancora in setup o non raggiungibile
        console.log(`⏳ VPS ${serverId} ancora in configurazione... (tentativo ${attempts})`);
      }
      
      // Aspetta 30 secondi prima del prossimo check
      await new Promise(resolve => setTimeout(resolve, 30000));
    }

    if (!setupComplete) {
      console.error(`❌ Setup VPS ${serverId} fallito dopo ${maxAttempts} tentativi`);
      
      await pool.query(`
        UPDATE client_vps_instances 
        SET status = 'setup_failed', error_message = 'Setup timeout after 20 minutes'
        WHERE instance_id = $1
      `, [serverId]);
    }
  }

  // Elimina VPS
  async deleteVPS(serverId: string, datacenterId?: string) {
    try {
      console.log(`🗑️ Eliminando VPS ${serverId}...`);
      
      if (datacenterId) {
        await axios.delete(
          `${this.baseUrl}/datacenters/${datacenterId}/servers/${serverId}`,
          { headers: this.getAuthHeaders() }
        );
      }
      
      console.log(`✅ VPS ${serverId} eliminato`);
      return { success: true };
    } catch (error: any) {
      console.error('Errore eliminazione VPS:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  // Get VPS info
  async getVPSInfo(serverId: string, datacenterId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/datacenters/${datacenterId}/servers/${serverId}`,
        { headers: this.getAuthHeaders() }
      );
      
      return {
        success: true,
        server: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export const ionosProvider = new IONOSProvider();

// Export function per subscription manager
export async function createIONOSVPS(request: IONOSVPSRequest) {
  return await ionosProvider.createTradingVPS(request);
}