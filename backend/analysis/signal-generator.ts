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
  calculatePositionSize
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
  
  const optimalStrategy = getOptimalStrategy(completeMarketData, symbol, userStrategy);
  
  console.log(`Performing AI analysis for ${symbol} with strategy ${optimalStrategy}`);
  const aiAnalysis = await analyzeWithAI(completeMarketData, symbol, optimalStrategy);
  
  const strategyConfig = TRADING_STRATEGIES[optimalStrategy];
  
  console.log(`Selected strategy: ${optimalStrategy} for ${symbol}`);
  
  const sentimentAnalysis = await analyzeSentiment(symbol);
  
  const currentPrice = completeMarketData["5m"].close;
  const atr = completeMarketData["5m"].indicators.atr;
  const spread = completeMarketData["5m"].spread;
  
  const priceTargets = calculateStrategyTargets(
    optimalStrategy, currentPrice, atr, aiAnalysis.direction, symbol, spread
  );
  
  const recommendedLotSize = calculatePositionSize(
    optimalStrategy, accountBalance, riskPercentage, priceTargets.riskAmount
  );
  
  const strategyRecommendation = getStrategyRecommendation(optimalStrategy, completeMarketData, aiAnalysis);
  
  const chartUrl = await generateChart(symbol, completeMarketData, aiAnalysis);
  
  const riskLevel = determineRiskLevel(optimalStrategy, aiAnalysis, completeMarketData);
  
  const confidenceInt = Math.round(aiAnalysis.confidence);
  const maxHoldingTimeHours = Number(strategyConfig.maxHoldingTime);
  const expiresAt = calculateExpirationTime(optimalStrategy, maxHoldingTimeHours);

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
      strategy: { name: strategyConfig.name, description: strategyConfig.description, timeframes: strategyConfig.timeframes, marketConditions: strategyConfig.marketConditions, riskLevel },
      enhancedTechnical: aiAnalysis.enhancedTechnical,
      vwap: aiAnalysis.vwap,
      dataSource: completeMarketData["5m"].source,
    },
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
