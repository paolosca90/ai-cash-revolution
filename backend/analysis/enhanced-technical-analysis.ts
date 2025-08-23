/**
 * Enhanced Technical Analysis Module
 * 
 * This module provides sophisticated technical analysis calculations
 * to significantly improve trading signal quality.
 */

export interface EnhancedIndicators {
  rsi: number;
  macd: {
    line: number;
    signal: number;
    histogram: number;
  };
  atr: number;
  sma: {
    sma20: number;
    sma50: number;
    sma200: number;
  };
  ema: {
    ema12: number;
    ema26: number;
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    squeeze: boolean;
  };
  stochastic: {
    k: number;
    d: number;
  };
  momentum: {
    roc: number; // Rate of Change
    momentum: number;
  };
  // Advanced features
  adx: number; // Average Directional Index
  obv: number; // On-Balance Volume
  ichimoku: {
    tenkan: number;
    kijun: number;
    senkouA: number;
    senkouB: number;
    chikou: number;
  };
  fibonacci: {
    retracement382: number;
    retracement500: number;
    retracement618: number;
  };
  volProfile: {
    valueAreaHigh: number;
    valueAreaLow: number;
    pointOfControl: number;
  };
  marketRegime: 'TRENDING' | 'RANGING' | 'BREAKOUT';
}

// Advanced indicator calculations
function calculateADX(highs: number[], lows: number[], closes: number[]): number {
  if (highs.length < 15) return 20; // Default neutral value
  
  // Simplified ADX calculation
  const trs = [];
  const plusDms = [];
  const minusDms = [];
  
  for (let i = 1; i < highs.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i-1]),
      Math.abs(lows[i] - closes[i-1])
    );
    trs.push(tr);
    
    const plusDm = highs[i] - highs[i-1];
    const minusDm = lows[i-1] - lows[i];
    
    if (plusDm > minusDm && plusDm > 0) {
      plusDms.push(plusDm);
      minusDms.push(0);
    } else if (minusDm > plusDm && minusDm > 0) {
      minusDms.push(minusDm);
      plusDms.push(0);
    } else {
      plusDms.push(0);
      minusDms.push(0);
    }
  }
  
  // Calculate DI+ and DI-
  const diPlus = (plusDms.slice(-14).reduce((a, b) => a + b, 0) / 14) / (trs.slice(-14).reduce((a, b) => a + b, 0) / 14) * 100;
  const diMinus = (minusDms.slice(-14).reduce((a, b) => a + b, 0) / 14) / (trs.slice(-14).reduce((a, b) => a + b, 0) / 14) * 100;
  
  // Calculate ADX
  const dx = Math.abs(diPlus - diMinus) / (diPlus + diMinus) * 100;
  
  return isNaN(dx) ? 20 : dx;
}

function calculateOBV(closes: number[], volumes: number[]): number {
  if (closes.length < 2 || volumes.length !== closes.length) return 0;
  
  let obv = 0;
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i-1]) {
      obv += volumes[i] || 0;
    } else if (closes[i] < closes[i-1]) {
      obv -= volumes[i] || 0;
    }
  }
  
  return obv;
}

function calculateIchimoku(highs: number[], lows: number[], closes: number[]) {
  if (highs.length < 52) {
    return { tenkan: 0, kijun: 0, senkouA: 0, senkouB: 0, chikou: 0 };
  }
  
  // Tenkan-sen (Conversion Line): (9-period high + 9-period low)/2
  const ninePeriodHigh = Math.max(...highs.slice(-9));
  const ninePeriodLow = Math.min(...lows.slice(-9));
  const tenkan = (ninePeriodHigh + ninePeriodLow) / 2;
  
  // Kijun-sen (Base Line): (26-period high + 26-period low)/2
  const twentysixPeriodHigh = Math.max(...highs.slice(-26));
  const twentysixPeriodLow = Math.min(...lows.slice(-26));
  const kijun = (twentysixPeriodHigh + twentysixPeriodLow) / 2;
  
  // Senkou Span A (Leading Span A): (Tenkan-sen + Kijun-sen)/2, plotted 26 periods ahead
  const senkouA = (tenkan + kijun) / 2;
  
  // Senkou Span B (Leading Span B): (52-period high + 52-period low)/2, plotted 26 periods ahead
  const fivetwoPeriodHigh = Math.max(...highs.slice(-52));
  const fivetwoPeriodLow = Math.min(...lows.slice(-52));
  const senkouB = (fivetwoPeriodHigh + fivetwoPeriodLow) / 2;
  
  // Chikou Span (Lagging Span): Close plotted 26 periods in the past
  const chikou = closes.length > 26 ? closes[closes.length - 27] : closes[closes.length - 1];
  
  return { tenkan, kijun, senkouA, senkouB, chikou };
}

function calculateFibonacciRetracements(highs: number[], lows: number[]) {
  if (highs.length < 2 || lows.length < 2) {
    return { retracement382: 0, retracement500: 0, retracement618: 0 };
  }
  
  const highestHigh = Math.max(...highs);
  const lowestLow = Math.min(...lows);
  const range = highestHigh - lowestLow;
  
  return {
    retracement382: highestHigh - range * 0.382,
    retracement500: highestHigh - range * 0.5,
    retracement618: highestHigh - range * 0.618
  };
}

function calculateVolumeProfile(closes: number[], volumes: number[]) {
  if (closes.length === 0 || volumes.length !== closes.length) {
    return { valueAreaHigh: 0, valueAreaLow: 0, pointOfControl: 0 };
  }
  
  // Simplified volume profile calculation
  const priceVolumeMap: { [key: number]: number } = {};
  
  // Group prices into levels (simplified to 10 levels)
  const minPrice = Math.min(...closes);
  const maxPrice = Math.max(...closes);
  const priceRange = maxPrice - minPrice;
  const levelSize = priceRange / 10 || 1;
  
  for (let i = 0; i < closes.length; i++) {
    const level = Math.floor((closes[i] - minPrice) / levelSize);
    const levelPrice = minPrice + level * levelSize;
    
    if (!priceVolumeMap[levelPrice]) {
      priceVolumeMap[levelPrice] = 0;
    }
    priceVolumeMap[levelPrice] += volumes[i] || 0;
  }
  
  // Find point of control (price level with highest volume)
  let maxVolume = 0;
  let pointOfControl = 0;
  
  for (const [price, volume] of Object.entries(priceVolumeMap)) {
    if (volume > maxVolume) {
      maxVolume = volume;
      pointOfControl = parseFloat(price);
    }
  }
  
  // Calculate value area (70% of total volume)
  const totalVolume = Object.values(priceVolumeMap).reduce((a, b) => a + b, 0);
  const valueAreaVolume = totalVolume * 0.7;
  
  // Find value area high and low (simplified)
  const sortedPrices = Object.keys(priceVolumeMap).map(parseFloat).sort((a, b) => a - b);
  const valueAreaHigh = Math.max(...sortedPrices.slice(-3));
  const valueAreaLow = Math.min(...sortedPrices.slice(0, 3));
  
  return { valueAreaHigh, valueAreaLow, pointOfControl };
}

function determineMarketRegime(closes: number[], atr: number): 'TRENDING' | 'RANGING' | 'BREAKOUT' {
  if (closes.length < 20) return 'RANGING';
  
  // Calculate standard deviation
  const mean = closes.reduce((a, b) => a + b, 0) / closes.length;
  const squareDiffs = closes.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  const stdDev = Math.sqrt(avgSquareDiff);
  
  // Calculate average true range as percentage of price
  const avgPrice = closes.reduce((a, b) => a + b, 0) / closes.length;
  const atrPct = (atr / avgPrice) * 100;
  
  // Determine market regime based on volatility and price action
  if (stdDev > closes[0] * 0.02 && atrPct > 0.5) {
    return 'TRENDING';
  } else if (stdDev < closes[0] * 0.005 && atrPct < 0.2) {
    return 'RANGING';
  } else {
    return 'BREAKOUT';
  }
}

export interface MultiTimeframeAnalysis {
  confluence: number; // 0-100 score for multi-timeframe agreement
  trendAlignment: "STRONG_BULL" | "BULL" | "NEUTRAL" | "BEAR" | "STRONG_BEAR";
  momentumAlignment: "INCREASING" | "DECREASING" | "DIVERGING" | "NEUTRAL";
  volatilityState: "LOW" | "NORMAL" | "HIGH" | "EXTREME";
}

export interface MarketConditionContext {
  sessionType: "ASIAN" | "EUROPEAN" | "US" | "OVERLAP" | "DEAD";
  volatilityAdjustment: number; // Multiplier for confidence based on current volatility
  trendStrength: number; // 0-1 where 1 is strongest trend
  marketNoise: number; // 0-1 where 1 is highest noise
}

/**
 * Calculate enhanced RSI with more sophisticated smoothing
 */
export function calculateEnhancedRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) {
    return 50; // Neutral if insufficient data
  }
  
  let gains = 0;
  let losses = 0;
  
  // Calculate initial averages
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses -= change; // Make positive
    }
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  // Apply Wilder's smoothing for remaining periods
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    
    avgGain = ((avgGain * (period - 1)) + gain) / period;
    avgLoss = ((avgLoss * (period - 1)) + loss) / period;
  }
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculate enhanced MACD with signal line and histogram
 */
export function calculateEnhancedMACD(prices: number[]): { line: number; signal: number; histogram: number } {
  if (prices.length < 26) {
    return { line: 0, signal: 0, histogram: 0 };
  }
  
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  // Calculate MACD line
  const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1];
  
  // Calculate signal line (9-period EMA of MACD line)
  const macdHistory = [];
  for (let i = 25; i < Math.min(ema12.length, ema26.length); i++) {
    macdHistory.push(ema12[i] - ema26[i]);
  }
  
  const signalEMA = calculateEMA(macdHistory, 9);
  const signalLine = signalEMA[signalEMA.length - 1] || 0;
  
  // Calculate histogram
  const histogram = macdLine - signalLine;
  
  return {
    line: macdLine,
    signal: signalLine,
    histogram: histogram
  };
}

/**
 * Calculate True Range and Average True Range
 */
export function calculateEnhancedATR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
  if (highs.length < period || lows.length < period || closes.length < period) {
    return 0;
  }
  
  const trueRanges = [];
  
  for (let i = 1; i < highs.length; i++) {
    const tr1 = highs[i] - lows[i];
    const tr2 = Math.abs(highs[i] - closes[i - 1]);
    const tr3 = Math.abs(lows[i] - closes[i - 1]);
    
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }
  
  // Calculate simple moving average of true ranges
  const recentTRs = trueRanges.slice(-period);
  return recentTRs.reduce((sum, tr) => sum + tr, 0) / recentTRs.length;
}

/**
 * Calculate exponential moving average
 */
export function calculateEMA(data: number[], period: number): number[] {
  if (data.length === 0) return [];
  
  const multiplier = 2 / (period + 1);
  const emaArray: number[] = [data[0]];
  
  for (let i = 1; i < data.length; i++) {
    const ema = (data[i] * multiplier) + (emaArray[i - 1] * (1 - multiplier));
    emaArray.push(ema);
  }
  
  return emaArray;
}

/**
 * Calculate simple moving average
 */
export function calculateSMA(data: number[], period: number): number[] {
  const smaArray: number[] = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const average = slice.reduce((sum, value) => sum + value, 0) / period;
    smaArray.push(average);
  }
  
  return smaArray;
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): {
  upper: number;
  middle: number;
  lower: number;
  squeeze: boolean;
} {
  if (prices.length < period) {
    const price = prices[prices.length - 1] || 0;
    return { upper: price, middle: price, lower: price, squeeze: false };
  }
  
  const sma = calculateSMA(prices, period);
  const middle = sma[sma.length - 1];
  
  // Calculate standard deviation
  const recentPrices = prices.slice(-period);
  const variance = recentPrices.reduce((sum, price) => {
    return sum + Math.pow(price - middle, 2);
  }, 0) / period;
  
  const standardDeviation = Math.sqrt(variance);
  
  const upper = middle + (standardDeviation * stdDev);
  const lower = middle - (standardDeviation * stdDev);
  
  // Detect squeeze (when bands are historically tight)
  const bandWidth = (upper - lower) / middle;
  const squeeze = bandWidth < 0.02; // 2% or less indicates squeeze
  
  return { upper, middle, lower, squeeze };
}

/**
 * Calculate Stochastic Oscillator
 */
export function calculateStochastic(highs: number[], lows: number[], closes: number[], kPeriod: number = 14, dPeriod: number = 3): {
  k: number;
  d: number;
} {
  if (highs.length < kPeriod || lows.length < kPeriod || closes.length < kPeriod) {
    return { k: 50, d: 50 };
  }
  
  // Calculate %K
  const recentHighs = highs.slice(-kPeriod);
  const recentLows = lows.slice(-kPeriod);
  const currentClose = closes[closes.length - 1];
  
  const highestHigh = Math.max(...recentHighs);
  const lowestLow = Math.min(...recentLows);
  
  const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
  
  // Calculate %D (moving average of %K)
  // For simplicity, we'll approximate %D
  const d = k; // In a full implementation, this would be a moving average of recent %K values
  
  return { k, d };
}

/**
 * Analyze multi-timeframe confluence
 */
export function analyzeMultiTimeframeConfluence(
  tf5m: any,
  tf15m: any,
  tf30m: any
): MultiTimeframeAnalysis {
  // Calculate trend agreement across timeframes
  let trendScore = 0;
  let momentumScore = 0;
  
  // Price momentum analysis
  const momentum5m = tf5m.close > tf5m.open ? 1 : -1;
  const momentum15m = tf15m.close > tf15m.open ? 1 : -1;
  const momentum30m = tf30m.close > tf30m.open ? 1 : -1;
  
  const momentumAlignment = momentum5m + momentum15m + momentum30m;
  
  // RSI alignment analysis
  const rsi5m = tf5m.indicators?.rsi || 50;
  const rsi15m = tf15m.indicators?.rsi || 50;
  const rsi30m = tf30m.indicators?.rsi || 50;
  
  // Check for RSI confluence (all in same zone)
  const rsiBullish = [rsi5m, rsi15m, rsi30m].filter(rsi => rsi > 50).length;
  const rsiBearish = [rsi5m, rsi15m, rsi30m].filter(rsi => rsi < 50).length;
  
  if (rsiBullish === 3) trendScore += 2;
  else if (rsiBullish === 2) trendScore += 1;
  else if (rsiBearish === 3) trendScore -= 2;
  else if (rsiBearish === 2) trendScore -= 1;
  
  // Volume confluence
  const volumes = [tf5m.volume, tf15m.volume, tf30m.volume];
  const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
  const volumeConfirmation = tf5m.volume > avgVolume * 1.2 ? 1 : 0;
  
  // Calculate final confluence score
  const confluenceScore = Math.min(100, Math.max(0, 
    50 + (trendScore * 10) + (momentumAlignment * 5) + (volumeConfirmation * 10)
  ));
  
  // Determine trend alignment
  let trendAlignment: MultiTimeframeAnalysis["trendAlignment"];
  if (confluenceScore >= 80) trendAlignment = "STRONG_BULL";
  else if (confluenceScore >= 60) trendAlignment = "BULL";
  else if (confluenceScore <= 20) trendAlignment = "STRONG_BEAR";
  else if (confluenceScore <= 40) trendAlignment = "BEAR";
  else trendAlignment = "NEUTRAL";
  
  // Momentum alignment analysis
  let momentumAlignmentResult: MultiTimeframeAnalysis["momentumAlignment"];
  if (Math.abs(momentumAlignment) === 3) momentumAlignmentResult = momentumAlignment > 0 ? "INCREASING" : "DECREASING";
  else if (Math.abs(momentumAlignment) >= 1) momentumAlignmentResult = momentumAlignment > 0 ? "INCREASING" : "DECREASING";
  else momentumAlignmentResult = "NEUTRAL";
  
  // Volatility state analysis
  const atrs = [tf5m.indicators?.atr || 0, tf15m.indicators?.atr || 0, tf30m.indicators?.atr || 0];
  const avgATR = atrs.reduce((sum, atr) => sum + atr, 0) / atrs.length;
  const currentPrice = tf5m.close;
  const volatilityRatio = avgATR / currentPrice;
  
  let volatilityState: MultiTimeframeAnalysis["volatilityState"];
  if (volatilityRatio > 0.02) volatilityState = "EXTREME";
  else if (volatilityRatio > 0.01) volatilityState = "HIGH";
  else if (volatilityRatio > 0.005) volatilityState = "NORMAL";
  else volatilityState = "LOW";
  
  return {
    confluence: confluenceScore,
    trendAlignment,
    momentumAlignment: momentumAlignmentResult,
    volatilityState
  };
}

/**
 * Determine market context for better signal quality
 */
export function getMarketConditionContext(): MarketConditionContext {
  const now = new Date();
  const utcHour = now.getUTCHours();
  
  // Determine trading session
  let sessionType: MarketConditionContext["sessionType"];
  if (utcHour >= 0 && utcHour < 7) {
    sessionType = "ASIAN";
  } else if (utcHour >= 7 && utcHour < 8) {
    sessionType = "OVERLAP"; // Asian-European overlap
  } else if (utcHour >= 8 && utcHour < 13) {
    sessionType = "EUROPEAN";
  } else if (utcHour >= 13 && utcHour < 17) {
    sessionType = "OVERLAP"; // European-US overlap
  } else if (utcHour >= 17 && utcHour < 22) {
    sessionType = "US";
  } else {
    sessionType = "DEAD"; // Low activity period
  }
  
  // Calculate volatility adjustment based on session
  let volatilityAdjustment: number;
  switch (sessionType) {
    case "OVERLAP":
      volatilityAdjustment = 1.2; // Higher confidence during overlaps
      break;
    case "EUROPEAN":
    case "US":
      volatilityAdjustment = 1.1; // Good activity
      break;
    case "ASIAN":
      volatilityAdjustment = 0.9; // Lower volatility typically
      break;
    case "DEAD":
      volatilityAdjustment = 0.7; // Reduce confidence during low activity
      break;
    default:
      volatilityAdjustment = 1.0;
  }
  
  // Calculate trend strength and market noise
  // This would be enhanced with real market data in production
  const trendStrength = 0.6 + (Math.random() * 0.4); // Placeholder
  const marketNoise = Math.random() * 0.5; // Placeholder
  
  return {
    sessionType,
    volatilityAdjustment,
    trendStrength,
    marketNoise
  };
}

/**
 * Calculate comprehensive technical indicators for a dataset
 */
export function calculateEnhancedIndicators(
  opens: number[],
  highs: number[],
  lows: number[],
  closes: number[],
  volumes?: number[]
): EnhancedIndicators {
  const rsi = calculateEnhancedRSI(closes);
  const macd = calculateEnhancedMACD(closes);
  const atr = calculateEnhancedATR(highs, lows, closes);
  
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);
  
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  
  const bollinger = calculateBollingerBands(closes);
  const stochastic = calculateStochastic(highs, lows, closes);
  
  // Rate of Change (momentum)
  const rocPeriod = 14;
  const roc = closes.length >= rocPeriod 
    ? ((closes[closes.length - 1] - closes[closes.length - rocPeriod]) / closes[closes.length - rocPeriod]) * 100
    : 0;
  
  const momentum = closes.length >= 10
    ? closes[closes.length - 1] - closes[closes.length - 10]
    : 0;
  
  // Calculate advanced indicators
  const adx = calculateADX(highs, lows, closes);
  const obv = calculateOBV(closes, volumes || []);
  const ichimoku = calculateIchimoku(highs, lows, closes);
  const fibonacci = calculateFibonacciRetracements(highs, lows);
  const volProfile = calculateVolumeProfile(closes, volumes || []);
  const marketRegime = determineMarketRegime(closes, atr);

  return {
    rsi,
    macd,
    atr,
    sma: {
      sma20: sma20[sma20.length - 1] || closes[closes.length - 1] || 0,
      sma50: sma50[sma50.length - 1] || closes[closes.length - 1] || 0,
      sma200: sma200[sma200.length - 1] || closes[closes.length - 1] || 0,
    },
    ema: {
      ema12: ema12[ema12.length - 1] || closes[closes.length - 1] || 0,
      ema26: ema26[ema26.length - 1] || closes[closes.length - 1] || 0,
    },
    bollinger,
    stochastic,
    momentum: {
      roc,
      momentum
    },
    adx,
    obv,
    ichimoku,
    fibonacci,
    volProfile,
    marketRegime
  };
}
