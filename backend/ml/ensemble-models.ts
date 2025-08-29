/**
 * Ensemble Learning System for Trading Signals
 * Combines multiple models for improved accuracy and robustness
 */

import { AdvancedFeatures } from "./enhanced-features";

export interface ModelPrediction {
  direction: "LONG" | "SHORT";
  confidence: number;
  modelName: string;
  features: number[];
}

export interface EnsembleResult {
  finalDirection: "LONG" | "SHORT";
  ensembleConfidence: number;
  modelAgreement: number;
  individualPredictions: ModelPrediction[];
  diversityScore: number;
  uncertaintyEstimate: number;
}

export class TradingEnsemble {
  private models: TradingModel[] = [];
  
  constructor() {
    this.initializeModels();
  }
  
  private initializeModels() {
    // Initialize different model types
    this.models = [
      new TechnicalAnalysisModel("Technical"),
      new MomentumModel("Momentum"), 
      new MeanReversionModel("MeanReversion"),
      new BreakoutModel("Breakout"),
      new VolumeProfileModel("VolumeProfile"),
      new RegimeDetectionModel("RegimeDetection")
    ];
  }
  
  /**
   * Generate ensemble prediction from multiple models
   */
  async predict(
    marketData: any,
    advancedFeatures: AdvancedFeatures,
    symbol: string
  ): Promise<EnsembleResult> {
    
    // Get predictions from all models
    const predictions = await Promise.all(
      this.models.map(model => model.predict(marketData, advancedFeatures, symbol))
    );
    
    // Calculate ensemble metrics
    const modelAgreement = this.calculateModelAgreement(predictions);
    const diversityScore = this.calculateDiversityScore(predictions);
    const uncertaintyEstimate = this.calculateUncertaintyEstimate(predictions);
    
    // Combine predictions using sophisticated weighted voting
    const ensembleResult = this.combinePreferences(predictions, advancedFeatures);
    
    return {
      finalDirection: ensembleResult.direction,
      ensembleConfidence: ensembleResult.confidence,
      modelAgreement,
      individualPredictions: predictions,
      diversityScore,
      uncertaintyEstimate
    };
  }
  
  private calculateModelAgreement(predictions: ModelPrediction[]): number {
    const longCount = predictions.filter(p => p.direction === "LONG").length;
    const shortCount = predictions.filter(p => p.direction === "SHORT").length;
    const total = predictions.length;
    
    return Math.max(longCount, shortCount) / total;
  }
  
  private calculateDiversityScore(predictions: ModelPrediction[]): number {
    // Calculate diversity in confidence levels
    const confidences = predictions.map(p => p.confidence);
    const mean = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    const variance = confidences.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / confidences.length;
    
    return Math.sqrt(variance) / 100; // Normalize to 0-1
  }
  
  private calculateUncertaintyEstimate(predictions: ModelPrediction[]): number {
    // Uncertainty increases when models disagree
    const agreement = this.calculateModelAgreement(predictions);
    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
    
    // Higher uncertainty when low agreement or low average confidence
    return Math.max(0, Math.min(1, (1 - agreement) + (1 - avgConfidence / 100)));
  }
  
  private combinePreferences(
    predictions: ModelPrediction[],
    features: AdvancedFeatures
  ): { direction: "LONG" | "SHORT"; confidence: number } {
    
    // Dynamic weight assignment based on market conditions
    const weights = this.calculateDynamicWeights(predictions, features);
    
    let longScore = 0;
    let shortScore = 0;
    
    predictions.forEach((pred, index) => {
      const weight = weights[index];
      const score = pred.confidence * weight;
      
      if (pred.direction === "LONG") {
        longScore += score;
      } else {
        shortScore += score;
      }
    });
    
    const totalScore = longScore + shortScore;
    const finalDirection = longScore > shortScore ? "LONG" : "SHORT";
    const rawConfidence = Math.max(longScore, shortScore) / totalScore;
    
    // Apply ensemble-specific adjustments
    const ensembleConfidence = this.adjustEnsembleConfidence(
      rawConfidence,
      predictions,
      features
    );
    
    return {
      direction: finalDirection,
      confidence: ensembleConfidence * 100
    };
  }
  
  private calculateDynamicWeights(
    predictions: ModelPrediction[],
    features: AdvancedFeatures
  ): number[] {
    const weights = new Array(predictions.length).fill(1);
    
    // Regime-based weight adjustment
    switch (features.regime.trend_regime) {
      case "TRENDING":
        // Boost momentum and breakout models
        weights[1] *= 1.3; // Momentum
        weights[3] *= 1.2; // Breakout
        weights[2] *= 0.8; // Mean reversion
        break;
        
      case "RANGING":
        // Boost mean reversion and technical models
        weights[2] *= 1.4; // Mean reversion
        weights[0] *= 1.2; // Technical
        weights[1] *= 0.7; // Momentum
        break;
        
      case "BREAKOUT":
        // Boost breakout and volume models
        weights[3] *= 1.5; // Breakout
        weights[4] *= 1.3; // Volume profile
        weights[2] *= 0.6; // Mean reversion
        break;
    }
    
    // Volatility regime adjustment
    switch (features.regime.volatility_regime) {
      case "LOW":
        // Reduce all model weights slightly
        weights.forEach((w, i) => weights[i] = w * 0.9);
        break;
        
      case "HIGH":
      case "CRISIS":
        // Boost regime detection and reduce others
        weights[5] *= 1.4; // Regime detection
        weights.forEach((w, i) => {
          if (i !== 5) weights[i] = w * 0.8;
        });
        break;
    }
    
    // Normalize weights
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    return weights.map(w => w / totalWeight);
  }
  
  private adjustEnsembleConfidence(
    rawConfidence: number,
    predictions: ModelPrediction[],
    features: AdvancedFeatures
  ): number {
    let adjustedConfidence = rawConfidence;
    
    // Boost confidence when models strongly agree
    const agreement = this.calculateModelAgreement(predictions);
    if (agreement > 0.8) {
      adjustedConfidence *= 1.1;
    } else if (agreement < 0.6) {
      adjustedConfidence *= 0.9;
    }
    
    // Adjust based on market conditions
    if (features.regime.volatility_regime === "CRISIS") {
      adjustedConfidence *= 0.8;
    } else if (features.regime.volatility_regime === "NORMAL") {
      adjustedConfidence *= 1.05;
    }
    
    // Temporal adjustments
    if (features.temporal.session_effect > 0.8) {
      adjustedConfidence *= 1.1;
    } else if (features.temporal.session_effect < 0.4) {
      adjustedConfidence *= 0.9;
    }
    
    return Math.min(0.98, Math.max(0.15, adjustedConfidence));
  }
}

// Base Model Interface
abstract class TradingModel {
  protected name: string;
  protected historicalAccuracy: number = 0.75;
  
  constructor(name: string) {
    this.name = name;
  }
  
  abstract predict(
    marketData: any,
    features: AdvancedFeatures,
    symbol: string
  ): Promise<ModelPrediction>;
  
  protected extractFeatures(marketData: any, features: AdvancedFeatures): number[] {
    // Base feature extraction - to be overridden by specific models
    return [
      features.technical.rsi_momentum,
      features.technical.macd_divergence,
      features.microstructure.order_flow_imbalance,
      features.temporal.session_effect
    ];
  }
}

// Specific Model Implementations
class TechnicalAnalysisModel extends TradingModel {
  async predict(
    marketData: any,
    features: AdvancedFeatures,
    symbol: string
  ): Promise<ModelPrediction> {
    
    const modelFeatures = [
      features.technical.rsi_momentum,
      features.technical.macd_divergence,
      features.technical.bollinger_squeeze,
      features.technical.market_structure_break
    ];
    
    // Technical analysis logic
    let score = 0;
    score += features.technical.rsi_momentum * 0.3;
    score += features.technical.macd_divergence * 0.3;
    score += features.technical.market_structure_break * 0.4;
    
    const direction = score > 0 ? "LONG" : "SHORT";
    const confidence = Math.min(95, 65 + Math.abs(score) * 30);
    
    return {
      direction,
      confidence,
      modelName: this.name,
      features: modelFeatures
    };
  }
}

class MomentumModel extends TradingModel {
  async predict(
    marketData: any,
    features: AdvancedFeatures,
    symbol: string
  ): Promise<ModelPrediction> {
    
    const modelFeatures = [
      features.technical.rsi_momentum,
      features.microstructure.tick_direction_bias,
      features.crossAsset.relative_strength,
      features.technical.market_structure_break
    ];
    
    // Momentum-based logic
    let score = 0;
    score += features.technical.rsi_momentum * 0.4;
    score += features.microstructure.tick_direction_bias * 0.3;
    score += features.crossAsset.relative_strength * 0.3;
    
    const direction = score > 0 ? "LONG" : "SHORT";
    const confidence = Math.min(92, 60 + Math.abs(score) * 35);
    
    return {
      direction,
      confidence,
      modelName: this.name,
      features: modelFeatures
    };
  }
}

class MeanReversionModel extends TradingModel {
  async predict(
    marketData: any,
    features: AdvancedFeatures,
    symbol: string
  ): Promise<ModelPrediction> {
    
    const modelFeatures = [
      features.technical.bollinger_squeeze,
      features.technical.volume_profile_poc,
      features.microstructure.order_flow_imbalance,
      -features.technical.rsi_momentum // Contrarian
    ];
    
    // Mean reversion logic (contrarian)
    let score = 0;
    score += features.technical.bollinger_squeeze * 0.4;
    score -= features.technical.rsi_momentum * 0.3; // Contrarian
    score += features.microstructure.order_flow_imbalance * 0.3;
    
    const direction = score > 0 ? "LONG" : "SHORT";
    const confidence = Math.min(88, 55 + Math.abs(score) * 30);
    
    return {
      direction,
      confidence,
      modelName: this.name,
      features: modelFeatures
    };
  }
}

class BreakoutModel extends TradingModel {
  async predict(
    marketData: any,
    features: AdvancedFeatures,
    symbol: string
  ): Promise<ModelPrediction> {
    
    const modelFeatures = [
      features.technical.market_structure_break,
      features.technical.bollinger_squeeze,
      features.microstructure.liquidity_depth,
      features.temporal.session_effect
    ];
    
    // Breakout detection logic
    let score = 0;
    score += features.technical.market_structure_break * 0.5;
    score += features.technical.bollinger_squeeze * 0.2;
    score += features.temporal.session_effect * 0.3;
    
    const direction = score > 0 ? "LONG" : "SHORT";
    const confidence = Math.min(90, 70 + Math.abs(score) * 25);
    
    return {
      direction,
      confidence,
      modelName: this.name,
      features: modelFeatures
    };
  }
}

class VolumeProfileModel extends TradingModel {
  async predict(
    marketData: any,
    features: AdvancedFeatures,
    symbol: string
  ): Promise<ModelPrediction> {
    
    const data5m = marketData["5m"];
    const currentPrice = data5m.close;
    const poc = features.technical.volume_profile_poc;
    
    const modelFeatures = [
      features.technical.volume_profile_poc,
      features.microstructure.order_flow_imbalance,
      features.microstructure.liquidity_depth,
      currentPrice - poc // Distance from POC
    ];
    
    // Volume profile logic
    let score = 0;
    if (currentPrice > poc) {
      score += 0.5; // Above POC = bullish
    } else {
      score -= 0.5; // Below POC = bearish
    }
    
    score += features.microstructure.order_flow_imbalance * 0.5;
    
    const direction = score > 0 ? "LONG" : "SHORT";
    const confidence = Math.min(85, 65 + Math.abs(score) * 20);
    
    return {
      direction,
      confidence,
      modelName: this.name,
      features: modelFeatures
    };
  }
}

class RegimeDetectionModel extends TradingModel {
  async predict(
    marketData: any,
    features: AdvancedFeatures,
    symbol: string
  ): Promise<ModelPrediction> {
    
    const modelFeatures = [
      this.encodeRegime(features.regime.trend_regime),
      this.encodeRegime(features.regime.volatility_regime),
      this.encodeRegime(features.regime.volume_regime),
      features.temporal.session_effect
    ];
    
    // Regime-based prediction logic
    let score = 0;
    
    switch (features.regime.trend_regime) {
      case "TRENDING":
        score += features.technical.rsi_momentum > 0 ? 0.4 : -0.4;
        break;
      case "RANGING":
        score -= features.technical.rsi_momentum * 0.3; // Contrarian in range
        break;
      case "BREAKOUT":
        score += features.technical.market_structure_break * 0.5;
        break;
    }
    
    // Volatility regime adjustment
    if (features.regime.volatility_regime === "CRISIS") {
      score *= 0.7; // Reduce conviction in crisis
    }
    
    const direction = score > 0 ? "LONG" : "SHORT";
    const confidence = Math.min(88, 60 + Math.abs(score) * 28);
    
    return {
      direction,
      confidence,
      modelName: this.name,
      features: modelFeatures
    };
  }
  
  private encodeRegime(regime: string): number {
    // Simple encoding for regime types
    return regime.length / 10; // Placeholder encoding
  }
}

// Export singleton
export const tradingEnsemble = new TradingEnsemble();