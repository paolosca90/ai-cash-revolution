/**
 * Advanced Backtesting Engine
 *
 * This module provides comprehensive backtesting capabilities for trading strategies,
 * including walk-forward analysis, Monte Carlo simulation, and out-of-sample testing
 * to validate strategy performance and robustness.
 */
import { TradingStrategy } from './trading-strategies';
import { QuantitativeMetrics } from './quantitative-strategy-optimizer';
export interface BacktestConfig {
    startDate: Date;
    endDate: Date;
    initialCapital: number;
    commission: number;
    slippage: number;
    riskPerTrade: number;
    reinvestProfits: boolean;
    maxPositions: number;
    outOfSamplePeriod: number;
}
export interface Trade {
    id: string;
    symbol: string;
    strategy: TradingStrategy;
    direction: 'LONG' | 'SHORT';
    entryDate: Date;
    exitDate: Date;
    entryPrice: number;
    exitPrice: number;
    quantity: number;
    commission: number;
    slippage: number;
    pnl: number;
    pnlPercent: number;
    holdingPeriod: number;
    exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'TIME_EXIT' | 'SIGNAL_EXIT';
    confidence: number;
}
export interface BacktestResults {
    config: BacktestConfig;
    trades: Trade[];
    performance: {
        totalTrades: number;
        winningTrades: number;
        losingTrades: number;
        winRate: number;
        avgWin: number;
        avgLoss: number;
        profitFactor: number;
        totalReturn: number;
        annualizedReturn: number;
        maxDrawdown: number;
        maxDrawdownDuration: number;
        sharpeRatio: number;
        sortinoRatio: number;
        calmarRatio: number;
        recoveryFactor: number;
        payoffRatio: number;
    };
    equity_curve: Array<{
        date: Date;
        equity: number;
        drawdown: number;
    }>;
    monthly_returns: Array<{
        month: string;
        return: number;
    }>;
    yearly_returns: Array<{
        year: number;
        return: number;
    }>;
    quantitative_metrics: QuantitativeMetrics;
    robustness_tests: RobustnessResults;
}
export interface RobustnessResults {
    walk_forward: WalkForwardResults;
    monte_carlo: MonteCarloResults;
    sensitivity_analysis: SensitivityResults;
    out_of_sample: OutOfSampleResults;
}
export interface WalkForwardResults {
    in_sample_performance: BacktestResults['performance'];
    out_of_sample_performance: BacktestResults['performance'];
    efficiency: number;
    degradation: number;
    consistency_score: number;
}
export interface MonteCarloResults {
    simulations: number;
    confidence_intervals: {
        return_95: [number, number];
        drawdown_95: [number, number];
        sharpe_95: [number, number];
    };
    probability_of_profit: number;
    tail_ratio: number;
    stress_test_results: Array<{
        scenario: string;
        result: number;
    }>;
}
export interface SensitivityResults {
    parameter_sensitivity: Map<string, {
        original: number;
        optimized: number;
        improvement: number;
    }>;
    market_regime_performance: Map<string, BacktestResults['performance']>;
    seasonal_effects: Array<{
        period: string;
        avg_return: number;
        volatility: number;
    }>;
}
export interface OutOfSampleResults {
    period: {
        start: Date;
        end: Date;
    };
    performance: BacktestResults['performance'];
    vs_in_sample: {
        return_difference: number;
        drawdown_difference: number;
        sharpe_difference: number;
    };
    statistical_significance: number;
}
export declare class BacktestingEngine {
    /**
     * Run comprehensive backtest with robustness testing
     */
    runBacktest(strategy: TradingStrategy, symbol: string, historicalData: any[], config: BacktestConfig): Promise<BacktestResults>;
    /**
     * Simulate trading based on strategy signals
     */
    private simulateTrades;
    /**
     * Generate trading signal using strategy logic
     */
    private generateTradingSignal;
    /**
     * Check exit conditions for open position
     */
    private checkExitConditions;
    /**
     * Create trade record from position and exit signal
     */
    private createTrade;
    /**
     * Calculate position size based on risk management
     */
    private calculatePositionSize;
    /**
     * Calculate comprehensive performance metrics
     */
    private calculatePerformanceMetrics;
    /**
     * Generate equity curve from trades
     */
    private generateEquityCurve;
    /**
     * Run comprehensive robustness tests
     */
    private runRobustnessTests;
    private runWalkForwardTest;
    private runMonteCarloSimulation;
    private runSensitivityAnalysis;
    private runOutOfSampleTest;
    private calculateRSI;
    private calculateMonthlyReturns;
    private calculateYearlyReturns;
    private calculateQuantitativeMetrics;
    private calculateSkewness;
    private calculateKurtosis;
    private getZeroPerformanceMetrics;
}
export declare const backtestingEngine: BacktestingEngine;
