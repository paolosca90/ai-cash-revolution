/**
 * Advanced Risk Management System
 *
 * This module implements sophisticated risk management techniques including
 * portfolio-level risk monitoring, dynamic position sizing, correlation analysis,
 * and advanced risk metrics for trading operations.
 */
import * as ss from 'simple-statistics';
export class AdvancedRiskManager {
    riskParams;
    positions = new Map();
    riskHistory = [];
    correlationMatrix = new Map();
    constructor() {
        this.riskParams = {
            maxPortfolioRisk: 0.02, // 2% portfolio risk
            maxSinglePositionRisk: 0.005, // 0.5% per position
            maxDrawdown: 0.15, // 15% max drawdown
            maxLeverage: 3.0, // 3:1 leverage
            riskFreeRate: 0.02, // 2% risk-free rate
            lookbackPeriod: 30 // 30 days lookback
        };
    }
    /**
     * Calculate dynamic position sizing based on multiple risk factors
     */
    async calculateDynamicPositionSize(symbol, strategy, baseSize, entryPrice, stopLoss, marketData, portfolioValue) {
        console.log(`📊 Calculating dynamic position size for ${symbol}...`);
        const reasoning = [];
        let riskAdjustment = 1.0;
        let volatilityAdjustment = 1.0;
        let correlationAdjustment = 1.0;
        let marketRegimeAdjustment = 1.0;
        try {
            // 1. Risk-based adjustment
            const currentPortfolioRisk = await this.calculatePortfolioRisk();
            if (currentPortfolioRisk.riskScore > 70) {
                riskAdjustment = 0.5;
                reasoning.push('High portfolio risk detected - reducing position size by 50%');
            }
            else if (currentPortfolioRisk.riskScore > 50) {
                riskAdjustment = 0.75;
                reasoning.push('Moderate portfolio risk - reducing position size by 25%');
            }
            else {
                reasoning.push('Portfolio risk within normal limits');
            }
            // 2. Volatility adjustment
            const volatility = this.calculateInstrumentVolatility(marketData);
            const normalizedVol = volatility / 0.20; // Normalize to 20% baseline
            if (normalizedVol > 1.5) {
                volatilityAdjustment = 0.6;
                reasoning.push(`High volatility (${(volatility * 100).toFixed(1)}%) - reducing size by 40%`);
            }
            else if (normalizedVol > 1.2) {
                volatilityAdjustment = 0.8;
                reasoning.push(`Elevated volatility - reducing size by 20%`);
            }
            else if (normalizedVol < 0.7) {
                volatilityAdjustment = 1.2;
                reasoning.push('Low volatility environment - increasing size by 20%');
            }
            // 3. Correlation adjustment\n      const avgCorrelation = this.calculateAverageCorrelation(symbol);
            if (avgCorrelation > 0.7) {
                correlationAdjustment = 0.7;
                reasoning.push('High correlation with existing positions - reducing size');
            }
            else if (avgCorrelation < 0.3) {
                correlationAdjustment = 1.1;
                reasoning.push('Low correlation provides diversification benefit');
            }
            // 4. Market regime adjustment
            const marketRegime = this.identifyMarketRegime(marketData);
            if (marketRegime.stress_level === 'HIGH') {
                marketRegimeAdjustment = 0.6;
                reasoning.push('High market stress - significant size reduction');
            }
            else if (marketRegime.stress_level === 'MODERATE') {
                marketRegimeAdjustment = 0.8;
                reasoning.push('Moderate market stress - minor size reduction');
            }
            // 5. Position concentration check
            const concentrationLimit = this.checkConcentrationLimit(symbol, strategy);
            if (concentrationLimit < 1.0) {
                reasoning.push(`Position concentration limit applied: ${(concentrationLimit * 100).toFixed(0)}%`);
            }
            // Calculate final size
            const recommendedSize = baseSize * riskAdjustment * volatilityAdjustment *
                correlationAdjustment * marketRegimeAdjustment * concentrationLimit;
            // Risk check
            const riskAmount = Math.abs(entryPrice - stopLoss) * recommendedSize;
            const riskPercent = riskAmount / portfolioValue;
            let finalSize = recommendedSize;
            if (riskPercent > this.riskParams.maxSinglePositionRisk) {
                finalSize = (portfolioValue * this.riskParams.maxSinglePositionRisk) / Math.abs(entryPrice - stopLoss);
                reasoning.push(`Size limited by maximum single position risk rule`);
            }
            console.log(`✅ Dynamic position sizing completed for ${symbol}`);
            return {
                recommendedSize,
                riskAdjustment,
                volatilityAdjustment,
                correlationAdjustment,
                marketRegimeAdjustment,
                finalSize,
                reasoning
            };
        }
        catch (error) {
            console.error('Error in dynamic position sizing:', error);
            return {
                recommendedSize: baseSize * 0.5, // Conservative fallback
                riskAdjustment: 0.5,
                volatilityAdjustment: 1.0,
                correlationAdjustment: 1.0,
                marketRegimeAdjustment: 1.0,
                finalSize: baseSize * 0.5,
                reasoning: ['Error in calculation - using conservative 50% size']
            };
        }
    }
    /**
     * Calculate comprehensive portfolio risk metrics
     */
    async calculatePortfolioRisk() {
        try {
            const positions = Array.from(this.positions.values());
            if (positions.length === 0) {
                return this.getZeroRiskMetrics();
            }
            // 1. Total risk calculation
            const totalRisk = positions.reduce((sum, pos) => sum + pos.riskPercent, 0);
            // 2. Concentration risk
            const concentrationRisk = this.calculateConcentrationRisk(positions);
            // 3. Correlation risk
            const correlationRisk = await this.calculateCorrelationRisk(positions);
            // 4. Leverage risk
            const leverageRisk = this.calculateLeverageRisk(positions);
            // 5. Liquidity risk
            const liquidityRisk = this.calculateLiquidityRisk(positions);
            // 6. Time risk
            const timeRisk = this.calculateTimeRisk(positions);
            // 7. Value at Risk calculations
            const varMetrics = this.calculateVaRMetrics(positions);
            // 8. Maximum drawdown risk
            const maxDrawdownRisk = this.calculateCurrentDrawdown();
            // 9. Overall risk score
            const riskScore = this.calculateOverallRiskScore({
                totalRisk,
                concentrationRisk,
                correlationRisk,
                leverageRisk,
                liquidityRisk,
                timeRisk,
                maxDrawdownRisk
            });
            const portfolioRisk = {
                totalRisk,
                concentrationRisk,
                correlationRisk,
                leverageRisk,
                liquidityRisk,
                timeRisk,
                var95: varMetrics.var95,
                var99: varMetrics.var99,
                expectedShortfall: varMetrics.expectedShortfall,
                maxDrawdownRisk,
                riskScore
            };
            // Store in history
            this.riskHistory.push({
                timestamp: new Date(),
                portfolio_risk: portfolioRisk
            });
            // Keep only last 100 entries
            if (this.riskHistory.length > 100) {
                this.riskHistory = this.riskHistory.slice(-100);
            }
            return portfolioRisk;
        }
        catch (error) {
            console.error('Error calculating portfolio risk:', error);
            return this.getZeroRiskMetrics();
        }
    }
    /**
     * Generate risk alerts based on current conditions
     */
    async generateRiskAlerts() {
        const alerts = [];
        const portfolioRisk = await this.calculatePortfolioRisk();
        // Portfolio-level alerts
        if (portfolioRisk.riskScore > 80) {
            alerts.push({
                level: 'CRITICAL',
                type: 'PORTFOLIO',
                message: 'Portfolio risk score critically high',
                value: portfolioRisk.riskScore,
                threshold: 80,
                timestamp: new Date(),
                action_required: 'Reduce position sizes immediately'
            });
        }
        else if (portfolioRisk.riskScore > 65) {
            alerts.push({
                level: 'WARNING',
                type: 'PORTFOLIO',
                message: 'Portfolio risk score elevated',
                value: portfolioRisk.riskScore,
                threshold: 65,
                timestamp: new Date(),
                action_required: 'Monitor closely and consider reducing exposure'
            });
        }
        // Concentration risk alerts
        if (portfolioRisk.concentrationRisk > 0.7) {
            alerts.push({
                level: 'WARNING',
                type: 'PORTFOLIO',
                message: 'High concentration risk detected',
                value: portfolioRisk.concentrationRisk,
                threshold: 0.7,
                timestamp: new Date(),
                action_required: 'Diversify positions across more instruments'
            });
        }
        // Correlation risk alerts
        if (portfolioRisk.correlationRisk > 0.8) {
            alerts.push({
                level: 'WARNING',
                type: 'PORTFOLIO',
                message: 'High correlation risk between positions',
                value: portfolioRisk.correlationRisk,
                threshold: 0.8,
                timestamp: new Date(),
                action_required: 'Review position correlations and reduce correlated exposures'
            });
        }
        // Drawdown alerts
        if (portfolioRisk.maxDrawdownRisk > this.riskParams.maxDrawdown * 0.8) {
            alerts.push({
                level: 'WARNING',
                type: 'PORTFOLIO',
                message: 'Approaching maximum drawdown limit',
                value: portfolioRisk.maxDrawdownRisk,
                threshold: this.riskParams.maxDrawdown * 0.8,
                timestamp: new Date(),
                action_required: 'Consider stopping trading to prevent further losses'
            });
        }
        // Position-level alerts
        for (const [symbol, position] of this.positions) {
            if (position.riskPercent > this.riskParams.maxSinglePositionRisk * 1.5) {
                alerts.push({
                    level: 'WARNING',
                    type: 'POSITION',
                    message: `Position size exceeds risk limits`,
                    symbol,
                    strategy: position.strategy,
                    value: position.riskPercent,
                    threshold: this.riskParams.maxSinglePositionRisk,
                    timestamp: new Date(),
                    action_required: 'Reduce position size'
                });
            }
            // Time-based alerts
            if (position.timeInPosition > 24) { // More than 24 hours
                alerts.push({
                    level: 'INFO',
                    type: 'POSITION',
                    message: `Long-term position detected`,
                    symbol,
                    strategy: position.strategy,
                    value: position.timeInPosition,
                    threshold: 24,
                    timestamp: new Date(),
                    action_required: 'Review position and consider profit taking'
                });
            }
        }
        return alerts;
    }
    /**
     * Update position information
     */
    updatePosition(position) {
        this.positions.set(position.symbol, position);
        // Update correlation matrix
        this.updateCorrelationMatrix(position.symbol);
    }
    /**
     * Remove closed position
     */
    removePosition(symbol) {
        this.positions.delete(symbol);
    }
    /**
     * Get risk recommendations based on current state
     */
    async getRiskRecommendations() {
        const recommendations = [];
        const portfolioRisk = await this.calculatePortfolioRisk();
        const alerts = await this.generateRiskAlerts();
        // General risk level recommendations
        if (portfolioRisk.riskScore < 30) {
            recommendations.push('✅ Risk levels are conservative - consider increasing position sizes');
        }
        else if (portfolioRisk.riskScore > 70) {
            recommendations.push('🚨 Risk levels are high - reduce position sizes immediately');
        }
        else if (portfolioRisk.riskScore > 50) {
            recommendations.push('⚠️ Risk levels are moderate - monitor closely');
        }
        // Specific risk factor recommendations
        if (portfolioRisk.concentrationRisk > 0.6) {
            recommendations.push('📊 High concentration detected - diversify across more instruments');
        }
        if (portfolioRisk.correlationRisk > 0.7) {
            recommendations.push('🔗 High correlation risk - reduce correlated positions');
        }
        if (portfolioRisk.leverageRisk > 0.8) {
            recommendations.push('⚖️ High leverage risk - reduce leverage or position sizes');
        }
        // Alert-based recommendations
        const criticalAlerts = alerts.filter(a => a.level === 'CRITICAL');
        if (criticalAlerts.length > 0) {
            recommendations.push(`🚨 ${criticalAlerts.length} critical risk alert(s) - immediate action required`);
        }
        // VaR-based recommendations
        if (portfolioRisk.var95 > 0.05) {
            recommendations.push('📈 95% VaR exceeds 5% - consider reducing overall exposure');
        }
        return recommendations.length > 0 ? recommendations : [
            '✅ All risk metrics within acceptable limits',
            '📊 Portfolio risk management is optimal'
        ];
    }
    // ============ Private Helper Methods ============
    calculateInstrumentVolatility(marketData) {
        try {
            const prices = [marketData['5m'].close, marketData['15m'].close, marketData['30m'].close];
            const returns = prices.slice(1).map((price, idx) => Math.log(price / prices[idx]));
            return ss.standardDeviation(returns) * Math.sqrt(252); // Annualized
        }
        catch (error) {
            return 0.20; // Default 20% volatility
        }
    }
    calculateAverageCorrelation(symbol) {
        const correlations = this.correlationMatrix.get(symbol);
        if (!correlations || correlations.size <= 1)
            return 0;
        const values = Array.from(correlations.values());
        return ss.mean(values);
    }
    identifyMarketRegime(marketData) {
        try {
            const volatility = this.calculateInstrumentVolatility(marketData);
            if (volatility > 0.40)
                return { stress_level: 'HIGH' };
            if (volatility > 0.25)
                return { stress_level: 'MODERATE' };
            return { stress_level: 'LOW' };
        }
        catch (error) {
            return { stress_level: 'MODERATE' };
        }
    }
    checkConcentrationLimit(symbol, strategy) {
        const existingPositions = Array.from(this.positions.values());
        const sameSymbolPositions = existingPositions.filter(p => p.symbol === symbol);
        const sameStrategyPositions = existingPositions.filter(p => p.strategy === strategy);
        // Limit multiple positions in same symbol
        if (sameSymbolPositions.length > 0)
            return 0.5;
        // Limit positions in same strategy
        if (sameStrategyPositions.length >= 3)
            return 0.7;
        return 1.0;
    }
    calculateConcentrationRisk(positions) {
        if (positions.length === 0)
            return 0;
        const risks = positions.map(p => p.riskPercent);
        const totalRisk = risks.reduce((sum, risk) => sum + risk, 0);
        if (totalRisk === 0)
            return 0;
        // Calculate Herfindahl-Hirschman Index for concentration
        const hhi = risks.reduce((sum, risk) => sum + Math.pow(risk / totalRisk, 2), 0);
        return Math.min(1, hhi * positions.length); // Normalize
    }
    async calculateCorrelationRisk(positions) {
        if (positions.length < 2)
            return 0;
        let totalCorrelation = 0;
        let pairs = 0;
        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                const corr = this.getPositionCorrelation(positions[i].symbol, positions[j].symbol);
                totalCorrelation += Math.abs(corr);
                pairs++;
            }
        }
        return pairs > 0 ? totalCorrelation / pairs : 0;
    }
    calculateLeverageRisk(positions) {
        const totalExposure = positions.reduce((sum, pos) => sum + Math.abs(pos.positionSize * pos.current_price), 0);
        // Assuming portfolio value is 100,000 for calculation
        const leverage = totalExposure / 100000;
        return Math.min(1, leverage / this.riskParams.maxLeverage);
    }
    calculateLiquidityRisk(positions) {
        // Simplified liquidity risk based on position sizes
        // In practice, this would consider bid-ask spreads, market depth, etc.
        const avgPositionSize = positions.length > 0 ?
            positions.reduce((sum, pos) => sum + Math.abs(pos.positionSize), 0) / positions.length : 0;
        // Normalize to 0-1 scale
        return Math.min(1, avgPositionSize / 1000);
    }
    calculateTimeRisk(positions) {
        if (positions.length === 0)
            return 0;
        const avgTimeInPosition = positions.reduce((sum, pos) => sum + pos.timeInPosition, 0) / positions.length;
        // Risk increases with time (simplified model)
        return Math.min(1, avgTimeInPosition / 168); // Normalize to weekly holding
    }
    calculateVaRMetrics(positions) {
        if (positions.length === 0) {
            return { var95: 0, var99: 0, expectedShortfall: 0 };
        }
        // Simplified VaR calculation using position risks
        const risks = positions.map(p => p.riskPercent);
        const totalRisk = risks.reduce((sum, risk) => sum + risk, 0);
        // Assume normal distribution for simplification
        const volatility = risks.length > 1 ? ss.standardDeviation(risks) : totalRisk;
        const var95 = totalRisk + 1.645 * volatility; // 95% confidence
        const var99 = totalRisk + 2.326 * volatility; // 99% confidence
        const expectedShortfall = var95 * 1.3; // Simplified ES calculation
        return { var95, var99, expectedShortfall };
    }
    calculateCurrentDrawdown() {
        if (this.riskHistory.length < 2)
            return 0;
        const returns = this.riskHistory.map(h => h.portfolio_risk.totalRisk);
        let maxReturn = returns[0];
        let maxDrawdown = 0;
        for (const ret of returns) {
            if (ret > maxReturn)
                maxReturn = ret;
            const drawdown = (maxReturn - ret) / maxReturn;
            if (drawdown > maxDrawdown)
                maxDrawdown = drawdown;
        }
        return maxDrawdown;
    }
    calculateOverallRiskScore(components) {
        const weights = {
            totalRisk: 0.25,
            concentrationRisk: 0.15,
            correlationRisk: 0.15,
            leverageRisk: 0.15,
            liquidityRisk: 0.10,
            timeRisk: 0.10,
            maxDrawdownRisk: 0.10
        };
        let score = 0;
        score += (components.totalRisk / this.riskParams.maxPortfolioRisk) * weights.totalRisk * 100;
        score += components.concentrationRisk * weights.concentrationRisk * 100;
        score += components.correlationRisk * weights.correlationRisk * 100;
        score += components.leverageRisk * weights.leverageRisk * 100;
        score += components.liquidityRisk * weights.liquidityRisk * 100;
        score += components.timeRisk * weights.timeRisk * 100;
        score += (components.maxDrawdownRisk / this.riskParams.maxDrawdown) * weights.maxDrawdownRisk * 100;
        return Math.max(0, Math.min(100, score));
    }
    updateCorrelationMatrix(symbol) {
        // Simplified correlation update (in practice, would calculate from returns)
        if (!this.correlationMatrix.has(symbol)) {
            this.correlationMatrix.set(symbol, new Map());
        }
        // Add random correlations for demonstration
        for (const [otherSymbol] of this.positions) {
            if (otherSymbol !== symbol) {
                const correlation = Math.random() * 0.6 - 0.3; // -0.3 to 0.3
                this.correlationMatrix.get(symbol)?.set(otherSymbol, correlation);
                if (!this.correlationMatrix.has(otherSymbol)) {
                    this.correlationMatrix.set(otherSymbol, new Map());
                }
                this.correlationMatrix.get(otherSymbol)?.set(symbol, correlation);
            }
        }
    }
    getPositionCorrelation(symbol1, symbol2) {
        return this.correlationMatrix.get(symbol1)?.get(symbol2) || 0;
    }
    getZeroRiskMetrics() {
        return {
            totalRisk: 0,
            concentrationRisk: 0,
            correlationRisk: 0,
            leverageRisk: 0,
            liquidityRisk: 0,
            timeRisk: 0,
            var95: 0,
            var99: 0,
            expectedShortfall: 0,
            maxDrawdownRisk: 0,
            riskScore: 0
        };
    }
}
// Export singleton instance
export const advancedRiskManager = new AdvancedRiskManager();
//# sourceMappingURL=advanced-risk-manager.js.map