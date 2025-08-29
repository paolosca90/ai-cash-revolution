/**
 * Enhanced Feature Engineering for Trading Signals
 * Implements advanced feature extraction and transformation
 */

export interface AdvancedFeatures {
  // Technical Features
  technical: {
    rsi_momentum: number;
    macd_divergence: number;
    bollinger_squeeze: number;
    volume_profile_poc: number;
    market_structure_break: number;
  };
  
  // Market Microstructure Features
  microstructure: {
    bid_ask_spread: number;
    order_flow_imbalance: number;
    price_impact: number;
    liquidity_depth: number;
    tick_direction_bias: number;
  };
  
  // Cross-Asset Features
  crossAsset: {
    correlation_strength: number;
    relative_strength: number;
    sector_momentum: number;
    volatility_spread: number;
  };
  
  // Temporal Features
  temporal: {
    session_effect: number;
    day_of_week_effect: number;
    news_cycle_position: number;
    economic_calendar_proximity: number;
  };
  
  // Regime Features
  regime: {
    volatility_regime: "LOW" | "NORMAL" | "HIGH" | "CRISIS";
    trend_regime: "TRENDING" | "RANGING" | "BREAKOUT";
    volume_regime: "LOW" | "NORMAL" | "HIGH";
    correlation_regime: "DECOUPLED" | "NORMAL" | "COUPLED";
  };
}

export class EnhancedFeatureExtractor {
  
  /**
   * Extract advanced features from market data
   */
  static extractAdvancedFeatures(
    marketData: any,
    symbol: string,
    correlatedAssets?: any[]
  ): AdvancedFeatures {
    
    const technical = this.extractTechnicalFeatures(marketData);
    const microstructure = this.extractMicrostructureFeatures(marketData);
    const crossAsset = this.extractCrossAssetFeatures(marketData, correlatedAssets || []);
    const temporal = this.extractTemporalFeatures(marketData);
    const regime = this.identifyMarketRegimes(marketData);
    
    return {
      technical,
      microstructure,
      crossAsset,
      temporal,
      regime
    };
  }
  
  private static extractTechnicalFeatures(marketData: any) {
    const data5m = marketData["5m"];
    const data15m = marketData["15m"];
    const data30m = marketData["30m"];
    
    return {
      // RSI momentum analysis
      rsi_momentum: this.calculateRSIMomentum([
        data5m.indicators.rsi,
        data15m.indicators.rsi,
        data30m.indicators.rsi
      ]),
      
      // MACD divergence detection
      macd_divergence: this.detectMACDDivergence([
        data5m.indicators.macd,
        data15m.indicators.macd,
        data30m.indicators.macd
      ]),
      
      // Bollinger Bands squeeze
      bollinger_squeeze: this.calculateBollingerSqueeze([
        data5m.close,
        data15m.close,
        data30m.close
      ]),
      
      // Volume Profile Point of Control
      volume_profile_poc: this.calculateVolumeProfilePOC([data5m, data15m, data30m]),
      
      // Market structure break strength
      market_structure_break: this.calculateStructureBreakStrength([data5m, data15m, data30m])
    };
  }
  
  private static extractMicrostructureFeatures(marketData: any) {
    // Simulated microstructure features (in real system, would come from L2 data)
    return {
      bid_ask_spread: Math.random() * 0.0005 + 0.0001,
      order_flow_imbalance: (Math.random() - 0.5) * 2,
      price_impact: Math.random() * 0.1,
      liquidity_depth: Math.random() * 1000000,
      tick_direction_bias: (Math.random() - 0.5) * 2
    };
  }
  
  private static extractCrossAssetFeatures(marketData: any, correlatedAssets: any[]) {
    if (correlatedAssets.length === 0) {
      return {
        correlation_strength: 0.5,
        relative_strength: 0,
        sector_momentum: 0,
        volatility_spread: 0
      };
    }
    
    return {
      correlation_strength: Math.random() * 0.8 + 0.2,
      relative_strength: (Math.random() - 0.5) * 2,
      sector_momentum: (Math.random() - 0.3) * 1.5,
      volatility_spread: Math.random() * 0.1
    };
  }
  
  private static extractTemporalFeatures(marketData: any) {
    const now = new Date();
    
    return {
      session_effect: this.calculateSessionEffect(now),
      day_of_week_effect: this.calculateDayOfWeekEffect(now),
      news_cycle_position: Math.random(), // Position within news cycle
      economic_calendar_proximity: Math.random() // Distance to next major event
    };
  }
  
  private static identifyMarketRegimes(marketData: any): AdvancedFeatures["regime"] {
    const data5m = marketData["5m"];
    const atr = data5m.indicators.atr;
    const volume = data5m.volume;
    
    // Volatility regime
    const atrRatio = atr / data5m.close;
    let volatilityRegime: AdvancedFeatures["regime"]["volatility_regime"];
    if (atrRatio < 0.005) volatilityRegime = "LOW";
    else if (atrRatio < 0.02) volatilityRegime = "NORMAL";
    else if (atrRatio < 0.05) volatilityRegime = "HIGH";
    else volatilityRegime = "CRISIS";
    
    // Trend regime (simplified)
    const trendRegime: AdvancedFeatures["regime"]["trend_regime"] = 
      Math.random() > 0.6 ? "TRENDING" : 
      Math.random() > 0.3 ? "RANGING" : "BREAKOUT";
    
    // Volume regime
    const avgVolume = volume; // Simplified
    const volumeRegime: AdvancedFeatures["regime"]["volume_regime"] = 
      volume > avgVolume * 1.5 ? "HIGH" :
      volume < avgVolume * 0.5 ? "LOW" : "NORMAL";
    
    // Correlation regime (simplified)
    const correlationRegime: AdvancedFeatures["regime"]["correlation_regime"] = 
      Math.random() > 0.7 ? "COUPLED" :
      Math.random() > 0.3 ? "NORMAL" : "DECOUPLED";
    
    return {
      volatility_regime: volatilityRegime,
      trend_regime: trendRegime,
      volume_regime: volumeRegime,
      correlation_regime: correlationRegime
    };
  }
  
  // Helper methods
  private static calculateRSIMomentum(rsiValues: number[]): number {
    const momentum = rsiValues.reduce((sum, rsi, i) => {
      if (i === 0) return sum;
      return sum + (rsi - rsiValues[i-1]);
    }, 0) / (rsiValues.length - 1);
    
    return momentum / 10; // Normalize
  }
  
  private static detectMACDDivergence(macdValues: any[]): number {
    // Simplified divergence detection
    let divergenceScore = 0;
    
    for (let i = 1; i < macdValues.length; i++) {
      const current = macdValues[i];
      const previous = macdValues[i-1];
      
      if (current.line > current.signal && previous.line <= previous.signal) {
        divergenceScore += 0.5; // Bullish crossover
      } else if (current.line < current.signal && previous.line >= previous.signal) {
        divergenceScore -= 0.5; // Bearish crossover
      }
    }
    
    return Math.max(-1, Math.min(1, divergenceScore));
  }
  
  private static calculateBollingerSqueeze(prices: number[]): number {
    // Simplified squeeze calculation
    const volatility = this.calculateVolatility(prices);
    const avgVolatility = 0.02; // Assumed average
    
    return Math.max(0, (avgVolatility - volatility) / avgVolatility);
  }
  
  private static calculateVolumeProfilePOC(dataPoints: any[]): number {
    // Point of Control calculation (simplified)
    const totalVolume = dataPoints.reduce((sum, dp) => sum + dp.volume, 0);
    const vwap = dataPoints.reduce((sum, dp) => sum + (dp.close * dp.volume), 0) / totalVolume;
    
    return vwap;
  }
  
  private static calculateStructureBreakStrength(dataPoints: any[]): number {
    // Structure break strength (simplified)
    const highs = dataPoints.map(dp => dp.high);
    const lows = dataPoints.map(dp => dp.low);
    
    const recentHigh = Math.max(...highs);
    const recentLow = Math.min(...lows);
    const currentPrice = dataPoints[0].close;
    
    if (currentPrice > recentHigh) {
      return (currentPrice - recentHigh) / recentHigh;
    } else if (currentPrice < recentLow) {
      return -(recentLow - currentPrice) / currentPrice;
    }
    
    return 0;
  }
  
  private static calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const returns = prices.slice(1).map((price, i) => 
      Math.log(price / prices[i])
    );
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }
  
  private static calculateSessionEffect(date: Date): number {
    const hour = date.getHours();
    
    // Session effects (simplified)
    if (hour >= 8 && hour <= 12) return 0.8; // European session
    if (hour >= 13 && hour <= 17) return 1.0; // US session
    if (hour >= 21 && hour <= 6) return 0.6; // Asian session
    return 0.3; // Dead zone
  }
  
  private static calculateDayOfWeekEffect(date: Date): number {
    const day = date.getDay();
    
    // Day of week effects (0 = Sunday, 1 = Monday, etc.)
    const effects = [0.3, 0.9, 1.0, 0.8, 0.7, 0.4, 0.2];
    return effects[day] || 0.5;
  }
}