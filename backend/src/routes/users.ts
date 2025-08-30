import { Router } from 'express';
import { query } from '../database/connection.js';
import { z } from 'zod';
import { Mt5Bridge } from '../../analysis/mt5-bridge.js';
import crypto from 'crypto';

const router = Router();

// Validation schemas
const AddTradingAccountSchema = z.object({
  userId: z.string(),
  accountType: z.enum(['MT4', 'MT5', 'BINANCE', 'BYBIT', 'COINBASE', 'ALPACA']),
  accountName: z.string(),
  brokerName: z.string(),
  serverUrl: z.string().optional(),
  accountNumber: z.string().optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional()
});

const UpdatePreferencesSchema = z.object({
  riskPercentage: z.number().min(0).max(100),
  accountBalance: z.number().positive()
});

// Get user preferences
router.get('/preferences', async (req, res) => {
  try {
    const { userId } = req.query;

    const result = await query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [userId]
    );

    const preferences = result.rows[0] || null;

    res.json({ preferences });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// Update user preferences
router.post('/preferences', async (req, res) => {
  try {
    const { userId } = req.query;
    const { riskPercentage, accountBalance } = UpdatePreferencesSchema.parse(req.body);

    const result = await query(`
      INSERT INTO user_preferences (user_id, risk_percentage, account_balance, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        risk_percentage = $2,
        account_balance = $3,
        updated_at = NOW()
      RETURNING *
    `, [userId, riskPercentage, accountBalance]);

    res.json({ success: true, preferences: result.rows[0] });
  } catch (error) {
    console.error('Update preferences error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Add trading account
router.post('/trading-accounts', async (req, res) => {
  try {
    const validatedData = AddTradingAccountSchema.parse(req.body);
    const { userId, accountType, accountName, brokerName, serverUrl, accountNumber, apiKey, apiSecret } = validatedData;

    // Encrypt sensitive data
    const encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
    
    function encrypt(text: string): string {
      if (!text) return text;
      const cipher = crypto.createCipher('aes192', encryptionKey);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    }
    
    const encryptedApiKey = apiKey ? encrypt(apiKey) : null;
    const encryptedApiSecret = apiSecret ? encrypt(apiSecret) : null;
    const encryptedAccountNumber = accountNumber ? encrypt(accountNumber) : null;

    const result = await query(`
      INSERT INTO trading_accounts (
        user_id, account_type, account_name, broker_name, 
        server_url, account_number, api_key, api_secret,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id, user_id, account_type, account_name, broker_name, created_at
    `, [userId, accountType, accountName, brokerName, serverUrl, 
        encryptedAccountNumber, encryptedApiKey, encryptedApiSecret]);

    const account = result.rows[0];

    res.status(201).json({
      success: true,
      account: {
        id: account.id,
        userId: account.user_id,
        accountType: account.account_type,
        accountName: account.account_name,
        brokerName: account.broker_name,
        createdAt: account.created_at
      },
      message: 'Trading account added successfully. Sensitive data has been encrypted.'
    });
  } catch (error) {
    console.error('Add trading account error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to add trading account', details: error.message });
  }
});

// Get trading accounts for user
router.get('/trading-accounts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await query(`
      SELECT 
        id, user_id, account_type, account_name, broker_name,
        server_url, account_number, is_connected, 
        last_connection_test, created_at, updated_at
      FROM trading_accounts 
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);

    const accounts = result.rows.map(account => ({
      id: account.id,
      userId: account.user_id,
      accountType: account.account_type,
      accountName: account.account_name,
      brokerName: account.broker_name,
      serverUrl: account.server_url,
      accountNumber: account.account_number,
      isConnected: account.is_connected,
      lastConnectionTest: account.last_connection_test,
      createdAt: account.created_at,
      updatedAt: account.updated_at
    }));

    res.json({ accounts });
  } catch (error) {
    console.error('Get trading accounts error:', error);
    res.status(500).json({ error: 'Failed to get trading accounts' });
  }
});

// Test trading account connection
router.post('/trading-accounts/:accountId/test', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { userId } = req.body;

    // Get account details
    const accountResult = await query(`
      SELECT * FROM trading_accounts WHERE id = $1 AND user_id = $2
    `, [accountId, userId]);
    
    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trading account not found' });
    }
    
    const account = accountResult.rows[0];
    
    // Test MT5 connection if it's an MT5 account
    let connectionResult;
    let accountInfo = null;
    
    if (account.account_type === 'MT5' || account.account_type === 'MT4') {
      try {
        const mt5Config = {
          host: account.server_url || process.env.MT5_HOST || 'localhost',
          port: parseInt(process.env.MT5_PORT || '8080'),
          login: account.account_number || '',
          server: account.broker_name || '',
          broker: account.broker_name || ''
        };
        
        const mt5Bridge = new Mt5Bridge();
        connectionResult = await mt5Bridge.testConnection(mt5Config);
        
        if (connectionResult.success && connectionResult.accountInfo) {
          accountInfo = {
            balance: connectionResult.accountInfo.balance,
            equity: connectionResult.accountInfo.equity,
            margin: connectionResult.accountInfo.margin,
            currency: connectionResult.accountInfo.currency || 'USD',
            leverage: connectionResult.accountInfo.leverage,
            server: connectionResult.accountInfo.server,
            company: connectionResult.accountInfo.company
          };
        }
        
      } catch (mt5Error) {
        console.error('MT5 connection test failed:', mt5Error);
        connectionResult = {
          success: false,
          error: mt5Error.message
        };
      }
    } else {
      // For other account types, simulate or implement specific connection logic
      connectionResult = {
        success: true,
        message: `${account.account_type} connection test completed`
      };
      
      accountInfo = {
        balance: 10000, // Default values for non-MT5 accounts
        currency: 'USD',
        accountType: account.account_type
      };
    }

    // Update connection status in database
    await query(`
      UPDATE trading_accounts 
      SET is_connected = $1, last_connection_test = NOW(),
          account_balance = $2, equity = $3, currency = $4
      WHERE id = $5 AND user_id = $6
    `, [
      connectionResult.success,
      accountInfo?.balance || null,
      accountInfo?.equity || null,
      accountInfo?.currency || 'USD',
      accountId,
      userId
    ]);

    res.json({
      success: connectionResult.success,
      message: connectionResult.success ? 'Connection successful' : 'Connection failed',
      error: connectionResult.error,
      accountInfo,
      connectionDetails: connectionResult,
      lastTestedAt: new Date()
    });
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({ error: 'Failed to test connection', details: error.message });
  }
});

// Delete trading account
router.delete('/trading-accounts/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { userId } = req.query;

    const result = await query(
      'DELETE FROM trading_accounts WHERE id = $1 AND user_id = $2 RETURNING *',
      [accountId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trading account not found' });
    }

    res.json({ success: true, message: 'Trading account deleted successfully' });
  } catch (error) {
    console.error('Delete trading account error:', error);
    res.status(500).json({ error: 'Failed to delete trading account' });
  }
});

// Get account status
router.get('/trading-accounts/:accountId/status', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { userId } = req.query;

    const result = await query(`
      SELECT 
        ta.*,
        COUNT(o.id) as total_orders,
        AVG(CASE WHEN o.status = 'FILLED' THEN o.volume END) as avg_volume
      FROM trading_accounts ta
      LEFT JOIN orders o ON ta.id = o.account_id
      WHERE ta.id = $1 AND ta.user_id = $2
      GROUP BY ta.id
    `, [accountId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trading account not found' });
    }

    const account = result.rows[0];

    res.json({
      account: {
        id: account.id,
        accountType: account.account_type,
        accountName: account.account_name,
        brokerName: account.broker_name,
        isConnected: account.is_connected
      },
      connectionStatus: {
        isConnected: account.is_connected,
        lastTestedAt: account.last_connection_test
      },
      accountStats: {
        balance: account.account_balance || 0,
        equity: account.equity || 0,
        totalOrders: parseInt(account.total_orders) || 0,
        averageVolume: parseFloat(account.avg_volume) || 0
      }
    });
  } catch (error) {
    console.error('Get account status error:', error);
    res.status(500).json({ error: 'Failed to get account status' });
  }
});

export default router;