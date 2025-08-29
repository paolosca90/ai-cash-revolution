import { api } from "encore.dev/api";
import { analysisDB } from "./db";
import { executeMT5Order, getMT5Positions, type MT5OrderRequest, type MT5OrderResult } from "./mt5-bridge";
import type { Mt5Config } from "~backend/user/api";

// Interfaccia per client MT5 account
export interface ClientMT5Account {
  id: number;
  clientId: number;
  accountName: string;
  brokerName: string;
  serverName: string;
  mt5Login: string;
  host: string;
  port: number;
  isConnected: boolean;
  connectionStatus: "connected" | "disconnected" | "testing" | "error";
  autoTradingEnabled: boolean;
  riskPercentage: number;
  maxDailyTrades: number;
  allowedSymbols: string[];
  totalTrades: number;
  winningTrades: number;
  totalProfitLoss: number;
  isActive: boolean;
}

// Interfaccia per signal distribution
export interface SignalDistribution {
  id: number;
  signalId: string;
  clientId: number;
  mt5AccountId: number;
  symbol: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  lotSize: number;
  confidenceScore: number;
  distributionStatus: "pending" | "sent" | "executed" | "failed" | "rejected";
  sentAt?: Date;
  executedAt?: Date;
  mt5OrderId?: number;
  executionPrice?: number;
  executionError?: string;
  closedAt?: Date;
  closePrice?: number;
  profitLoss?: number;
  tradeResult?: "profit" | "loss" | "breakeven";
  createdAt: Date;
}

// Interfaccia per master signal
export interface MasterSignal {
  id: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  confidence: number;
  strategy: string;
  timeframe: string;
  createdAt: Date;
  shouldExecute: boolean;
  technicalAnalysis?: any;
}

// Sistema di crittografia per password MT5
const crypto = require('crypto');

function encryptPassword(password: string): string {
  const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptPassword(encryptedPassword: string): string {
  const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
  const textParts = encryptedPassword.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = textParts.join(':');
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// 🔄 Sistema di Replicazione Segnali Multi-MT5
export const replicateSignalToClients = api<{ signalId: string; signal: MasterSignal }, { success: boolean; distributionsCreated: number; errors: string[] }>({
  method: "POST",
  path: "/analysis/replicate-signal/:signalId",
  expose: false, // Internal API chiamata automaticamente quando un segnale è generato
}, async (params) => {
  console.log(`🔄 Replicating signal ${params.signalId} to all active clients...`);
  
  const { signalId, signal } = params;
  const errors: string[] = [];
  let distributionsCreated = 0;

  try {
    // 1. Ottieni tutti i client attivi con i loro account MT5
    const activeClientAccounts = await getActiveClientMT5Accounts();
    
    console.log(`📊 Found ${activeClientAccounts.length} active client MT5 accounts`);

    // 2. Filtra i client in base alle loro preferenze
    const eligibleAccounts = await filterEligibleAccounts(activeClientAccounts, signal);
    
    console.log(`✅ ${eligibleAccounts.length} accounts are eligible for this signal`);

    // 3. Crea le distribution per ogni account eligible
    for (const account of eligibleAccounts) {
      try {
        await createSignalDistribution(signalId, signal, account);
        distributionsCreated++;
      } catch (error: any) {
        errors.push(`Account ${account.id}: ${error.message}`);
        console.error(`❌ Failed to create distribution for account ${account.id}:`, error);
      }
    }

    // 4. Esegui le distribuzioni in parallelo (ma con rate limiting)
    await executeSignalDistributions(signalId);

    console.log(`✅ Signal replication completed: ${distributionsCreated} distributions created`);
    
    return {
      success: true,
      distributionsCreated,
      errors
    };
  } catch (error: any) {
    console.error("❌ Signal replication failed:", error);
    return {
      success: false,
      distributionsCreated,
      errors: [...errors, `System error: ${error.message}`]
    };
  }
});

// Ottieni tutti gli account MT5 client attivi
async function getActiveClientMT5Accounts(): Promise<ClientMT5Account[]> {
  const query = `
    SELECT 
      cma.id,
      cma.client_id,
      cma.account_name,
      cma.broker_name,
      cma.server_name,
      cma.mt5_login,
      cma.host,
      cma.port,
      cma.is_connected,
      cma.connection_status,
      cma.auto_trading_enabled,
      cma.risk_percentage,
      cma.max_daily_trades,
      cma.allowed_symbols,
      cma.total_trades,
      cma.winning_trades,
      cma.total_profit_loss,
      cma.is_active
    FROM client_mt5_accounts cma
    INNER JOIN clients c ON c.id = cma.client_id
    WHERE cma.is_active = true 
      AND c.is_active = true 
      AND c.subscription_status = 'active'
      AND cma.auto_trading_enabled = true
    ORDER BY cma.id
  `;

  const result = await analysisDB.query(query);
  return result.rows.map(row => ({
    id: row.id,
    clientId: row.client_id,
    accountName: row.account_name,
    brokerName: row.broker_name,
    serverName: row.server_name,
    mt5Login: row.mt5_login,
    host: row.host,
    port: row.port,
    isConnected: row.is_connected,
    connectionStatus: row.connection_status,
    autoTradingEnabled: row.auto_trading_enabled,
    riskPercentage: parseFloat(row.risk_percentage),
    maxDailyTrades: row.max_daily_trades,
    allowedSymbols: row.allowed_symbols || [],
    totalTrades: row.total_trades,
    winningTrades: row.winning_trades,
    totalProfitLoss: parseFloat(row.total_profit_loss),
    isActive: row.is_active
  }));
}

// Filtra gli account in base alle preferenze del client
async function filterEligibleAccounts(accounts: ClientMT5Account[], signal: MasterSignal): Promise<ClientMT5Account[]> {
  const eligible: ClientMT5Account[] = [];

  for (const account of accounts) {
    try {
      // 1. Verifica se il simbolo è permesso
      if (account.allowedSymbols.length > 0 && !account.allowedSymbols.includes(signal.symbol)) {
        console.log(`⏭️  Account ${account.id}: Symbol ${signal.symbol} not in allowed symbols`);
        continue;
      }

      // 2. Verifica le preferenze del cliente
      const preferences = await getClientTradingPreferences(account.clientId, account.id);
      
      if (preferences) {
        // Verifica confidence minima
        if (signal.confidence < preferences.minConfidenceScore) {
          console.log(`⏭️  Account ${account.id}: Signal confidence ${signal.confidence} below minimum ${preferences.minConfidenceScore}`);
          continue;
        }

        // Verifica simboli esclusi
        if (preferences.excludedSymbols.includes(signal.symbol)) {
          console.log(`⏭️  Account ${account.id}: Symbol ${signal.symbol} is excluded`);
          continue;
        }

        // Verifica orari di trading
        const currentHour = new Date().getUTCHours();
        if (currentHour < preferences.tradingStartHour || currentHour > preferences.tradingEndHour) {
          console.log(`⏭️  Account ${account.id}: Outside trading hours (${preferences.tradingStartHour}-${preferences.tradingEndHour})`);
          continue;
        }

        // Verifica giorni di trading
        const currentDay = new Date().getUTCDay();
        if (!preferences.tradingDays.includes(currentDay)) {
          console.log(`⏭️  Account ${account.id}: Trading not allowed on day ${currentDay}`);
          continue;
        }

        // Verifica limite giornaliero trade
        const todayTrades = await getTodayTradesCount(account.id);
        if (todayTrades >= account.maxDailyTrades) {
          console.log(`⏭️  Account ${account.id}: Daily trade limit reached (${todayTrades}/${account.maxDailyTrades})`);
          continue;
        }

        // Verifica limite perdita giornaliera
        const todayLoss = await getTodayLoss(account.id);
        if (todayLoss >= preferences.maxDailyLoss) {
          console.log(`⏭️  Account ${account.id}: Daily loss limit reached (${todayLoss}/${preferences.maxDailyLoss})`);
          continue;
        }

        // Verifica trade concorrenti
        const activeTrades = await getActiveTradesCount(account.id);
        if (activeTrades >= preferences.maxConcurrentTrades) {
          console.log(`⏭️  Account ${account.id}: Max concurrent trades reached (${activeTrades}/${preferences.maxConcurrentTrades})`);
          continue;
        }
      }

      // 3. Verifica connessione MT5
      if (account.connectionStatus !== 'connected') {
        console.log(`⏭️  Account ${account.id}: MT5 not connected (${account.connectionStatus})`);
        continue;
      }

      // Account è eligible!
      eligible.push(account);
      console.log(`✅ Account ${account.id} (${account.accountName}) is eligible for signal`);

    } catch (error) {
      console.error(`❌ Error checking eligibility for account ${account.id}:`, error);
    }
  }

  return eligible;
}

// Ottieni le preferenze di trading di un cliente
async function getClientTradingPreferences(clientId: number, mt5AccountId: number) {
  const query = `
    SELECT 
      min_confidence_score,
      excluded_symbols,
      trading_start_hour,
      trading_end_hour,
      trading_days,
      max_daily_loss,
      max_concurrent_trades
    FROM client_trading_preferences 
    WHERE client_id = $1 AND mt5_account_id = $2
  `;

  const result = await analysisDB.query(query, [clientId, mt5AccountId]);
  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    minConfidenceScore: row.min_confidence_score,
    excludedSymbols: row.excluded_symbols || [],
    tradingStartHour: row.trading_start_hour,
    tradingEndHour: row.trading_end_hour,
    tradingDays: row.trading_days || [],
    maxDailyLoss: parseFloat(row.max_daily_loss),
    maxConcurrentTrades: row.max_concurrent_trades
  };
}

// Conta i trade di oggi per un account
async function getTodayTradesCount(mt5AccountId: number): Promise<number> {
  const query = `
    SELECT COUNT(*) as count 
    FROM signal_distributions 
    WHERE mt5_account_id = $1 
      AND DATE(created_at) = CURRENT_DATE
      AND distribution_status IN ('executed', 'sent')
  `;
  const result = await analysisDB.query(query, [mt5AccountId]);
  return parseInt(result.rows[0].count);
}

// Calcola la perdita di oggi per un account
async function getTodayLoss(mt5AccountId: number): Promise<number> {
  const query = `
    SELECT COALESCE(SUM(CASE WHEN profit_loss < 0 THEN ABS(profit_loss) ELSE 0 END), 0) as loss
    FROM signal_distributions 
    WHERE mt5_account_id = $1 
      AND DATE(created_at) = CURRENT_DATE
      AND profit_loss IS NOT NULL
  `;
  const result = await analysisDB.query(query, [mt5AccountId]);
  return parseFloat(result.rows[0].loss);
}

// Conta i trade attivi per un account
async function getActiveTradesCount(mt5AccountId: number): Promise<number> {
  const query = `
    SELECT COUNT(*) as count 
    FROM signal_distributions 
    WHERE mt5_account_id = $1 
      AND distribution_status = 'executed'
      AND closed_at IS NULL
  `;
  const result = await analysisDB.query(query, [mt5AccountId]);
  return parseInt(result.rows[0].count);
}

// Crea una signal distribution
async function createSignalDistribution(signalId: string, signal: MasterSignal, account: ClientMT5Account): Promise<void> {
  // Calcola la lot size basata sul risk percentage
  const lotSize = calculateLotSize(account, signal);

  const query = `
    INSERT INTO signal_distributions (
      signal_id, client_id, mt5_account_id, symbol, direction,
      entry_price, take_profit, stop_loss, lot_size, confidence_score,
      distribution_status, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', NOW())
  `;

  await analysisDB.query(query, [
    signalId,
    account.clientId,
    account.id,
    signal.symbol,
    signal.direction,
    signal.entryPrice,
    signal.takeProfit,
    signal.stopLoss,
    lotSize,
    signal.confidence
  ]);
}

// Calcola la lot size basata sul risk management
function calculateLotSize(account: ClientMT5Account, signal: MasterSignal): number {
  // Stima del balance account (dovrebbe essere aggiornato in tempo reale)
  const accountBalance = 10000; // TODO: Ottieni dal database o MT5 in tempo reale
  
  // Calcola il rischio in dollari
  const riskAmount = accountBalance * (account.riskPercentage / 100);
  
  // Calcola la distanza in pip tra entry e stop loss
  const stopLossDistance = Math.abs(signal.entryPrice - signal.stopLoss);
  
  // Valore per pip (approssimativo per i major pairs)
  const pipValue = 10; // $10 per pip per lotto standard per EURUSD
  
  // Calcola lot size
  let lotSize = riskAmount / (stopLossDistance * pipValue * 100000); // 100000 per convertire in lotti
  
  // Arrotonda e applica limiti
  lotSize = Math.round(lotSize * 100) / 100; // 2 decimali
  lotSize = Math.max(0.01, lotSize); // Minimo 0.01
  lotSize = Math.min(1.0, lotSize);  // Massimo 1.0 per sicurezza
  
  return lotSize;
}

// Esegui le distribuzioni di segnale
async function executeSignalDistributions(signalId: string): Promise<void> {
  console.log(`🚀 Executing signal distributions for signal ${signalId}...`);

  // Ottieni tutte le distribuzioni pending per questo segnale
  const query = `
    SELECT 
      sd.*,
      cma.host,
      cma.port,
      cma.mt5_login,
      cma.server_name
    FROM signal_distributions sd
    INNER JOIN client_mt5_accounts cma ON cma.id = sd.mt5_account_id
    WHERE sd.signal_id = $1 AND sd.distribution_status = 'pending'
    ORDER BY sd.id
  `;

  const result = await analysisDB.query(query, [signalId]);
  const distributions = result.rows;

  console.log(`📤 Executing ${distributions.length} signal distributions...`);

  // Esegui le distribuzioni con rate limiting (max 5 simultanee)
  const BATCH_SIZE = 5;
  for (let i = 0; i < distributions.length; i += BATCH_SIZE) {
    const batch = distributions.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (distribution) => {
      try {
        await executeSingleDistribution(distribution);
      } catch (error) {
        console.error(`❌ Failed to execute distribution ${distribution.id}:`, error);
      }
    }));

    // Piccola pausa tra i batch per non sovraccaricare i server
    if (i + BATCH_SIZE < distributions.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Esegui una singola distribuzione
async function executeSingleDistribution(distribution: any): Promise<void> {
  console.log(`📤 Executing distribution ${distribution.id} for account ${distribution.mt5_account_id}...`);

  try {
    // 1. Aggiorna status a "sent"
    await updateDistributionStatus(distribution.id, 'sent');

    // 2. Prepara la richiesta MT5
    const mt5Config: Mt5Config = {
      userId: distribution.client_id,
      host: distribution.host,
      port: distribution.port,
      login: distribution.mt5_login,
      server: distribution.server_name
    };

    const orderRequest: MT5OrderRequest = {
      symbol: distribution.symbol,
      direction: distribution.direction,
      lotSize: distribution.lot_size,
      entryPrice: distribution.entry_price,
      takeProfit: distribution.take_profit,
      stopLoss: distribution.stop_loss,
      comment: `AI Signal ${distribution.signal_id.slice(0, 8)}`
    };

    // 3. Esegui l'ordine MT5
    const result = await executeMT5Order(orderRequest, mt5Config);

    // 4. Aggiorna il database con il risultato
    if (result.success) {
      await updateDistributionExecution(distribution.id, {
        status: 'executed',
        executedAt: new Date(),
        mt5OrderId: result.orderId,
        executionPrice: result.executionPrice
      });
      console.log(`✅ Distribution ${distribution.id} executed successfully - Order ID: ${result.orderId}`);
    } else {
      await updateDistributionError(distribution.id, result.error || 'Unknown execution error');
      console.error(`❌ Distribution ${distribution.id} failed: ${result.error}`);
    }

  } catch (error: any) {
    await updateDistributionError(distribution.id, error.message);
    console.error(`❌ Distribution ${distribution.id} failed with exception:`, error);
  }
}

// Aggiorna lo status di una distribuzione
async function updateDistributionStatus(distributionId: number, status: string): Promise<void> {
  const query = `
    UPDATE signal_distributions 
    SET distribution_status = $1, sent_at = CASE WHEN $1 = 'sent' THEN NOW() ELSE sent_at END
    WHERE id = $2
  `;
  await analysisDB.query(query, [status, distributionId]);
}

// Aggiorna i dettagli di esecuzione
async function updateDistributionExecution(distributionId: number, details: {
  status: string;
  executedAt: Date;
  mt5OrderId?: number;
  executionPrice?: number;
}): Promise<void> {
  const query = `
    UPDATE signal_distributions 
    SET 
      distribution_status = $1,
      executed_at = $2,
      mt5_order_id = $3,
      execution_price = $4
    WHERE id = $5
  `;
  
  await analysisDB.query(query, [
    details.status,
    details.executedAt,
    details.mt5OrderId,
    details.executionPrice,
    distributionId
  ]);
}

// Aggiorna con errore di esecuzione
async function updateDistributionError(distributionId: number, error: string): Promise<void> {
  const query = `
    UPDATE signal_distributions 
    SET distribution_status = 'failed', execution_error = $1
    WHERE id = $2
  `;
  await analysisDB.query(query, [error, distributionId]);
}

// 📊 API per ottenere le statistiche delle distribuzioni
export const getDistributionStats = api<{ timeframe?: "today" | "week" | "month" }, {
  totalDistributions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  activeClients: number;
  totalProfit: number;
}>({
  method: "GET",
  path: "/analysis/distribution-stats",
  expose: true,
}, async ({ timeframe = "today" }) => {
  let dateCondition = "DATE(created_at) = CURRENT_DATE";
  
  switch (timeframe) {
    case "week":
      dateCondition = "created_at >= NOW() - INTERVAL '7 days'";
      break;
    case "month":
      dateCondition = "created_at >= NOW() - INTERVAL '30 days'";
      break;
  }

  const query = `
    SELECT 
      COUNT(*) as total_distributions,
      COUNT(CASE WHEN distribution_status = 'executed' THEN 1 END) as successful_executions,
      COUNT(CASE WHEN distribution_status = 'failed' THEN 1 END) as failed_executions,
      COUNT(DISTINCT client_id) as active_clients,
      COALESCE(SUM(profit_loss), 0) as total_profit
    FROM signal_distributions 
    WHERE ${dateCondition}
  `;

  const result = await analysisDB.query(query);
  const row = result.rows[0];

  const totalDistributions = parseInt(row.total_distributions);
  const successfulExecutions = parseInt(row.successful_executions);
  const successRate = totalDistributions > 0 ? (successfulExecutions / totalDistributions) * 100 : 0;

  return {
    totalDistributions,
    successfulExecutions,
    failedExecutions: parseInt(row.failed_executions),
    successRate: Math.round(successRate * 100) / 100,
    activeClients: parseInt(row.active_clients),
    totalProfit: parseFloat(row.total_profit)
  };
});

// 📋 API per ottenere le distribuzioni recenti
export const getRecentDistributions = api<{ limit?: number }, { distributions: SignalDistribution[] }>({
  method: "GET",
  path: "/analysis/recent-distributions",
  expose: true,
}, async ({ limit = 50 }) => {
  const query = `
    SELECT 
      sd.*,
      c.first_name,
      c.last_name,
      cma.account_name
    FROM signal_distributions sd
    INNER JOIN clients c ON c.id = sd.client_id
    INNER JOIN client_mt5_accounts cma ON cma.id = sd.mt5_account_id
    ORDER BY sd.created_at DESC
    LIMIT $1
  `;

  const result = await analysisDB.query(query, [limit]);
  
  const distributions = result.rows.map(row => ({
    id: row.id,
    signalId: row.signal_id,
    clientId: row.client_id,
    mt5AccountId: row.mt5_account_id,
    symbol: row.symbol,
    direction: row.direction,
    entryPrice: parseFloat(row.entry_price),
    takeProfit: parseFloat(row.take_profit),
    stopLoss: parseFloat(row.stop_loss),
    lotSize: parseFloat(row.lot_size),
    confidenceScore: row.confidence_score,
    distributionStatus: row.distribution_status,
    sentAt: row.sent_at,
    executedAt: row.executed_at,
    mt5OrderId: row.mt5_order_id,
    executionPrice: row.execution_price ? parseFloat(row.execution_price) : undefined,
    executionError: row.execution_error,
    closedAt: row.closed_at,
    closePrice: row.close_price ? parseFloat(row.close_price) : undefined,
    profitLoss: row.profit_loss ? parseFloat(row.profit_loss) : undefined,
    tradeResult: row.trade_result,
    createdAt: row.created_at
  }));

  return { distributions };
});