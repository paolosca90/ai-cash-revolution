import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = new SQLDatabase("trading", {
  migrations: "./migrations",
});

interface TradingStrategy {
  name: string;
  indicators: string[];
  thresholds: {
    buy: number;
    sell: number;
  };
  riskLevel: number;
}

const TRADING_STRATEGIES: Record<string, TradingStrategy> = {
  conservative: {
    name: "Conservative",
    indicators: ["SMA", "RSI"],
    thresholds: { buy: 0.7, sell: 0.3 },
    riskLevel: 0.2
  },
  moderate: {
    name: "Moderate", 
    indicators: ["SMA", "RSI", "MACD"],
    thresholds: { buy: 0.6, sell: 0.4 },
    riskLevel: 0.5
  },
  aggressive: {
    name: "Aggressive",
    indicators: ["SMA", "RSI", "MACD", "BB"],
    thresholds: { buy: 0.5, sell: 0.5 },
    riskLevel: 0.8
  }
};

interface GenerateSignalRequest {
  symbol: string;
  timeframe: string;
  strategy?: string;
}

interface TradingSignal {
  symbol: string;
  action: "BUY" | "SELL" | "HOLD";
  confidence: number;
  price: number;
  timestamp: Date;
  strategy: string;
  indicators: Record<string, number>;
}

interface GenerateSignalResponse {
  signal: TradingSignal;
}

// Generates trading signals based on technical analysis
export const generateSignal = api<GenerateSignalRequest, GenerateSignalResponse>(
  { expose: true, method: "POST", path: "/signal" },
  async (req) => {
    const { symbol, timeframe, strategy = "moderate" } = req;
    
    // Get market data
    const marketData = await getMarketData(symbol, timeframe);
    
    // Calculate technical indicators
    const indicators = await calculateIndicators(marketData);
    
    // Determine optimal strategy if not specified
    const optimalStrategy = strategy || await determineOptimalStrategy(marketData, indicators);
    const strategyConfig = TRADING_STRATEGIES[optimalStrategy];
    
    // Generate signal based on strategy
    const signal = await generateTradingSignal(
      symbol,
      marketData,
      indicators,
      strategyConfig
    );
    
    // Store signal in database
    await storeSignal(signal);
    
    return { signal };
  }
);

async function getMarketData(symbol: string, timeframe: string) {
  // Simulate market data - in real implementation, fetch from market data provider
  const mockData = [];
  const basePrice = 100;
  
  for (let i = 0; i < 100; i++) {
    const price = basePrice + Math.random() * 20 - 10;
    mockData.push({
      timestamp: new Date(Date.now() - (100 - i) * 60000),
      open: price,
      high: price * 1.02,
      low: price * 0.98,
      close: price,
      volume: Math.floor(Math.random() * 1000000)
    });
  }
  
  return mockData;
}

async function calculateIndicators(marketData: any[]) {
  const closes = marketData.map(d => d.close);
  
  // Simple Moving Average (20 periods)
  const sma = calculateSMA(closes, 20);
  
  // RSI (14 periods)
  const rsi = calculateRSI(closes, 14);
  
  // MACD
  const macd = calculateMACD(closes);
  
  // Bollinger Bands
  const bb = calculateBollingerBands(closes, 20, 2);
  
  return {
    SMA: sma[sma.length - 1],
    RSI: rsi[rsi.length - 1],
    MACD: macd.histogram[macd.histogram.length - 1],
    BB_UPPER: bb.upper[bb.upper.length - 1],
    BB_LOWER: bb.lower[bb.lower.length - 1],
    BB_MIDDLE: bb.middle[bb.middle.length - 1]
  };
}

function calculateSMA(prices: number[], period: number): number[] {
  const sma = [];
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
}

function calculateRSI(prices: number[], period: number): number[] {
  const rsi = [];
  const gains = [];
  const losses = [];
  
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  for (let i = period - 1; i < gains.length; i++) {
    const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }
  
  return rsi;
}

function calculateMACD(prices: number[]) {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  const macdLine = [];
  for (let i = 0; i < Math.min(ema12.length, ema26.length); i++) {
    macdLine.push(ema12[i] - ema26[i]);
  }
  
  const signalLine = calculateEMA(macdLine, 9);
  const histogram = [];
  
  for (let i = 0; i < Math.min(macdLine.length, signalLine.length); i++) {
    histogram.push(macdLine[i] - signalLine[i]);
  }
  
  return { macdLine, signalLine, histogram };
}

function calculateEMA(prices: number[], period: number): number[] {
  const ema = [];
  const multiplier = 2 / (period + 1);
  
  ema[0] = prices[0];
  
  for (let i = 1; i < prices.length; i++) {
    ema[i] = (prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
  }
  
  return ema;
}

function calculateBollingerBands(prices: number[], period: number, stdDev: number) {
  const sma = calculateSMA(prices, period);
  const upper = [];
  const lower = [];
  const middle = sma;
  
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);
    
    upper.push(sma[i - period + 1] + (standardDeviation * stdDev));
    lower.push(sma[i - period + 1] - (standardDeviation * stdDev));
  }
  
  return { upper, lower, middle };
}

async function determineOptimalStrategy(marketData: any[], indicators: any): Promise<string> {
  // Simple strategy selection based on market volatility
  const prices = marketData.map(d => d.close);
  const volatility = calculateVolatility(prices);
  
  if (volatility < 0.02) return "conservative";
  if (volatility < 0.05) return "moderate";
  return "aggressive";
}

function calculateVolatility(prices: number[]): number {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance);
}

async function generateTradingSignal(
  symbol: string,
  marketData: any[],
  indicators: any,
  strategy: TradingStrategy
): Promise<TradingSignal> {
  const currentPrice = marketData[marketData.length - 1].close;
  
  // Calculate signal strength based on indicators
  let signalStrength = 0;
  let signalCount = 0;
  
  // RSI analysis
  if (indicators.RSI < 30) {
    signalStrength += 1; // Oversold - buy signal
  } else if (indicators.RSI > 70) {
    signalStrength -= 1; // Overbought - sell signal
  }
  signalCount++;
  
  // SMA analysis
  if (currentPrice > indicators.SMA) {
    signalStrength += 0.5; // Price above SMA - bullish
  } else {
    signalStrength -= 0.5; // Price below SMA - bearish
  }
  signalCount++;
  
  // MACD analysis
  if (indicators.MACD > 0) {
    signalStrength += 0.5; // Positive MACD - bullish
  } else {
    signalStrength -= 0.5; // Negative MACD - bearish
  }
  signalCount++;
  
  // Bollinger Bands analysis
  if (currentPrice < indicators.BB_LOWER) {
    signalStrength += 0.5; // Price below lower band - buy signal
  } else if (currentPrice > indicators.BB_UPPER) {
    signalStrength -= 0.5; // Price above upper band - sell signal
  }
  signalCount++;
  
  const normalizedSignal = signalStrength / signalCount;
  
  let action: "BUY" | "SELL" | "HOLD";
  let confidence: number;
  
  if (normalizedSignal >= strategy.thresholds.buy) {
    action = "BUY";
    confidence = Math.min(normalizedSignal, 1);
  } else if (normalizedSignal <= -strategy.thresholds.sell) {
    action = "SELL";
    confidence = Math.min(Math.abs(normalizedSignal), 1);
  } else {
    action = "HOLD";
    confidence = 1 - Math.abs(normalizedSignal);
  }
  
  return {
    symbol,
    action,
    confidence,
    price: currentPrice,
    timestamp: new Date(),
    strategy: strategy.name,
    indicators
  };
}

async function storeSignal(signal: TradingSignal): Promise<void> {
  await db.exec`
    INSERT INTO trading_signals (
      symbol, action, confidence, price, timestamp, strategy, indicators
    ) VALUES (
      ${signal.symbol}, ${signal.action}, ${signal.confidence}, 
      ${signal.price}, ${signal.timestamp}, ${signal.strategy}, 
      ${JSON.stringify(signal.indicators)}
    )
  `;
}
