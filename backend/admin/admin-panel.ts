// Admin Panel API per gestione clienti
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import crypto from 'crypto';

const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Middleware per autenticazione admin
const authenticateAdmin = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token richiesto' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const admin = await pool.query('SELECT * FROM admin_users WHERE id = $1 AND is_active = true', [decoded.id]);
    
    if (admin.rows.length === 0) {
      return res.status(401).json({ error: 'Admin non autorizzato' });
    }

    req.admin = admin.rows[0];
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token non valido' });
  }
};

// Login Admin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await pool.query('SELECT * FROM admin_users WHERE email = $1 AND is_active = true', [email]);
    if (admin.rows.length === 0) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const isValidPassword = await bcrypt.compare(password, admin.rows[0].password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    // Update last login
    await pool.query('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [admin.rows[0].id]);

    const token = jwt.sign({ id: admin.rows[0].id, role: admin.rows[0].role }, process.env.JWT_SECRET!);
    
    res.json({
      success: true,
      token,
      admin: {
        id: admin.rows[0].id,
        username: admin.rows[0].username,
        email: admin.rows[0].email,
        role: admin.rows[0].role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore login admin' });
  }
});

// Get all clients
router.get('/clients', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, 
             COUNT(mc.id) as mt5_configs_count,
             MAX(mc.last_connection_test) as last_connection_test,
             COUNT(ts.id) as active_sessions
      FROM clients c
      LEFT JOIN client_mt5_configs mc ON c.id = mc.client_id AND mc.is_active = true
      LEFT JOIN trading_sessions ts ON c.id = ts.client_id AND ts.status = 'active'
    `;

    const params: any[] = [limit, offset];
    
    if (search) {
      query += ` WHERE (c.email ILIKE $3 OR c.full_name ILIKE $3)`;
      params.push(`%${search}%`);
    }
    
    query += ` GROUP BY c.id ORDER BY c.created_at DESC LIMIT $1 OFFSET $2`;

    const clients = await pool.query(query, params);

    // Count total
    let countQuery = 'SELECT COUNT(*) FROM clients c';
    const countParams: any[] = [];
    if (search) {
      countQuery += ` WHERE (c.email ILIKE $1 OR c.full_name ILIKE $1)`;
      countParams.push(`%${search}%`);
    }
    const totalCount = await pool.query(countQuery, countParams);

    res.json({
      clients: clients.rows,
      pagination: {
        page,
        limit,
        total: parseInt(totalCount.rows[0].count),
        totalPages: Math.ceil(totalCount.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error getting clients:', error);
    res.status(500).json({ error: 'Errore recupero clienti' });
  }
});

// Get client by ID with details
router.get('/clients/:id', authenticateAdmin, async (req, res) => {
  try {
    const clientId = req.params.id;

    // Get client info
    const client = await pool.query('SELECT * FROM clients WHERE id = $1', [clientId]);
    if (client.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente non trovato' });
    }

    // Get MT5 configs
    const mt5Configs = await pool.query(`
      SELECT id, config_name, mt5_host, mt5_port, mt5_login, mt5_server, mt5_broker,
             default_lot_size, risk_level, auto_trading_enabled, connection_status,
             last_connection_test, last_error_message, created_at, is_active
      FROM client_mt5_configs 
      WHERE client_id = $1 
      ORDER BY created_at DESC
    `, [clientId]);

    // Get recent activity
    const activities = await pool.query(`
      SELECT activity_type, description, metadata, created_at
      FROM client_activity_logs
      WHERE client_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [clientId]);

    // Get trading sessions
    const sessions = await pool.query(`
      SELECT id, session_token, started_at, ended_at, trades_executed, 
             total_profit_loss, status
      FROM trading_sessions
      WHERE client_id = $1
      ORDER BY started_at DESC
      LIMIT 10
    `, [clientId]);

    res.json({
      client: client.rows[0],
      mt5_configs: mt5Configs.rows,
      recent_activities: activities.rows,
      trading_sessions: sessions.rows
    });
  } catch (error) {
    console.error('Error getting client details:', error);
    res.status(500).json({ error: 'Errore recupero dettagli cliente' });
  }
});

// Create new client
router.post('/clients', authenticateAdmin, async (req, res) => {
  try {
    const {
      email,
      password,
      full_name,
      phone,
      subscription_type = 'trial',
      subscription_expires,
      max_concurrent_trades = 3,
      max_lot_size = 0.1,
      allowed_symbols = ['EURUSD', 'GBPUSD', 'USDJPY']
    } = req.body;

    // Check if email exists
    const existingClient = await pool.query('SELECT id FROM clients WHERE email = $1', [email]);
    if (existingClient.rows.length > 0) {
      return res.status(400).json({ error: 'Email già esistente' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const newClient = await pool.query(`
      INSERT INTO clients (email, password_hash, full_name, phone, subscription_type, 
                          subscription_expires, max_concurrent_trades, max_lot_size, allowed_symbols)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, email, full_name, subscription_type, created_at
    `, [email, passwordHash, full_name, phone, subscription_type, subscription_expires, 
        max_concurrent_trades, max_lot_size, allowed_symbols]);

    // Log activity
    await pool.query(`
      INSERT INTO client_activity_logs (client_id, activity_type, description, metadata)
      VALUES ($1, $2, $3, $4)
    `, [newClient.rows[0].id, 'client_created', `Cliente creato da admin ${req.admin.username}`, 
        JSON.stringify({ created_by_admin: req.admin.id })]);

    res.json({
      success: true,
      client: newClient.rows[0]
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Errore creazione cliente' });
  }
});

// Update client
router.put('/clients/:id', authenticateAdmin, async (req, res) => {
  try {
    const clientId = req.params.id;
    const updates = req.body;
    
    // Build dynamic update query
    const allowedFields = ['email', 'full_name', 'phone', 'subscription_type', 
                          'subscription_expires', 'is_active', 'max_concurrent_trades', 
                          'max_lot_size', 'allowed_symbols'];
    
    const setClause = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (setClause.length === 0) {
      return res.status(400).json({ error: 'Nessun campo valido da aggiornare' });
    }

    values.push(clientId);
    const query = `
      UPDATE clients 
      SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING id, email, full_name, subscription_type, is_active, updated_at
    `;

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente non trovato' });
    }

    // Log activity
    await pool.query(`
      INSERT INTO client_activity_logs (client_id, activity_type, description, metadata)
      VALUES ($1, $2, $3, $4)
    `, [clientId, 'client_updated', `Cliente aggiornato da admin ${req.admin.username}`, 
        JSON.stringify({ updated_fields: Object.keys(updates), updated_by_admin: req.admin.id })]);

    res.json({
      success: true,
      client: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Errore aggiornamento cliente' });
  }
});

// Encrypt password helper
function encrypt(text: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY!);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encryptedText: string): string {
  const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY!);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Add/Update MT5 Config for client
router.post('/clients/:id/mt5-config', authenticateAdmin, async (req, res) => {
  try {
    const clientId = req.params.id;
    const {
      config_name = 'Default',
      mt5_host,
      mt5_port = 8080,
      mt5_login,
      mt5_password,
      mt5_server,
      mt5_broker,
      default_lot_size = 0.01,
      risk_level = 'medium',
      auto_trading_enabled = false
    } = req.body;

    // Encrypt MT5 password
    const encryptedPassword = encrypt(mt5_password);

    const newConfig = await pool.query(`
      INSERT INTO client_mt5_configs 
      (client_id, config_name, mt5_host, mt5_port, mt5_login, mt5_password_encrypted, 
       mt5_server, mt5_broker, default_lot_size, risk_level, auto_trading_enabled)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, config_name, mt5_host, mt5_port, mt5_login, mt5_server, created_at
    `, [clientId, config_name, mt5_host, mt5_port, mt5_login, encryptedPassword, 
        mt5_server, mt5_broker, default_lot_size, risk_level, auto_trading_enabled]);

    // Log activity
    await pool.query(`
      INSERT INTO client_activity_logs (client_id, activity_type, description, metadata)
      VALUES ($1, $2, $3, $4)
    `, [clientId, 'mt5_config_added', `Configurazione MT5 aggiunta da admin ${req.admin.username}`, 
        JSON.stringify({ config_id: newConfig.rows[0].id, added_by_admin: req.admin.id })]);

    res.json({
      success: true,
      config: newConfig.rows[0]
    });
  } catch (error) {
    console.error('Error adding MT5 config:', error);
    res.status(500).json({ error: 'Errore aggiunta configurazione MT5' });
  }
});

// Test MT5 connection
router.post('/clients/:clientId/mt5-config/:configId/test', authenticateAdmin, async (req, res) => {
  try {
    const { clientId, configId } = req.params;

    // Get config
    const config = await pool.query(`
      SELECT * FROM client_mt5_configs 
      WHERE id = $1 AND client_id = $2 AND is_active = true
    `, [configId, clientId]);

    if (config.rows.length === 0) {
      return res.status(404).json({ error: 'Configurazione non trovata' });
    }

    const mt5Config = config.rows[0];
    const decryptedPassword = decrypt(mt5Config.mt5_password_encrypted);

    // Test connection (using existing MT5 bridge)
    const testUrl = `http://${mt5Config.mt5_host}:${mt5Config.mt5_port}/status`;
    
    try {
      const response = await fetch(testUrl, { timeout: 5000 });
      const data = await response.json();

      let status = 'error';
      let errorMessage = '';

      if (data.connected && data.trade_allowed) {
        status = 'connected';
      } else {
        status = 'disconnected';
        errorMessage = data.error || 'Trading not allowed';
      }

      // Update config
      await pool.query(`
        UPDATE client_mt5_configs 
        SET connection_status = $1, last_connection_test = CURRENT_TIMESTAMP, last_error_message = $2
        WHERE id = $3
      `, [status, errorMessage, configId]);

      // Log activity
      await pool.query(`
        INSERT INTO client_activity_logs (client_id, activity_type, description, metadata)
        VALUES ($1, $2, $3, $4)
      `, [clientId, 'mt5_connection_test', `Test connessione MT5: ${status}`, 
          JSON.stringify({ config_id: configId, status, tested_by_admin: req.admin.id })]);

      res.json({
        success: status === 'connected',
        status,
        error_message: errorMessage,
        connection_data: data
      });

    } catch (fetchError) {
      // Update with error
      await pool.query(`
        UPDATE client_mt5_configs 
        SET connection_status = 'error', last_connection_test = CURRENT_TIMESTAMP, 
            last_error_message = $1
        WHERE id = $2
      `, [fetchError.message, configId]);

      res.json({
        success: false,
        status: 'error',
        error_message: `Connection failed: ${fetchError.message}`
      });
    }

  } catch (error) {
    console.error('Error testing MT5 connection:', error);
    res.status(500).json({ error: 'Errore test connessione' });
  }
});

// Get system statistics
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    // Total clients
    const totalClients = await pool.query('SELECT COUNT(*) FROM clients WHERE is_active = true');
    
    // Active subscriptions
    const activeSubscriptions = await pool.query(`
      SELECT COUNT(*) FROM clients 
      WHERE is_active = true AND (subscription_expires IS NULL OR subscription_expires > CURRENT_TIMESTAMP)
    `);
    
    // Connected MT5 configs
    const connectedMT5 = await pool.query(`
      SELECT COUNT(*) FROM client_mt5_configs 
      WHERE is_active = true AND connection_status = 'connected'
    `);
    
    // Active trading sessions
    const activeSessions = await pool.query(`
      SELECT COUNT(*) FROM trading_sessions WHERE status = 'active'
    `);

    // Recent activities (last 24h)
    const recentActivities = await pool.query(`
      SELECT COUNT(*) FROM client_activity_logs 
      WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
    `);

    // Subscription breakdown
    const subscriptionBreakdown = await pool.query(`
      SELECT subscription_type, COUNT(*) as count
      FROM clients WHERE is_active = true
      GROUP BY subscription_type
    `);

    res.json({
      total_clients: parseInt(totalClients.rows[0].count),
      active_subscriptions: parseInt(activeSubscriptions.rows[0].count),
      connected_mt5_configs: parseInt(connectedMT5.rows[0].count),
      active_trading_sessions: parseInt(activeSessions.rows[0].count),
      recent_activities_24h: parseInt(recentActivities.rows[0].count),
      subscription_breakdown: subscriptionBreakdown.rows
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Errore recupero statistiche' });
  }
});

// Export per Vercel function
module.exports = router;
export default router;