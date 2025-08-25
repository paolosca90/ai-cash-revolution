/**
 * Advanced Risk Management System
 *
 * This module implements sophisticated risk management techniques including
 * portfolio-level risk monitoring, dynamic position sizing, correlation analysis,
 * and advanced risk metrics for trading operations.
 */
import { TradingStrategy } from './trading-strategies';
export interface RiskParameters {
    maxPortfolioRisk: number;
    maxSinglePositionRisk: number;
    maxDrawdown: number;
    maxLeverage: number;
    riskFreeRate: number;
    lookbackPeriod: number;
}
export interface PositionRisk {
    symbol: string;
    strategy: TradingStrategy;
    positionSize: number;
    entry_price: number;
    current_price: number;
    stop_loss: number;
    take_profit: number;
    unrealizedPnL: number;
    riskAmount: number;
    riskPercent: number;
    timeInPosition: number;
    volatility: number;
    beta: number;
}
export interface PortfolioRisk {
    totalRisk: number;
    concentrationRisk: number;
    correlationRisk: number;
    leverageRisk: number;
    liquidityRisk: number;
    timeRisk: number;
    var95: number;
    var99: number;
    expectedShortfall: number;
    maxDrawdownRisk: number;
    riskScore: number;
}
export interface RiskAlert {
    level: 'INFO' | 'WARNING' | 'CRITICAL';
    type: 'POSITION' | 'PORTFOLIO' | 'MARKET' | 'SYSTEM';
    message: string;
    symbol?: string;
    strategy?: TradingStrategy;
    value: number;
    threshold: number;
    timestamp: Date;
    action_required: string;
}
export interface DynamicPositionSize {
    recommendedSize: number;
    riskAdjustment: number;
    volatilityAdjustment: number;
    correlationAdjustment: number;
    marketRegimeAdjustment: number;
    finalSize: number;
    reasoning: string[];
}
export declare class AdvancedRiskManager {
    private riskParams;
    private positions;
    private riskHistory;
    private correlationMatrix;
    constructor();
    /**
     * Calculate dynamic position sizing based on multiple risk factors
     */
    calculateDynamicPositionSize(symbol: string, strategy: TradingStrategy, baseSize: number, entryPrice: number, stopLoss: number, marketData: any, portfolioValue: number): Promise<DynamicPositionSize>;
    /**
     * Calculate comprehensive portfolio risk metrics
     */
    calculatePortfolioRisk(): Promise<PortfolioRisk>;
    /**
     * Generate risk alerts based on current conditions
     */
    generateRiskAlerts(): Promise<RiskAlert[]>;
    /**
     * Update position information
     */
    updatePosition(position: PositionRisk): void;
    /**
     * Remove closed position
     */
    removePosition(symbol: string): void;
    /**
     * Get risk recommendations based on current state
     */
    getRiskRecommendations(): Promise<string[]>;
    private calculateInstrumentVolatility;
    private calculateAverageCorrelation;
    private identifyMarketRegime;
    private checkConcentrationLimit;
    private calculateConcentrationRisk;
    private calculateCorrelationRisk;
    private calculateLeverageRisk;
    private calculateLiquidityRisk;
    private calculateTimeRisk;
    private calculateVaRMetrics;
    private calculateCurrentDrawdown;
    private calculateOverallRiskScore;
    private updateCorrelationMatrix;
    private getPositionCorrelation;
    private getZeroRiskMetrics;
}
export declare const advancedRiskManager: AdvancedRiskManager;
