/**
 * Quantitative Trading Strategy Optimizer
 *
 * This module implements advanced quantitative methods for optimizing
 * trading strategies, including portfolio theory, risk-adjusted returns,
 * and adaptive strategy selection based on market conditions.
 */
import { TradingStrategy } from './trading-strategies';
export interface QuantitativeMetrics {
    sharpeRatio: number;
    sortinoRatio: number;
    calmarRatio: number;
    maxDrawdown: number;
    valueAtRisk: number;
    conditionalVaR: number;
    beta: number;
    alpha: number;
    informationRatio: number;
    volatility: number;
    skewness: number;
    kurtosis: number;
}
export interface StrategyPerformance {
    strategy: TradingStrategy;
    returns: number[];
    cumulativeReturns: number;
    winRate: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
    metrics: QuantitativeMetrics;
    confidence: number;
    marketRegimeOptimal: string[];
}
export interface PortfolioOptimization {
    optimalWeights: Map<TradingStrategy, number>;
    expectedReturn: number;
    expectedVolatility: number;
    sharpeRatio: number;
    diversificationRatio: number;
    maxDrawdown: number;
    riskContribution: Map<TradingStrategy, number>;
}
export interface MarketRegime {
    name: string;
    volatility: 'LOW' | 'NORMAL' | 'HIGH' | 'EXTREME';
    trend: 'BULL' | 'BEAR' | 'SIDEWAYS';
    momentum: 'STRONG' | 'WEAK' | 'NEUTRAL';
    characteristics: {
        avgVolatility: number;
        avgReturn: number;
        autocorrelation: number;
        riskAversion: number;
    };
}
export declare class QuantitativeStrategyOptimizer {
    /**
     * Analyze and optimize trading strategies using quantitative methods
     */
    analyzeAndOptimizeStrategies(historicalData: any[], marketData: any, symbol: string): Promise<{
        strategyRankings: StrategyPerformance[];
        portfolioOptimization: PortfolioOptimization;
        marketRegime: MarketRegime;
        recommendations: string[];
    }>;
    /**
     * Identify current market regime using statistical methods
     */
    private identifyMarketRegime;
    /**
     * Analyze individual strategy performance with quantitative metrics
     */
    private analyzeStrategyPerformance;
    /**
     * Calculate comprehensive quantitative metrics
     */
    private calculateQuantitativeMetrics;
    /**
     * Optimize portfolio allocation using Modern Portfolio Theory
     */
    private optimizePortfolio;
    /**
     * Rank strategies by risk-adjusted performance
     */
    private rankStrategiesByPerformance;
    /**
     * Calculate composite score for strategy ranking
     */
    private calculateCompositeScore;
    private simulateStrategyReturns;
    private getStrategyBaseReturn;
    private getStrategyBaseVolatility;
    private calculateSkewness;
    private calculateKurtosis;
    private getOptimalMarketRegimes;
    private calculateStrategyConfidence;
    private calculateCorrelationMatrix;
    private optimizeMeanVariance;
    private calculatePortfolioReturn;
    private calculatePortfolioVolatility;
    private calculateRiskContribution;
    private generateQuantitativeRecommendations;
    private getDefaultMetrics;
}
export declare const quantitativeOptimizer: QuantitativeStrategyOptimizer;
