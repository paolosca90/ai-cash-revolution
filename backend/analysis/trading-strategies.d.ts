export declare enum TradingStrategy {
    SCALPING = "SCALPING",
    INTRADAY = "INTRADAY",
    SWING = "SWING",
    POSITION = "POSITION",
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
export declare const TRADING_STRATEGIES: Record<TradingStrategy, StrategyConfig>;
export interface StrategyPriceTargets {
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    riskAmount: number;
    rewardAmount: number;
    riskRewardRatio: number;
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
export declare function calculateStrategyTargets(strategy: TradingStrategy, currentPrice: number, atr: number, direction: "LONG" | "SHORT", symbol: string, spread: number, marketData?: any, mlAnalysis?: any, adaptiveParams?: AdaptiveStrategyParams): StrategyPriceTargets;
/**
 * Enhanced strategy selection using ML and market analysis
 */
export declare function getOptimalStrategy(marketData: any, symbol: string, userPreference?: TradingStrategy, mlAnalysis?: any, historicalPerformance?: Map<TradingStrategy, StrategyPerformance>): TradingStrategy;
/**
 * Get market regime and adapt strategy parameters
 */
export declare function getMarketRegime(marketData: any, mlAnalysis?: any): MarketRegime;
/**
 * Calculate adaptive strategy parameters based on current market conditions
 */
export declare function calculateAdaptiveParams(strategy: TradingStrategy, marketData: any, mlAnalysis?: any, historicalPerformance?: StrategyPerformance): AdaptiveStrategyParams;
export declare function getStrategyRecommendation(strategy: TradingStrategy, marketData: any, aiAnalysis: any): string;
export declare function calculatePositionSize(strategy: TradingStrategy, accountBalance: number, riskPercentage: number, riskAmount: number): number;
/**
 * Statistical Arbitrage Strategy Logic
 */
export declare function analyzeStatisticalArbitrage(marketData: any, symbol: string, mlAnalysis?: any): {
    signal: "LONG" | "SHORT" | "NEUTRAL";
    confidence: number;
    zscore: number;
    meanReversionLevel: number;
    hedgeRatio?: number;
};
/**
 * Momentum Breakout Strategy Logic
 */
export declare function analyzeMomentumBreakout(marketData: any, symbol: string, mlAnalysis?: any): {
    signal: "LONG" | "SHORT" | "NEUTRAL";
    confidence: number;
    breakoutLevel: number;
    momentum: number;
    volumeConfirmation: boolean;
};
/**
 * Order Flow Strategy Logic
 */
export declare function analyzeOrderFlow(marketData: any, symbol: string, mlAnalysis?: any): {
    signal: "LONG" | "SHORT" | "NEUTRAL";
    confidence: number;
    orderImbalance: number;
    liquidityLevel: number;
    institutionalBias: "BULLISH" | "BEARISH" | "NEUTRAL";
};
