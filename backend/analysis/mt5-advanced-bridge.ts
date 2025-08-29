/**
 * Advanced MetaTrader 5 Bridge v3.0
 * Sistema completo per l'integrazione con MT5 con esecuzione automatica,
 * gestione avanzata del rischio, e monitoring in tempo reale
 */

import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import type { AdvancedTradingSignal } from "./advanced-trading-engine";

const db = new SQLDatabase("mt5_trading", {
  migrations: "./migrations",
});

// === INTERFACCE MT5 AVANZATE ===

export interface MT5Account {
  login: string;
  password: string;
  server: string;
  name: string;
  company: string;
  currency: string;
  leverage: number;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  profit: number;
  credit: number;
  tradeAllowed: boolean;
  expertAllowed: boolean;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  lastUpdate: Date;
}

export interface MT5Position {
  ticket: number;
  symbol: string;
  type: "BUY" | "SELL";
  volume: number;
  openPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  openTime: Date;
  profit: number;
  swap: number;
  commission: number;
  comment: string;
  magic: number;
  identifier: number;
}

export interface MT5Order {
  ticket: number;
  symbol: string;
  type: "BUY_LIMIT" | "SELL_LIMIT" | "BUY_STOP" | "SELL_STOP";
  volume: number;
  price: number;
  stopLoss: number;
  takeProfit: number;
  expiration?: Date;
  comment: string;
  magic: number;
  state: "STARTED" | "PLACED" | "CANCELED" | "PARTIAL" | "FILLED" | "REJECTED" | "EXPIRED";
}

export interface MT5TradeRequest {
  signal: AdvancedTradingSignal;
  accountId: string;
  executionMode: "MANUAL" | "AUTO" | "CONFIRM_REQUIRED";
  riskManagement: {
    maxRiskPerTrade: number;
    maxOpenPositions: number;
    maxDailyLoss: number;
    emergencyStop: boolean;
  };
  executionSettings: {
    slippage: number;
    maxRetries: number;
    partialFillAllowed: boolean;
    timeoutMs: number;
  };
}

export interface MT5TradeResult {
  success: boolean;
  ticket?: number;
  orderId?: number;
  executedPrice: number;
  executedVolume: number;
  slippage: number;
  commission: number;
  executionTime: number;
  error?: {
    code: number;
    message: string;
    retryable: boolean;
  };
  riskAnalysis: {
    riskAmount: number;
    marginRequired: number;
    impactOnAccount: number;
  };
}

export interface MT5Configuration {
  host: string;
  port: number;
  timeout: number;
  retryAttempts: number;
  enableSSL: boolean;
  authToken?: string;
  riskLimits: {
    maxPositionsPerSymbol: number;
    maxTotalPositions: number;
    maxRiskPercentage: number;
    stopLossRequired: boolean;
    takeProfitRequired: boolean;
  };
  tradingHours: {
    enabled: boolean;
    allowedSessions: string[];
    restrictedHours: string[];
  };
}

// === CONFIGURAZIONE DEFAULT ===

const DEFAULT_MT5_CONFIG: MT5Configuration = {
  host: "localhost",
  port: 8080,
  timeout: 30000,
  retryAttempts: 3,
  enableSSL: false,
  riskLimits: {
    maxPositionsPerSymbol: 3,
    maxTotalPositions: 10,
    maxRiskPercentage: 2.0,
    stopLossRequired: true,
    takeProfitRequired: true
  },
  tradingHours: {
    enabled: true,
    allowedSessions: ["LONDON", "NEW_YORK", "ASIAN"],
    restrictedHours: ["23:00-01:00", "16:30-17:00"] // UTC
  }
};

const MAGIC_NUMBER = 123456789; // Identificativo univoco per i nostri trade

// === ENDPOINT PRINCIPALI ===

export interface ConnectMT5Request {
  accountId: string;
  config?: Partial<MT5Configuration>;
}

export interface ConnectMT5Response {
  connected: boolean;
  account: MT5Account | null;
  error?: string;
}

export const connectMT5 = api<ConnectMT5Request, ConnectMT5Response>(
  { expose: true, method: "POST", path: "/mt5/connect" },
  async (req) => {
    try {
      const { accountId, config } = req;
      const fullConfig = { ...DEFAULT_MT5_CONFIG, ...config };
      
      // Verifica configurazione account
      const accountConfig = await getMT5AccountConfig(accountId);
      if (!accountConfig) {
        return { connected: false, account: null, error: "Account non configurato" };
      }
      
      // Testa connessione
      const connectionResult = await testMT5Connection(accountConfig, fullConfig);
      if (!connectionResult.success) {
        return { connected: false, account: null, error: connectionResult.error };
      }
      
      // Ottieni info account
      const account = await getMT5AccountInfo(accountConfig, fullConfig);
      
      // Salva configurazione connessione
      await saveMT5Configuration(accountId, fullConfig);
      
      return { connected: true, account };
      
    } catch (error) {
      console.error("Errore connessione MT5:", error);
      return { 
        connected: false, 
        account: null, 
        error: error instanceof Error ? error.message : "Errore sconosciuto" 
      };
    }
  }
);

export const executeTrade = api<MT5TradeRequest, MT5TradeResult>(
  { expose: true, method: "POST", path: "/mt5/execute-trade" },
  async (req) => {
    const startTime = Date.now();
    
    try {
      const { signal, accountId, executionMode, riskManagement, executionSettings } = req;
      
      // 1. Validazione pre-trade
      const preTradeCheck = await validateTradeRequest(signal, accountId, riskManagement);
      if (!preTradeCheck.valid) {
        return {
          success: false,
          executedPrice: 0,
          executedVolume: 0,
          slippage: 0,
          commission: 0,
          executionTime: Date.now() - startTime,
          error: { code: 400, message: preTradeCheck.reason || "Validazione fallita", retryable: false },
          riskAnalysis: { riskAmount: 0, marginRequired: 0, impactOnAccount: 0 }
        };
      }
      
      // 2. Calcolo size e risk management
      const tradeSize = await calculateOptimalTradeSize(signal, accountId, riskManagement);
      
      // 3. Ottieni configurazione MT5
      const config = await getMT5Configuration(accountId);
      const accountConfig = await getMT5AccountConfig(accountId);
      
      if (!config || !accountConfig) {
        return {
          success: false,
          executedPrice: 0,
          executedVolume: 0,
          slippage: 0,
          commission: 0,
          executionTime: Date.now() - startTime,
          error: { code: 404, message: "Configurazione MT5 non trovata", retryable: false },
          riskAnalysis: { riskAmount: 0, marginRequired: 0, impactOnAccount: 0 }
        };
      }
      
      // 4. Verifica orari di trading
      if (!isWithinTradingHours(config)) {
        return {
          success: false,
          executedPrice: 0,
          executedVolume: 0,
          slippage: 0,
          commission: 0,
          executionTime: Date.now() - startTime,
          error: { code: 403, message: "Fuori dagli orari di trading consentiti", retryable: true },
          riskAnalysis: { riskAmount: 0, marginRequired: 0, impactOnAccount: 0 }
        };
      }
      
      // 5. Esecuzione del trade
      const result = await executeMT5Trade(signal, accountConfig, config, tradeSize, executionSettings);
      
      // 6. Salvataggio nel database
      await saveTradeExecution({
        signal,
        accountId,
        result,
        timestamp: new Date()
      });
      
      // 7. Notifica sistema di learning
      await notifyLearningSystem(signal, result);
      
      return result;
      
    } catch (error) {
      console.error("Errore esecuzione trade:", error);
      
      return {
        success: false,
        executedPrice: 0,
        executedVolume: 0,
        slippage: 0,
        commission: 0,
        executionTime: Date.now() - startTime,
        error: {
          code: 500,
          message: error instanceof Error ? error.message : "Errore interno",
          retryable: true
        },
        riskAnalysis: { riskAmount: 0, marginRequired: 0, impactOnAccount: 0 }
      };
    }
  }
);

export const getPositions = api<{ accountId: string }, { positions: MT5Position[]; total: number }>(
  { expose: true, method: "GET", path: "/mt5/positions" },
  async (req) => {
    try {
      const { accountId } = req;
      const config = await getMT5Configuration(accountId);
      const accountConfig = await getMT5AccountConfig(accountId);
      
      if (!config || !accountConfig) {
        return { positions: [], total: 0 };
      }
      
      const positions = await getMT5Positions(accountConfig, config);
      return { positions, total: positions.length };
      
    } catch (error) {
      console.error("Errore recupero posizioni:", error);
      return { positions: [], total: 0 };
    }
  }
);

export const closePosition = api<{ accountId: string; ticket: number }, { success: boolean; error?: string }>(
  { expose: true, method: "POST", path: "/mt5/close-position" },
  async (req) => {
    try {
      const { accountId, ticket } = req;
      const config = await getMT5Configuration(accountId);
      const accountConfig = await getMT5AccountConfig(accountId);
      
      if (!config || !accountConfig) {
        return { success: false, error: "Configurazione MT5 non trovata" };
      }
      
      const result = await closeMT5Position(accountConfig, config, ticket);
      return result;
      
    } catch (error) {
      console.error("Errore chiusura posizione:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Errore sconosciuto" 
      };
    }
  }
);

// === FUNZIONI CORE ===

async function testMT5Connection(
  accountConfig: any,
  config: MT5Configuration
): Promise<{ success: boolean; error?: string }> {
  try {
    // Simula test di connessione - in realtà farebbe HTTP request al server MT5
    const response = await fetch(`http://${config.host}:${config.port}/status`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(config.timeout)
    });
    
    if (response.ok) {
      const status = await response.json();
      if (status.connected) {
        return { success: true };
      } else {
        return { success: false, error: "MT5 non connesso" };
      }
    } else {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
    
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return { success: false, error: "Timeout connessione MT5" };
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Errore connessione" 
    };
  }
}

async function getMT5AccountInfo(
  accountConfig: any,
  config: MT5Configuration
): Promise<MT5Account> {
  // In una implementazione reale, questo farebbe una chiamata HTTP al bridge MT5
  // Per ora simulo i dati dell'account
  
  return {
    login: accountConfig.login || "123456",
    password: "***",
    server: accountConfig.server || "Demo-Server",
    name: accountConfig.name || "Demo Account",
    company: "Demo Broker",
    currency: "USD",
    leverage: 1000,
    balance: 10000 + Math.random() * 5000,
    equity: 10000 + Math.random() * 5000,
    margin: Math.random() * 1000,
    freeMargin: 9000 + Math.random() * 4000,
    marginLevel: 500 + Math.random() * 1000,
    profit: (Math.random() - 0.5) * 1000,
    credit: 0,
    tradeAllowed: true,
    expertAllowed: true,
    status: "CONNECTED",
    lastUpdate: new Date()
  };
}

async function validateTradeRequest(
  signal: AdvancedTradingSignal,
  accountId: string,
  riskManagement: any
): Promise<{ valid: boolean; reason?: string }> {
  
  // 1. Verifica confidence minima
  if (signal.confidence < 70) {
    return { valid: false, reason: "Confidence del segnale troppo bassa" };
  }
  
  // 2. Verifica validità temporale
  if (new Date() > signal.validUntil) {
    return { valid: false, reason: "Segnale scaduto" };
  }
  
  // 3. Verifica account balance
  const account = await getMT5AccountInfo({}, DEFAULT_MT5_CONFIG);
  if (account.balance < 100) {
    return { valid: false, reason: "Balance account insufficiente" };
  }
  
  // 4. Verifica margin level
  if (account.marginLevel < 200) {
    return { valid: false, reason: "Margin level troppo basso" };
  }
  
  // 5. Verifica posizioni esistenti
  const positions = await getMT5Positions({}, DEFAULT_MT5_CONFIG);
  const existingPositions = positions.filter(p => p.symbol === signal.symbol);
  
  if (existingPositions.length >= DEFAULT_MT5_CONFIG.riskLimits.maxPositionsPerSymbol) {
    return { valid: false, reason: "Troppe posizioni aperte su questo simbolo" };
  }
  
  // 6. Verifica emergency stop
  if (riskManagement.emergencyStop) {
    return { valid: false, reason: "Emergency stop attivato" };
  }
  
  // 7. Verifica sessione qualità
  if (signal.sessionQuality === "POOR") {
    return { valid: false, reason: "Qualità sessione insufficiente" };
  }
  
  return { valid: true };
}

async function calculateOptimalTradeSize(
  signal: AdvancedTradingSignal,
  accountId: string,
  riskManagement: any
): Promise<number> {
  
  const account = await getMT5AccountInfo({}, DEFAULT_MT5_CONFIG);
  const maxRisk = account.balance * (riskManagement.maxRiskPerTrade / 100);
  
  // Calcolo size basato su stop loss
  const riskPerUnit = Math.abs(signal.entryPrice - signal.stopLoss);
  let calculatedSize = maxRisk / riskPerUnit;
  
  // Adjustment basato su Kelly Criterion
  const kellyCriterion = signal.positionSizing.kellyCriterion;
  if (kellyCriterion > 0) {
    calculatedSize *= Math.min(kellyCriterion, 0.25); // Massimo 25% del Kelly
  }
  
  // Adjustment basato su confidence
  const confidenceMultiplier = signal.confidence / 100;
  calculatedSize *= confidenceMultiplier;
  
  // Adjustment basato su volatilità
  if (signal.newsImpact.volatilityExpected) {
    calculatedSize *= 0.7; // Riduci size se alta volatilità attesa
  }
  
  // Limiti minimi e massimi
  calculatedSize = Math.max(0.01, calculatedSize); // Minimo 0.01 lot
  calculatedSize = Math.min(signal.positionSizing.recommendedLotSize, calculatedSize);
  
  // Round to valid lot sizes
  return Math.round(calculatedSize * 100) / 100;
}

async function executeMT5Trade(
  signal: AdvancedTradingSignal,
  accountConfig: any,
  config: MT5Configuration,
  volume: number,
  executionSettings: any
): Promise<MT5TradeResult> {
  
  const startTime = Date.now();
  
  try {
    // Prepara trade request per MT5
    const tradeRequest = {
      action: signal.action === "BUY" ? "TRADE_ACTION_DEAL" : "TRADE_ACTION_DEAL",
      symbol: signal.symbol,
      volume,
      type: signal.action === "BUY" ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL",
      price: signal.entryPrice,
      sl: signal.stopLoss,
      tp: signal.takeProfit,
      deviation: executionSettings.slippage,
      magic: MAGIC_NUMBER,
      comment: `AI_Signal_${signal.id}`,
      type_time: "ORDER_TIME_GTC",
      type_filling: executionSettings.partialFillAllowed ? "ORDER_FILLING_IOC" : "ORDER_FILLING_FOK"
    };
    
    // Simula esecuzione trade (in realtà HTTP POST al bridge MT5)
    await simulateDelay(100, 500); // Simula latenza di rete
    
    // Simula risultato esecuzione
    const success = Math.random() > 0.05; // 95% success rate
    const slippage = (Math.random() - 0.5) * executionSettings.slippage;
    const executedPrice = signal.entryPrice + slippage;
    const commission = volume * 7; // $7 per lot
    
    if (success) {
      const ticket = Math.floor(Math.random() * 1000000) + 100000;
      
      return {
        success: true,
        ticket,
        executedPrice,
        executedVolume: volume,
        slippage: Math.abs(slippage),
        commission,
        executionTime: Date.now() - startTime,
        riskAnalysis: {
          riskAmount: Math.abs(executedPrice - signal.stopLoss) * volume * 100000,
          marginRequired: volume * executedPrice * 100000 / 1000, // Leva 1000
          impactOnAccount: (Math.abs(executedPrice - signal.stopLoss) * volume * 100000) / 10000 * 100
        }
      };
    } else {
      // Simula errore
      const errorCodes = [
        { code: 10004, message: "Richiesta scaduta", retryable: true },
        { code: 10006, message: "Prezzo non valido", retryable: false },
        { code: 10013, message: "Operazione non permessa", retryable: false },
        { code: 10018, message: "Mercato chiuso", retryable: true }
      ];
      
      const error = errorCodes[Math.floor(Math.random() * errorCodes.length)];
      
      return {
        success: false,
        executedPrice: 0,
        executedVolume: 0,
        slippage: 0,
        commission: 0,
        executionTime: Date.now() - startTime,
        error,
        riskAnalysis: { riskAmount: 0, marginRequired: 0, impactOnAccount: 0 }
      };
    }
    
  } catch (error) {
    return {
      success: false,
      executedPrice: 0,
      executedVolume: 0,
      slippage: 0,
      commission: 0,
      executionTime: Date.now() - startTime,
      error: {
        code: 500,
        message: error instanceof Error ? error.message : "Errore interno",
        retryable: true
      },
      riskAnalysis: { riskAmount: 0, marginRequired: 0, impactOnAccount: 0 }
    };
  }
}

async function getMT5Positions(accountConfig: any, config: MT5Configuration): Promise<MT5Position[]> {
  // Simula posizioni esistenti
  const positions: MT5Position[] = [];
  
  // Random positions per demo
  if (Math.random() > 0.7) {
    positions.push({
      ticket: Math.floor(Math.random() * 1000000) + 100000,
      symbol: "EURUSD",
      type: Math.random() > 0.5 ? "BUY" : "SELL",
      volume: Math.round((Math.random() * 2 + 0.1) * 100) / 100,
      openPrice: 1.0850 + (Math.random() - 0.5) * 0.01,
      currentPrice: 1.0850 + (Math.random() - 0.5) * 0.005,
      stopLoss: 1.0800,
      takeProfit: 1.0900,
      openTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      profit: (Math.random() - 0.5) * 500,
      swap: (Math.random() - 0.5) * 10,
      commission: -7,
      comment: "AI_Signal_" + Math.random().toString(36).substr(2, 9),
      magic: MAGIC_NUMBER,
      identifier: Math.floor(Math.random() * 1000000)
    });
  }
  
  return positions;
}

async function closeMT5Position(
  accountConfig: any,
  config: MT5Configuration,
  ticket: number
): Promise<{ success: boolean; error?: string }> {
  
  try {
    // Simula chiusura posizione
    await simulateDelay(100, 300);
    
    const success = Math.random() > 0.02; // 98% success rate
    
    if (success) {
      return { success: true };
    } else {
      return { success: false, error: "Errore nella chiusura della posizione" };
    }
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Errore sconosciuto" 
    };
  }
}

function isWithinTradingHours(config: MT5Configuration): boolean {
  if (!config.tradingHours.enabled) return true;
  
  const now = new Date();
  const currentHour = now.getUTCHours();
  const timeString = `${currentHour.toString().padStart(2, '0')}:00`;
  
  // Verifica ore ristrette
  for (const restrictedRange of config.tradingHours.restrictedHours) {
    const [start, end] = restrictedRange.split('-');
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);
    
    if (currentHour >= startHour && currentHour < endHour) {
      return false;
    }
  }
  
  return true;
}

// === FUNZIONI DATABASE ===

async function getMT5AccountConfig(accountId: string): Promise<any> {
  try {
    const result = await db.query`
      SELECT login, server, name FROM mt5_accounts WHERE account_id = ${accountId}
    `;
    
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Errore recupero config account MT5:", error);
    return null;
  }
}

async function getMT5Configuration(accountId: string): Promise<MT5Configuration | null> {
  try {
    const result = await db.query`
      SELECT config FROM mt5_configurations WHERE account_id = ${accountId}
    `;
    
    if (result.length > 0) {
      return { ...DEFAULT_MT5_CONFIG, ...JSON.parse(result[0].config) };
    }
    
    return DEFAULT_MT5_CONFIG;
  } catch (error) {
    console.error("Errore recupero configurazione MT5:", error);
    return DEFAULT_MT5_CONFIG;
  }
}

async function saveMT5Configuration(accountId: string, config: MT5Configuration): Promise<void> {
  try {
    await db.exec`
      INSERT INTO mt5_configurations (account_id, config, updated_at)
      VALUES (${accountId}, ${JSON.stringify(config)}, ${new Date()})
      ON CONFLICT (account_id) 
      DO UPDATE SET config = ${JSON.stringify(config)}, updated_at = ${new Date()}
    `;
  } catch (error) {
    console.error("Errore salvataggio configurazione MT5:", error);
  }
}

async function saveTradeExecution(execution: any): Promise<void> {
  try {
    await db.exec`
      INSERT INTO mt5_executions (
        signal_id, account_id, symbol, action, volume, 
        entry_price, stop_loss, take_profit, executed_price,
        success, ticket, execution_time, timestamp
      ) VALUES (
        ${execution.signal.id}, ${execution.accountId}, ${execution.signal.symbol},
        ${execution.signal.action}, ${execution.result.executedVolume},
        ${execution.signal.entryPrice}, ${execution.signal.stopLoss}, 
        ${execution.signal.takeProfit}, ${execution.result.executedPrice},
        ${execution.result.success}, ${execution.result.ticket || null},
        ${execution.result.executionTime}, ${execution.timestamp}
      )
    `;
  } catch (error) {
    console.error("Errore salvataggio esecuzione trade:", error);
  }
}

async function notifyLearningSystem(signal: AdvancedTradingSignal, result: MT5TradeResult): Promise<void> {
  // Notifica al sistema di ML per future ottimizzazioni
  try {
    // In una implementazione reale, questo invierebbe i dati al modulo ML
    console.log(`Learning notification: Signal ${signal.id}, Success: ${result.success}`);
    
    await db.exec`
      INSERT INTO ml_feedback_queue (
        signal_id, execution_success, executed_price, slippage,
        execution_time, timestamp, processed
      ) VALUES (
        ${signal.id}, ${result.success}, ${result.executedPrice},
        ${result.slippage}, ${result.executionTime}, ${new Date()}, false
      )
    `;
  } catch (error) {
    console.error("Errore notifica learning system:", error);
  }
}

// === UTILITY FUNCTIONS ===

function simulateDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = minMs + Math.random() * (maxMs - minMs);
  return new Promise(resolve => setTimeout(resolve, delay));
}

// === ENDPOINT AUSILIARI ===

export const getMT5Status = api<{ accountId: string }, { status: string; account?: MT5Account }>(
  { expose: true, method: "GET", path: "/mt5/status" },
  async (req) => {
    try {
      const { accountId } = req;
      const config = await getMT5Configuration(accountId);
      const accountConfig = await getMT5AccountConfig(accountId);
      
      if (!config || !accountConfig) {
        return { status: "NOT_CONFIGURED" };
      }
      
      const connectionTest = await testMT5Connection(accountConfig, config);
      if (!connectionTest.success) {
        return { status: "DISCONNECTED" };
      }
      
      const account = await getMT5AccountInfo(accountConfig, config);
      return { status: "CONNECTED", account };
      
    } catch (error) {
      console.error("Errore status MT5:", error);
      return { status: "ERROR" };
    }
  }
);

export const configureMT5Account = api<{
  accountId: string;
  login: string;
  server: string;
  name?: string;
  config?: Partial<MT5Configuration>;
}, { success: boolean; error?: string }>(
  { expose: true, method: "POST", path: "/mt5/configure-account" },
  async (req) => {
    try {
      const { accountId, login, server, name, config } = req;
      
      // Salva configurazione account
      await db.exec`
        INSERT INTO mt5_accounts (account_id, login, server, name, created_at)
        VALUES (${accountId}, ${login}, ${server}, ${name || "MT5 Account"}, ${new Date()})
        ON CONFLICT (account_id) 
        DO UPDATE SET login = ${login}, server = ${server}, name = ${name || "MT5 Account"}
      `;
      
      // Salva configurazione avanzata se fornita
      if (config) {
        const fullConfig = { ...DEFAULT_MT5_CONFIG, ...config };
        await saveMT5Configuration(accountId, fullConfig);
      }
      
      return { success: true };
      
    } catch (error) {
      console.error("Errore configurazione account MT5:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Errore configurazione" 
      };
    }
  }
);