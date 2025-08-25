/**
 * Advanced Feature Engineering Module for Trading Signal Enhancement
 *
 * This module implements sophisticated feature extraction and engineering
 * techniques specifically designed for financial time series analysis
 */
import * as ss from 'simple-statistics';
import * as ti from 'technicalindicators';
export class AdvancedFeatureEngine {
    /**
     * Extract comprehensive features from price data
     */
    async extractAdvancedFeatures(priceData, symbol, contextData) {
        console.log(`🔧 Extracting advanced features for ${symbol}...`);
        const features = {
            priceFeatures: await this.extractPriceFeatures(priceData),
            technicalFeatures: await this.extractTechnicalFeatures(priceData),
            volumeFeatures: await this.extractVolumeFeatures(priceData),
            microstructureFeatures: await this.extractMicrostructureFeatures(priceData, contextData),
            timeSeriesFeatures: await this.extractTimeSeriesFeatures(priceData),
            crossAssetFeatures: await this.extractCrossAssetFeatures(priceData, symbol, contextData)
        };
        console.log(`✅ Advanced feature extraction completed for ${symbol}`);
        return features;
    }
    /**
     * Extract sophisticated price-based features
     */
    async extractPriceFeatures(priceData) {
        const { close, high, low } = priceData;
        // Calculate log returns
        const logReturns = close.slice(1).map((price, idx) => Math.log(price / close[idx]));
        // Calculate realized volatility (GARCH-like)
        const volatility = this.calculateRealizedVolatility(logReturns);
        // Statistical moments
        const skewness = this.calculateSkewness(logReturns);
        const kurtosis = this.calculateKurtosis(logReturns);
        // Long-range dependence measures
        const hurstExponent = this.calculateHurstExponent(close);
        const fractalDimension = 2 - hurstExponent;
        return {
            logReturns,
            volatility,
            skewness,
            kurtosis,
            hurst_exponent: hurstExponent,
            fractal_dimension: fractalDimension
        };
    }
    /**
     * Extract advanced technical indicator features
     */
    async extractTechnicalFeatures(priceData) {
        const { open, high, low, close, volume } = priceData;
        try {
            // RSI with divergence analysis
            const rsiValues = ti.RSI.calculate({ values: close, period: 14 });
            const rsiDivergence = this.calculateDivergence(close, rsiValues);
            // MACD signal strength
            const macdResult = ti.MACD.calculate({
                values: close,
                fastPeriod: 12,
                slowPeriod: 26,
                signalPeriod: 9
            });
            const macdSignalStrength = this.calculateMACDStrength(macdResult);
            // Bollinger Band squeeze
            const bbResult = ti.BollingerBands.calculate({
                period: 20,
                stdDev: 2,
                values: close
            });
            const bollingerSqueeze = this.calculateBollingerSqueeze(bbResult);
            // ADX for trend strength
            const adxResult = ti.ADX.calculate({
                high, low, close,
                period: 14
            });
            const adxTrendStrength = adxResult.length > 0 ? adxResult[adxResult.length - 1].adx : 0;
            // Stochastic momentum
            const stochResult = ti.Stochastic.calculate({
                high, low, close,
                period: 14,
                signalPeriod: 3
            });
            const stochasticMomentum = this.calculateStochasticMomentum(stochResult);
            // Williams %R
            const williamsR = ti.WilliamsR.calculate({
                high, low, close,
                period: 14
            });
            const currentWilliamsR = williamsR.length > 0 ? williamsR[williamsR.length - 1] : 0;
            // Commodity Channel Index
            const cci = ti.CCI.calculate({
                high, low, close,
                period: 20
            });
            const currentCCI = cci.length > 0 ? cci[cci.length - 1] : 0;
            return {
                rsi_divergence: rsiDivergence,
                macd_signal_strength: macdSignalStrength,
                bollinger_squeeze: bollingerSqueeze,
                adx_trend_strength: adxTrendStrength || 0,
                stochastic_momentum: stochasticMomentum,
                williams_r: currentWilliamsR,
                commodity_channel_index: currentCCI
            };
        }
        catch (error) {
            console.error('Error calculating technical features:', error);
            return {
                rsi_divergence: 0,
                macd_signal_strength: 0,
                bollinger_squeeze: 0,
                adx_trend_strength: 0,
                stochastic_momentum: 0,
                williams_r: 0,
                commodity_channel_index: 0
            };
        }
    }
    /**
     * Extract volume-based features
     */
    async extractVolumeFeatures(priceData) {
        const { open, high, low, close, volume } = priceData;
        try {
            // Volume Price Trend
            const vpt = this.calculateVPT(close, volume);
            // On Balance Volume
            const obv = ti.OBV.calculate({ close, volume });
            const currentOBV = obv.length > 0 ? obv[obv.length - 1] : 0;
            // Accumulation/Distribution Line
            const adLine = ti.AD.calculate({ high, low, close, volume });
            const currentAD = adLine.length > 0 ? adLine[adLine.length - 1] : 0;
            // Money Flow Index
            const mfi = ti.MFI.calculate({
                high, low, close, volume,
                period: 14
            });
            const currentMFI = mfi.length > 0 ? mfi[mfi.length - 1] : 0;
            // Volume Oscillator
            const volumeOscillator = this.calculateVolumeOscillator(volume);
            // Price-Volume Correlation
            const priceVolumeCorrelation = this.calculatePriceVolumeCorrelation(close, volume);
            return {
                volume_price_trend: vpt,
                on_balance_volume: currentOBV,
                accumulation_distribution: currentAD,
                money_flow_index: currentMFI,
                volume_oscillator: volumeOscillator,
                price_volume_correlation: priceVolumeCorrelation
            };
        }
        catch (error) {
            console.error('Error calculating volume features:', error);
            return {
                volume_price_trend: 0,
                on_balance_volume: 0,
                accumulation_distribution: 0,
                money_flow_index: 0,
                volume_oscillator: 0,
                price_volume_correlation: 0
            };
        }
    }
    /**
     * Extract market microstructure features
     */
    async extractMicrostructureFeatures(priceData, contextData) {
        const { high, low, close } = priceData;
        // Estimated bid-ask spread using high-low spread
        const bidAskSpread = this.estimateBidAskSpread(high, low);
        // Market impact (how much price moves with volume)
        const marketImpact = this.calculateMarketImpact(priceData);
        // Order flow imbalance estimation
        const orderFlowImbalance = this.estimateOrderFlowImbalance(priceData);
        // High-frequency volatility
        const hfVolatility = this.calculateHighFrequencyVolatility(close);
        // Jump detection using price gaps
        const jumpDetection = this.detectPriceJumps(close);
        // Regime change probability
        const regimeChangeProb = this.calculateRegimeChangeProbability(close);
        return {
            bid_ask_spread: bidAskSpread,
            market_impact: marketImpact,
            order_flow_imbalance: orderFlowImbalance,
            high_frequency_volatility: hfVolatility,
            jump_detection: jumpDetection,
            regime_change_probability: regimeChangeProb
        };
    }
    /**
     * Extract time series features
     */
    async extractTimeSeriesFeatures(priceData) {
        const { close } = priceData;
        // Calculate autocorrelation function
        const autocorrelation = this.calculateAutocorrelation(close, 10);
        // Partial autocorrelation
        const partialAutocorrelation = this.calculatePartialAutocorrelation(close, 10);
        // Periodogram analysis for dominant frequencies
        const periodogramPeaks = this.findPeriodogramPeaks(close);
        // Simple seasonal decomposition
        const seasonalDecomposition = this.simpleSeasonalDecomposition(close);
        return {
            autocorrelation,
            partial_autocorrelation: partialAutocorrelation,
            periodogram_peaks: periodogramPeaks,
            seasonal_decomposition: seasonalDecomposition
        };
    }
    /**
     * Extract cross-asset correlation features
     */
    async extractCrossAssetFeatures(priceData, symbol, contextData) {
        // This would ideally fetch data from other assets
        // For now, we'll provide placeholder values
        const correlationWithIndices = [0.3, 0.4, -0.1]; // S&P500, NASDAQ, VIX
        const correlationWithCurrencies = [0.1, -0.2, 0.05]; // EUR, JPY, GBP
        const correlationWithCommodities = [0.2, 0.1, -0.1]; // Gold, Oil, Silver
        // Sector momentum (simplified)
        const sectorMomentum = this.calculateSectorMomentum(symbol);
        // Market beta (simplified)
        const marketBeta = this.calculateMarketBeta(priceData.close);
        return {
            correlation_with_indices: correlationWithIndices,
            correlation_with_currencies: correlationWithCurrencies,
            correlation_with_commodities: correlationWithCommodities,
            sector_momentum: sectorMomentum,
            market_beta: marketBeta
        };
    }
    // ============ Helper Methods ============
    calculateRealizedVolatility(returns) {
        if (returns.length === 0)
            return 0;
        const variance = ss.variance(returns);
        return Math.sqrt(variance * 252); // Annualized volatility
    }
    calculateSkewness(data) {
        if (data.length < 3)
            return 0;
        const mean = ss.mean(data);
        const std = ss.standardDeviation(data);
        if (std === 0)
            return 0;
        const skewness = data.reduce((sum, value) => {
            return sum + Math.pow((value - mean) / std, 3);
        }, 0) / data.length;
        return skewness;
    }
    calculateKurtosis(data) {
        if (data.length < 4)
            return 0;
        const mean = ss.mean(data);
        const std = ss.standardDeviation(data);
        if (std === 0)
            return 0;
        const kurtosis = data.reduce((sum, value) => {
            return sum + Math.pow((value - mean) / std, 4);
        }, 0) / data.length;
        return kurtosis - 3; // Excess kurtosis
    }
    calculateHurstExponent(prices) {
        // Simplified R/S analysis implementation
        if (prices.length < 10)
            return 0.5;
        const returns = prices.slice(1).map((price, idx) => Math.log(price / prices[idx]));
        const n = returns.length;
        const mean = ss.mean(returns);
        // Calculate cumulative deviations
        let cumulativeDeviation = 0;
        const deviations = returns.map(ret => {
            cumulativeDeviation += ret - mean;
            return cumulativeDeviation;
        });
        const range = Math.max(...deviations) - Math.min(...deviations);
        const standardDev = ss.standardDeviation(returns);
        if (standardDev === 0)
            return 0.5;
        const rescaledRange = range / standardDev;
        // H = log(R/S) / log(n)
        return Math.log(rescaledRange) / Math.log(n);
    }
    calculateDivergence(prices, indicator) {
        if (prices.length !== indicator.length || prices.length < 4)
            return 0;
        // Find last 4 peaks/troughs in price and indicator
        const priceExtrema = this.findExtrema(prices.slice(-10));
        const indicatorExtrema = this.findExtrema(indicator.slice(-10));
        if (priceExtrema.length < 2 || indicatorExtrema.length < 2)
            return 0;
        // Simple divergence calculation
        const priceDirection = priceExtrema[priceExtrema.length - 1] - priceExtrema[priceExtrema.length - 2];
        const indicatorDirection = indicatorExtrema[indicatorExtrema.length - 1] - indicatorExtrema[indicatorExtrema.length - 2];
        // Divergence occurs when directions are opposite
        return (Math.sign(priceDirection) * Math.sign(indicatorDirection)) < 0 ? 1 : 0;
    }
    calculateMACDStrength(macdData) {
        if (macdData.length === 0)
            return 0;
        const latest = macdData[macdData.length - 1];
        return Math.abs(latest.histogram || 0);
    }
    calculateBollingerSqueeze(bbData) {
        if (bbData.length < 2)
            return 0;
        const latest = bbData[bbData.length - 1];
        const width = (latest.upper - latest.lower) / latest.middle;
        const historical = bbData.slice(-20).map((bb) => (bb.upper - bb.lower) / bb.middle);
        const avgWidth = ss.mean(historical);
        return width < avgWidth * 0.8 ? 1 : 0; // Squeeze when width is 20% below average
    }
    calculateStochasticMomentum(stochData) {
        if (stochData.length < 2)
            return 0;
        const latest = stochData[stochData.length - 1];
        const previous = stochData[stochData.length - 2];
        return latest.k - previous.k; // Rate of change in stochastic
    }
    calculateVPT(close, volume) {
        if (close.length < 2)
            return 0;
        let vpt = 0;
        for (let i = 1; i < close.length; i++) {
            const priceChange = (close[i] - close[i - 1]) / close[i - 1];
            vpt += volume[i] * priceChange;
        }
        return vpt;
    }
    calculateVolumeOscillator(volume) {
        if (volume.length < 20)
            return 0;
        const shortMA = ss.mean(volume.slice(-10));
        const longMA = ss.mean(volume.slice(-20));
        return ((shortMA - longMA) / longMA) * 100;
    }
    calculatePriceVolumeCorrelation(prices, volume) {
        if (prices.length !== volume.length || prices.length < 3)
            return 0;
        return ss.sampleCorrelation(prices, volume);
    }
    estimateBidAskSpread(high, low) {
        const spreads = high.map((h, idx) => (h - low[idx]) / h);
        return ss.mean(spreads);
    }
    calculateMarketImpact(priceData) {
        // Simplified market impact using price volatility and volume
        const { close, volume } = priceData;
        if (close.length < 2)
            return 0;
        const returns = close.slice(1).map((price, idx) => Math.log(price / close[idx]));
        const volatility = ss.standardDeviation(returns);
        const avgVolume = ss.mean(volume);
        return volatility / Math.sqrt(avgVolume);
    }
    estimateOrderFlowImbalance(priceData) {
        const { high, low, close, volume } = priceData;
        if (close.length < 2)
            return 0;
        // Estimate buy/sell volume based on price action
        let buyVolume = 0;
        let sellVolume = 0;
        for (let i = 1; i < close.length; i++) {
            if (close[i] > close[i - 1]) {
                buyVolume += volume[i];
            }
            else {
                sellVolume += volume[i];
            }
        }
        const totalVolume = buyVolume + sellVolume;
        return totalVolume > 0 ? (buyVolume - sellVolume) / totalVolume : 0;
    }
    calculateHighFrequencyVolatility(close) {
        if (close.length < 2)
            return 0;
        const returns = close.slice(1).map((price, idx) => Math.log(price / close[idx]));
        return ss.standardDeviation(returns);
    }
    detectPriceJumps(close) {
        if (close.length < 2)
            return false;
        const returns = close.slice(1).map((price, idx) => Math.log(price / close[idx]));
        const threshold = 3 * ss.standardDeviation(returns);
        const lastReturn = Math.abs(returns[returns.length - 1]);
        return lastReturn > threshold;
    }
    calculateRegimeChangeProbability(close) {
        if (close.length < 20)
            return 0.5;
        // Compare recent volatility to historical
        const recentReturns = close.slice(-10, -1).map((price, idx) => Math.log(price / close[close.length - 11 + idx]));
        const historicalReturns = close.slice(-20, -10).map((price, idx) => Math.log(price / close[close.length - 21 + idx]));
        const recentVol = ss.standardDeviation(recentReturns);
        const historicalVol = ss.standardDeviation(historicalReturns);
        const volRatio = historicalVol > 0 ? recentVol / historicalVol : 1;
        // Higher ratio suggests regime change
        return Math.min(0.9, Math.max(0.1, volRatio / 3));
    }
    calculateAutocorrelation(data, maxLag) {
        const correlations = [];
        const mean = ss.mean(data);
        for (let lag = 1; lag <= maxLag; lag++) {
            if (data.length <= lag)
                break;
            const lagged = data.slice(0, -lag).map(x => x - mean);
            const original = data.slice(lag).map(x => x - mean);
            const correlation = ss.sampleCorrelation(lagged, original);
            correlations.push(correlation || 0);
        }
        return correlations;
    }
    calculatePartialAutocorrelation(data, maxLag) {
        // Simplified PACF using Yule-Walker equations
        const autocorr = this.calculateAutocorrelation(data, maxLag);
        const pacf = [];
        for (let k = 1; k <= Math.min(maxLag, autocorr.length); k++) {
            if (k === 1) {
                pacf.push(autocorr[0]);
            }
            else {
                // Simplified calculation
                pacf.push(autocorr[k - 1] || 0);
            }
        }
        return pacf;
    }
    findPeriodogramPeaks(data) {
        // Simplified frequency analysis
        if (data.length < 8)
            return [];
        const peaks = [];
        const n = data.length;
        // Look for dominant cycles (very simplified)
        for (let period = 2; period <= Math.min(n / 3, 20); period++) {
            let correlation = 0;
            const validPoints = n - period;
            for (let i = 0; i < validPoints; i++) {
                correlation += data[i] * data[i + period];
            }
            correlation /= validPoints;
            if (Math.abs(correlation) > 0.3) { // Threshold for significant correlation
                peaks.push(period);
            }
        }
        return peaks.slice(0, 3); // Return top 3 periods
    }
    simpleSeasonalDecomposition(data) {
        if (data.length < 12) {
            return { trend: 0, seasonal: 0, residual: 0 };
        }
        // Simple trend using moving average
        const windowSize = Math.min(12, Math.floor(data.length / 3));
        const trendData = [];
        for (let i = windowSize; i < data.length - windowSize; i++) {
            const window = data.slice(i - windowSize, i + windowSize + 1);
            trendData.push(ss.mean(window));
        }
        const trend = trendData.length > 0 ? ss.mean(trendData) : 0;
        // Simple seasonal pattern (daily/weekly)
        const detrended = data.map(x => x - trend);
        const seasonal = ss.mean(detrended.slice(-7)) || 0; // Weekly pattern
        // Residual
        const residual = ss.standardDeviation(detrended);
        return { trend, seasonal, residual };
    }
    findExtrema(data) {
        const extrema = [];
        for (let i = 1; i < data.length - 1; i++) {
            if ((data[i] > data[i - 1] && data[i] > data[i + 1]) ||
                (data[i] < data[i - 1] && data[i] < data[i + 1])) {
                extrema.push(data[i]);
            }
        }
        return extrema;
    }
    calculateSectorMomentum(symbol) {
        // Placeholder for sector-specific momentum
        const sectorMultipliers = {
            'BTCUSD': 0.8, // Crypto sector
            'ETHUSD': 0.7,
            'EURUSD': 0.3, // Forex
            'GBPUSD': 0.2,
            'XAUUSD': 0.5, // Commodities
            'CRUDE': 0.6
        };
        return sectorMultipliers[symbol] || 0.4;
    }
    calculateMarketBeta(prices) {
        // Simplified beta calculation (normally requires market index data)
        if (prices.length < 20)
            return 1.0;
        const returns = prices.slice(1).map((price, idx) => (price - prices[idx]) / prices[idx]);
        const volatility = ss.standardDeviation(returns);
        // Assume market volatility is 15% annually
        const marketVolatility = 0.15;
        return volatility / marketVolatility;
    }
}
// Export singleton instance
export const advancedFeatureEngine = new AdvancedFeatureEngine();
//# sourceMappingURL=advanced-feature-engine.js.map