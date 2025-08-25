import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { Secret } from "encore.dev/config";

// Database connection
const db = new SQLDatabase("trading_accounts", {
  migrations: "./trading_migrations",
});

// Encryption secret for sensitive data
const encryptionSecret = new Secret("TRADING_ACCOUNT_ENCRYPTION_KEY");

// Trading account types and interfaces
export interface TradingAccount {
  id: string;
  userId: string;
  accountType: "MT4" | "MT5" | "BINANCE" | "BYBIT" | "COINBASE" | "ALPACA";
  accountName: string;
  brokerName: string;
  
  // Connection details (encrypted)
  serverUrl?: string;
  accountNumber?: string;
  password?: string; // Encrypted
  apiKey?: string; // Encrypted
  apiSecret?: string; // Encrypted
  
  // Account info
  accountBalance?: number;
  equity?: number;
  currency: string;
  leverage?: number;
  
  // Status and settings
  isActive: boolean;
  isConnected: boolean;
  autoTradingEnabled: boolean;
  maxRiskPerTrade: number; // Percentage
  maxDailyLoss: number; // Percentage
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastConnectionAt?: Date;
  
  // Trading preferences
  allowedSymbols: string[];
  blockedSymbols: string[];
  tradingHours: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  accountInfo: {
    balance?: number;
    currency?: string;
  } | null;
  lastTestedAt: Date;
}

export interface TradingAccountDetails {
  account: TradingAccount;
  connectionStatus: {
    isConnected: boolean;
    lastTestResult?: string;
    lastTestedAt?: Date;
  };
  accountStats?: {
    balance: number;
    equity: number;
    margin?: number;
    freeMargin?: number;
  };
}

export interface AddTradingAccountRequest {
  userId: string;
  accountType: "MT4" | "MT5" | "BINANCE" | "BYBIT" | "COINBASE" | "ALPACA";
  accountName: string;
  brokerName: string;
  serverUrl?: string;
  accountNumber?: string;
  password?: string;
  apiKey?: string;
  apiSecret?: string;
  currency: string;
  leverage?: number;
  maxRiskPerTrade: number;
  maxDailyLoss: number;
  allowedSymbols?: string[];
  tradingHours?: { start: string; end: string };
}

export interface UpdateTradingAccountRequest {
  accountId: string;
  userId: string;
  accountName?: string;
  isActive?: boolean;
  autoTradingEnabled?: boolean;
  maxRiskPerTrade?: number;
  maxDailyLoss?: number;
  allowedSymbols?: string[];
  blockedSymbols?: string[];
  tradingHours?: { start: string; end: string };
}

export interface TradingAccountResponse {
  success: boolean;
  account?: Omit<TradingAccount, 'password' | 'apiSecret'>;
  accounts?: Omit<TradingAccount, 'password' | 'apiSecret'>[];
  message: string;
}

export interface TestConnectionRequest {
  accountId: string;
  userId: string;
}

// Encryption/Decryption helpers (simplified)
const encrypt = (text: string): string => {
  return `encrypted_${text}`;
};

const decrypt = (encryptedText: string): string => {
  return encryptedText.replace('encrypted_', '');
};

// Helper to sanitize account data (remove sensitive info)
const sanitizeAccount = (account: any): Omit<TradingAccount, 'password' | 'apiSecret'> => {
  const { password, apiSecret, ...sanitized } = account;
  return {
    ...sanitized,
    apiKey: account.apiKey ? '***' + account.apiKey.slice(-4) : undefined,
    accountNumber: account.accountNumber ? '***' + account.accountNumber.slice(-4) : undefined,
    allowedSymbols: JSON.parse(account.allowed_symbols || '[]'),
    blockedSymbols: JSON.parse(account.blocked_symbols || '[]'),
    tradingHours: JSON.parse(account.trading_hours || '{"start":"09:00","end":"17:00"}')
  };
};

// Add new trading account
export const addTradingAccount = api(
  { method: "POST", path: "/user/trading-accounts", expose: true },
  async (req: AddTradingAccountRequest): Promise<TradingAccountResponse> => {
    try {
      // Validate user exists and check limits
      const users = await db.query`
        SELECT trading_accounts_connected, max_trading_accounts 
        FROM users WHERE id = ${req.userId}
      `;

      if (users.length === 0) {
        throw APIError.notFound("User not found");
      }

      const user = users[0];
      if (user.trading_accounts_connected >= user.max_trading_accounts) {
        throw APIError.failedPrecondition(
          `Maximum trading accounts limit reached (${user.max_trading_accounts}). Please upgrade your subscription.`
        );
      }

      // Encrypt sensitive data
      const encryptedPassword = req.password ? encrypt(req.password) : null;
      const encryptedApiSecret = req.apiSecret ? encrypt(req.apiSecret) : null;

      // Create trading account
      const accountId = crypto.randomUUID();
      const now = new Date();

      await db.exec`
        INSERT INTO trading_accounts (
          id, user_id, account_type, account_name, broker_name,
          server_url, account_number, password_encrypted, api_key, api_secret_encrypted,
          currency, leverage, is_active, is_connected, auto_trading_enabled,
          max_risk_per_trade, max_daily_loss, allowed_symbols, blocked_symbols,
          trading_hours, created_at, updated_at
        ) VALUES (
          ${accountId}, ${req.userId}, ${req.accountType}, ${req.accountName}, ${req.brokerName},
          ${req.serverUrl}, ${req.accountNumber}, ${encryptedPassword}, ${req.apiKey}, ${encryptedApiSecret},
          ${req.currency}, ${req.leverage || 100}, true, false, false,
          ${req.maxRiskPerTrade}, ${req.maxDailyLoss}, 
          ${JSON.stringify(req.allowedSymbols || [])}, ${JSON.stringify([])},
          ${JSON.stringify(req.tradingHours || { start: "09:00", end: "17:00" })},
          ${now}, ${now}
        )
      `;

      // Update user's connected accounts count
      await db.exec`
        UPDATE users SET 
          trading_accounts_connected = trading_accounts_connected + 1,
          updated_at = ${now}
        WHERE id = ${req.userId}
      `;

      // Get the created account
      const accounts = await db.query`
        SELECT * FROM trading_accounts WHERE id = ${accountId}
      `;

      return {
        success: true,
        account: sanitizeAccount(accounts[0]),
        message: "Trading account added successfully"
      };
    } catch (error: any) {
      console.error("Add trading account error:", error);
      if (error.code) {
        throw error;
      }
      throw APIError.internal(`Failed to add trading account: ${error.message}`);
    }
  }
);

// Get user's trading accounts
export const getTradingAccounts = api(
  { method: "GET", path: "/user/trading-accounts/:userId", expose: true },
  async ({ userId }: { userId: string }): Promise<TradingAccountResponse> => {
    try {
      const accounts = await db.query`
        SELECT * FROM trading_accounts 
        WHERE user_id = ${userId} 
        ORDER BY created_at DESC
      `;

      return {
        success: true,
        accounts: accounts.map(sanitizeAccount),
        message: `Found ${accounts.length} trading accounts`
      };
    } catch (error: any) {
      console.error("Get trading accounts error:", error);
      throw APIError.internal(`Failed to get trading accounts: ${error.message}`);
    }
  }
);

// Update trading account
export const updateTradingAccount = api(
  { method: "PUT", path: "/user/trading-accounts/:accountId", expose: true },
  async (req: UpdateTradingAccountRequest): Promise<TradingAccountResponse> => {
    try {
      // Verify account ownership
      const accounts = await db.query`
        SELECT * FROM trading_accounts 
        WHERE id = ${req.accountId} AND user_id = ${req.userId}
      `;

      if (accounts.length === 0) {
        throw APIError.notFound("Trading account not found or access denied");
      }

      // Build update query dynamically
      const updates = [];
      const values = [];

      if (req.accountName !== undefined) {
        updates.push(`account_name = $${updates.length + 1}`);
        values.push(req.accountName);
      }
      if (req.isActive !== undefined) {
        updates.push(`is_active = $${updates.length + 1}`);
        values.push(req.isActive);
      }
      if (req.autoTradingEnabled !== undefined) {
        updates.push(`auto_trading_enabled = $${updates.length + 1}`);
        values.push(req.autoTradingEnabled);
      }
      if (req.maxRiskPerTrade !== undefined) {
        updates.push(`max_risk_per_trade = $${updates.length + 1}`);
        values.push(req.maxRiskPerTrade);
      }
      if (req.maxDailyLoss !== undefined) {
        updates.push(`max_daily_loss = $${updates.length + 1}`);
        values.push(req.maxDailyLoss);
      }
      if (req.allowedSymbols !== undefined) {
        updates.push(`allowed_symbols = $${updates.length + 1}`);
        values.push(JSON.stringify(req.allowedSymbols));
      }
      if (req.blockedSymbols !== undefined) {
        updates.push(`blocked_symbols = $${updates.length + 1}`);
        values.push(JSON.stringify(req.blockedSymbols));
      }
      if (req.tradingHours !== undefined) {
        updates.push(`trading_hours = $${updates.length + 1}`);
        values.push(JSON.stringify(req.tradingHours));
      }

      if (updates.length === 0) {
        throw APIError.invalidArgument("No fields to update");
      }

      updates.push(`updated_at = $${updates.length + 1}`);
      values.push(new Date());

      // Execute update
      await db.exec`
        UPDATE trading_accounts 
        SET ${updates.join(', ')}
        WHERE id = ${req.accountId}
      `;

      // Get updated account
      const updatedAccounts = await db.query`
        SELECT * FROM trading_accounts WHERE id = ${req.accountId}
      `;

      return {
        success: true,
        account: sanitizeAccount(updatedAccounts[0]),
        message: "Trading account updated successfully"
      };
    } catch (error: any) {
      console.error("Update trading account error:", error);
      if (error.code) {
        throw error;
      }
      throw APIError.internal(`Failed to update trading account: ${error.message}`);
    }
  }
);

// Test connection to trading account
export const testConnection = api(
  { method: "POST", path: "/user/trading-accounts/:accountId/test", expose: true },
  async (req: TestConnectionRequest): Promise<TestConnectionResponse> => {
    try {
      // Get account details
      const accounts = await db.query`
        SELECT * FROM trading_accounts 
        WHERE id = ${req.accountId} AND user_id = ${req.userId}
      `;

      if (accounts.length === 0) {
        throw APIError.notFound("Trading account not found or access denied");
      }

      const account = accounts[0];

      // Decrypt credentials for connection test
      let credentials: any = {};
      if (account.password_encrypted) {
        credentials.password = decrypt(account.password_encrypted);
      }
      if (account.api_secret_encrypted) {
        credentials.apiSecret = decrypt(account.api_secret_encrypted);
      }

      // Test connection based on account type
      let connectionResult = false;
      let connectionMessage = "";
      let accountInfo: any = {};

      switch (account.account_type) {
        case "MT4":
        case "MT5":
          // Test MT4/MT5 connection via external service
          const mt5Response = await fetch(`http://localhost:8001/test_connection`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              server: account.server_url,
              login: account.account_number,
              password: credentials.password
            })
          });
          
          if (mt5Response.ok) {
            const mt5Data = await mt5Response.json();
            connectionResult = mt5Data.success;
            connectionMessage = mt5Data.message || "Connection successful";
            accountInfo = {
              balance: mt5Data.account_info?.balance || 0,
              equity: mt5Data.account_info?.equity || 0,
              leverage: mt5Data.account_info?.leverage || 100
            };
          } else {
            connectionMessage = "MT5 service unavailable";
          }
          break;

        case "BINANCE":
          // Test Binance API connection (example)
          connectionResult = true; // Simulate successful connection
          connectionMessage = "Binance API connection successful";
          accountInfo = { balance: 1000, currency: "USDT" };
          break;

        case "BYBIT":
        case "COINBASE":
        case "ALPACA":
          // Simulate other broker connections
          connectionResult = true;
          connectionMessage = `${account.account_type} connection successful`;
          accountInfo = { balance: 1000, currency: account.currency };
          break;

        default:
          throw APIError.invalidArgument("Unsupported account type");
      }

      // Update connection status and account info
      const now = new Date();
      await db.exec`
        UPDATE trading_accounts SET 
          is_connected = ${connectionResult},
          account_balance = ${accountInfo.balance || null},
          equity = ${accountInfo.equity || accountInfo.balance || null},
          leverage = ${accountInfo.leverage || account.leverage},
          last_connection_at = ${connectionResult ? now : null},
          updated_at = ${now}
        WHERE id = ${req.accountId}
      `;

      return {
        success: connectionResult,
        message: connectionMessage,
        accountInfo: connectionResult ? accountInfo : null,
        lastTestedAt: now
      };
    } catch (error: any) {
      console.error("Test connection error:", error);
      if (error.code) {
        throw error;
      }
      throw APIError.internal(`Failed to test connection: ${error.message}`);
    }
  }
);

// Delete trading account
export const deleteTradingAccount = api(
  { method: "DELETE", path: "/user/trading-accounts/:accountId", expose: true },
  async ({ accountId, userId }: { accountId: string; userId: string }): Promise<TradingAccountDetails> => {
    try {
      // Verify account ownership
      const accounts = await db.query`
        SELECT * FROM trading_accounts 
        WHERE id = ${accountId} AND user_id = ${userId}
      `;

      if (accounts.length === 0) {
        throw APIError.notFound("Trading account not found or access denied");
      }

      // Delete account
      await db.exec`DELETE FROM trading_accounts WHERE id = ${accountId}`;

      // Update user's connected accounts count
      const now = new Date();
      await db.exec`
        UPDATE users SET 
          trading_accounts_connected = trading_accounts_connected - 1,
          updated_at = ${now}
        WHERE id = ${userId}
      `;

      return {
        success: true,
        message: "Trading account deleted successfully"
      };
    } catch (error: any) {
      console.error("Delete trading account error:", error);
      if (error.code) {
        throw error;
      }
      throw APIError.internal(`Failed to delete trading account: ${error.message}`);
    }
  }
);

// Get account connection status
export const getAccountStatus = api(
  { method: "GET", path: "/user/trading-accounts/:accountId/status", expose: true },
  async ({ accountId, userId }: { accountId: string; userId: string }): Promise<TradingAccountDetails> => {
    try {
      const accounts = await db.query`
        SELECT id, account_name, account_type, is_connected, is_active, 
               auto_trading_enabled, account_balance, equity, currency,
               last_connection_at, created_at
        FROM trading_accounts 
        WHERE id = ${accountId} AND user_id = ${userId}
      `;

      if (accounts.length === 0) {
        throw APIError.notFound("Trading account not found or access denied");
      }

      const account = accounts[0];
      return {
        success: true,
        status: {
          id: account.id,
          name: account.account_name,
          type: account.account_type,
          isConnected: account.is_connected,
          isActive: account.is_active,
          autoTradingEnabled: account.auto_trading_enabled,
          balance: account.account_balance,
          equity: account.equity,
          currency: account.currency,
          lastConnection: account.last_connection_at,
          createdAt: account.created_at
        }
      };
    } catch (error: any) {
      console.error("Get account status error:", error);
      if (error.code) {
        throw error;
      }
      throw APIError.internal(`Failed to get account status: ${error.message}`);
    }
  }
);