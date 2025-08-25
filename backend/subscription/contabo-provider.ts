// Contabo VPS Provider - Alternativa affidabile e economica
import axios from 'axios';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

interface ContaboConfig {
  clientId: string;
  clientSecret: string;
  apiUser: string;
  apiPassword: string;
}

interface ContaboVPSRequest {
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

class ContaboProvider {
  private config: ContaboConfig;
  private baseUrl = 'https://api.contabo.com/v1';
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.config = {
      clientId: process.env.CONTABO_CLIENT_ID!,
      clientSecret: process.env.CONTABO_CLIENT_SECRET!,
      apiUser: process.env.CONTABO_API_USER!,
      apiPassword: process.env.CONTABO_API_PASSWORD!
    };
  }

  // Ottieni access token OAuth2
  private async getAccessToken(): Promise<string> {
    // Riusa token se ancora valido
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      console.log('🔐 Ottenendo access token Contabo...');
      
      const response = await axios.post('https://auth.contabo.com/auth/realms/contabo/protocol/openid-connect/token', 
        new URLSearchParams({
          'grant_type': 'password',
          'client_id': this.config.clientId,
          'client_secret': this.config.clientSecret,
          'username': this.config.apiUser,
          'password': this.config.apiPassword,
          'scope': 'openid'
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      // Token expires in (expires_in seconds)
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000) - 60000); // 1 min buffer

      console.log('✅ Access token ottenuto');
      return this.accessToken;

    } catch (error: any) {
      console.error('❌ Errore ottenimento token Contabo:', error.response?.data || error.message);
      throw new Error(`Contabo authentication failed: ${error.message}`);
    }
  }

  private async getAuthHeaders() {
    const token = await this.getAccessToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-request-id': this.generateUUID()
    };
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Crea VPS Windows per Trading
  async createTradingVPS(request: ContaboVPSRequest) {
    try {
      console.log(`🚀 Creando VPS Contabo per utente ${request.userId}...`);
      
      // 1. Seleziona specifiche VPS
      const vpsSpecs = this.getVPSSpecs(request.planType);
      console.log(`📊 Specifiche VPS: ${vpsSpecs.productId} - €${vpsSpecs.monthlyCost}/mese`);
      
      // 2. Genera password amministratore sicura
      const adminPassword = this.generateSecurePassword();

      // 3. Script setup Windows
      const setupScript = this.generateWindowsSetupScript(request.mt5Config, request.userId);
      const encodedScript = Buffer.from(setupScript).toString('base64');

      // 4. Crea istanza VPS
      const instanceData = {
        imageId: vpsSpecs.imageId, // Windows Server 2019
        productId: vpsSpecs.productId,
        region: 'EU', // Europa per bassa latenza
        sshKeys: [], // Non usato per Windows
        rootPassword: adminPassword,
        userData: encodedScript, // Script eseguito al primo boot
        displayName: `trading-bot-user-${request.userId}`,
        defaultUser: 'Administrator'
      };

      const headers = await this.getAuthHeaders();
      
      console.log('🖥️ Creando istanza VPS...');
      const response = await axios.post(
        `${this.baseUrl}/compute/instances`,
        instanceData,
        { headers }
      );

      const instance = response.data[0]; // Contabo returns array
      const instanceId = instance.instanceId;
      const ipAddress = instance.ipConfig?.v4?.ip || 'pending';

      console.log(`✅ VPS Contabo creato: ${instanceId}`);
      
      // 5. Salva nel database
      await pool.query(`
        INSERT INTO client_vps_instances (
          client_id, provider, instance_id, ip_address, region,
          admin_password, monthly_cost, status, created_at,
          product_id, image_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, $9, $10)
      `, [
        request.userId, 'contabo', instanceId, ipAddress, 'EU',
        adminPassword, vpsSpecs.monthlyCost, 'provisioning',
        vpsSpecs.productId, vpsSpecs.imageId
      ]);

      // 6. Monitora setup in background
      this.monitorVPSSetup(instanceId, ipAddress, request.userId);

      return {
        success: true,
        provider: 'contabo',
        instance_id: instanceId,
        ip_address: ipAddress,
        admin_password: adminPassword,
        monthly_cost: vpsSpecs.monthlyCost,
        estimated_ready_time: '10-15 minuti',
        product_id: vpsSpecs.productId
      };

    } catch (error: any) {
      console.error('❌ Errore creazione VPS Contabo:', error.response?.data || error.message);
      throw new Error(`Contabo VPS creation failed: ${error.message}`);
    }
  }

  private getVPSSpecs(planType: string) {
    // Contabo product IDs - verificare nella dashboard
    const specs = {
      basic: {
        productId: 'VPS-1-SSD-EU', // VPS S SSD: 2 vCPU, 4GB RAM, 50GB SSD
        imageId: 'win2019-std-x64', // Windows Server 2019 Standard
        monthlyCost: 5.99
      },
      premium: {
        productId: 'VPS-2-SSD-EU', // VPS M SSD: 3 vCPU, 8GB RAM, 100GB SSD  
        imageId: 'win2019-std-x64',
        monthlyCost: 9.99
      },
      enterprise: {
        productId: 'VPS-3-SSD-EU', // VPS L SSD: 4 vCPU, 16GB RAM, 200GB SSD
        imageId: 'win2019-std-x64', 
        monthlyCost: 18.99
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
    // Ensure it has required complexity
    return 'Tr4d3!' + password; // Prefix to ensure complexity rules
  }

  private generateWindowsSetupScript(mt5Config: any, userId: number): string {
    return `
# Trading Bot Setup Script for Windows Server 2019
# User: ${userId}
# Generated: ${new Date().toISOString()}

Start-Transcript -Path "C:\\setup-log.txt" -Append

Write-Host "=== TRADING BOT SETUP INIZIATO ===" -ForegroundColor Green

try {
    # 1. Configura Windows per performance
    Write-Host "Configurando Windows..."
    
    # Disabilita Windows Defender per performance (sicuro in ambiente controllato)
    Set-MpPreference -DisableRealtimeMonitoring $true -ErrorAction SilentlyContinue
    
    # Disabilita aggiornamenti automatici Windows
    reg add "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU" /v AUOptions /t REG_DWORD /d 2 /f
    
    # 2. Installa Chocolatey
    Write-Host "Installando Chocolatey..."
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
    
    # Refresh PATH
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
    
    # 3. Installa Python
    Write-Host "Installando Python 3.11..."
    choco install python311 --version 3.11.0 -y --force
    
    # 4. Installa Git
    choco install git -y
    
    # Refresh PATH again
    refreshenv
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
    
    # 5. Verifica Python
    python --version
    pip --version
    
    # 6. Installa pacchetti Python
    Write-Host "Installando pacchetti Python..."
    python -m pip install --upgrade pip
    pip install MetaTrader5 flask flask-cors requests schedule psutil
    
    # 7. Crea directory trading
    Write-Host "Creando directory trading..."
    New-Item -ItemType Directory -Force -Path "C:\\TradingBot"
    New-Item -ItemType Directory -Force -Path "C:\\TradingBot\\logs"
    
    # 8. Crea MT5 Bridge Server
    Write-Host "Creando MT5 Bridge Server..."
    
    $bridgeServerCode = @"
import MetaTrader5 as mt5
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
import sys

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('C:/TradingBot/logs/mt5-bridge.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global connection state
mt5_connected = False

def initialize_mt5():
    global mt5_connected
    
    try:
        if not mt5.initialize():
            logger.error("MT5 initialize() failed")
            return False
        
        account_info = mt5.account_info()
        if account_info is None:
            logger.error("MT5 account_info() failed")
            mt5.shutdown()
            return False
        
        logger.info(f"MT5 connected - Account: {account_info.login}, Server: {account_info.server}")
        mt5_connected = True
        return True
        
    except Exception as e:
        logger.error(f"MT5 initialization error: {e}")
        return False

@app.route('/status', methods=['GET'])
def get_status():
    try:
        if not mt5_connected:
            return jsonify({
                'connected': False,
                'trade_allowed': False,
                'error': 'MT5 not connected'
            })
        
        account_info = mt5.account_info()
        if account_info is None:
            return jsonify({
                'connected': False,
                'trade_allowed': False,
                'error': 'Account info unavailable'
            })
        
        return jsonify({
            'connected': True,
            'trade_allowed': account_info.trade_allowed,
            'server': account_info.server,
            'login': account_info.login,
            'balance': account_info.balance,
            'equity': account_info.equity,
            'margin': account_info.margin,
            'free_margin': account_info.margin_free,
            'margin_level': account_info.margin_level,
            'user_id': '${userId}'
        })
        
    except Exception as e:
        logger.error(f"Status check error: {e}")
        return jsonify({
            'connected': False,
            'trade_allowed': False,
            'error': str(e)
        }), 500

@app.route('/rates/<symbol>', methods=['GET'])
def get_rates(symbol):
    try:
        if not mt5_connected:
            return jsonify({'error': 'MT5 not connected'}), 400
        
        timeframe = request.args.get('timeframe', '5m')
        count = int(request.args.get('count', 50))
        
        # Convert timeframe
        tf_map = {
            '1m': mt5.TIMEFRAME_M1, '5m': mt5.TIMEFRAME_M5,
            '15m': mt5.TIMEFRAME_M15, '30m': mt5.TIMEFRAME_M30,
            '1h': mt5.TIMEFRAME_H1, '4h': mt5.TIMEFRAME_H4,
            '1d': mt5.TIMEFRAME_D1
        }
        
        mt5_tf = tf_map.get(timeframe, mt5.TIMEFRAME_M5)
        rates = mt5.copy_rates_from_pos(symbol, mt5_tf, 0, count)
        
        if rates is None:
            return jsonify({'error': f'No rates for {symbol}'}), 404
        
        rates_list = []
        for rate in rates:
            rates_list.append({
                'time': int(rate['time']),
                'open': float(rate['open']),
                'high': float(rate['high']),
                'low': float(rate['low']),
                'close': float(rate['close']),
                'volume': int(rate['tick_volume'])
            })
        
        return jsonify({
            'symbol': symbol,
            'timeframe': timeframe,
            'rates': rates_list
        })
        
    except Exception as e:
        logger.error(f"Get rates error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting MT5 Bridge Server...")
    
    # Try to initialize MT5
    if initialize_mt5():
        logger.info("MT5 Bridge Server ready on port 8080")
        app.run(host='0.0.0.0', port=8080, debug=False)
    else:
        logger.error("Failed to initialize MT5 - server will run but MT5 functions disabled")
        app.run(host='0.0.0.0', port=8080, debug=False)
"@

    $bridgeServerCode | Out-File -FilePath "C:\\TradingBot\\mt5-bridge-server.py" -Encoding UTF8
    
    # 9. Crea file di configurazione
    Write-Host "Creando configurazione MT5..."
    $configContent = @"
# MT5 Configuration
MT5_LOGIN=${mt5Config.login}
MT5_SERVER=${mt5Config.server}
MT5_BROKER=${mt5Config.broker}
USER_ID=${userId}
"@
    $configContent | Out-File -FilePath "C:\\TradingBot\\config.env" -Encoding UTF8
    
    # 10. Crea script di avvio
    $startupScript = @"
@echo off
echo Starting Trading Bot MT5 Bridge...
cd /d C:\\TradingBot
python mt5-bridge-server.py
pause
"@
    $startupScript | Out-File -FilePath "C:\\TradingBot\\start-bridge.bat" -Encoding ASCII
    
    # 11. Crea servizio Windows
    Write-Host "Configurando servizio Windows..."
    
    # Crea task scheduler per avvio automatico
    schtasks /create /tn "TradingBotBridge" /tr "C:\\TradingBot\\start-bridge.bat" /sc onstart /ru SYSTEM /rl HIGHEST /f
    
    # 12. Configura firewall
    Write-Host "Configurando firewall..."
    New-NetFirewallRule -DisplayName "Trading Bot Bridge" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
    New-NetFirewallRule -DisplayName "RDP Access" -Direction Inbound -Protocol TCP -LocalPort 3389 -Action Allow
    
    # 13. Download MetaTrader 5
    Write-Host "Scaricando MetaTrader 5..."
    try {
        $mt5Url = "https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe"
        Invoke-WebRequest -Uri $mt5Url -OutFile "C:\\TradingBot\\mt5setup.exe" -UseBasicParsing -TimeoutSec 60
        Write-Host "✅ MT5 installer scaricato"
    } catch {
        Write-Host "⚠️ Download MT5 fallito, sarà disponibile manualmente"
    }
    
    # 14. Crea istruzioni finali
    $instructions = @"
=== TRADING BOT SETUP COMPLETATO ===

Il tuo VPS è pronto per il trading automatico!

PROSSIMI PASSI:
1. Installa MetaTrader 5: C:\\TradingBot\\mt5setup.exe
2. Apri MT5 e fai login con:
   - Account: ${mt5Config.login}
   - Password: [la tua password MT5]
   - Server: ${mt5Config.server}
3. Abilita "Automated Trading" in MT5
4. Il bridge server è già attivo

ACCESSI:
- Bridge API: http://[questo-ip]:8080/status
- RDP: [questo-ip]:3389 (Administrator / password fornita)
- Logs: C:\\TradingBot\\logs\\

SUPPORTO:
- User ID: ${userId}
- Setup: ${new Date().toISOString()}
- Server: Contabo EU
"@
    
    $instructions | Out-File -FilePath "C:\\TradingBot\\ISTRUZIONI.txt" -Encoding UTF8
    
    # 15. Avvia il bridge server
    Write-Host "Avviando bridge server..."
    Start-Process -FilePath "C:\\TradingBot\\start-bridge.bat" -WindowStyle Minimized
    
    Write-Host "=== SETUP COMPLETATO CON SUCCESSO ===" -ForegroundColor Green
    
    # Marker di completamento
    "SETUP_COMPLETE_$(Get-Date -Format 'yyyyMMdd_HHmmss')" | Out-File -FilePath "C:\\setup-complete.txt"
    
} catch {
    Write-Host "=== ERRORE DURANTE SETUP ===" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    $_.Exception | Out-File -FilePath "C:\\setup-error.txt" -Append
}

Stop-Transcript
    `;
  }

  private async monitorVPSSetup(instanceId: string, ipAddress: string, userId: number) {
    console.log(`🔍 Monitoraggio setup VPS ${instanceId}...`);
    
    let setupComplete = false;
    let attempts = 0;
    const maxAttempts = 30; // 15 minuti max

    while (!setupComplete && attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`⏳ Controllo setup VPS ${instanceId} (${attempts}/${maxAttempts})`);
        
        // Aspetta un po' di più per il primo check (Windows startup lento)
        const waitTime = attempts <= 3 ? 60000 : 30000; // 1 min primi 3, poi 30 sec
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Testa connessione bridge
        const response = await axios.get(`http://${ipAddress}:8080/status`, { 
          timeout: 15000,
          headers: { 'User-Agent': 'TradingBot-Monitor' }
        });
        
        if (response.status === 200) {
          setupComplete = true;
          console.log(`✅ VPS ${instanceId} setup completato!`);
          
          // Aggiorna database
          await pool.query(`
            UPDATE client_vps_instances 
            SET status = 'active', configured_at = CURRENT_TIMESTAMP
            WHERE instance_id = $1
          `, [instanceId]);

          await pool.query(`
            UPDATE client_mt5_configs 
            SET connection_status = 'ready', last_connection_test = CURRENT_TIMESTAMP
            WHERE mt5_host = $1
          `, [ipAddress]);

          // Log success
          await pool.query(`
            INSERT INTO client_activity_logs (client_id, activity_type, description, metadata)
            VALUES ($1, $2, $3, $4)
          `, [userId, 'vps_setup_complete', 'VPS Contabo configurato e bridge attivo', JSON.stringify({
            instance_id: instanceId, ip_address: ipAddress, setup_attempts: attempts
          })]);

          break;
        }
      } catch (error) {
        console.log(`⏳ VPS ${instanceId} ancora in configurazione (${attempts}/${maxAttempts})`);
      }
    }

    if (!setupComplete) {
      console.error(`❌ Setup VPS ${instanceId} timeout`);
      
      await pool.query(`
        UPDATE client_vps_instances 
        SET status = 'setup_timeout', error_message = 'Setup timeout dopo 15 minuti'
        WHERE instance_id = $1
      `, [instanceId]);
    }
  }

  // Get VPS info
  async getVPSInfo(instanceId: string) {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await axios.get(
        `${this.baseUrl}/compute/instances/${instanceId}`,
        { headers }
      );
      
      return {
        success: true,
        instance: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete VPS
  async deleteVPS(instanceId: string) {
    try {
      const headers = await this.getAuthHeaders();
      
      await axios.delete(
        `${this.baseUrl}/compute/instances/${instanceId}`,
        { headers }
      );
      
      console.log(`✅ VPS ${instanceId} eliminato`);
      return { success: true };
    } catch (error: any) {
      console.error('Errore eliminazione VPS:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }
}

export const contaboProvider = new ContaboProvider();

// Export function per subscription manager
export async function createContaboVPS(request: ContaboVPSRequest) {
  return await contaboProvider.createTradingVPS(request);
}