/**
 * Advanced Performance Monitoring and Model Evaluation System
 *
 * This module provides comprehensive monitoring of trading performance,
 * model evaluation metrics, real-time alerting, and adaptive model
 * retraining recommendations based on performance degradation.
 */
export interface PerformanceMetrics {
    period: string;
    total_signals: number;
    executed_trades: number;
    win_rate: number;
    avg_profit: number;
    avg_loss: number;
    profit_factor: number;
    sharpe_ratio: number;
    max_drawdown: number;
    total_return: number;
    volatility: number;
    alpha: number;
    beta: number;
    information_ratio: number;
    calmar_ratio: number;
}
export interface ModelEvaluationMetrics {
    model_name: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    auc_roc: number;
    prediction_calibration: number;
    feature_importance_stability: number;
    concept_drift_score: number;
    overfitting_indicator: number;
    generalization_error: number;
}
export interface PredictionPerformance {
    accuracy: number;
    precision: number;
    recall: number;
}
export interface PerformanceAlert {
    id: string;
    level: 'INFO' | 'WARNING' | 'CRITICAL';
    category: 'PERFORMANCE' | 'MODEL' | 'RISK' | 'SYSTEM';
    title: string;
    description: string;
    metric_name: string;
    current_value: number;
    threshold_value: number;
    trend: 'IMPROVING' | 'STABLE' | 'DEGRADING';
    recommendation: string;
    timestamp: Date;
    acknowledged: boolean;
}
export interface ModelDriftDetection {
    model_name: string;
    drift_detected: boolean;
    drift_magnitude: number;
    affected_features: string[];
    drift_type: 'GRADUAL' | 'SUDDEN' | 'INCREMENTAL' | 'RECURRING';
    confidence: number;
    recommendation: 'MONITOR' | 'RETRAIN' | 'URGENT_RETRAIN' | 'REPLACE_MODEL';
    estimated_performance_impact: number;
}
export interface AdaptiveRecommendation {
    type: 'STRATEGY_ADJUSTMENT' | 'MODEL_RETRAIN' | 'RISK_ADJUSTMENT' | 'PARAMETER_OPTIMIZATION';
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    expected_improvement: number;
    implementation_complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
    estimated_impact: string;
    action_steps: string[];
}
export declare class PerformanceMonitor {
    private performanceHistory;
    private modelMetrics;
    private activeAlerts;
    private driftDetectors;
    /**
     * Monitor real-time performance and generate insights
     */
    monitorPerformance(): Promise<{
        performance_summary: PerformanceMetrics;
        model_evaluation: ModelEvaluationMetrics[];
        active_alerts: PerformanceAlert[];
        drift_detection: ModelDriftDetection[];
        recommendations: AdaptiveRecommendation[];
    }>;
    /**
     * Collect comprehensive performance metrics from database
     */
    private collectPerformanceMetrics;
    /**
     * Evaluate ML model performance and stability
     */
    private evaluateModels;
    /**
     * Evaluate individual model performance
     */
    private evaluateIndividualModel;
    /**
     * Detect concept drift in models
     */
    private detectConceptDrift;
    /**
     * Generate performance alerts based on thresholds
     */
    private generatePerformanceAlerts;
    /**
     * Generate adaptive recommendations for system improvement
     */
    private generateAdaptiveRecommendations;
    private updatePerformanceHistory;
    private calculateAUCROC;
    private calculatePredictionCalibration;
    private calculateFeatureImportanceStability;
    private calculateConceptDriftScore;
    private calculateOverfittingIndicator;
    private calculateGeneralizationError;
    private getRecentPredictionPerformance;
    private getHistoricalPredictionPerformance;
    private detectModelDrift;
    private getDefaultPerformanceMetrics;
    private getDefaultModelEvaluation;
    /**
     * Get performance dashboard data
     */
    getPerformanceDashboard(): Promise<{
        current_performance: PerformanceMetrics;
        performance_trend: Array<{
            date: string;
            performance: number;
        }>;
        model_health: Array<{
            model: string;
            health_score: number;
        }>;
        active_alerts_count: number;
        recommendations_count: number;
    }>;
}
export declare const performanceMonitor: PerformanceMonitor;
