/**
 * Quantitative Trading Strategy Optimizer
 * 
 * This module implements advanced quantitative methods for optimizing
 * trading strategies, including portfolio theory, risk-adjusted returns,
 * and adaptive strategy selection based on market conditions.
 */

import * as ss from 'simple-statistics';
import { TradingStrategy, TRADING_STRATEGIES, StrategyConfig } from './trading-strategies';
import { learningEngine } from '../ml/learning-engine';

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

// Funzione per generare numeri gaussiani standard (media 0, std 1)
function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export class QuantitativeStrategyOptimizer {
  /**
   * Analyze and optimize trading strategies using quantitative methods
   */
  async analyzeAndOptimizeStrategies(
    historicalData: any[],
    marketData: any,
    symbol: string
  ): Promise<{
    strategyRankings: StrategyPerformance[];
    portfolioOptimization: PortfolioOptimization;
    marketRegime: MarketRegime;
    recommendations: string[];
  }> {
    console.log(`📊 Starting quantitative strategy analysis for ${symbol}...`);

    // 1. Identify current market regime
    const marketRegime = this.identifyMarketRegime(marketData, historicalData);
    console.log(`🎯 Market regime identified: ${marketRegime.name}`);

    // 2. Analyze strategy performance for each strategy
    const strategyPerformances: StrategyPerformance[] = [];

    for (const strategy of Object.values(TradingStrategy)) {
      const performance = await this.analyzeStrategyPerformance(
        strategy as TradingStrategy,
        historicalData,
        marketRegime,
        symbol
      );
      strategyPerformances.push(performance);
    }

    // 3. Rank strategies by risk-adjusted performance
    const strategyRankings = this.rankStrategiesByPerformance(strategyPerformances);

    // 4. Optimize portfolio allocation
    const portfolioOptimization = this.optimizePortfolio(strategyPerformances, marketRegime);

    // 5. Generate recommendations
    const recommendations = this.generateQuantitativeRecommendations(
      strategyRankings,
      portfolioOptimization,
      marketRegime
    );

    console.log(`✅ Quantitative analysis completed for ${symbol}`);

    return {
      strategyRankings,
      portfolioOptimization,
      marketRegime,
      recommendations
    };
  }

  /**
   * Identify current market regime using statistical methods
   */
  private identifyMarketRegime(marketData: any, historicalData: any[]): MarketRegime {
    try {
      // Robust check for close prices
      const timeframes = ['5m', '15m', '30m'];
      const prices = timeframes.map(tf => marketData?.[tf]?.close).filter(v => typeof v === 'number');
      if (prices.length < 2) throw new Error('Not enough price data for regime identification.');

      const returns = prices.slice(1).map((price, idx) => (price - prices[idx]) / prices[idx]);

      // Calculate regime characteristics
      const volatility = ss.standardDeviation(returns) * Math.sqrt(252);
      const avgReturn = ss.mean(returns) * 252;

      // Simple autocorrelation
      let autocorr = 0;
      if (returns.length > 1) {
        const lagged = returns.slice(0, -1);
        const current = returns.slice(1);
        autocorr = ss.sampleCorrelation(lagged, current) || 0;
      }

      // Determine regime based on volatility and trend
      let regimeName = "NORMAL_MARKET";
      let volatilityState: 'LOW' | 'NORMAL' | 'HIGH' | 'EXTREME' = 'NORMAL';
      let trendState: 'BULL' | 'BEAR' | 'SIDEWAYS' = 'SIDEWAYS';
      let momentumState: 'STRONG' | 'WEAK' | 'NEUTRAL' = 'NEUTRAL';

      // Volatility regime (ordine corretto: da più alto a più basso)
      if (volatility > 0.50) {
        volatilityState = 'EXTREME';
        regimeName = "CRISIS_VOLATILITY";
      } else if (volatility > 0.30) {
        volatilityState = 'HIGH';
        regimeName = "HIGH_VOLATILITY";
      } else if (volatility < 0.15) {
        volatilityState = 'LOW';
        regimeName = "LOW_VOLATILITY";
      }

      // Trend regime
      if (avgReturn > 0.10) {
        trendState = 'BULL';
        regimeName = regimeName.includes('VOLATILITY') ? `BULL_${regimeName}` : "BULL_MARKET";
      } else if (avgReturn < -0.10) {
        trendState = 'BEAR';
        regimeName = regimeName.includes('VOLATILITY') ? `BEAR_${regimeName}` : "BEAR_MARKET";
      }

      // Momentum regime
      if (Math.abs(autocorr) > 0.3) {
        momentumState = 'STRONG';
      } else if (Math.abs(autocorr) < 0.1) {
        momentumState = 'WEAK';
      }

      return {
        name: regimeName,
        volatility: volatilityState,
        trend: trendState,
        momentum: momentumState,
        characteristics: {
          avgVolatility: volatility,
          avgReturn: avgReturn,
          autocorrelation: autocorr,
          riskAversion: volatility > 0.25 ? 0.8 : 0.5 // Higher in volatile markets
        }
      };
    } catch (error) {
      console.error('Error identifying market regime:', error);
      return {
        name: "UNKNOWN_MARKET",
        volatility: 'NORMAL',
        trend: 'SIDEWAYS',
        momentum: 'NEUTRAL',
        characteristics: {
          avgVolatility: 0.20,
          avgReturn: 0.05,
          autocorrelation: 0,
          riskAversion: 0.5
        }
      };
    }
  }

  /**
   * Analyze individual strategy performance with quantitative metrics
   */
  private async analyzeStrategyPerformance(
    strategy: TradingStrategy,
    historicalData: any[],
    marketRegime: MarketRegime,
    symbol: string
  ): Promise<StrategyPerformance> {
    // Simulate strategy returns (in practice, this would use historical backtest data)
    const returns = this.simulateStrategyReturns(strategy, historicalData, marketRegime);

    // Calculate basic performance metrics
    const winRate = returns.filter(r => r > 0).length / returns.length;
    const wins = returns.filter(r => r > 0);
    const losses = returns.filter(r => r < 0);
    const avgWin = wins.length ? ss.mean(wins) : 0;
    const avgLoss = losses.length ? Math.abs(ss.mean(losses)) : 0;
    const profitFactor = losses.length ? (avgWin * wins.length) / (avgLoss * losses.length) : 0;
    const cumulativeReturns = returns.reduce((cum, ret) => cum * (1 + ret), 1) - 1;

    // Calculate quantitative metrics
    const metrics = this.calculateQuantitativeMetrics(returns, marketRegime);

    // Determine optimal market regimes for this strategy
    const marketRegimeOptimal = this.getOptimalMarketRegimes(strategy, metrics);

    // Calculate confidence in strategy performance
    const confidence = this.calculateStrategyConfidence(strategy, metrics, marketRegime);

    return {
      strategy,
      returns,
      cumulativeReturns,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      metrics,
      confidence,
      marketRegimeOptimal
    };
  }

  /**
   * Calculate comprehensive quantitative metrics
   */
  private calculateQuantitativeMetrics(returns: number[], marketRegime: MarketRegime): QuantitativeMetrics {
    if (returns.length === 0) {
      return this.getDefaultMetrics();
    }

    try {
      const riskFreeRate = 0.02; // 2% annual risk-free rate
      const mean = ss.mean(returns);
      const std = ss.standardDeviation(returns);
      const annualizedReturn = mean * 252;
      const annualizedVolatility = std * Math.sqrt(252);

      // Sharpe Ratio
      const sharpeRatio = std > 0 ? (annualizedReturn - riskFreeRate) / annualizedVolatility : 0;

      // Sortino Ratio (downside deviation)
      const downsideReturns = returns.filter(r => r < mean);
      const downsideDeviation = downsideReturns.length > 0 ?
        Math.sqrt(downsideReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / downsideReturns.length) * Math.sqrt(252) : std;
      const sortinoRatio = downsideDeviation > 0 ? (annualizedReturn - riskFreeRate) / downsideDeviation : 0;

      // Max Drawdown
      const cumulativeReturnsArr = returns.reduce((acc, ret, idx) => {
        if (idx === 0) return [1 + ret];
        return [...acc, acc[acc.length - 1] * (1 + ret)];
      }, [] as number[]);

      let maxDrawdown = 0;
      let peak = cumulativeReturnsArr[0];

      for (const value of cumulativeReturnsArr) {
        if (value > peak) peak = value;
        const drawdown = (peak - value) / peak;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      }

      // Calmar Ratio
      const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;

      // Value at Risk (VaR) at 95% confidence
      const sortedReturns = returns.slice().sort((a, b) => a - b);
      const varIndex = Math.floor(returns.length * 0.05);
      const valueAtRisk = sortedReturns[varIndex] || 0;

      // Conditional VaR (Expected Shortfall)
      const conditionalVaR = varIndex > 0 ? ss.mean(sortedReturns.slice(0, varIndex)) : valueAtRisk;

      // Beta and Alpha (semplificato)
      // Beta: se non hai benchmark reale, meglio impostare a 1
      const beta = 1;
      const marketReturn = marketRegime.characteristics.avgReturn / 252;
      const alpha = mean - (riskFreeRate / 252 + beta * (marketReturn - riskFreeRate / 252));

      // Information Ratio (semplificato)
      const benchmarkReturns = returns.map(() => marketReturn);
      const excessReturns = returns.map((r, idx) => r - benchmarkReturns[idx]);
      const trackingError = ss.standardDeviation(excessReturns);
      const informationRatio = trackingError > 0 ? ss.mean(excessReturns) / trackingError : 0;

      // Statistical moments
      const skewness = this.calculateSkewness(returns);
      const kurtosis = this.calculateKurtosis(returns);

      return {
        sharpeRatio,
        sortinoRatio,
        calmarRatio,
        maxDrawdown,
        valueAtRisk,
        conditionalVaR,
        beta,
        alpha: alpha * 252, // Annualized
        informationRatio,
        volatility: annualizedVolatility,
        skewness,
        kurtosis
      };
    } catch (error) {
      console.error('Error calculating quantitative metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Optimize portfolio allocation using Modern Portfolio Theory
   */
  private optimizePortfolio(
    strategies: StrategyPerformance[],
    marketRegime: MarketRegime
  ): PortfolioOptimization {
    if (!strategies.length) {
      // Fallback: nessuna strategia
      return {
        optimalWeights: new Map(),
        expectedReturn: 0,
        expectedVolatility: 0,
        sharpeRatio: 0,
        diversificationRatio: 1,
        maxDrawdown: 0,
        riskContribution: new Map()
      };
    }

    try {
      // Calculate correlation matrix
      const correlationMatrix = this.calculateCorrelationMatrix(strategies);

      // Expected returns and volatilities
      const expectedReturns = strategies.map(s => s.cumulativeReturns);
      const volatilities = strategies.map(s => s.metrics.volatility);

      // Risk aversion based on market regime
      const riskAversion = marketRegime.characteristics.riskAversion;

      // Simplified mean-variance optimization
      const weights = this.optimizeMeanVariance(expectedReturns, volatilities, correlationMatrix, riskAversion);

      const optimalWeights = new Map<TradingStrategy, number>();
      strategies.forEach((strategy, idx) => {
        optimalWeights.set(strategy.strategy, weights[idx]);
      });

      // Calculate portfolio metrics
      const expectedReturn = this.calculatePortfolioReturn(expectedReturns, weights);
      const expectedVolatility = this.calculatePortfolioVolatility(volatilities, weights, correlationMatrix);
      const sharpeRatio = expectedVolatility > 0 ? (expectedReturn - 0.02) / expectedVolatility : 0;

      // Diversification ratio
      const averageVolatility = ss.mean(volatilities);
      const diversificationRatio = expectedVolatility > 0 ? averageVolatility / expectedVolatility : 1;

      // Portfolio max drawdown (weighted average)
      const maxDrawdown = strategies.reduce((sum, strategy, idx) =>
        sum + strategy.metrics.maxDrawdown * weights[idx], 0);

      // Risk contribution
      const riskContribution = this.calculateRiskContribution(strategies, weights, expectedVolatility);

      return {
        optimalWeights,
        expectedReturn,
        expectedVolatility,
        sharpeRatio,
        diversificationRatio,
        maxDrawdown,
        riskContribution
      };
    } catch (error) {
      console.error('Error optimizing portfolio:', error);

      // Fallback: equal weights
      const equalWeight = 1 / strategies.length;
      const optimalWeights = new Map<TradingStrategy, number>();
      strategies.forEach(strategy => {
        optimalWeights.set(strategy.strategy, equalWeight);
      });

      return {
        optimalWeights,
        expectedReturn: 0.05,
        expectedVolatility: 0.15,
        sharpeRatio: 0.2,
        diversificationRatio: 1.0,
        maxDrawdown: 0.1,
        riskContribution: optimalWeights
      };
    }
  }

  /**
   * Rank strategies by risk-adjusted performance
   */
  private rankStrategiesByPerformance(strategies: StrategyPerformance[]): StrategyPerformance[] {
    return strategies.sort((a, b) => {
      // Multi-criteria scoring
      const scoreA = this.calculateCompositeScore(a);
      const scoreB = this.calculateCompositeScore(b);
      return scoreB - scoreA;
    });
  }

  /**
   * Calculate composite score for strategy ranking
   */
  private calculateCompositeScore(performance: StrategyPerformance): number {
    const weights = {
      sharpeRatio: 0.25,
      sortinoRatio: 0.20,
      calmarRatio: 0.15,
      profitFactor: 0.15,
      winRate: 0.10,
      confidence: 0.10,
      alpha: 0.05
    };

    // Normalize metrics to 0-1 scale for scoring
    const normalizedMetrics = {
      sharpeRatio: Math.max(0, Math.min(1, (performance.metrics.sharpeRatio + 1) / 3)),
      sortinoRatio: Math.max(0, Math.min(1, (performance.metrics.sortinoRatio + 1) / 3)),
      calmarRatio: Math.max(0, Math.min(1, performance.metrics.calmarRatio / 2)),
      profitFactor: Math.max(0, Math.min(1, performance.profitFactor / 3)),
      winRate: performance.winRate,
      confidence: performance.confidence / 100,
      alpha: Math.max(0, Math.min(1, (performance.metrics.alpha + 0.05) / 0.10))
    };

    let score = 0;
    Object.entries(weights).forEach(([metric, weight]) => {
      score += normalizedMetrics[metric as keyof typeof normalizedMetrics] * weight;
    });

    return score;
  }

  // ============ Helper Methods ============

  private simulateStrategyReturns(
    strategy: TradingStrategy,
    historicalData: any[],
    marketRegime: MarketRegime
  ): number[] {
    const config = TRADING_STRATEGIES[strategy];
    const numTrades = Math.max(30, historicalData.length);
    const returns: number[] = [];

    // Strategy-specific return characteristics based on market regime
    const baseReturn = this.getStrategyBaseReturn(strategy, marketRegime);
    const baseVolatility = this.getStrategyBaseVolatility(strategy, marketRegime);

    for (let i = 0; i < numTrades; i++) {
      // Random return with strategy-specific characteristics
      const randomReturn = gaussianRandom() * baseVolatility + baseReturn;
      returns.push(randomReturn);
    }

    return returns;
  }

  private getStrategyBaseReturn(strategy: TradingStrategy, regime: MarketRegime): number {
    // Garantisce copertura di tutte le strategie
    switch (strategy) {
      case TradingStrategy.SCALPING:
        return regime.trend === 'BULL' ? 0.002 : regime.trend === 'BEAR' ? -0.001 : 0.001;
      case TradingStrategy.INTRADAY:
        return regime.trend === 'BULL' ? 0.005 : regime.trend === 'BEAR' ? -0.002 : 0.002;
      default:
        return 0.001;
    }
  }

  private getStrategyBaseVolatility(strategy: TradingStrategy, regime: MarketRegime): number {
    let baseVol = 0.01;
    switch (strategy) {
      case TradingStrategy.SCALPING:
        baseVol = 0.01;
        break;
      case TradingStrategy.INTRADAY:
        baseVol = 0.015;
        break;
      default:
        baseVol = 0.01;
    }

    const volatilityMultiplier = {
      'LOW': 0.7,
      'NORMAL': 1.0,
      'HIGH': 1.5,
      'EXTREME': 2.0
    };

    return baseVol * (volatilityMultiplier[regime.volatility] || 1.0);
  }

  private calculateSkewness(data: number[]): number {
    if (data.length < 3) return 0;
    const mean = ss.mean(data);
    const std = ss.standardDeviation(data);
    if (std === 0) return 0;

    const skewness = data.reduce((sum, value) => {
      return sum + Math.pow((value - mean) / std, 3);
    }, 0) / data.length;

    return skewness;
  }

  private calculateKurtosis(data: number[]): number {
    if (data.length < 4) return 0;
    const mean = ss.mean(data);
    const std = ss.standardDeviation(data);
    if (std === 0) return 0;

    const kurtosis = data.reduce((sum, value) => {
      return sum + Math.pow((value - mean) / std, 4);
    }, 0) / data.length;

    return kurtosis - 3; // Excess kurtosis
  }

  private getOptimalMarketRegimes(strategy: TradingStrategy, metrics: QuantitativeMetrics): string[] {
    const regimes: string[] = [];

    // Strategy-specific optimal conditions
    if (strategy === TradingStrategy.SCALPING) {
      if (metrics.volatility > 0.20) regimes.push('HIGH_VOLATILITY');
      if (metrics.sharpeRatio > 1) regimes.push('BULL_MARKET');
    } else if (strategy === TradingStrategy.INTRADAY) {
      if (metrics.volatility < 0.30) regimes.push('NORMAL_MARKET');
      if (metrics.sortinoRatio > 0.5) regimes.push('TRENDING_MARKET');
    }

    return regimes.length ? regimes : ['NORMAL_MARKET'];
  }

  private calculateStrategyConfidence(
    strategy: TradingStrategy,
    metrics: QuantitativeMetrics,
    regime: MarketRegime
  ): number {
    let confidence = 50;

    // Boost confidence for good metrics
    if (metrics.sharpeRatio > 0.5) confidence += 15;
    if (metrics.sortinoRatio > 0.7) confidence += 10;
    if (metrics.maxDrawdown < 0.15) confidence += 10;
    if (metrics.alpha > 0) confidence += 5;

    // Adjust for market regime fit
    const optimalRegimes = this.getOptimalMarketRegimes(strategy, metrics);
    if (optimalRegimes.includes(regime.name)) confidence += 10;

    return Math.max(20, Math.min(95, confidence));
  }

  private calculateCorrelationMatrix(strategies: StrategyPerformance[]): number[][] {
    const n = strategies.length;
    const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          // Simplified correlation (in practice, would use actual return correlations)
          matrix[i][j] = Math.random() * 0.4 + 0.1; // 0.1 to 0.5 correlation
        }
      }
    }

    return matrix;
  }

  private optimizeMeanVariance(
    expectedReturns: number[],
    volatilities: number[],
    correlationMatrix: number[][],
    riskAversion: number
  ): number[] {
    const n = expectedReturns.length;
    if (n === 0) return [];
    // Simplified optimization (equal weights as baseline)
    const baseWeights = Array(n).fill(1 / n);

    // Adjust weights based on risk-adjusted returns
    const adjustedWeights = baseWeights.map((weight, i) => {
      const riskAdjustedReturn = volatilities[i] > 0 ? expectedReturns[i] / (volatilities[i] * riskAversion) : 0;
      return weight * (1 + riskAdjustedReturn);
    });

    // Normalize weights to sum to 1
    const totalWeight = adjustedWeights.reduce((sum, w) => sum + w, 0);
    return totalWeight > 0 ? adjustedWeights.map(w => w / totalWeight) : baseWeights;
  }

  private calculatePortfolioReturn(returns: number[], weights: number[]): number {
    return returns.reduce((sum, ret, idx) => sum + ret * weights[idx], 0);
  }

  private calculatePortfolioVolatility(
    volatilities: number[],
    weights: number[],
    correlationMatrix: number[][]
  ): number {
    let variance = 0;

    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        variance += weights[i] * weights[j] * volatilities[i] * volatilities[j] * correlationMatrix[i][j];
      }
    }

    return Math.sqrt(variance);
  }

  private calculateRiskContribution(
    strategies: StrategyPerformance[],
    weights: number[],
    portfolioVolatility: number
  ): Map<TradingStrategy, number> {
    const riskContribution = new Map<TradingStrategy, number>();
    if (portfolioVolatility === 0) return riskContribution;

    strategies.forEach((strategy, idx) => {
      const marginalContribution = weights[idx] * strategy.metrics.volatility / portfolioVolatility;
      riskContribution.set(strategy.strategy, marginalContribution);
    });

    return riskContribution;
  }

  private generateQuantitativeRecommendations(
    rankings: StrategyPerformance[],
    portfolio: PortfolioOptimization,
    regime: MarketRegime
  ): string[] {
    const recommendations: string[] = [];
    if (!rankings.length) return recommendations;

    // Top strategy recommendation
    const topStrategy = rankings[0];
    recommendations.push(`🏆 Top strategy: ${topStrategy.strategy} (Sharpe: ${topStrategy.metrics.sharpeRatio.toFixed(2)})`);

    // Portfolio recommendation
    const maxWeight = Math.max(...Array.from(portfolio.optimalWeights.values()));
    const dominantStrategy = Array.from(portfolio.optimalWeights.entries())
      .find(([_, weight]) => weight === maxWeight)?.[0];

    if (dominantStrategy) {
      recommendations.push(`📊 Portfolio allocation: ${dominantStrategy} dominates with ${(maxWeight * 100).toFixed(1)}%`);
    }

    // Market regime recommendations
    recommendations.push(`🎯 Market regime: ${regime.name} - adjust risk accordingly`);

    if (regime.volatility === 'HIGH' || regime.volatility === 'EXTREME') {
      recommendations.push('⚠️ High volatility detected - reduce position sizes');
    }

    if (portfolio.sharpeRatio > 1) {
      recommendations.push('✅ Portfolio shows excellent risk-adjusted returns');
    } else if (portfolio.sharpeRatio < 0.5) {
      recommendations.push('🚨 Portfolio risk-adjusted returns are poor - consider rebalancing');
    }

    // Diversification recommendations
    if (portfolio.diversificationRatio > 1.2) {
      recommendations.push('📈 Good diversification benefits achieved');
    } else {
      recommendations.push('🔄 Consider more diversification to reduce risk');
    }

    return recommendations;
  }

  private getDefaultMetrics(): QuantitativeMetrics {
    return {
      sharpeRatio: 0,
      sortinoRatio: 0,
      calmarRatio: 0,
      maxDrawdown: 0,
      valueAtRisk: 0,
      conditionalVaR: 0,
      beta: 1,
      alpha: 0,
      informationRatio: 0,
      volatility: 0.15,
      skewness: 0,
      kurtosis: 0
    };
  }
}

// Export singleton instance
export const quantitativeOptimizer = new QuantitativeStrategyOptimizer();