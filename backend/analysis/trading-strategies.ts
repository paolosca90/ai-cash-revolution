export enum TradingStrategy {
  SCALPING = "SCALPING",
  INTRADAY = "INTRADAY",
  SWING = "SWING",
  POSITION = "POSITION",
  // New quantitative strategies
  STATISTICAL_ARBITRAGE = "STATISTICAL_ARBITRAGE",
  MOMENTUM_BREAKOUT = "MOMENTUM_BREAKOUT",
  MEAN_REVERSION = "MEAN_REVERSION",
  PAIRS_TRADING = "PAIRS_TRADING",
  ORDER_FLOW = "ORDER_FLOW",
  VOLATILITY_TRADING = "VOLATILITY_TRADING",
  TREND_FOLLOWING = "TREND_FOLLOWING",
  REGIME_SWITCHING = "REGIME_SWITCHING"
}

export interface StrategyConfig {
  name: string;
  description: string;
  timeframes: string[];
  riskRewardRatio: number;
  stopLossMultiplier: number;
  takeProfitMultiplier: number;
  maxHoldingTime: number;
  minConfidence: number;
  maxLotSize: number;
  volatilityThreshold: number;
  trendStrengthRequired: number;
  marketConditions: string[];
  // Enhanced configuration
  adaptiveParameters: boolean;
  mlDriven: boolean;
  institutionalAlignment: boolean;
  riskModel: "FIXED" | "ADAPTIVE" | "VOLATILITY_BASED" | "VaR";
  assetClasses: string[];
  correlationThreshold?: number;
  leverageMultiplier: number;
  drawdownLimit: number;
  sharpeRatioTarget: number;
}

export const TRADING_STRATEGIES: Record<TradingStrategy, StrategyConfig> = {
  [TradingStrategy.SCALPING]: {
    name: "AI-Enhanced Scalping",
    description: "Ultra-fast trades using market microstructure and order flow analysis (1-15 minutes)",
    timeframes: ["1m", "5m"],
    riskRewardRatio: 1.8,
    stopLossMultiplier: 0.6,
    takeProfitMultiplier: 1.1,
    maxHoldingTime: 0.25,
    minConfidence: 92,
    maxLotSize: 0.3,
    volatilityThreshold: 0.002,
    trendStrengthRequired: 0.8,
    marketConditions: ["HIGH_VOLUME", "TRENDING", "LOW_SPREAD", "ACTIVE_SESSION"],
    adaptiveParameters: true,
    mlDriven: true,
    institutionalAlignment: true,
    riskModel: "VOLATILITY_BASED",
    assetClasses: ["FOREX", "CRYPTO", "INDICES"],
    leverageMultiplier: 1.5,
    drawdownLimit: 0.02,
    sharpeRatioTarget: 2.5
  },
  
  [TradingStrategy.INTRADAY]: {
    name: "Smart Intraday",
    description: "Institutional-aligned day trading with adaptive risk management (1-6 hours)",
    timeframes: ["5m", "15m", "30m"],
    riskRewardRatio: 2.2,
    stopLossMultiplier: 0.8,
    takeProfitMultiplier: 1.8,
    maxHoldingTime: 6,
    minConfidence: 85,
    maxLotSize: 0.8,
    volatilityThreshold: 0.005,
    trendStrengthRequired: 0.6,
    marketConditions: ["NORMAL_VOLUME", "TRENDING", "BREAKOUT", "ORDER_FLOW"],
    adaptiveParameters: true,
    mlDriven: true,
    institutionalAlignment: true,
    riskModel: "ADAPTIVE",
    assetClasses: ["FOREX", "CRYPTO", "COMMODITIES", "INDICES"],
    leverageMultiplier: 2.0,
    drawdownLimit: 0.03,
    sharpeRatioTarget: 2.0
  },

  [TradingStrategy.SWING]: {
    name: "ML-Driven Swing",
    description: "Medium-term trend following with pattern recognition (1-5 days)",
    timeframes: ["1h", "4h", "1d"],
    riskRewardRatio: 3.0,
    stopLossMultiplier: 1.2,
    takeProfitMultiplier: 3.6,
    maxHoldingTime: 120,
    minConfidence: 78,
    maxLotSize: 1.2,
    volatilityThreshold: 0.015,
    trendStrengthRequired: 0.4,
    marketConditions: ["TRENDING", "PATTERN_CONFIRMATION", "VOLUME_SUPPORT"],
    adaptiveParameters: true,
    mlDriven: true,
    institutionalAlignment: false,
    riskModel: "VaR",
    assetClasses: ["FOREX", "CRYPTO", "COMMODITIES", "EQUITIES", "INDICES"],
    leverageMultiplier: 1.5,
    drawdownLimit: 0.05,
    sharpeRatioTarget: 1.8
  },

  [TradingStrategy.POSITION]: {
    name: "Strategic Position Trading",
    description: "Long-term systematic trend following with fundamental overlay (1-4 weeks)",
    timeframes: ["4h", "1d", "1w"],
    riskRewardRatio: 4.0,
    stopLossMultiplier: 1.5,
    takeProfitMultiplier: 6.0,
    maxHoldingTime: 720,
    minConfidence: 75,
    maxLotSize: 2.0,
    volatilityThreshold: 0.025,
    trendStrengthRequired: 0.3,
    marketConditions: ["TRENDING", "FUNDAMENTAL_ALIGNMENT", "LOW_NOISE"],
    adaptiveParameters: true,
    mlDriven: false,
    institutionalAlignment: false,
    riskModel: "VaR",
    assetClasses: ["FOREX", "COMMODITIES", "EQUITIES", "INDICES"],
    leverageMultiplier: 1.0,
    drawdownLimit: 0.08,
    sharpeRatioTarget: 1.5
  },

  [TradingStrategy.STATISTICAL_ARBITRAGE]: {
    name: "Statistical Arbitrage",
    description: "Quantitative pairs trading and mean reversion strategies",
    timeframes: ["5m", "15m", "30m"],
    riskRewardRatio: 2.5,
    stopLossMultiplier: 0.5,
    takeProfitMultiplier: 1.25,
    maxHoldingTime: 8,
    minConfidence: 88,
    maxLotSize: 1.5,
    volatilityThreshold: 0.008,
    trendStrengthRequired: 0.2,
    marketConditions: ["COINTEGRATION", "SPREAD_DIVERGENCE", "LOW_CORRELATION"],
    adaptiveParameters: true,
    mlDriven: true,
    institutionalAlignment: false,
    riskModel: "VaR",
    assetClasses: ["FOREX", "CRYPTO", "INDICES"],
    correlationThreshold: 0.7,
    leverageMultiplier: 3.0,
    drawdownLimit: 0.04,
    sharpeRatioTarget: 3.0
  },

  [TradingStrategy.MOMENTUM_BREAKOUT]: {
    name: "Momentum Breakout",
    description: "High-momentum breakout strategy with volume confirmation",
    timeframes: ["5m", "15m", "30m"],
    riskRewardRatio: 2.8,
    stopLossMultiplier: 0.7,
    takeProfitMultiplier: 2.0,
    maxHoldingTime: 4,
    minConfidence: 86,
    maxLotSize: 1.0,
    volatilityThreshold: 0.012,
    trendStrengthRequired: 0.8,
    marketConditions: ["BREAKOUT", "HIGH_MOMENTUM", "VOLUME_SPIKE"],
    adaptiveParameters: true,
    mlDriven: true,
    institutionalAlignment: true,
    riskModel: "VOLATILITY_BASED",
    assetClasses: ["CRYPTO", "FOREX", "INDICES"],
    leverageMultiplier: 2.5,
    drawdownLimit: 0.035,
    sharpeRatioTarget: 2.3
  },

  [TradingStrategy.MEAN_REVERSION]: {
    name: "Smart Mean Reversion",
    description: "Statistical mean reversion with regime detection",
    timeframes: ["15m", "30m", "1h"],
    riskRewardRatio: 2.0,
    stopLossMultiplier: 1.0,
    takeProfitMultiplier: 2.0,
    maxHoldingTime: 12,
    minConfidence: 82,
    maxLotSize: 1.2,
    volatilityThreshold: 0.010,
    trendStrengthRequired: 0.1,
    marketConditions: ["OVERSOLD", "OVERBOUGHT", "RANGE_BOUND"],
    adaptiveParameters: true,
    mlDriven: true,
    institutionalAlignment: false,
    riskModel: "ADAPTIVE",
    assetClasses: ["FOREX", "CRYPTO", "COMMODITIES"],
    leverageMultiplier: 1.8,
    drawdownLimit: 0.04,
    sharpeRatioTarget: 1.9
  },

  [TradingStrategy.PAIRS_TRADING]: {
    name: "Quantitative Pairs Trading",
    description: "Market-neutral pairs trading with cointegration analysis",
    timeframes: ["15m", "30m", "1h"],
    riskRewardRatio: 2.5,
    stopLossMultiplier: 0.8,
    takeProfitMultiplier: 2.0,
    maxHoldingTime: 24,
    minConfidence: 85,
    maxLotSize: 2.0,
    volatilityThreshold: 0.008,
    trendStrengthRequired: 0.3,
    marketConditions: ["PAIR_DIVERGENCE", "COINTEGRATION", "HEDGE_RATIO"],
    adaptiveParameters: true,
    mlDriven: true,
    institutionalAlignment: false,
    riskModel: "VaR",
    assetClasses: ["FOREX", "CRYPTO", "INDICES"],
    correlationThreshold: 0.8,
    leverageMultiplier: 1.5,
    drawdownLimit: 0.03,
    sharpeRatioTarget: 2.8
  },

  [TradingStrategy.ORDER_FLOW]: {
    name: "Order Flow Strategy",
    description: "Market microstructure-based trading using order flow analysis",
    timeframes: ["1m", "5m"],
    riskRewardRatio: 2.2,
    stopLossMultiplier: 0.5,
    takeProfitMultiplier: 1.1,
    maxHoldingTime: 0.5,
    minConfidence: 90,
    maxLotSize: 0.8,
    volatilityThreshold: 0.003,
    trendStrengthRequired: 0.6,
    marketConditions: ["ORDER_IMBALANCE", "LIQUIDITY_ZONES", "INSTITUTIONAL_FLOW"],
    adaptiveParameters: true,
    mlDriven: true,
    institutionalAlignment: true,
    riskModel: "VOLATILITY_BASED",
    assetClasses: ["FOREX", "CRYPTO"],
    leverageMultiplier: 3.0,
    drawdownLimit: 0.02,
    sharpeRatioTarget: 3.5
  },

  [TradingStrategy.VOLATILITY_TRADING]: {
    name: "Volatility Trading",
    description: "Volatility-based strategies exploiting regime changes",
    timeframes: ["15m", "30m", "1h"],
    riskRewardRatio: 2.0,
    stopLossMultiplier: 1.2,
    takeProfitMultiplier: 2.4,
    maxHoldingTime: 8,
    minConfidence: 80,
    maxLotSize: 1.0,
    volatilityThreshold: 0.020,
    trendStrengthRequired: 0.4,
    marketConditions: ["VOL_EXPANSION", "VOL_CONTRACTION", "REGIME_CHANGE"],
    adaptiveParameters: true,
    mlDriven: true,
    institutionalAlignment: false,
    riskModel: "VaR",
    assetClasses: ["CRYPTO", "FOREX", "COMMODITIES"],
    leverageMultiplier: 2.0,
    drawdownLimit: 0.06,
    sharpeRatioTarget: 1.7
  },

  [TradingStrategy.TREND_FOLLOWING]: {
    name: "Advanced Trend Following",
    description: "Multi-timeframe trend following with adaptive filters",
    timeframes: ["30m", "1h", "4h"],
    riskRewardRatio: 3.5,
    stopLossMultiplier: 1.0,
    takeProfitMultiplier: 3.5,
    maxHoldingTime: 48,
    minConfidence: 75,
    maxLotSize: 1.5,
    volatilityThreshold: 0.012,
    trendStrengthRequired: 0.7,
    marketConditions: ["STRONG_TREND", "MOMENTUM", "BREAKOUT"],
    adaptiveParameters: true,
    mlDriven: true,
    institutionalAlignment: false,
    riskModel: "ADAPTIVE",
    assetClasses: ["FOREX", "CRYPTO", "COMMODITIES", "INDICES"],
    leverageMultiplier: 2.0,
    drawdownLimit: 0.05,
    sharpeRatioTarget: 1.8
  },

  [TradingStrategy.REGIME_SWITCHING]: {
    name: "Regime Switching Strategy",
    description: "Adaptive strategy that switches based on market regime detection",
    timeframes: ["15m", "30m", "1h", "4h"],
    riskRewardRatio: 2.5,
    stopLossMultiplier: 1.0,
    takeProfitMultiplier: 2.5,
    maxHoldingTime: 24,
    minConfidence: 78,
    maxLotSize: 1.2,
    volatilityThreshold: 0.015,
    trendStrengthRequired: 0.5,
    marketConditions: ["REGIME_DETECTION", "ADAPTATION", "META_STRATEGY"],
    adaptiveParameters: true,
    mlDriven: true,
    institutionalAlignment: true,
    riskModel: "ADAPTIVE",
    assetClasses: ["FOREX", "CRYPTO", "COMMODITIES", "INDICES"],
    leverageMultiplier: 1.8,
    drawdownLimit: 0.04,
    sharpeRatioTarget: 2.2
  }
};

export interface StrategyPriceTargets {
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskAmount: number;
  rewardAmount: number;
  riskRewardRatio: number;
  // Enhanced targets
  trailingStop?: number;
  partialTakeProfit?: number[];
  dynamicStopLoss?: number;
  volatilityAdjustedTargets?: boolean;
}

export interface AdaptiveStrategyParams {
  volatilityMultiplier: number;
  trendAdjustment: number;
  sessionMultiplier: number;
  marketRegimeAdjustment: number;
  correlationAdjustment?: number;
  mlConfidenceBoost: number;
  institutionalBias: number;
}

export interface StrategyPerformance {
  winRate: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalTrades: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

export interface QuantitativeMetrics {
  riskAdjustedReturn: number;
  informationRatio: number;
  calmarRatio: number;
  sortinoRatio: number;
  var95: number;
  expectedShortfall: number;
  correlation: number;
  beta: number;
  alpha: number;
}

export interface MarketRegime {
  type: "TRENDING" | "RANGING" | "VOLATILE" | "LOW_VOL" | "CRISIS";
  confidence: number;
  duration: number;
  characteristics: string[];
}

export function calculateStrategyTargets(
  strategy: TradingStrategy,
  currentPrice: number,
  atr: number,
  direction: "LONG" | "SHORT",
  symbol: string,
  spread: number,
  marketData?: any,
  mlAnalysis?: any,
  adaptiveParams?: AdaptiveStrategyParams
): StrategyPriceTargets {
  const config = TRADING_STRATEGIES[strategy];
  const symbolCharacteristics = getSymbolCharacteristics(symbol);
  
  // Apply adaptive parameters if available
  let adjustedATR = atr * symbolCharacteristics.volatilityMultiplier;
  let adjustedStopLossMultiplier = config.stopLossMultiplier;
  let adjustedRiskRewardRatio = config.riskRewardRatio;
  
  if (adaptiveParams) {
    adjustedATR *= adaptiveParams.volatilityMultiplier;
    adjustedStopLossMultiplier *= adaptiveParams.trendAdjustment;
    adjustedRiskRewardRatio *= (1 + adaptiveParams.mlConfidenceBoost);
  }
  
  // Advanced risk-based sizing for different strategies
  const baseStopLoss = calculateAdvancedStopLoss(
    strategy, currentPrice, adjustedATR, direction, marketData, mlAnalysis
  );
  
  // Ensure stop loss is at least 3x the spread to avoid premature stops
  const stopLossDistance = Math.max(
    baseStopLoss,
    spread * 3
  );
  
  const takeProfitDistance = calculateAdvancedTakeProfit(
    strategy, stopLossDistance, adjustedRiskRewardRatio, marketData, mlAnalysis
  );
  
  let stopLoss: number;
  let takeProfit: number;
  
  if (direction === "LONG") {
    stopLoss = currentPrice - stopLossDistance;
    takeProfit = currentPrice + takeProfitDistance;
  } else {
    stopLoss = currentPrice + stopLossDistance;
    takeProfit = currentPrice - takeProfitDistance;
  }
  
  const minMovement = symbolCharacteristics.minMovement;
  
  if (direction === "LONG") {
    stopLoss = Math.min(stopLoss, currentPrice - minMovement);
    takeProfit = Math.max(takeProfit, currentPrice + minMovement * config.riskRewardRatio);
  } else {
    stopLoss = Math.max(stopLoss, currentPrice + minMovement);
    takeProfit = Math.min(takeProfit, currentPrice - minMovement * config.riskRewardRatio);
  }
  
  const riskAmount = Math.abs(currentPrice - stopLoss);
  const rewardAmount = Math.abs(takeProfit - currentPrice);
  const actualRiskReward = riskAmount > 0 ? rewardAmount / riskAmount : 0;
  
  return {
    entryPrice: currentPrice,
    stopLoss: Math.round(stopLoss * 100000) / 100000,
    takeProfit: Math.round(takeProfit * 100000) / 100000,
    riskAmount: Math.round(riskAmount * 100000) / 100000,
    rewardAmount: Math.round(rewardAmount * 100000) / 100000,
    riskRewardRatio: Math.round(actualRiskReward * 100) / 100
  };
}

/**
 * Advanced strategy scoring with ML and regime analysis
 */
function calculateAdvancedStrategyScore(
  strategy: TradingStrategy,
  marketData: any,
  symbol: string,
  mlAnalysis?: any,
  marketRegime?: MarketRegime,
  historicalPerformance?: Map<TradingStrategy, StrategyPerformance>
): number {
  const config = TRADING_STRATEGIES[strategy];
  const volatility = calculateMarketVolatility(marketData);
  const trendStrength = calculateTrendStrength(marketData);
  let score = 50; // Base score

  // Volatility fit
  const volFit = 1 - Math.abs(volatility - config.volatilityThreshold) / config.volatilityThreshold;
  score += Math.max(0, volFit * 20);

  // Trend strength alignment
  if (trendStrength >= config.trendStrengthRequired) {
    score += Math.min(15, (trendStrength - config.trendStrengthRequired) / (1 - config.trendStrengthRequired) * 15);
  } else {
    score -= 10;
  }

  // Market regime bonus/penalty
  if (marketRegime) {
    switch (strategy) {
      case TradingStrategy.MOMENTUM_BREAKOUT:
      case TradingStrategy.TREND_FOLLOWING:
        if (marketRegime.type === "TRENDING") score += 15;
        if (marketRegime.type === "RANGING") score -= 10;
        break;
      
      case TradingStrategy.MEAN_REVERSION:
      case TradingStrategy.STATISTICAL_ARBITRAGE:
        if (marketRegime.type === "RANGING") score += 15;
        if (marketRegime.type === "TRENDING") score -= 10;
        break;
      
      case TradingStrategy.VOLATILITY_TRADING:
        if (marketRegime.type === "VOLATILE") score += 20;
        if (marketRegime.type === "LOW_VOL") score -= 15;
        break;
      
      case TradingStrategy.SCALPING:
      case TradingStrategy.ORDER_FLOW:
        if (marketRegime.type === "CRISIS") score -= 20;
        break;
    }
  }

  // ML analysis bonuses
  if (mlAnalysis && config.mlDriven) {
    const mlConfidence = mlAnalysis.enhancedConfidence?.mlScore || 50;
    if (mlConfidence > 70) {
      score += (mlConfidence - 70) / 3; // Up to 10 bonus points
    }

    // Pattern recognition bonus
    if (mlAnalysis.patternAnalysis?.confidence > 0.8) {
      score += 8;
    }

    // Institutional alignment bonus
    if (config.institutionalAlignment && mlAnalysis.institutionalAnalysis) {
      const institutionalScore = mlAnalysis.enhancedConfidence?.institutionalScore || 50;
      if (institutionalScore > 60) {
        score += (institutionalScore - 60) / 5; // Up to 8 bonus points
      }
    }
  }

  // Historical performance adjustment
  if (historicalPerformance?.has(strategy)) {
    const perf = historicalPerformance.get(strategy)!;
    
    // Adjust based on win rate
    if (perf.winRate > 0.65) {
      score += (perf.winRate - 0.65) * 40; // Up to 14 bonus points
    } else if (perf.winRate < 0.45) {
      score -= (0.45 - perf.winRate) * 60; // Up to 27 penalty points
    }

    // Adjust based on Sharpe ratio
    if (perf.sharpeRatio > config.sharpeRatioTarget) {
      score += Math.min(10, (perf.sharpeRatio - config.sharpeRatioTarget) * 5);
    }

    // Penalty for high drawdown
    if (perf.maxDrawdown > config.drawdownLimit) {
      score -= (perf.maxDrawdown - config.drawdownLimit) * 100;
    }
  }

  // Strategy-specific conditions
  switch (strategy) {
    case TradingStrategy.STATISTICAL_ARBITRAGE:
    case TradingStrategy.PAIRS_TRADING:
      // Need correlation data
      if (!mlAnalysis?.correlationAnalysis) score *= 0.5;
      break;
    
    case TradingStrategy.ORDER_FLOW:
      // Need institutional analysis
      if (!mlAnalysis?.institutionalAnalysis) score *= 0.3;
      break;
    
    case TradingStrategy.REGIME_SWITCHING:
      // Always available but needs regime confidence
      if (!marketRegime || marketRegime.confidence < 0.6) score *= 0.7;
      break;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Enhanced strategy selection using ML and market analysis
 */
export function getOptimalStrategy(
  marketData: any,
  symbol: string,
  userPreference?: TradingStrategy,
  mlAnalysis?: any,
  historicalPerformance?: Map<TradingStrategy, StrategyPerformance>
): TradingStrategy {
  // Get symbol characteristics and market regime
  const symbolChar = getSymbolCharacteristics(symbol);
  const marketRegime = getMarketRegime(marketData, mlAnalysis);
  const volatility = calculateMarketVolatility(marketData);
  const trendStrength = calculateTrendStrength(marketData);
  
  // Check user preference first if valid
  if (userPreference && isStrategyValid(userPreference, marketData, symbol, mlAnalysis)) {
    return userPreference;
  }
  
  // Time-based constraints
  const now = new Date();
  const nyCloseHour = 22;
  const currentHour = now.getHours();
  const hoursUntilNYClose = currentHour < nyCloseHour ? nyCloseHour - currentHour : 24 - currentHour + nyCloseHour;
  
  // Emergency scalping if close to NY close
  if (hoursUntilNYClose < 1) {
    return TradingStrategy.SCALPING;
  }
  
  // Calculate scores for all strategies
  const allStrategies = Object.values(TradingStrategy);
  const scores = new Map<TradingStrategy, number>();
  
  for (const strategy of allStrategies) {
    const config = TRADING_STRATEGIES[strategy];
    
    // Skip if asset class not supported
    if (!config.assetClasses.includes(symbolChar.assetClass) && symbolChar.assetClass !== "UNKNOWN") {
      scores.set(strategy, 0);
      continue;
    }
    
    let score = calculateAdvancedStrategyScore(
      strategy, 
      marketData, 
      symbol, 
      mlAnalysis, 
      marketRegime, 
      historicalPerformance
    );
    
    // Apply symbol-specific bonuses
    if (symbolChar.optimalStrategies.includes(strategy)) {
      score *= 1.3;
    }
    
    // Apply time constraints
    if (hoursUntilNYClose < config.maxHoldingTime) {
      score *= (hoursUntilNYClose / config.maxHoldingTime);
    }
    
    scores.set(strategy, score);
  }
  
  // Find best strategy
  let bestStrategy = TradingStrategy.INTRADAY;
  let bestScore = 0;
  
  for (const [strategy, score] of scores) {
    if (score > bestScore) {
      bestStrategy = strategy;
      bestScore = score;
    }
  }
  
  return bestStrategy;
  
  const volatility = calculateMarketVolatility(marketData);
  const trendStrength = calculateTrendStrength(marketData);
  
  // Calcola il tempo rimanente fino alla chiusura di NY (22:00 CET)
  const now = new Date();
  const nyCloseHour = 22; // 22:00 CET
  const currentHour = now.getHours();
  const hoursUntilNYClose = currentHour < nyCloseHour ? nyCloseHour - currentHour : 24 - currentHour + nyCloseHour;
  
  // Se mancano meno di 2 ore alla chiusura NY, forza scalping
  if (hoursUntilNYClose < 2) {
    return TradingStrategy.SCALPING;
  }
  
  const scores = {
    [TradingStrategy.SCALPING]: calculateStrategyScore(TradingStrategy.SCALPING, volatility, trendStrength),
    [TradingStrategy.INTRADAY]: calculateStrategyScore(TradingStrategy.INTRADAY, volatility, trendStrength)
  };
  
  // Find the strategy with the highest score
  let bestStrategy = TradingStrategy.INTRADAY;
  let bestScore = scores[TradingStrategy.INTRADAY];
  
  for (const [strategy, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestStrategy = strategy as TradingStrategy;
      bestScore = score;
    }
  }
  
  return bestStrategy;
}

function isStrategyValid(
  strategy: TradingStrategy,
  marketData: any,
  symbol: string,
  mlAnalysis?: any
): boolean {
  const config = TRADING_STRATEGIES[strategy];
  const symbolChar = getSymbolCharacteristics(symbol);
  const volatility = calculateMarketVolatility(marketData);
  const trendStrength = calculateTrendStrength(marketData);
  
  // Check basic requirements
  const basicValid = (
    volatility <= config.volatilityThreshold * 2.5 &&
    trendStrength >= config.trendStrengthRequired * 0.7
  );
  
  // Check asset class compatibility
  const assetValid = config.assetClasses.includes(symbolChar.assetClass) || symbolChar.assetClass === "UNKNOWN";
  
  // Check ML requirements
  let mlValid = true;
  if (config.mlDriven && mlAnalysis) {
    const mlScore = mlAnalysis.enhancedConfidence?.mlScore || 0;
    mlValid = mlScore >= 40; // Minimum ML score required
  }
  
  // Check institutional requirements
  let institutionalValid = true;
  if (config.institutionalAlignment && mlAnalysis) {
    institutionalValid = !!mlAnalysis.institutionalAnalysis;
  }
  
  // Strategy-specific validations
  switch (strategy) {
    case TradingStrategy.PAIRS_TRADING:
    case TradingStrategy.STATISTICAL_ARBITRAGE:
      // Need correlation analysis
      return basicValid && assetValid && !!mlAnalysis?.correlationAnalysis;
    
    case TradingStrategy.ORDER_FLOW:
      // Need institutional analysis and high-frequency data
      return basicValid && assetValid && !!mlAnalysis?.institutionalAnalysis;
    
    case TradingStrategy.VOLATILITY_TRADING:
      // Need sufficient volatility
      return basicValid && assetValid && volatility > 0.005;
    
    default:
      return basicValid && assetValid && mlValid && institutionalValid;
  }
}

function calculateStrategyScore(
  strategy: TradingStrategy,
  volatility: number,
  trendStrength: number
): number {
  const config = TRADING_STRATEGIES[strategy];
  let score = 50;
  
  const volatilityFit = 1 - Math.abs(volatility - config.volatilityThreshold) / config.volatilityThreshold;
  score += Math.max(0, volatilityFit * 30);
  
  if (trendStrength >= config.trendStrengthRequired) {
    score += Math.min(30, (trendStrength - config.trendStrengthRequired) / (1 - config.trendStrengthRequired) * 30);
  }
  
  return score;
}

function calculateMarketVolatility(marketData: any): number {
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];
  
  const volatilities = [
    data5m.indicators.atr / data5m.close,
    data15m.indicators.atr / data15m.close,
    data30m.indicators.atr / data30m.close
  ];
  
  return volatilities.reduce((sum, vol) => sum + vol, 0) / volatilities.length;
}

function calculateTrendStrength(marketData: any): number {
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];
  
  const prices = [data5m.close, data15m.close, data30m.close];
  const isUptrend = prices.every((price, i) => i === 0 || price >= prices[i - 1]);
  const isDowntrend = prices.every((price, i) => i === 0 || price <= prices[i - 1]);
  
  if (isUptrend || isDowntrend) {
    const totalMove = Math.abs(prices[0] - prices[prices.length - 1]);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    return Math.min(1, totalMove / avgPrice * 100);
  }
  
  return 0;
}

/**
 * Calculate advanced stop loss based on strategy type and market conditions
 */
function calculateAdvancedStopLoss(
  strategy: TradingStrategy,
  currentPrice: number,
  atr: number,
  direction: "LONG" | "SHORT",
  marketData?: any,
  mlAnalysis?: any
): number {
  const config = TRADING_STRATEGIES[strategy];
  let baseStopLoss = atr * config.stopLossMultiplier;
  
  switch (strategy) {
    case TradingStrategy.STATISTICAL_ARBITRAGE:
      // Use statistical-based stops
      const zscore = mlAnalysis?.zscore || 2;
      baseStopLoss = Math.min(baseStopLoss, currentPrice * 0.01 * zscore);
      break;
      
    case TradingStrategy.MOMENTUM_BREAKOUT:
      // Tighter stops for breakouts
      if (marketData?.breakoutConfirmed) {
        baseStopLoss *= 0.7;
      }
      break;
      
    case TradingStrategy.MEAN_REVERSION:
      // Wider stops for mean reversion
      baseStopLoss *= 1.3;
      break;
      
    case TradingStrategy.ORDER_FLOW:
      // Use order flow levels for stops
      const orderFlowLevel = mlAnalysis?.institutionalAnalysis?.orderBlocks?.[0];
      if (orderFlowLevel) {
        const levelDistance = Math.abs(currentPrice - (direction === "LONG" ? orderFlowLevel.low : orderFlowLevel.high));
        baseStopLoss = Math.min(baseStopLoss, levelDistance * 1.1);
      }
      break;
      
    case TradingStrategy.VOLATILITY_TRADING:
      // Volatility-based stops
      const impliedVol = marketData?.impliedVolatility || 0.2;
      baseStopLoss = currentPrice * impliedVol * Math.sqrt(1/252); // Daily volatility
      break;
      
    case TradingStrategy.REGIME_SWITCHING:
      // Regime-aware stops
      const regimeVol = marketData?.regimeVolatility || 1.0;
      baseStopLoss *= regimeVol;
      break;
      
    default:
      // Standard ATR-based stop
      break;
  }
  
  // Apply institutional analysis adjustments
  if (mlAnalysis?.institutionalAnalysis && config.institutionalAlignment) {
    const institutionalBias = mlAnalysis.institutionalAnalysis.marketMakerModel.smartMoneyDirection;
    if ((direction === "LONG" && institutionalBias === "SHORT") || 
        (direction === "SHORT" && institutionalBias === "LONG")) {
      baseStopLoss *= 0.8; // Tighten stops against institutional flow
    }
  }
  
  return baseStopLoss;
}

/**
 * Calculate advanced take profit based on strategy and market analysis
 */
function calculateAdvancedTakeProfit(
  strategy: TradingStrategy,
  stopLossDistance: number,
  riskRewardRatio: number,
  marketData?: any,
  mlAnalysis?: any
): number {
  let baseTakeProfit = stopLossDistance * riskRewardRatio;
  
  switch (strategy) {
    case TradingStrategy.STATISTICAL_ARBITRAGE:
      // Target statistical mean reversion
      const meanReversionTarget = mlAnalysis?.meanReversionLevel || baseTakeProfit;
      baseTakeProfit = Math.min(baseTakeProfit, meanReversionTarget);
      break;
      
    case TradingStrategy.MOMENTUM_BREAKOUT:
      // Extended targets for strong momentum
      const momentumStrength = mlAnalysis?.momentumStrength || 1.0;
      if (momentumStrength > 1.5) {
        baseTakeProfit *= 1.5;
      }
      break;
      
    case TradingStrategy.PAIRS_TRADING:
      // Target spread convergence
      const spreadTarget = mlAnalysis?.targetSpread || baseTakeProfit;
      baseTakeProfit = Math.min(baseTakeProfit, spreadTarget);
      break;
      
    case TradingStrategy.TREND_FOLLOWING:
      // Use trend channels for targets
      const trendChannel = marketData?.trendChannel;
      if (trendChannel) {
        baseTakeProfit = Math.max(baseTakeProfit, trendChannel.width * 0.8);
      }
      break;
      
    case TradingStrategy.VOLATILITY_TRADING:
      // Volatility expansion/contraction targets
      const volTarget = marketData?.volatilityTarget || 1.0;
      baseTakeProfit *= volTarget;
      break;
      
    default:
      break;
  }
  
  // Apply pattern-based adjustments
  if (mlAnalysis?.patternAnalysis?.targetLevel) {
    const patternTarget = Math.abs(mlAnalysis.patternAnalysis.targetLevel - mlAnalysis.entryPrice || 0);
    if (patternTarget > 0) {
      baseTakeProfit = Math.min(baseTakeProfit, patternTarget);
    }
  }
  
  return baseTakeProfit;
}

/**
 * Get market regime and adapt strategy parameters
 */
export function getMarketRegime(marketData: any, mlAnalysis?: any): MarketRegime {
  const volatility = calculateMarketVolatility(marketData);
  const trendStrength = calculateTrendStrength(marketData);
  const volume = marketData["5m"]?.volume || 1;
  const avgVolume = marketData["30m"]?.volume || 1;
  const volumeRatio = volume / avgVolume;
  
  // Determine regime type
  let regimeType: MarketRegime["type"] = "RANGING";
  let confidence = 0.5;
  let characteristics: string[] = [];
  
  if (volatility > 0.025) {
    if (volumeRatio > 2.0) {
      regimeType = "CRISIS";
      confidence = 0.9;
      characteristics = ["HIGH_VOLATILITY", "PANIC_SELLING", "FLIGHT_TO_QUALITY"];
    } else {
      regimeType = "VOLATILE";
      confidence = 0.8;
      characteristics = ["HIGH_VOLATILITY", "UNCERTAINTY", "WIDE_RANGES"];
    }
  } else if (volatility < 0.005) {
    regimeType = "LOW_VOL";
    confidence = 0.7;
    characteristics = ["LOW_VOLATILITY", "CONSOLIDATION", "MEAN_REVERSION"];
  } else if (trendStrength > 0.7) {
    regimeType = "TRENDING";
    confidence = 0.8;
    characteristics = ["STRONG_TREND", "MOMENTUM", "BREAKOUTS"];
  } else {
    regimeType = "RANGING";
    confidence = 0.6;
    characteristics = ["SIDEWAYS", "MEAN_REVERSION", "SUPPORT_RESISTANCE"];
  }
  
  // ML-based regime adjustments
  if (mlAnalysis?.regimeDetection) {
    const mlRegime = mlAnalysis.regimeDetection;
    confidence = Math.max(confidence, mlRegime.confidence);
    if (mlRegime.type === regimeType) {
      confidence *= 1.2;
    }
  }
  
  return {
    type: regimeType,
    confidence: Math.min(confidence, 0.95),
    duration: estimateRegimeDuration(regimeType, marketData),
    characteristics
  };
}

/**
 * Estimate how long current regime might last (in hours)
 */
function estimateRegimeDuration(regimeType: MarketRegime["type"], marketData: any): number {
  const baseEstimates: Record<MarketRegime["type"], number> = {
    "TRENDING": 48,
    "RANGING": 24,
    "VOLATILE": 12,
    "LOW_VOL": 72,
    "CRISIS": 6
  };
  
  const volatility = calculateMarketVolatility(marketData);
  const adjustment = 1 / (1 + volatility * 20); // Higher volatility = shorter duration
  
  return baseEstimates[regimeType] * adjustment;
}

/**
 * Calculate adaptive strategy parameters based on current market conditions
 */
export function calculateAdaptiveParams(
  strategy: TradingStrategy,
  marketData: any,
  mlAnalysis?: any,
  historicalPerformance?: StrategyPerformance
): AdaptiveStrategyParams {
  const regime = getMarketRegime(marketData, mlAnalysis);
  const volatility = calculateMarketVolatility(marketData);
  const trendStrength = calculateTrendStrength(marketData);
  
  // Base adjustments
  let volatilityMultiplier = 1.0;
  let trendAdjustment = 1.0;
  let sessionMultiplier = 1.0;
  let marketRegimeAdjustment = 1.0;
  let mlConfidenceBoost = 0.0;
  let institutionalBias = 0.0;
  
  // Volatility adjustments
  if (volatility > 0.015) {
    volatilityMultiplier = 1.5; // Wider stops in high vol
  } else if (volatility < 0.005) {
    volatilityMultiplier = 0.7; // Tighter stops in low vol
  }
  
  // Trend adjustments
  if (trendStrength > 0.8) {
    trendAdjustment = 0.8; // Tighter stops in strong trends
  } else if (trendStrength < 0.3) {
    trendAdjustment = 1.3; // Wider stops in choppy markets
  }
  
  // Session-based adjustments
  const sessionType = mlAnalysis?.enhancedTechnical?.marketContext?.sessionType;
  switch (sessionType) {
    case "OVERLAP":
      sessionMultiplier = 1.3; // More volatile during overlaps
      break;
    case "DEAD":
      sessionMultiplier = 0.6; // Less volatile during dead times
      break;
    default:
      sessionMultiplier = 1.0;
  }
  
  // Market regime adjustments
  switch (regime.type) {
    case "CRISIS":
      marketRegimeAdjustment = 2.0; // Much wider stops in crisis
      break;
    case "VOLATILE":
      marketRegimeAdjustment = 1.5;
      break;
    case "LOW_VOL":
      marketRegimeAdjustment = 0.7;
      break;
    case "TRENDING":
      marketRegimeAdjustment = 0.9;
      break;
    default:
      marketRegimeAdjustment = 1.0;
  }
  
  // ML confidence boost
  if (mlAnalysis?.enhancedConfidence) {
    const mlScore = mlAnalysis.enhancedConfidence.mlScore || 50;
    mlConfidenceBoost = Math.max(0, (mlScore - 70) / 100); // Boost for high ML confidence
  }
  
  // Institutional bias
  if (mlAnalysis?.institutionalAnalysis) {
    const institutionalScore = mlAnalysis.enhancedConfidence?.institutionalScore || 50;
    institutionalBias = (institutionalScore - 50) / 100;
  }
  
  // Strategy-specific adjustments
  const config = TRADING_STRATEGIES[strategy];
  if (config.adaptiveParameters) {
    // Apply historical performance adjustments
    if (historicalPerformance) {
      if (historicalPerformance.winRate < 0.5) {
        // Poor performance - be more conservative
        volatilityMultiplier *= 1.2;
        trendAdjustment *= 1.1;
      } else if (historicalPerformance.winRate > 0.7) {
        // Good performance - can be more aggressive
        volatilityMultiplier *= 0.9;
        mlConfidenceBoost *= 1.2;
      }
    }
  }
  
  return {
    volatilityMultiplier,
    trendAdjustment,
    sessionMultiplier,
    marketRegimeAdjustment,
    mlConfidenceBoost,
    institutionalBias
  };
}

function getSymbolCharacteristics(symbol: string) {"
  const characteristics: Record<string, any> = {
    // Cryptocurrencies
    "BTCUSD": {
      volatilityMultiplier: 1.2,
      minMovement: 100,
      tickSize: 0.01,
      assetClass: "CRYPTO",
      optimalStrategies: [TradingStrategy.MOMENTUM_BREAKOUT, TradingStrategy.VOLATILITY_TRADING],
      correlationAssets: ["ETHUSD", "CRYPTO_INDEX"],
      tradingHours: "24/7",
      liquidityTier: "HIGH"
    },
    "ETHUSD": {
      volatilityMultiplier: 1.3,
      minMovement: 5,
      tickSize: 0.01,
      assetClass: "CRYPTO",
      optimalStrategies: [TradingStrategy.MEAN_REVERSION, TradingStrategy.MOMENTUM_BREAKOUT],
      correlationAssets: ["BTCUSD", "CRYPTO_INDEX"],
      tradingHours: "24/7",
      liquidityTier: "HIGH"
    },
    
    // Major Forex Pairs
    "EURUSD": {
      volatilityMultiplier: 1.0,
      minMovement: 0.0010,
      tickSize: 0.00001,
      assetClass: "FOREX",
      optimalStrategies: [TradingStrategy.TREND_FOLLOWING, TradingStrategy.STATISTICAL_ARBITRAGE],
      correlationAssets: ["GBPUSD", "DXY"],
      tradingHours: "24/5",
      liquidityTier: "ULTRA_HIGH"
    },
    "GBPUSD": {
      volatilityMultiplier: 1.2,
      minMovement: 0.0015,
      tickSize: 0.00001,
      assetClass: "FOREX",
      optimalStrategies: [TradingStrategy.VOLATILITY_TRADING, TradingStrategy.MOMENTUM_BREAKOUT],
      correlationAssets: ["EURUSD", "EURGBP"],
      tradingHours: "24/5",
      liquidityTier: "HIGH"
    },
    "USDJPY": {
      volatilityMultiplier: 0.9,
      minMovement: 0.10,
      tickSize: 0.001,
      assetClass: "FOREX",
      optimalStrategies: [TradingStrategy.TREND_FOLLOWING, TradingStrategy.ORDER_FLOW],
      correlationAssets: ["EURJPY", "NIKKEI"],
      tradingHours: "24/5",
      liquidityTier: "HIGH"
    },
    
    // Commodities
    "XAUUSD": {
      volatilityMultiplier: 1.1,
      minMovement: 2.0,
      tickSize: 0.01,
      assetClass: "COMMODITIES",
      optimalStrategies: [TradingStrategy.MEAN_REVERSION, TradingStrategy.REGIME_SWITCHING],
      correlationAssets: ["XAGUSD", "DXY"],
      tradingHours: "24/5",
      liquidityTier: "HIGH"
    },
    "CRUDE": {
      volatilityMultiplier: 1.5,
      minMovement: 0.50,
      tickSize: 0.01,
      assetClass: "COMMODITIES",
      optimalStrategies: [TradingStrategy.VOLATILITY_TRADING, TradingStrategy.TREND_FOLLOWING],
      correlationAssets: ["NATGAS", "ENERGY_INDEX"],
      tradingHours: "24/5",
      liquidityTier: "HIGH"
    },
    
    // Indices
    "US500": {
      volatilityMultiplier: 0.8,
      minMovement: 2.5,
      tickSize: 0.1,
      assetClass: "INDICES",
      optimalStrategies: [TradingStrategy.TREND_FOLLOWING, TradingStrategy.MOMENTUM_BREAKOUT],
      correlationAssets: ["NAS100", "US30"],
      tradingHours: "24/5",
      liquidityTier: "ULTRA_HIGH"
    },
    "NAS100": {
      volatilityMultiplier: 1.3,
      minMovement: 5.0,
      tickSize: 0.1,
      assetClass: "INDICES",
      optimalStrategies: [TradingStrategy.VOLATILITY_TRADING, TradingStrategy.MOMENTUM_BREAKOUT],
      correlationAssets: ["US500", "TECH_INDEX"],
      tradingHours: "24/5",
      liquidityTier: "HIGH"
    }
  };
  
  return characteristics[symbol] || {
    volatilityMultiplier: 1.0,
    minMovement: 0.001,
    tickSize: 0.00001,
    assetClass: "UNKNOWN",
    optimalStrategies: [TradingStrategy.INTRADAY],
    correlationAssets: [],
    tradingHours: "24/5",
    liquidityTier: "MEDIUM"
  };
}

export function getStrategyRecommendation(
  strategy: TradingStrategy,
  marketData: any,
  aiAnalysis: any
): string {
  const config = TRADING_STRATEGIES[strategy];
  const volatility = calculateMarketVolatility(marketData);
  const trendStrength = calculateTrendStrength(marketData);
  
  let recommendation = `${config.name} Strategy Selected:\n\n`;
  
  switch (strategy) {
    case TradingStrategy.SCALPING:
      recommendation += "🔥 SETUP SCALPING:\n";
      recommendation += "• Entrata/uscita rapida (1-15 minuti)\n";
      recommendation += "• Stop loss stretto per protezione capitale\n";
      recommendation += "• Solo segnali ad alta confidenza\n";
      recommendation += "• Monitora spread e slippage\n";
      recommendation += "• Migliore durante sessioni ad alto volume\n";
      break;
      
    case TradingStrategy.INTRADAY:
      recommendation += "⚡ SETUP INTRADAY:\n";
      recommendation += "• Mantieni per 1-6 ore massimo\n";
      recommendation += "• Rapporto rischio/rendimento bilanciato\n";
      recommendation += "• Segui la direzione del trend\n";
      recommendation += "• Chiusura automatica prima della fine sessione NY\n";
      recommendation += "• Monitora notizie ed eventi\n";
      break;
  }
  
  recommendation += `\n📊 CONDIZIONI DI MERCATO:\n`;
  recommendation += `• Volatilità: ${(volatility * 100).toFixed(2)}%\n`;
  recommendation += `• Forza Trend: ${(trendStrength * 100).toFixed(0)}%\n`;
  recommendation += `• Confidenza: ${aiAnalysis.confidence}%\n`;
  
  // NEW: Institutional Analysis Section
  if (aiAnalysis.institutionalAnalysis) {
    const institutional = aiAnalysis.institutionalAnalysis;
    recommendation += `\n🏛️ ANALISI ISTITUZIONALE:\n`;
    
    // Market Maker Model
    recommendation += `• Fase Market Maker: ${institutional.marketMakerModel.phase}\n`;
    recommendation += `• Smart Money: ${institutional.marketMakerModel.smartMoneyDirection}\n`;
    recommendation += `• Flusso Istituzionale: ${institutional.marketMakerModel.institutionalFlow}\n`;
    
    // Order Blocks
    if (institutional.orderBlocks.length > 0) {
      const bullishOBs = institutional.orderBlocks.filter((ob: any) => ob.type === "BULLISH").length;
      const bearishOBs = institutional.orderBlocks.filter((ob: any) => ob.type === "BEARISH").length;
      recommendation += `• Order Blocks: ${bullishOBs} Bullish, ${bearishOBs} Bearish\n`;
    }
    
    // Fair Value Gaps
    if (institutional.fairValueGaps.length > 0) {
      const openFVGs = institutional.fairValueGaps.filter((fvg: any) => fvg.status === "OPEN").length;
      recommendation += `• Fair Value Gaps Aperti: ${openFVGs}\n`;
    }
    
    // Supply/Demand Zones
    if (institutional.supplyDemandZones.length > 0) {
      const freshZones = institutional.supplyDemandZones.filter((zone: any) => zone.status === "FRESH").length;
      recommendation += `• Zone S/D Fresche: ${freshZones}\n`;
    }
    
    // Active Sessions
    if (institutional.activeSessions.length > 0) {
      const sessionNames = institutional.activeSessions.map((s: any) => s.name).join(", ");
      recommendation += `• Sessioni Attive: ${sessionNames}\n`;
    }
    
    // Kill Zones
    const activeKillZone = institutional.killZones.find((kz: any) => kz.isActive);
    if (activeKillZone) {
      recommendation += `• Kill Zone Attiva: ${activeKillZone.name} (${activeKillZone.volatilityExpected})\n`;
    }
    
    // Enhanced Confidence
    if (aiAnalysis.enhancedConfidence && aiAnalysis.enhancedConfidence.institutionalScore) {
      recommendation += `• Score Istituzionale: ${aiAnalysis.enhancedConfidence.institutionalScore.toFixed(1)}%\n`;
      recommendation += `• Bias Istituzionale: ${aiAnalysis.enhancedConfidence.recommendations.institutionalBias}\n`;
    }
  }
  
  if (aiAnalysis.confidence < config.minConfidence) {
    recommendation += `\n⚠️ ATTENZIONE: Confidenza sotto l'ottimale (${config.minConfidence}%)\n`;
  }
  
  if (volatility > config.volatilityThreshold * 1.5) {
    recommendation += `\n⚠️ ATTENZIONE: Alta volatilità rilevata\n`;
  }
  
  if (trendStrength < config.trendStrengthRequired) {
    recommendation += `\n⚠️ ATTENZIONE: Forza del trend debole\n`;
  }
  
  // NEW: Institutional Warnings
  if (aiAnalysis.enhancedConfidence && aiAnalysis.enhancedConfidence.factors) {
    const factors = aiAnalysis.enhancedConfidence.factors;
    
    if (factors.institutionalAlignment < 40) {
      recommendation += `\n🚨 ATTENZIONE: Flusso istituzionale in conflitto\n`;
    }
    
    if (factors.orderBlockConfirmation < 30) {
      recommendation += `\n⚠️ ATTENZIONE: Nessun Order Block di supporto\n`;
    }
    
    if (factors.liquidityZoneConfirmation < 30) {
      recommendation += `\n⚠️ ATTENZIONE: Lontano da zone di liquidità significative\n`;
    }
  }
  
  return recommendation;
}

export function calculatePositionSize(
  strategy: TradingStrategy,
  accountBalance: number,
  riskPercentage: number,
  riskAmount: number
): number {
  const config = TRADING_STRATEGIES[strategy];
  
  const maxRiskAmount = accountBalance * (riskPercentage / 100);
  const positionSize = riskAmount > 0 ? Math.min(maxRiskAmount / riskAmount, config.maxLotSize) : config.maxLotSize;
  
  return Math.round(positionSize * 100) / 100;
}

// ===== NEW INNOVATIVE STRATEGY IMPLEMENTATIONS =====

/**
 * Statistical Arbitrage Strategy Logic
 */
export function analyzeStatisticalArbitrage(
  marketData: any,
  symbol: string,
  mlAnalysis?: any
): {
  signal: "LONG" | "SHORT" | "NEUTRAL";
  confidence: number;
  zscore: number;
  meanReversionLevel: number;
  hedgeRatio?: number;
} {
  const prices = [marketData["5m"].close, marketData["15m"].close, marketData["30m"].close];
  const currentPrice = marketData["5m"].close;
  
  // Calculate rolling statistics
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  
  // Calculate Z-score
  const zscore = stdDev > 0 ? (currentPrice - mean) / stdDev : 0;
  
  // Statistical thresholds
  const entryThreshold = 1.5;
  
  let signal: "LONG" | "SHORT" | "NEUTRAL" = "NEUTRAL";
  let confidence = 0;
  
  if (Math.abs(zscore) > entryThreshold) {
    signal = zscore > 0 ? "SHORT" : "LONG"; // Mean reversion
    confidence = Math.min(95, 60 + Math.abs(zscore) * 15);
  }
  
  // Enhanced with ML insights
  if (mlAnalysis?.statisticalFeatures) {
    const mlZscore = mlAnalysis.statisticalFeatures.zscore || zscore;
    if (Math.abs(mlZscore) > Math.abs(zscore)) {
      confidence += 10; // ML confirms statistical signal
    }
  }
  
  return {
    signal,
    confidence,
    zscore,
    meanReversionLevel: mean,
    hedgeRatio: mlAnalysis?.hedgeRatio || 1.0
  };
}

/**
 * Momentum Breakout Strategy Logic
 */
export function analyzeMomentumBreakout(
  marketData: any,
  symbol: string,
  mlAnalysis?: any
): {
  signal: "LONG" | "SHORT" | "NEUTRAL";
  confidence: number;
  breakoutLevel: number;
  momentum: number;
  volumeConfirmation: boolean;
} {
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];
  
  const currentPrice = data5m.close;
  const volume5m = data5m.volume;
  
  // Calculate momentum
  const priceChange5m = (data5m.close - data5m.open) / data5m.open;
  const priceChange15m = (data15m.close - data15m.open) / data15m.open;
  const momentum = (priceChange5m + priceChange15m * 0.5) * 100;
  
  // Volume confirmation
  const avgVolume = (data15m.volume + data30m.volume) / 2;
  const volumeConfirmation = volume5m > avgVolume * 1.5;
  
  // Breakout levels
  const resistance = Math.max(data15m.high, data30m.high);
  const support = Math.min(data15m.low, data30m.low);
  
  let signal: "LONG" | "SHORT" | "NEUTRAL" = "NEUTRAL";
  let confidence = 0;
  let breakoutLevel = 0;
  
  // Bullish breakout
  if (currentPrice > resistance && momentum > 0.5) {
    signal = "LONG";
    breakoutLevel = resistance;
    confidence = 70 + Math.min(20, momentum * 10);
    if (volumeConfirmation) confidence += 10;
  }
  // Bearish breakout
  else if (currentPrice < support && momentum < -0.5) {
    signal = "SHORT";
    breakoutLevel = support;
    confidence = 70 + Math.min(20, Math.abs(momentum) * 10);
    if (volumeConfirmation) confidence += 10;
  }
  
  // ML enhancement
  if (mlAnalysis?.momentumAnalysis && signal !== "NEUTRAL") {
    const mlMomentum = mlAnalysis.momentumAnalysis.strength || 0;
    if (mlMomentum > 0.7) {
      confidence += 8;
    }
  }
  
  return {
    signal,
    confidence: Math.min(95, confidence),
    breakoutLevel,
    momentum,
    volumeConfirmation
  };
}

/**
 * Order Flow Strategy Logic
 */
export function analyzeOrderFlow(
  marketData: any,
  symbol: string,
  mlAnalysis?: any
): {
  signal: "LONG" | "SHORT" | "NEUTRAL";
  confidence: number;
  orderImbalance: number;
  liquidityLevel: number;
  institutionalBias: "BULLISH" | "BEARISH" | "NEUTRAL";
} {
  let signal: "LONG" | "SHORT" | "NEUTRAL" = "NEUTRAL";
  let confidence = 0;
  let orderImbalance = 0;
  let liquidityLevel = 50;
  let institutionalBias: "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL";
  
  // Order flow analysis requires institutional data
  if (mlAnalysis?.institutionalAnalysis) {
    const institutional = mlAnalysis.institutionalAnalysis;
    
    // Analyze order blocks
    const bullishOBs = institutional.orderBlocks.filter((ob: any) => ob.type === "BULLISH");
    const bearishOBs = institutional.orderBlocks.filter((ob: any) => ob.type === "BEARISH");
    
    // Calculate order imbalance
    orderImbalance = (bullishOBs.length - bearishOBs.length) / (bullishOBs.length + bearishOBs.length + 1) * 100;
    
    // Institutional bias
    const smartMoneyDirection = institutional.marketMakerModel.smartMoneyDirection;
    if (smartMoneyDirection === "LONG") {
      institutionalBias = "BULLISH";
      if (orderImbalance > 20) {
        signal = "LONG";
        confidence = 80;
      }
    } else if (smartMoneyDirection === "SHORT") {
      institutionalBias = "BEARISH";
      if (orderImbalance < -20) {
        signal = "SHORT";
        confidence = 80;
      }
    }
    
    // Kill zone activity boost
    const activeKillZone = institutional.killZones.find((kz: any) => kz.isActive);
    if (activeKillZone && signal !== "NEUTRAL") {
      confidence += 15;
    }
  }
  
  return {
    signal,
    confidence: Math.min(95, confidence),
    orderImbalance,
    liquidityLevel,
    institutionalBias
  };
}
