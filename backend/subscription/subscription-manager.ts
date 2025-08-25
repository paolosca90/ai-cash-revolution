// Sistema gestione abbonamenti e provisioning VPS automatico
import express from 'express';
import { Pool } from 'pg';
import axios from 'axios';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Configurazioni VPS provider (Vultr API)
const VULTR_API_KEY = process.env.VULTR_API_KEY;
const VPS_PLAN_ID = 'vc2-1c-1gb'; // Piano base Vultr
const VPS_REGION = 'ewr'; // New York
const VPS_OS_ID = '124'; // Windows Server 2019

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  vps_included: boolean;
  max_concurrent_trades: number;
  max_symbols: number;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter Plan',
    price: 29,
    features: ['Trading automatico 24/7', 'VPS dedicato', 'Supporto email', '3 simboli trading'],
    vps_included: true,
    max_concurrent_trades: 3,
    max_symbols: 3
  },
  {
    id: 'professional',
    name: 'Professional Plan', 
    price: 59,
    features: ['Trading automatico 24/7', 'VPS dedicato', 'Supporto prioritario', '10 simboli trading', 'Strategie avanzate'],
    vps_included: true,
    max_concurrent_trades: 10,
    max_symbols: 10
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: 119,
    features: ['Trading automatico 24/7', 'VPS dedicato', 'Supporto telefonico', 'Simboli illimitati', 'Strategie custom', 'API access'],
    vps_included: true,
    max_concurrent_trades: -1, // Illimitato
    max_symbols: -1
  }
];

// Endpoint per ottenere piani disponibili
router.get('/plans', async (req, res) => {
  res.json({
    success: true,
    plans: SUBSCRIPTION_PLANS
  });
});

// One-Click Subscription - Endpoint principale
router.post('/subscribe-oneclick', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      email,
      full_name,
      phone,
      password,
      plan_id,
      mt5_login,
      mt5_password,
      mt5_server,
      mt5_broker,
      payment_token, // Token pagamento da Stripe/PayPal
    } = req.body;

    // 1. Validazione piano
    const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === plan_id);
    if (!selectedPlan) {
      throw new Error('Piano non valido');
    }

    // 2. Verifica email non esistente
    const existingUser = await client.query('SELECT id FROM clients WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new Error('Email già registrata');
    }

    // 3. Processa pagamento
    const paymentResult = await processPayment(payment_token, selectedPlan.price, email);
    if (!paymentResult.success) {
      throw new Error(`Pagamento fallito: ${paymentResult.error}`);
    }

    // 4. Crea utente nel database
    const passwordHash = await bcrypt.hash(password, 10);
    const subscriptionExpires = new Date();
    subscriptionExpires.setMonth(subscriptionExpires.getMonth() + 1); // 1 mese

    const newUser = await client.query(`
      INSERT INTO clients (
        email, password_hash, full_name, phone, subscription_type, subscription_expires,
        max_concurrent_trades, max_lot_size, allowed_symbols, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
      RETURNING id, email, created_at
    `, [
      email, passwordHash, full_name, phone, plan_id, subscriptionExpires,
      selectedPlan.max_concurrent_trades, 0.1, 
      selectedPlan.max_symbols === -1 ? null : ['EURUSD', 'GBPUSD', 'USDJPY'].slice(0, selectedPlan.max_symbols)
    ]);

    const userId = newUser.rows[0].id;

    // 5. Crea VPS automaticamente
    console.log(`🚀 Creando VPS per utente ${userId}...`);
    const vpsResult = await createVPS(userId, email, plan_id, {
      login: mt5_login,
      password: mt5_password,
      server: mt5_server,
      broker: mt5_broker
    });
    
    if (!vpsResult.success) {
      throw new Error(`Creazione VPS fallita: ${vpsResult.error}`);
    }

    // 6. Salva configurazione MT5 con VPS
    const encryptedMT5Password = encrypt(mt5_password);
    
    await client.query(`
      INSERT INTO client_mt5_configs (
        client_id, config_name, mt5_host, mt5_port, 
        mt5_login, mt5_password_encrypted, mt5_server, mt5_broker,
        default_lot_size, auto_trading_enabled, connection_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, 'provisioning')
    `, [
      userId, 'VPS Auto Config', vpsResult.ip_address, 8080,
      mt5_login, encryptedMT5Password, mt5_server, mt5_broker, 0.01
    ]);

    // 7. Avvia configurazione VPS in background
    console.log(`⚙️ Configurando MT5 su VPS ${vpsResult.instance_id}...`);
    // Non blocchiamo la response per la configurazione
    configureVPSInBackground(vpsResult.instance_id, vpsResult.ip_address, {
      mt5_login,
      mt5_password,
      mt5_server,
      mt5_broker,
      user_id: userId
    });

    // 8. Crea token di accesso
    const accessToken = jwt.sign(
      { id: userId, email, plan: plan_id }, 
      process.env.JWT_SECRET!, 
      { expiresIn: '30d' }
    );

    // 9. Log attività
    await client.query(`
      INSERT INTO client_activity_logs (client_id, activity_type, description, metadata)
      VALUES ($1, $2, $3, $4)
    `, [userId, 'subscription_created', `Abbonamento ${plan_id} attivato con VPS`, JSON.stringify({
      plan_id, vps_instance: vpsResult.instance_id, payment_id: paymentResult.payment_id
    })]);

    await client.query('COMMIT');

    // 10. Invia email di benvenuto
    await sendWelcomeEmail(email, full_name, {
      vps_ip: vpsResult.ip_address,
      login_url: `https://${req.get('host')}/dashboard`,
      access_token: accessToken
    });

    res.json({
      success: true,
      message: 'Abbonamento attivato con successo!',
      user: {
        id: userId,
        email,
        plan: selectedPlan.name,
        subscription_expires: subscriptionExpires
      },
      vps: {
        ip_address: vpsResult.ip_address,
        status: 'configuring',
        estimated_ready: '10-15 minuti'
      },
      access: {
        token: accessToken,
        dashboard_url: `https://${req.get('host')}/dashboard`
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Subscription creation error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Errore creazione abbonamento'
    });
  } finally {
    client.release();
  }
});

// Crea VPS automaticamente con IONOS (priorità) o fallback
export async function createVPS(userId: number, userEmail: string, planType: 'basic' | 'premium' | 'enterprise', mt5Config: any) {
  try {
    console.log(`🚀 Creando VPS per utente ${userId} con piano ${planType}...`);
    
    // Prova Contabo prima (migliore rapporto qualità/prezzo funzionante)
    try {
      const { createContaboVPS } = await import('./contabo-provider');
      
      const contaboRequest = {
        userId,
        email: userEmail,
        planType,
        mt5Config
      };
      
      const result = await createContaboVPS(contaboRequest);
      
      if (result.success) {
        console.log(`✅ VPS Contabo creato per utente ${userId}: ${result.instance_id}`);
        return result;
      } else {
        throw new Error(result.error || 'Contabo VPS creation failed');
      }
      
    } catch (contaboError) {
      console.log(`⚠️ Contabo fallito per utente ${userId}, fallback a Vultr...`, contaboError.message);
      
      // Fallback a Vultr se Contabo non disponibile
      return await createVultrVPS(userId, userEmail, planType);
    }

  } catch (error) {
    console.error('VPS Creation Error:', error.message);
    return {
      success: false,
      error: error.message || 'Errore creazione VPS'
    };
  }
}

// Fallback Vultr (codice esistente)
async function createVultrVPS(userId: number, userEmail: string, planType: string) {
  try {
    const vpsLabel = `trading-bot-user-${userId}`;
    const userData = Buffer.from(`
      # Configurazione automatica VPS - Vultr
      # User: ${userEmail}
      # Plan: ${planType}
      # Created: ${new Date().toISOString()}
      
      # Script di configurazione verrà eseguito dopo il boot
      powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force"
    `).toString('base64');

    const response = await axios.post('https://api.vultr.com/v2/instances', {
      region: VPS_REGION,
      plan: VPS_PLAN_ID,
      os_id: VPS_OS_ID,
      label: vpsLabel,
      tag: 'trading-bot',
      user_data: userData,
      activation_email: false,
      ddos_protection: false,
      firewall_group_id: process.env.VULTR_FIREWALL_GROUP_ID || ''
    }, {
      headers: {
        'Authorization': `Bearer ${VULTR_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const instance = response.data.instance;
    
    console.log(`✅ VPS Vultr creato per utente ${userId}: ${instance.id}`);

    // Salva info VPS nel database
    await pool.query(`
      INSERT INTO client_vps_instances (
        client_id, provider, instance_id, ip_address, region, plan,
        monthly_cost, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    `, [userId, 'vultr', instance.id, instance.main_ip, VPS_REGION, VPS_PLAN_ID, 10, 'creating']);

    return {
      success: true,
      instance_id: instance.id,
      ip_address: instance.main_ip,
      provider: 'vultr',
      monthly_cost: 10
    };

  } catch (error) {
    console.error('Vultr VPS Creation Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || 'Errore creazione VPS Vultr'
    };
  }
}

// Configura MT5 su VPS in background (non bloccante)
async function configureVPSInBackground(instanceId: string, ipAddress: string, config: any) {
  // Aspetta che VPS sia pronto (polling)
  let attempts = 0;
  const maxAttempts = 20; // 10 minuti max
  
  while (attempts < maxAttempts) {
    try {
      // Controlla se VPS è raggiungibile
      const response = await axios.get(`http://${ipAddress}:22`, { timeout: 5000 });
      break; // VPS pronto
    } catch {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 30000)); // Aspetta 30 sec
    }
  }

  if (attempts >= maxAttempts) {
    console.error(`❌ VPS ${instanceId} non raggiungibile dopo ${maxAttempts} tentativi`);
    return;
  }

  console.log(`🔧 Configurando MT5 su VPS ${instanceId}...`);

  // Esegui script di configurazione remoto
  try {
    // Script PowerShell per installare Python + MT5 bridge
    const configScript = `
      # Download e installa Python
      $pythonUrl = "https://www.python.org/ftp/python/3.11.0/python-3.11.0-amd64.exe"
      Invoke-WebRequest -Uri $pythonUrl -OutFile "C:\\python-installer.exe"
      Start-Process -Wait -FilePath "C:\\python-installer.exe" -ArgumentList "/quiet", "InstallAllUsers=1", "PrependPath=1"
      
      # Installa dipendenze
      pip install MetaTrader5 flask flask-cors requests
      
      # Scarica MT5 bridge server
      $bridgeUrl = "https://yourdomain.com/mt5-bridge-server.py"
      Invoke-WebRequest -Uri $bridgeUrl -OutFile "C:\\mt5-bridge-server.py"
      
      # Configura credenziali MT5
      $mt5Config = @"
      MT5_LOGIN=${config.mt5_login}
      MT5_PASSWORD=${config.mt5_password}
      MT5_SERVER=${config.mt5_server}
      MT5_BROKER=${config.mt5_broker}
      USER_ID=${config.user_id}
      "@
      Set-Content -Path "C:\\mt5-config.env" -Value $mt5Config
      
      # Avvia servizio MT5 bridge
      python C:\\mt5-bridge-server.py
    `;

    // Eseguire script tramite WinRM o SSH (implementazione specifica)
    await executeRemoteScript(ipAddress, configScript);
    
    // Aggiorna stato nel database
    await pool.query(`
      UPDATE client_vps_instances 
      SET status = 'configured', configured_at = CURRENT_TIMESTAMP
      WHERE instance_id = $1
    `, [instanceId]);

    await pool.query(`
      UPDATE client_mt5_configs 
      SET connection_status = 'connected'
      WHERE mt5_host = $1
    `, [ipAddress]);

    console.log(`✅ VPS ${instanceId} configurato con successo`);

  } catch (error) {
    console.error(`❌ Errore configurazione VPS ${instanceId}:`, error);
    
    await pool.query(`
      UPDATE client_vps_instances 
      SET status = 'error', error_message = $1
      WHERE instance_id = $2
    `, [error.message, instanceId]);
  }
}

// Placeholder functions
async function processPayment(token: string, amount: number, email: string) {
  try {
    // Integrazione Stripe/PayPal
    return { success: true, payment_id: `pay_${Date.now()}` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function sendWelcomeEmail(email: string, name: string, data: any) {
  console.log(`📧 Sending welcome email to ${email}`);
  // Implementare con SendGrid/Mailgun
}

async function executeRemoteScript(ip: string, script: string) {
  console.log(`🔧 Executing remote script on ${ip}`);
  // Implementare con SSH/WinRM
}

function encrypt(text: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY!);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Aggiungi tabella VPS al database
const createVPSTable = `
CREATE TABLE IF NOT EXISTS client_vps_instances (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- vultr, digitalocean, aws
  instance_id VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  region VARCHAR(50),
  plan VARCHAR(100),
  status VARCHAR(50) DEFAULT 'creating', -- creating, running, configured, error
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  configured_at TIMESTAMP,
  monthly_cost DECIMAL(10,2) DEFAULT 10.00
);

CREATE INDEX IF NOT EXISTS idx_vps_client ON client_vps_instances(client_id);
CREATE INDEX IF NOT EXISTS idx_vps_status ON client_vps_instances(status);
`;

// Export per Vercel function
export default router;