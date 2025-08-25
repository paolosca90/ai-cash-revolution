/**
 * Advanced Feature Engineering Module for Trading Signal Enhancement
 *
 * This module implements sophisticated feature extraction and engineering
 * techniques specifically designed for financial time series analysis
 */
export interface AdvancedFeatures {
    priceFeatures: {
        logReturns: number[];
        volatility: number;
        skewness: number;
        kurtosis: number;
        hurst_exponent: number;
        fractal_dimension: number;
    };
    technicalFeatures: {
        rsi_divergence: number;
        macd_signal_strength: number;
        bollinger_squeeze: number;
        adx_trend_strength: number;
        stochastic_momentum: number;
        williams_r: number;
        commodity_channel_index: number;
    };
    volumeFeatures: {
        volume_price_trend: number;
        on_balance_volume: number;
        accumulation_distribution: number;
        money_flow_index: number;
        volume_oscillator: number;
        price_volume_correlation: number;
    };
    microstructureFeatures: {
        bid_ask_spread: number;
        market_impact: number;
        order_flow_imbalance: number;
        high_frequency_volatility: number;
        jump_detection: boolean;
        regime_change_probability: number;
    };
    timeSeriesFeatures: {
        autocorrelation: number[];
        partial_autocorrelation: number[];
        periodogram_peaks: number[];
        seasonal_decomposition: {
            trend: number;
            seasonal: number;
            residual: number;
        };
    };
    crossAssetFeatures: {
        correlation_with_indices: number[];
        correlation_with_currencies: number[];
        correlation_with_commodities: number[];
        sector_momentum: number;
        market_beta: number;
    };
}
export declare class AdvancedFeatureEngine {
    /**
     * Extract comprehensive features from price data
     */
    extractAdvancedFeatures(priceData: {
        open: number[];
        high: number[];
        low: number[];
        close: number[];
        volume: number[];
        timestamp: number[];
    }, symbol: string, contextData?: any): Promise<AdvancedFeatures>;
    /**
     * Extract sophisticated price-based features
     */
    private extractPriceFeatures;
    /**
     * Extract advanced technical indicator features
     */
    private extractTechnicalFeatures;
    /**
     * Extract volume-based features
     */
    private extractVolumeFeatures;
    /**
     * Extract market microstructure features
     */
    private extractMicrostructureFeatures;
    /**
     * Extract time series features
     */
    private extractTimeSeriesFeatures;
    /**
     * Extract cross-asset correlation features
     */
    private extractCrossAssetFeatures;
    private calculateRealizedVolatility;
    private calculateSkewness;
    private calculateKurtosis;
    private calculateHurstExponent;
    private calculateDivergence;
    private calculateMACDStrength;
    private calculateBollingerSqueeze;
    private calculateStochasticMomentum;
    private calculateVPT;
    private calculateVolumeOscillator;
    private calculatePriceVolumeCorrelation;
    private estimateBidAskSpread;
    private calculateMarketImpact;
    private estimateOrderFlowImbalance;
    private calculateHighFrequencyVolatility;
    private detectPriceJumps;
    private calculateRegimeChangeProbability;
    private calculateAutocorrelation;
    private calculatePartialAutocorrelation;
    private findPeriodogramPeaks;
    private simpleSeasonalDecomposition;
    private findExtrema;
    private calculateSectorMomentum;
    private calculateMarketBeta;
}
export declare const advancedFeatureEngine: AdvancedFeatureEngine;
