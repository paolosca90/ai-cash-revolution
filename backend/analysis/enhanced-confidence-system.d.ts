interface MarketData {
    timestamp: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
interface TechnicalIndicators {
    sma20: number;
    sma50: number;
    rsi: number;
    macd: number;
    macdSignal: number;
    macdHistogram: number;
    bollingerUpper: number;
    bollingerLower: number;
    bollingerMiddle: number;
    atr: number;
    stochK: number;
    stochD: number;
    williamsR: number;
    cci: number;
    momentum: number;
    roc: number;
}
interface MarketConditions {
    volatility: number;
    trend: "BULLISH" | "BEARISH" | "SIDEWAYS";
    volume: "HIGH" | "MEDIUM" | "LOW";
    support: number;
    resistance: number;
}
interface ConfidenceFactors {
    technicalAlignment: number;
    marketConditions: number;
    volumeConfirmation: number;
    trendStrength: number;
    riskReward: number;
    historicalAccuracy: number;
}
interface EnhancedConfidenceRequest {
    symbol: string;
    timeframe: string;
    signalType: "BUY" | "SELL";
    baseConfidence: number;
}
interface EnhancedConfidenceResponse {
    enhancedConfidence: number;
    confidenceFactors: ConfidenceFactors;
    marketConditions: MarketConditions;
    recommendations: string[];
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
}
export declare function calculateEnhancedConfidence(symbol: string, marketData: MarketData[], indicators: TechnicalIndicators, signalType: "BUY" | "SELL", baseConfidence: number): Promise<{
    enhancedConfidence: number;
    confidenceFactors: ConfidenceFactors;
    marketConditions: MarketConditions;
    recommendations: string[];
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
}>;
export declare const getEnhancedConfidence: (params: EnhancedConfidenceRequest) => Promise<EnhancedConfidenceResponse>;
export {};
