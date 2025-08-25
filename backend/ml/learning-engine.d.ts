export interface LearningMetrics {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    confusionMatrix: number[][];
}
export interface FeatureImportance {
    rsi: number;
    macd: number;
    atr: number;
    volume: number;
    sentiment: number;
    smartMoney: number;
    priceAction: number;
    multiTimeframe: number;
}
export interface AdaptiveLearning {
    learningRate: number;
    regularization: number;
    batchSize: number;
    dropoutRate: number;
    optimizerType: string;
}
export interface ModelStats {
    modelVersion: string;
    currentEpoch: number;
    trainingDataPoints: number;
    lastAccuracy: number;
    totalUpdates: number;
}
export declare class MLLearningEngine {
    private modelVersion;
    private currentEpoch;
    private featureScalers;
    private regressionModels;
    private trainingHistory;
    /**
     * Simplified ML model training with statistical methods
     */
    trainModel(marketData: any[], signals: any[]): Promise<LearningMetrics>;
    /**
     * Extract features from market data
     */
    private extractFeatures;
    /**
     * Prepare labels from trading signals
     */
    private prepareLabels;
    /**
     * Train simple statistical model
     */
    private trainStatisticalModel;
    /**
     * Calculate correlation between features and labels
     */
    private calculateCorrelation;
    /**
     * Make predictions using the trained model
     */
    private makePredictions;
    /**
     * Calculate performance metrics
     */
    private calculateMetrics;
    /**
     * Save model performance to database
     */
    private saveModelPerformance;
    /**
     * Predict signal success probability
     */
    predictSignalSuccess(marketData: any): Promise<number>;
    /**
     * Get feature importance
     */
    getFeatureImportance(): Promise<FeatureImportance>;
    /**
     * Update model with new data (incremental learning)
     */
    updateModel(newData: any[], newSignals: any[]): Promise<void>;
    /**
     * Get model statistics
     */
    getModelStats(): Promise<ModelStats>;
}
export declare const mlEngine: MLLearningEngine;
