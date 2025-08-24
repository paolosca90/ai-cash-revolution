import { APIError } from "encore.dev/api";
import { generateTradeId } from "./utils";
import { fetchMarketData } from "./market-data";
import { analyzeWithAI } from "./ai-engine";
import { generateChart } from "./chart-generator";
import { analyzeSentiment } from "./sentiment-analyzer";
import { 
  TradingStrategy,
  TRADING_STRATEGIES, 
  calculateStrategyTargets, 
  getOptimalStrategy,
  getStrategyRecommendation,
  calculatePositionSize,
  calculateAdaptiveParams,
  getMarketRegime,
  analyzeStatisticalArbitrage,
  analyzeMomentumBreakout,
  analyzeOrderFlow,
  StrategyPerformance
} from "./trading-strategies";
import type { Mt5Config } from "~backend/user/api";

export interface TradingSignal {
  tradeId: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  strategy: TradingStrategy;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  confidence: number;
  riskRewardRatio: number;
  recommendedLotSize: number;
  maxHoldingTime: number;
  expiresAt: Date;
  chartUrl?: string;
  strategyRecommendation: string;
  analysis: any;
  // Enhanced fields
  marketRegime?: any;
  adaptiveParams?: any;
  strategySpecificAnalysis?: any;
  riskMetrics?: {
    var95: number;
    expectedShortfall: number;
    drawdownRisk: number;
    leverageAdjusted: boolean;
  };
}

export async function generateSignalForSymbol(
  symbol: string, 
  mt5Config: Mt5Config,
  tradeParams: { accountBalance: number, riskPercentage: number },
  userStrategy?: TradingStrategy,
  requireRealData: boolean = false
): Promise<TradingSignal> {
  const tradeId = generateTradeId(symbol);

  console.log(`Starting prediction for ${symbol} with trade ID ${tradeId}`);
  
  const { accountBalance, riskPercentage } = tradeParams;

  const marketData = await fetchMarketData(symbol, ["1m", "5m", "15m", "30m", "1h"], mt5Config, requireRealData);
  
  const availableTimeframes = Object.keys(marketData);
  if (availableTimeframes.length === 0) {
    throw APIError.unavailable(`Unable to fetch market data for ${symbol}.`);
  }
  
  const requiredTimeframes = ["5m", "15m", "30m"];
  const completeMarketData: any = {};
  const fallbackTimeframe = availableTimeframes.includes("5m") ? "5m" : availableTimeframes[0];
  const fallbackData = (marketData as any)[fallbackTimeframe];

  for (const tf of requiredTimeframes) {
    completeMarketData[tf] = (marketData as any)[tf] || fallbackData;
  }
  if ((marketData as any)["1m"]) completeMarketData["1m"] = (marketData as any)["1m"];
  if ((marketData as any)["1h"]) completeMarketData["1h"] = (marketData as any)["1h"];
  
  // Get historical performance data (would come from database in real implementation)
  const historicalPerformance = new Map<TradingStrategy, StrategyPerformance>();
  
  const optimalStrategy = getOptimalStrategy(
    completeMarketData, 
    symbol, 
    userStrategy, 
    aiAnalysis, 
    historicalPerformance
  );
  
  console.log(`Performing AI analysis for ${symbol} with strategy ${optimalStrategy}`);
  const aiAnalysis = await analyzeWithAI(completeMarketData, symbol, optimalStrategy);
  
  const strategyConfig = TRADING_STRATEGIES[optimalStrategy];
  
  console.log(`Selected strategy: ${optimalStrategy} for ${symbol}`);
  
  const sentimentAnalysis = await analyzeSentiment(symbol);
  
  const currentPrice = completeMarketData["5m"].close;
  const atr = completeMarketData["5m"].indicators.atr;
  const spread = completeMarketData["5m"].spread;
  
  // Calculate adaptive parameters
  const adaptiveParams = calculateAdaptiveParams(
    optimalStrategy,
    completeMarketData,
    aiAnalysis
  );
  
  // Get market regime
  const marketRegime = getMarketRegime(completeMarketData, aiAnalysis);
  
  // Strategy-specific analysis
  let strategySpecificAnalysis: any = {};
  
  switch (optimalStrategy) {
    case TradingStrategy.STATISTICAL_ARBITRAGE:
      strategySpecificAnalysis = analyzeStatisticalArbitrage(
        completeMarketData, symbol, aiAnalysis
      );
      break;
    
    case TradingStrategy.MOMENTUM_BREAKOUT:
      strategySpecificAnalysis = analyzeMomentumBreakout(
        completeMarketData, symbol, aiAnalysis
      );
      break;
    
    case TradingStrategy.ORDER_FLOW:
      strategySpecificAnalysis = analyzeOrderFlow(
        completeMarketData, symbol, aiAnalysis
      );
      break;
    
    default:
      // Use standard analysis for other strategies
      strategySpecificAnalysis = {
        signal: aiAnalysis.direction,
        confidence: aiAnalysis.confidence,
        analysis: "Standard technical analysis"
      };
  }
  
  // Override direction if strategy-specific analysis provides better signal
  if (strategySpecificAnalysis.signal && 
      strategySpecificAnalysis.confidence > aiAnalysis.confidence) {
    aiAnalysis.direction = strategySpecificAnalysis.signal;
    aiAnalysis.confidence = strategySpecificAnalysis.confidence;
  }
  
  const priceTargets = calculateStrategyTargets(
    optimalStrategy, 
    currentPrice, 
    atr, 
    aiAnalysis.direction, 
    symbol, 
    spread,
    completeMarketData,
    aiAnalysis,
    adaptiveParams
  );
  
  // Enhanced position sizing with adaptive parameters
  let basePositionSize = calculatePositionSize(
    optimalStrategy, accountBalance, riskPercentage, priceTargets.riskAmount
  );
  
  // Apply adaptive adjustments
  const strategyConfig = TRADING_STRATEGIES[optimalStrategy];
  let adjustedLotSize = basePositionSize;
  
  // Market regime adjustments
  if (marketRegime.type === "CRISIS") {
    adjustedLotSize *= 0.5; // Reduce size in crisis
  } else if (marketRegime.type === "TRENDING" && marketRegime.confidence > 0.8) {
    adjustedLotSize *= Math.min(1.3, strategyConfig.leverageMultiplier); // Increase in strong trends
  }
  
  // ML confidence adjustments
  if (aiAnalysis.enhancedConfidence?.mlScore) {
    const mlScore = aiAnalysis.enhancedConfidence.mlScore;
    if (mlScore > 80) {
      adjustedLotSize *= 1.2;
    } else if (mlScore < 60) {
      adjustedLotSize *= 0.8;
    }
  }
  
  // Strategy-specific sizing
  if (optimalStrategy === TradingStrategy.PAIRS_TRADING || 
      optimalStrategy === TradingStrategy.STATISTICAL_ARBITRAGE) {
    // Market-neutral strategies can use higher leverage
    adjustedLotSize *= strategyConfig.leverageMultiplier;
  }
  
  const recommendedLotSize = Math.max(0.01, Math.min(
    adjustedLotSize, 
    strategyConfig.maxLotSize
  ));
  
  const strategyRecommendation = getStrategyRecommendation(optimalStrategy, completeMarketData, aiAnalysis);
  
  const chartUrl = await generateChart(symbol, completeMarketData, aiAnalysis);
  
  const riskLevel = determineRiskLevel(optimalStrategy, aiAnalysis, completeMarketData);
  
  const confidenceInt = Math.round(aiAnalysis.confidence);
  const maxHoldingTimeHours = Number(strategyConfig.maxHoldingTime);
  const expiresAt = calculateExpirationTime(optimalStrategy, maxHoldingTimeHours);

  // Calculate advanced risk metrics
  const riskMetrics = calculateAdvancedRiskMetrics(
    optimalStrategy,
    priceTargets,
    recommendedLotSize,
    accountBalance,
    marketRegime,
    aiAnalysis
  );
  
  const signal: TradingSignal = {
    tradeId,
    symbol,
    direction: aiAnalysis.direction,
    strategy: optimalStrategy,
    entryPrice: priceTargets.entryPrice,
    takeProfit: priceTargets.takeProfit,
    stopLoss: priceTargets.stopLoss,
    confidence: confidenceInt,
    riskRewardRatio: priceTargets.riskRewardRatio,
    recommendedLotSize,
    maxHoldingTime: maxHoldingTimeHours,
    expiresAt,
    chartUrl,
    strategyRecommendation,
    analysis: {
      technical: { ...aiAnalysis.technical, ...aiAnalysis.priceAction, support: aiAnalysis.support, resistance: aiAnalysis.resistance },
      smartMoney: aiAnalysis.smartMoney,
      professional: aiAnalysis.professionalAnalysis,
      sentiment: { ...sentimentAnalysis, summary: sentimentAnalysis.summary },
      volatility: aiAnalysis.volatility,
      strategy: { 
        name: strategyConfig.name, 
        description: strategyConfig.description, 
        timeframes: strategyConfig.timeframes, 
        marketConditions: strategyConfig.marketConditions, 
        riskLevel,
        adaptiveParameters: strategyConfig.adaptiveParameters,
        mlDriven: strategyConfig.mlDriven,
        institutionalAlignment: strategyConfig.institutionalAlignment
      },
      enhancedTechnical: aiAnalysis.enhancedTechnical,
      vwap: aiAnalysis.vwap,
      dataSource: completeMarketData["5m"].source,
      // New enhanced analysis
      institutionalAnalysis: aiAnalysis.institutionalAnalysis,
      enhancedConfidence: aiAnalysis.enhancedConfidence
    },
    // Enhanced fields
    marketRegime,
    adaptiveParams,
    strategySpecificAnalysis,
    riskMetrics
  };

  return signal;
}

function calculateExpirationTime(strategy: TradingStrategy, maxHoldingHours: number): Date {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + maxHoldingHours * 60 * 60 * 1000);
  
  if (strategy === TradingStrategy.INTRADAY) {
    const nyCloseTime = new Date(now);
    nyCloseTime.setUTCHours(21, 30, 0, 0);
    if (nyCloseTime <= now) {
      nyCloseTime.setDate(nyCloseTime.getDate() + 1);
    }
    return expiresAt < nyCloseTime ? expiresAt : nyCloseTime;
  }
  
  return expiresAt;
}

function determineRiskLevel(strategy: TradingStrategy, aiAnalysis: any, marketData: any): "LOW" | "MEDIUM" | "HIGH" {
  const strategyConfig = TRADING_STRATEGIES[strategy];
  const volatility = calculateMarketVolatility(marketData);
  
  let riskScore = 0;
  switch (strategy) {
    case TradingStrategy.SCALPING: riskScore = 2; break;
    case TradingStrategy.INTRADAY: riskScore = 1; break;
  }
  
  if (aiAnalysis.confidence < 75) riskScore += 1;
  if (aiAnalysis.confidence > 90) riskScore -= 1;
  if (volatility > strategyConfig.volatilityThreshold * 1.5) riskScore += 1;
  if (volatility < strategyConfig.volatilityThreshold * 0.5) riskScore -= 1;
  if (aiAnalysis.priceAction.structure === "NEUTRAL") riskScore += 1;
  if (aiAnalysis.smartMoney.institutionalFlow === "NEUTRAL") riskScore += 1;
  
  if (riskScore <= 1) return "LOW";
  if (riskScore <= 3) return "MEDIUM";
  return "HIGH";
}

/**
 * Calculate advanced risk metrics for the trading signal
 */
function calculateAdvancedRiskMetrics(
  strategy: TradingStrategy,
  priceTargets: any,
  lotSize: number,
  accountBalance: number,
  marketRegime: any,
  aiAnalysis: any
): {
  var95: number;
  expectedShortfall: number;
  drawdownRisk: number;
  leverageAdjusted: boolean;
} {
  const config = TRADING_STRATEGIES[strategy];
  
  // Calculate Value at Risk (95% confidence level)
  const riskAmount = priceTargets.riskAmount * lotSize;
  const accountRiskPercentage = (riskAmount / accountBalance) * 100;
  
  // VaR calculation (simplified)
  let var95 = accountRiskPercentage;
  
  // Adjust VaR based on market regime
  switch (marketRegime.type) {
    case "CRISIS":
      var95 *= 2.5; // Much higher risk in crisis
      break;
    case "VOLATILE":
      var95 *= 1.8;
      break;
    case "LOW_VOL":
      var95 *= 0.7;
      break;
    default:
      var95 *= 1.0;
  }
  
  // Expected Shortfall (conditional VaR)
  const expectedShortfall = var95 * 1.3; // ES is typically 1.3x VaR for normal distribution
  
  // Drawdown risk based on strategy characteristics
  let drawdownRisk = config.drawdownLimit * 100; // Convert to percentage
  
  // Adjust for strategy-specific risks
  if (config.riskModel === "VaR") {
    drawdownRisk *= 0.8; // VaR-based strategies have better risk control
  } else if (config.riskModel === "VOLATILITY_BASED") {
    drawdownRisk *= 1.2; // Vol-based can have larger swings
  }
  
  // Check if leverage is being used
  const leverageAdjusted = lotSize > config.maxLotSize * 0.8;
  
  return {
    var95: Math.round(var95 * 100) / 100,
    expectedShortfall: Math.round(expectedShortfall * 100) / 100,
    drawdownRisk: Math.round(drawdownRisk * 100) / 100,
    leverageAdjusted
  };
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
