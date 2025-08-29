/**
 * Advanced Feedback Engine for Continuous AI Improvement
 * Sistema di feedback avanzato per il miglioramento continuo dell'AI
 * Versione: 3.0 - Sistema completo di apprendimento automatico
 */

import { api, Query } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import log from "encore.dev/log";

// Database per il feedback del sistema
const feedbackDB = new SQLDatabase("feedback", {
  migrations: "./migrations",
});

// === INTERFACCE ===

interface TradeResult {
  tradeId: string;
  symbol: string;
  strategy: string;
  predictedOutcome: "WIN" | "LOSS";
  actualOutcome: "WIN" | "LOSS";
  confidenceScore: number;
  entryPrice: number;
  exitPrice: number;
  profitLoss: number;
  duration: number; // in minutes
  maxDrawdown: number;
  timestamp: Date;
  
  // Condizioni di mercato al momento del trade
  marketConditions: {
    volatility: number;
    trend: "BULL" | "BEAR" | "SIDEWAYS";
    volume: "HIGH" | "MEDIUM" | "LOW";
    newsImpact: "HIGH" | "MEDIUM" | "LOW";
    sessionQuality: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  };
  
  // Features utilizzate dalla rete neurale
  features: {
    priceAction: number;
    volumeProfile: number;
    smartMoney: number;
    technicalIndicators: number;
    newsScore: number;
    marketRegime: number;
  };
}

interface FeedbackMetrics {
  totalTrades: number;
  correctPredictions: number;
  accuracy: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  avgWin: number;
  avgLoss: number;
  winRate: number;
  
  // Metriche per strategia
  strategyPerformance: Map<string, {
    trades: number;
    accuracy: number;
    profitLoss: number;
    avgConfidence: number;
  }>;
  
  // Analisi degli errori
  errorAnalysis: {
    falsePositives: number;
    falseNegatives: number;
    lowConfidenceWins: number;
    highConfidenceLosses: number;
    commonFailurePatterns: string[];
  };
}

interface ModelAdjustment {
  adjustmentType: "WEIGHT_UPDATE" | "FEATURE_IMPORTANCE" | "THRESHOLD_ADJUSTMENT" | "STRATEGY_OPTIMIZATION";
  description: string;
  parameters: Record<string, number>;
  expectedImprovement: number;
  confidenceLevel: number;
}

// === SERVIZI PRINCIPALI ===

export const recordTradeResult = api<{ result: TradeResult }, { success: boolean; feedbackId: string }>(
  { method: "POST", path: "/ml/feedback/record" },
  async ({ result }) => {
    try {
      // Registra il risultato del trade nel database
      const feedbackId = await feedbackDB.exec`
        INSERT INTO trade_results 
        (trade_id, symbol, strategy, predicted_outcome, actual_outcome, confidence_score, 
         entry_price, exit_price, profit_loss, duration, max_drawdown, timestamp,
         volatility, trend, volume, news_impact, session_quality,
         price_action_score, volume_profile_score, smart_money_score, 
         technical_indicators_score, news_score, market_regime_score)
        VALUES 
        (${result.tradeId}, ${result.symbol}, ${result.strategy}, ${result.predictedOutcome}, 
         ${result.actualOutcome}, ${result.confidenceScore}, ${result.entryPrice}, 
         ${result.exitPrice}, ${result.profitLoss}, ${result.duration}, ${result.maxDrawdown}, 
         ${result.timestamp}, ${result.marketConditions.volatility}, ${result.marketConditions.trend}, 
         ${result.marketConditions.volume}, ${result.marketConditions.newsImpact}, 
         ${result.marketConditions.sessionQuality}, ${result.features.priceAction}, 
         ${result.features.volumeProfile}, ${result.features.smartMoney}, 
         ${result.features.technicalIndicators}, ${result.features.newsScore}, 
         ${result.features.marketRegime})
        RETURNING id
      `;

      // Analizza il feedback e aggiorna il modello se necessario
      await processTradeResult(result);
      
      log.info("Trade result recorded", { 
        tradeId: result.tradeId, 
        predicted: result.predictedOutcome, 
        actual: result.actualOutcome,
        profitLoss: result.profitLoss
      });
      
      return { success: true, feedbackId: feedbackId[0].id.toString() };
    } catch (error) {
      log.error("Error recording trade result", { error, tradeId: result.tradeId });
      throw new Error(`Failed to record trade result: ${error}`);
    }
  }
);

export const getFeedbackMetrics = api<{}, { metrics: FeedbackMetrics }>(
  { method: "GET", path: "/ml/feedback/metrics" },
  async () => {
    try {
      // Calcola le metriche complete del feedback
      const metrics = await calculateFeedbackMetrics();
      return { metrics };
    } catch (error) {
      log.error("Error getting feedback metrics", { error });
      throw new Error(`Failed to get feedback metrics: ${error}`);
    }
  }
);

export const analyzeModelPerformance = api<{}, { 
  analysis: {
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    suggestedAdjustments: ModelAdjustment[];
  }
}>(
  { method: "POST", path: "/ml/feedback/analyze" },
  async () => {
    try {
      const analysis = await performModelAnalysis();
      return { analysis };
    } catch (error) {
      log.error("Error analyzing model performance", { error });
      throw new Error(`Failed to analyze model performance: ${error}`);
    }
  }
);

export const optimizeModel = api<{ 
  adjustments: ModelAdjustment[] 
}, { 
  success: boolean; 
  improvementEstimate: number;
  newModelVersion: string;
}>(
  { method: "POST", path: "/ml/feedback/optimize" },
  async ({ adjustments }) => {
    try {
      const result = await applyModelOptimizations(adjustments);
      return result;
    } catch (error) {
      log.error("Error optimizing model", { error });
      throw new Error(`Failed to optimize model: ${error}`);
    }
  }
);

export const getAdaptiveLearningStatus = api<{}, {
  status: {
    learningRate: number;
    adaptationScore: number;
    lastOptimization: Date;
    pendingAdjustments: number;
    performanceTrend: "IMPROVING" | "STABLE" | "DECLINING";
    confidenceLevel: number;
    nextOptimizationETA: string;
  }
}>(
  { method: "GET", path: "/ml/feedback/adaptive-status" },
  async () => {
    try {
      const status = await getSystemAdaptiveStatus();
      return { status };
    } catch (error) {
      log.error("Error getting adaptive learning status", { error });
      throw new Error(`Failed to get adaptive learning status: ${error}`);
    }
  }
);

// === FUNZIONI CORE ===

async function processTradeResult(result: TradeResult): Promise<void> {
  // Analisi della predizione
  const isPredictionCorrect = result.predictedOutcome === result.actualOutcome;
  
  // Calcola metriche di confidenza vs risultato
  const confidenceAccuracy = calculateConfidenceAccuracy(result);
  
  // Aggiorna i pesi del modello basandosi sul risultato
  if (!isPredictionCorrect) {
    await updateModelWeights(result);
  }
  
  // Registra pattern di successo/fallimento
  await recordLearningPattern(result, isPredictionCorrect);
  
  // Verifica se è necessario un riaddestramento del modello
  const shouldRetrain = await shouldTriggerRetraining();
  if (shouldRetrain) {
    await triggerModelRetraining();
  }
}

async function calculateFeedbackMetrics(): Promise<FeedbackMetrics> {
  const trades = await feedbackDB.query`
    SELECT * FROM trade_results 
    WHERE timestamp > NOW() - INTERVAL '30 days'
    ORDER BY timestamp DESC
  `;
  
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      correctPredictions: 0,
      accuracy: 0,
      profitFactor: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      avgWin: 0,
      avgLoss: 0,
      winRate: 0,
      strategyPerformance: new Map(),
      errorAnalysis: {
        falsePositives: 0,
        falseNegatives: 0,
        lowConfidenceWins: 0,
        highConfidenceLosses: 0,
        commonFailurePatterns: []
      }
    };
  }
  
  const totalTrades = trades.length;
  const correctPredictions = trades.filter(t => t.predicted_outcome === t.actual_outcome).length;
  const winningTrades = trades.filter(t => t.profit_loss > 0);
  const losingTrades = trades.filter(t => t.profit_loss < 0);
  
  const totalProfit = winningTrades.reduce((sum, t) => sum + t.profit_loss, 0);
  const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profit_loss, 0));
  
  const accuracy = (correctPredictions / totalTrades) * 100;
  const winRate = (winningTrades.length / totalTrades) * 100;
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;
  
  const avgWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;
  
  // Calcola Sharpe Ratio
  const returns = trades.map(t => t.profit_loss);
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const returnStdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
  const sharpeRatio = returnStdDev > 0 ? avgReturn / returnStdDev : 0;
  
  const maxDrawdown = calculateMaxDrawdown(trades);
  
  // Analisi delle strategie
  const strategyPerformance = new Map<string, any>();
  const strategies = [...new Set(trades.map(t => t.strategy))];
  
  strategies.forEach(strategy => {
    const strategyTrades = trades.filter(t => t.strategy === strategy);
    const strategyCorrect = strategyTrades.filter(t => t.predicted_outcome === t.actual_outcome).length;
    const strategyPnL = strategyTrades.reduce((sum, t) => sum + t.profit_loss, 0);
    const avgConfidence = strategyTrades.reduce((sum, t) => sum + t.confidence_score, 0) / strategyTrades.length;
    
    strategyPerformance.set(strategy, {
      trades: strategyTrades.length,
      accuracy: (strategyCorrect / strategyTrades.length) * 100,
      profitLoss: strategyPnL,
      avgConfidence
    });
  });
  
  // Analisi degli errori
  const falsePositives = trades.filter(t => t.predicted_outcome === "WIN" && t.actual_outcome === "LOSS").length;
  const falseNegatives = trades.filter(t => t.predicted_outcome === "LOSS" && t.actual_outcome === "WIN").length;
  const lowConfidenceWins = trades.filter(t => t.confidence_score < 70 && t.profit_loss > 0).length;
  const highConfidenceLosses = trades.filter(t => t.confidence_score > 80 && t.profit_loss < 0).length;
  
  return {
    totalTrades,
    correctPredictions,
    accuracy,
    profitFactor,
    sharpeRatio,
    maxDrawdown,
    avgWin,
    avgLoss,
    winRate,
    strategyPerformance,
    errorAnalysis: {
      falsePositives,
      falseNegatives,
      lowConfidenceWins,
      highConfidenceLosses,
      commonFailurePatterns: await identifyFailurePatterns(trades)
    }
  };
}

async function performModelAnalysis(): Promise<any> {
  const metrics = await calculateFeedbackMetrics();
  const recentPerformance = await getRecentPerformanceTrend();
  
  const overallScore = calculateOverallScore(metrics);
  const strengths = identifyStrengths(metrics);
  const weaknesses = identifyWeaknesses(metrics);
  const recommendations = generateRecommendations(metrics, recentPerformance);
  const suggestedAdjustments = await generateModelAdjustments(metrics);
  
  return {
    overallScore,
    strengths,
    weaknesses,
    recommendations,
    suggestedAdjustments
  };
}

async function applyModelOptimizations(adjustments: ModelAdjustment[]): Promise<any> {
  let totalImprovement = 0;
  
  for (const adjustment of adjustments) {
    switch (adjustment.adjustmentType) {
      case "WEIGHT_UPDATE":
        await updateModelWeights(adjustment.parameters);
        break;
      case "FEATURE_IMPORTANCE":
        await adjustFeatureImportance(adjustment.parameters);
        break;
      case "THRESHOLD_ADJUSTMENT":
        await updateDecisionThresholds(adjustment.parameters);
        break;
      case "STRATEGY_OPTIMIZATION":
        await optimizeStrategyParameters(adjustment.parameters);
        break;
    }
    
    totalImprovement += adjustment.expectedImprovement;
  }
  
  const newModelVersion = `v${Date.now()}`;
  
  // Registra l'ottimizzazione
  await feedbackDB.exec`
    INSERT INTO model_optimizations 
    (version, adjustments, expected_improvement, timestamp)
    VALUES (${newModelVersion}, ${JSON.stringify(adjustments)}, ${totalImprovement}, NOW())
  `;
  
  return {
    success: true,
    improvementEstimate: totalImprovement,
    newModelVersion
  };
}

async function getSystemAdaptiveStatus(): Promise<any> {
  const lastOptimization = await feedbackDB.queryRow`
    SELECT * FROM model_optimizations 
    ORDER BY timestamp DESC 
    LIMIT 1
  `;
  
  const recentTrades = await feedbackDB.query`
    SELECT * FROM trade_results 
    WHERE timestamp > NOW() - INTERVAL '7 days'
  `;
  
  const learningRate = calculateCurrentLearningRate(recentTrades);
  const adaptationScore = calculateAdaptationScore(recentTrades);
  const performanceTrend = determinePerformanceTrend(recentTrades);
  const pendingAdjustments = await countPendingAdjustments();
  
  return {
    learningRate,
    adaptationScore,
    lastOptimization: lastOptimization?.timestamp || new Date(),
    pendingAdjustments,
    performanceTrend,
    confidenceLevel: calculateSystemConfidence(recentTrades),
    nextOptimizationETA: calculateNextOptimizationETA(recentTrades)
  };
}

// === FUNZIONI DI SUPPORTO ===

function calculateConfidenceAccuracy(result: TradeResult): number {
  const isCorrect = result.predictedOutcome === result.actualOutcome;
  const confidenceWeight = result.confidenceScore / 100;
  
  return isCorrect ? confidenceWeight : (1 - confidenceWeight);
}

async function updateModelWeights(result: TradeResult | Record<string, number>): Promise<void> {
  // Logica per aggiornare i pesi del modello basata sul risultato
  log.info("Updating model weights", { result });
}

async function recordLearningPattern(result: TradeResult, isCorrect: boolean): Promise<void> {
  await feedbackDB.exec`
    INSERT INTO learning_patterns 
    (trade_id, pattern_type, success, features, timestamp)
    VALUES 
    (${result.tradeId}, 'PREDICTION', ${isCorrect}, ${JSON.stringify(result.features)}, NOW())
  `;
}

async function shouldTriggerRetraining(): Promise<boolean> {
  const recentAccuracy = await feedbackDB.queryRow`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN predicted_outcome = actual_outcome THEN 1 END) as correct
    FROM trade_results 
    WHERE timestamp > NOW() - INTERVAL '24 hours'
  `;
  
  if (!recentAccuracy || recentAccuracy.total < 10) return false;
  
  const accuracy = recentAccuracy.correct / recentAccuracy.total;
  return accuracy < 0.6; // Riaddestra se l'accuratezza scende sotto il 60%
}

async function triggerModelRetraining(): Promise<void> {
  log.info("Triggering model retraining due to poor performance");
  
  // Qui si collegherebbe al sistema di training del modello
  await feedbackDB.exec`
    INSERT INTO training_requests (reason, timestamp, status)
    VALUES ('POOR_PERFORMANCE', NOW(), 'PENDING')
  `;
}

function calculateMaxDrawdown(trades: any[]): number {
  let maxDrawdown = 0;
  let peak = 0;
  let runningPnL = 0;
  
  for (const trade of trades) {
    runningPnL += trade.profit_loss;
    
    if (runningPnL > peak) {
      peak = runningPnL;
    }
    
    const drawdown = peak - runningPnL;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  return maxDrawdown;
}

async function identifyFailurePatterns(trades: any[]): Promise<string[]> {
  const patterns: string[] = [];
  
  // Analizza pattern di fallimento comuni
  const highVolatilityLosses = trades.filter(t => 
    t.profit_loss < 0 && t.volatility > 0.02
  ).length;
  
  if (highVolatilityLosses > trades.length * 0.3) {
    patterns.push("High volatility environments cause frequent losses");
  }
  
  const lowVolumeFailures = trades.filter(t =>
    t.profit_loss < 0 && t.volume === "LOW"
  ).length;
  
  if (lowVolumeFailures > trades.length * 0.25) {
    patterns.push("Low volume conditions reduce prediction accuracy");
  }
  
  return patterns;
}

async function getRecentPerformanceTrend(): Promise<"IMPROVING" | "STABLE" | "DECLINING"> {
  const recent = await feedbackDB.query`
    SELECT DATE(timestamp) as date, 
           AVG(CASE WHEN predicted_outcome = actual_outcome THEN 1.0 ELSE 0.0 END) as accuracy
    FROM trade_results 
    WHERE timestamp > NOW() - INTERVAL '14 days'
    GROUP BY DATE(timestamp)
    ORDER BY date
  `;
  
  if (recent.length < 3) return "STABLE";
  
  const firstThird = recent.slice(0, Math.floor(recent.length / 3)).reduce((sum, r) => sum + r.accuracy, 0) / Math.floor(recent.length / 3);
  const lastThird = recent.slice(-Math.floor(recent.length / 3)).reduce((sum, r) => sum + r.accuracy, 0) / Math.floor(recent.length / 3);
  
  if (lastThird > firstThird + 0.05) return "IMPROVING";
  if (lastThird < firstThird - 0.05) return "DECLINING";
  return "STABLE";
}

function calculateOverallScore(metrics: FeedbackMetrics): number {
  return (
    (metrics.accuracy * 0.3) +
    (metrics.winRate * 0.25) +
    (Math.min(metrics.profitFactor, 3) * 20) +
    (Math.max(0, 100 - metrics.maxDrawdown) * 0.15) +
    (Math.min(metrics.sharpeRatio, 3) * 10)
  );
}

function identifyStrengths(metrics: FeedbackMetrics): string[] {
  const strengths: string[] = [];
  
  if (metrics.accuracy > 70) strengths.push(`Excellent prediction accuracy: ${metrics.accuracy.toFixed(1)}%`);
  if (metrics.profitFactor > 1.5) strengths.push(`Strong profit factor: ${metrics.profitFactor.toFixed(2)}`);
  if (metrics.winRate > 60) strengths.push(`High win rate: ${metrics.winRate.toFixed(1)}%`);
  if (metrics.sharpeRatio > 1.0) strengths.push(`Good risk-adjusted returns: Sharpe ${metrics.sharpeRatio.toFixed(2)}`);
  
  return strengths;
}

function identifyWeaknesses(metrics: FeedbackMetrics): string[] {
  const weaknesses: string[] = [];
  
  if (metrics.accuracy < 60) weaknesses.push(`Low prediction accuracy: ${metrics.accuracy.toFixed(1)}%`);
  if (metrics.profitFactor < 1.2) weaknesses.push(`Poor profit factor: ${metrics.profitFactor.toFixed(2)}`);
  if (metrics.maxDrawdown > 20) weaknesses.push(`High drawdown risk: ${metrics.maxDrawdown.toFixed(1)}%`);
  if (metrics.errorAnalysis.highConfidenceLosses > 5) weaknesses.push(`Too many high-confidence losses: ${metrics.errorAnalysis.highConfidenceLosses}`);
  
  return weaknesses;
}

function generateRecommendations(metrics: FeedbackMetrics, trend: "IMPROVING" | "STABLE" | "DECLINING"): string[] {
  const recommendations: string[] = [];
  
  if (trend === "DECLINING") {
    recommendations.push("Consider retraining the model with recent market data");
  }
  
  if (metrics.errorAnalysis.falsePositives > metrics.errorAnalysis.falseNegatives) {
    recommendations.push("Increase prediction threshold to reduce false positives");
  }
  
  if (metrics.maxDrawdown > 15) {
    recommendations.push("Implement stricter risk management rules");
  }
  
  return recommendations;
}

async function generateModelAdjustments(metrics: FeedbackMetrics): Promise<ModelAdjustment[]> {
  const adjustments: ModelAdjustment[] = [];
  
  if (metrics.accuracy < 65) {
    adjustments.push({
      adjustmentType: "WEIGHT_UPDATE",
      description: "Update neural network weights to improve accuracy",
      parameters: { learningRate: 0.01, epochs: 50 },
      expectedImprovement: 5.0,
      confidenceLevel: 0.75
    });
  }
  
  if (metrics.errorAnalysis.highConfidenceLosses > 3) {
    adjustments.push({
      adjustmentType: "THRESHOLD_ADJUSTMENT",
      description: "Increase confidence threshold for trade execution",
      parameters: { minConfidence: 80 },
      expectedImprovement: 3.0,
      confidenceLevel: 0.85
    });
  }
  
  return adjustments;
}

async function adjustFeatureImportance(parameters: Record<string, number>): Promise<void> {
  log.info("Adjusting feature importance", { parameters });
}

async function updateDecisionThresholds(parameters: Record<string, number>): Promise<void> {
  log.info("Updating decision thresholds", { parameters });
}

async function optimizeStrategyParameters(parameters: Record<string, number>): Promise<void> {
  log.info("Optimizing strategy parameters", { parameters });
}

async function countPendingAdjustments(): Promise<number> {
  const result = await feedbackDB.queryRow`
    SELECT COUNT(*) as count FROM training_requests 
    WHERE status = 'PENDING'
  `;
  
  return result?.count || 0;
}

function calculateCurrentLearningRate(trades: any[]): number {
  return Math.min(0.1, trades.length / 1000);
}

function calculateAdaptationScore(trades: any[]): number {
  if (trades.length === 0) return 0;
  
  const recentAccuracy = trades.filter(t => t.predicted_outcome === t.actual_outcome).length / trades.length;
  return recentAccuracy * 100;
}

function determinePerformanceTrend(trades: any[]): "IMPROVING" | "STABLE" | "DECLINING" {
  if (trades.length < 10) return "STABLE";
  
  const mid = Math.floor(trades.length / 2);
  const firstHalf = trades.slice(0, mid);
  const secondHalf = trades.slice(mid);
  
  const firstHalfAccuracy = firstHalf.filter(t => t.predicted_outcome === t.actual_outcome).length / firstHalf.length;
  const secondHalfAccuracy = secondHalf.filter(t => t.predicted_outcome === t.actual_outcome).length / secondHalf.length;
  
  if (secondHalfAccuracy > firstHalfAccuracy + 0.05) return "IMPROVING";
  if (secondHalfAccuracy < firstHalfAccuracy - 0.05) return "DECLINING";
  return "STABLE";
}

function calculateSystemConfidence(trades: any[]): number {
  if (trades.length === 0) return 0;
  
  const avgConfidence = trades.reduce((sum, t) => sum + t.confidence_score, 0) / trades.length;
  const accuracy = trades.filter(t => t.predicted_outcome === t.actual_outcome).length / trades.length;
  
  return (avgConfidence * 0.6) + (accuracy * 40);
}

function calculateNextOptimizationETA(trades: any[]): string {
  const tradesPerDay = trades.length / 7;
  const daysUntilNextOptimization = Math.max(1, Math.ceil(50 / tradesPerDay));
  
  return `${daysUntilNextOptimization} days`;
}