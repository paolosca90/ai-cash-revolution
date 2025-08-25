import { api } from "encore.dev/api";
// Calculates enhanced confidence score for trading signals
export async function calculateEnhancedConfidence(symbol, marketData, indicators, signalType, baseConfidence) {
    // Analyze market conditions
    const marketConditions = analyzeMarketConditions(marketData, indicators);
    // Calculate confidence factors
    const confidenceFactors = calculateConfidenceFactors(indicators, marketConditions, signalType, marketData);
    // Apply dynamic thresholds based on market conditions
    const adjustedFactors = applyDynamicThresholds(confidenceFactors, marketConditions);
    // Calculate weighted confidence score
    const enhancedConfidence = calculateWeightedConfidence(baseConfidence, adjustedFactors);
    // Generate recommendations
    const recommendations = generateRecommendations(confidenceFactors, marketConditions, signalType);
    // Determine risk level
    const riskLevel = determineRiskLevel(enhancedConfidence, marketConditions);
    return {
        enhancedConfidence,
        confidenceFactors: adjustedFactors,
        marketConditions,
        recommendations,
        riskLevel
    };
}
function analyzeMarketConditions(marketData, indicators) {
    const prices = marketData.map(d => d.close);
    const volumes = marketData.map(d => d.volume);
    // Calculate volatility
    const volatility = calculateVolatility(prices);
    // Determine trend
    const trend = determineTrend(indicators);
    // Analyze volume
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const currentVolume = volumes[volumes.length - 1];
    const volumeRatio = currentVolume / avgVolume;
    let volume;
    if (volumeRatio > 1.5)
        volume = "HIGH";
    else if (volumeRatio > 0.8)
        volume = "MEDIUM";
    else
        volume = "LOW";
    // Calculate support and resistance
    const { support, resistance } = calculateSupportResistance(marketData);
    return {
        volatility,
        trend,
        volume,
        support,
        resistance
    };
}
function calculateVolatility(prices) {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
}
function determineTrend(indicators) {
    let bullishSignals = 0;
    let bearishSignals = 0;
    // SMA trend
    if (indicators.sma20 > indicators.sma50)
        bullishSignals++;
    else
        bearishSignals++;
    // MACD trend
    if (indicators.macd > indicators.macdSignal)
        bullishSignals++;
    else
        bearishSignals++;
    // RSI trend
    if (indicators.rsi > 50)
        bullishSignals++;
    else
        bearishSignals++;
    if (bullishSignals > bearishSignals)
        return "BULLISH";
    if (bearishSignals > bullishSignals)
        return "BEARISH";
    return "SIDEWAYS";
}
function calculateSupportResistance(marketData) {
    const highs = marketData.map(d => d.high);
    const lows = marketData.map(d => d.low);
    // Simple support/resistance calculation
    const support = Math.min(...lows.slice(-20));
    const resistance = Math.max(...highs.slice(-20));
    return { support, resistance };
}
function calculateConfidenceFactors(indicators, marketConditions, signalType, marketData) {
    // Technical alignment score
    const technicalAlignment = calculateTechnicalAlignment(indicators, signalType);
    // Market conditions score
    const marketConditionsScore = calculateMarketConditionsScore(marketConditions, signalType);
    // Volume confirmation score
    const volumeConfirmation = calculateVolumeConfirmation(marketConditions, signalType);
    // Trend strength score
    const trendStrength = calculateTrendStrength(indicators, marketConditions);
    // Risk/reward ratio
    const riskReward = calculateRiskReward(marketData, marketConditions, signalType);
    // Historical accuracy (simplified)
    const historicalAccuracy = 0.7; // Would be calculated from historical data
    return {
        technicalAlignment,
        marketConditions: marketConditionsScore,
        volumeConfirmation,
        trendStrength,
        riskReward,
        historicalAccuracy
    };
}
function calculateTechnicalAlignment(indicators, signalType) {
    let alignmentScore = 0;
    let totalIndicators = 0;
    if (signalType === "BUY") {
        // RSI oversold
        if (indicators.rsi < 30)
            alignmentScore += 1;
        else if (indicators.rsi < 50)
            alignmentScore += 0.5;
        totalIndicators++;
        // MACD bullish
        if (indicators.macd > indicators.macdSignal)
            alignmentScore += 1;
        totalIndicators++;
        // Price above SMA
        if (indicators.sma20 > indicators.sma50)
            alignmentScore += 1;
        totalIndicators++;
        // Stochastic oversold
        if (indicators.stochK < 20)
            alignmentScore += 1;
        else if (indicators.stochK < 50)
            alignmentScore += 0.5;
        totalIndicators++;
    }
    else { // SELL
        // RSI overbought
        if (indicators.rsi > 70)
            alignmentScore += 1;
        else if (indicators.rsi > 50)
            alignmentScore += 0.5;
        totalIndicators++;
        // MACD bearish
        if (indicators.macd < indicators.macdSignal)
            alignmentScore += 1;
        totalIndicators++;
        // Price below SMA
        if (indicators.sma20 < indicators.sma50)
            alignmentScore += 1;
        totalIndicators++;
        // Stochastic overbought
        if (indicators.stochK > 80)
            alignmentScore += 1;
        else if (indicators.stochK > 50)
            alignmentScore += 0.5;
        totalIndicators++;
    }
    return alignmentScore / totalIndicators;
}
function calculateMarketConditionsScore(marketConditions, signalType) {
    let score = 0;
    // Trend alignment
    if (signalType === "BUY" && marketConditions.trend === "BULLISH")
        score += 0.4;
    else if (signalType === "SELL" && marketConditions.trend === "BEARISH")
        score += 0.4;
    else if (marketConditions.trend === "SIDEWAYS")
        score += 0.2;
    // Volatility consideration
    if (marketConditions.volatility < 0.02)
        score += 0.3; // Low volatility is good
    else if (marketConditions.volatility < 0.05)
        score += 0.2;
    else
        score += 0.1; // High volatility reduces confidence
    // Volume confirmation
    if (marketConditions.volume === "HIGH")
        score += 0.3;
    else if (marketConditions.volume === "MEDIUM")
        score += 0.2;
    else
        score += 0.1;
    return Math.min(score, 1);
}
function calculateVolumeConfirmation(marketConditions, signalType) {
    // High volume confirms the signal
    switch (marketConditions.volume) {
        case "HIGH": return 0.9;
        case "MEDIUM": return 0.6;
        case "LOW": return 0.3;
        default: return 0.5;
    }
}
function calculateTrendStrength(indicators, marketConditions) {
    let strength = 0;
    // SMA relationship
    const smaRatio = indicators.sma20 / indicators.sma50;
    if (smaRatio > 1.02 || smaRatio < 0.98)
        strength += 0.3;
    else
        strength += 0.1;
    // MACD histogram strength
    const macdStrength = Math.abs(indicators.macdHistogram);
    if (macdStrength > 0.5)
        strength += 0.3;
    else if (macdStrength > 0.2)
        strength += 0.2;
    else
        strength += 0.1;
    // Volatility consideration
    if (marketConditions.volatility > 0.03)
        strength += 0.4; // High volatility can indicate strong trends
    else
        strength += 0.2;
    return Math.min(strength, 1);
}
function calculateRiskReward(marketData, marketConditions, signalType) {
    const currentPrice = marketData[marketData.length - 1].close;
    let targetPrice;
    let stopLoss;
    if (signalType === "BUY") {
        targetPrice = marketConditions.resistance;
        stopLoss = marketConditions.support;
    }
    else {
        targetPrice = marketConditions.support;
        stopLoss = marketConditions.resistance;
    }
    const potentialGain = Math.abs(targetPrice - currentPrice);
    const potentialLoss = Math.abs(stopLoss - currentPrice);
    if (potentialLoss === 0)
        return 0.5;
    const riskRewardRatio = potentialGain / potentialLoss;
    // Convert ratio to score (higher ratio = higher score)
    if (riskRewardRatio >= 3)
        return 1;
    if (riskRewardRatio >= 2)
        return 0.8;
    if (riskRewardRatio >= 1.5)
        return 0.6;
    if (riskRewardRatio >= 1)
        return 0.4;
    return 0.2;
}
function applyDynamicThresholds(factors, marketConditions) {
    const adjustmentFactor = calculateAdjustmentFactor(marketConditions);
    return {
        technicalAlignment: factors.technicalAlignment * adjustmentFactor.technical,
        marketConditions: factors.marketConditions * adjustmentFactor.market,
        volumeConfirmation: factors.volumeConfirmation * adjustmentFactor.volume,
        trendStrength: factors.trendStrength * adjustmentFactor.trend,
        riskReward: factors.riskReward * adjustmentFactor.risk,
        historicalAccuracy: factors.historicalAccuracy * adjustmentFactor.historical
    };
}
function calculateAdjustmentFactor(marketConditions) {
    let technical = 1;
    let market = 1;
    let volume = 1;
    let trend = 1;
    let risk = 1;
    let historical = 1;
    // Adjust based on volatility
    if (marketConditions.volatility > 0.05) {
        technical *= 0.9; // Reduce technical confidence in high volatility
        risk *= 0.8; // Increase risk penalty
    }
    else if (marketConditions.volatility < 0.02) {
        technical *= 1.1; // Increase technical confidence in low volatility
        risk *= 1.2; // Reduce risk penalty
    }
    // Adjust based on trend
    if (marketConditions.trend === "SIDEWAYS") {
        trend *= 0.8; // Reduce trend confidence in sideways market
        market *= 0.9;
    }
    // Adjust based on volume
    if (marketConditions.volume === "LOW") {
        volume *= 0.7; // Reduce volume confidence
        market *= 0.9;
    }
    return { technical, market, volume, trend, risk, historical };
}
function calculateWeightedConfidence(baseConfidence, factors) {
    const weights = {
        technicalAlignment: 0.25,
        marketConditions: 0.20,
        volumeConfirmation: 0.15,
        trendStrength: 0.15,
        riskReward: 0.15,
        historicalAccuracy: 0.10
    };
    const weightedScore = factors.technicalAlignment * weights.technicalAlignment +
        factors.marketConditions * weights.marketConditions +
        factors.volumeConfirmation * weights.volumeConfirmation +
        factors.trendStrength * weights.trendStrength +
        factors.riskReward * weights.riskReward +
        factors.historicalAccuracy * weights.historicalAccuracy;
    // Combine base confidence with enhanced factors
    const enhancedConfidence = (baseConfidence * 0.4) + (weightedScore * 0.6);
    return Math.max(0, Math.min(1, enhancedConfidence));
}
function generateRecommendations(factors, marketConditions, signalType) {
    const recommendations = [];
    if (factors.technicalAlignment < 0.6) {
        recommendations.push("Technical indicators show mixed signals - consider waiting for better alignment");
    }
    if (factors.volumeConfirmation < 0.5) {
        recommendations.push("Low volume confirmation - signal may lack conviction");
    }
    if (marketConditions.volatility > 0.05) {
        recommendations.push("High market volatility detected - consider reducing position size");
    }
    if (factors.riskReward < 0.5) {
        recommendations.push("Poor risk/reward ratio - consider adjusting stop loss and take profit levels");
    }
    if (marketConditions.trend === "SIDEWAYS") {
        recommendations.push("Market is in sideways trend - consider range trading strategies");
    }
    if (factors.trendStrength > 0.8) {
        recommendations.push("Strong trend detected - consider trend-following strategies");
    }
    return recommendations;
}
function determineRiskLevel(enhancedConfidence, marketConditions) {
    let riskScore = 0;
    // Confidence level
    if (enhancedConfidence < 0.5)
        riskScore += 2;
    else if (enhancedConfidence < 0.7)
        riskScore += 1;
    // Volatility
    if (marketConditions.volatility > 0.05)
        riskScore += 2;
    else if (marketConditions.volatility > 0.03)
        riskScore += 1;
    // Volume
    if (marketConditions.volume === "LOW")
        riskScore += 1;
    // Trend
    if (marketConditions.trend === "SIDEWAYS")
        riskScore += 1;
    if (riskScore >= 4)
        return "HIGH";
    if (riskScore >= 2)
        return "MEDIUM";
    return "LOW";
}
// API endpoint for enhanced confidence calculation
export const getEnhancedConfidence = api({ expose: true, method: "POST", path: "/analysis/enhanced-confidence" }, async (req) => {
    const { symbol, timeframe, signalType, baseConfidence } = req;
    // Get market data (simplified - would fetch from data provider)
    const marketData = await getMarketData(symbol, timeframe);
    // Calculate technical indicators
    const indicators = await calculateTechnicalIndicators(marketData);
    // Calculate enhanced confidence
    const result = await calculateEnhancedConfidence(symbol, marketData, indicators, signalType, baseConfidence);
    return result;
});
async function getMarketData(symbol, timeframe) {
    // Mock data - in real implementation, fetch from market data provider
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
async function calculateTechnicalIndicators(marketData) {
    const closes = marketData.map(d => d.close);
    const highs = marketData.map(d => d.high);
    const lows = marketData.map(d => d.low);
    // Calculate various technical indicators
    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);
    const rsi = calculateRSI(closes, 14);
    const macd = calculateMACD(closes);
    const bb = calculateBollingerBands(closes, 20, 2);
    const atr = calculateATR(highs, lows, closes, 14);
    const stoch = calculateStochastic(highs, lows, closes, 14);
    return {
        sma20: sma20[sma20.length - 1] || 0,
        sma50: sma50[sma50.length - 1] || 0,
        rsi: rsi[rsi.length - 1] || 50,
        macd: macd.macdLine[macd.macdLine.length - 1] || 0,
        macdSignal: macd.signalLine[macd.signalLine.length - 1] || 0,
        macdHistogram: macd.histogram[macd.histogram.length - 1] || 0,
        bollingerUpper: bb.upper[bb.upper.length - 1] || 0,
        bollingerLower: bb.lower[bb.lower.length - 1] || 0,
        bollingerMiddle: bb.middle[bb.middle.length - 1] || 0,
        atr: atr[atr.length - 1] || 0,
        stochK: stoch.k[stoch.k.length - 1] || 50,
        stochD: stoch.d[stoch.d.length - 1] || 50,
        williamsR: calculateWilliamsR(highs, lows, closes, 14),
        cci: calculateCCI(highs, lows, closes, 20),
        momentum: calculateMomentum(closes, 10),
        roc: calculateROC(closes, 10)
    };
}
function calculateSMA(prices, period) {
    const sma = [];
    for (let i = period - 1; i < prices.length; i++) {
        const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
    }
    return sma;
}
function calculateRSI(prices, period) {
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
        }
        else {
            const rs = avgGain / avgLoss;
            rsi.push(100 - (100 / (1 + rs)));
        }
    }
    return rsi;
}
function calculateMACD(prices) {
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
function calculateEMA(prices, period) {
    const ema = [];
    const multiplier = 2 / (period + 1);
    ema[0] = prices[0];
    for (let i = 1; i < prices.length; i++) {
        ema[i] = (prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
    }
    return ema;
}
function calculateBollingerBands(prices, period, stdDev) {
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
function calculateATR(highs, lows, closes, period) {
    const trueRanges = [];
    for (let i = 1; i < highs.length; i++) {
        const tr1 = highs[i] - lows[i];
        const tr2 = Math.abs(highs[i] - closes[i - 1]);
        const tr3 = Math.abs(lows[i] - closes[i - 1]);
        trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    return calculateSMA(trueRanges, period);
}
function calculateStochastic(highs, lows, closes, period) {
    const k = [];
    for (let i = period - 1; i < closes.length; i++) {
        const highestHigh = Math.max(...highs.slice(i - period + 1, i + 1));
        const lowestLow = Math.min(...lows.slice(i - period + 1, i + 1));
        const currentClose = closes[i];
        if (highestHigh === lowestLow) {
            k.push(50);
        }
        else {
            k.push(((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100);
        }
    }
    const d = calculateSMA(k, 3);
    return { k, d };
}
function calculateWilliamsR(highs, lows, closes, period) {
    if (closes.length < period)
        return -50;
    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);
    const currentClose = closes[closes.length - 1];
    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);
    if (highestHigh === lowestLow)
        return -50;
    return ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
}
function calculateCCI(highs, lows, closes, period) {
    if (closes.length < period)
        return 0;
    const typicalPrices = [];
    for (let i = 0; i < closes.length; i++) {
        typicalPrices.push((highs[i] + lows[i] + closes[i]) / 3);
    }
    const recentTypicalPrices = typicalPrices.slice(-period);
    const sma = recentTypicalPrices.reduce((a, b) => a + b, 0) / period;
    const meanDeviation = recentTypicalPrices.reduce((sum, price) => {
        return sum + Math.abs(price - sma);
    }, 0) / period;
    const currentTypicalPrice = typicalPrices[typicalPrices.length - 1];
    if (meanDeviation === 0)
        return 0;
    return (currentTypicalPrice - sma) / (0.015 * meanDeviation);
}
function calculateMomentum(prices, period) {
    if (prices.length < period + 1)
        return 0;
    const currentPrice = prices[prices.length - 1];
    const pastPrice = prices[prices.length - 1 - period];
    return currentPrice - pastPrice;
}
function calculateROC(prices, period) {
    if (prices.length < period + 1)
        return 0;
    const currentPrice = prices[prices.length - 1];
    const pastPrice = prices[prices.length - 1 - period];
    if (pastPrice === 0)
        return 0;
    return ((currentPrice - pastPrice) / pastPrice) * 100;
}
//# sourceMappingURL=enhanced-confidence-system.js.map