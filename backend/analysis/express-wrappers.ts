// Express.js wrapper functions for Encore services
// This file provides Express-compatible functions that call the original Encore API functions

import { analysisDB } from "./db.js";
import { analyzeSentiment } from "./sentiment-analyzer.js";

export interface AssetReliability {
  symbol: string;
  category: string;
  reliabilityScore: number;
  avgConfidence: number;
  winRate: number;
  recentPerformance: number;
  volatility: "LOW" | "MEDIUM" | "HIGH";
  recommendation: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
  lastAnalyzed: Date;
}

export interface MarketNews {
  id: string;
  title: string;
  summary: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  affectedAssets: string[];
  source: string;
  publishedAt: Date;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
}

export interface MarketOverview {
  topAssets: AssetReliability[];
  marketNews: MarketNews[];
  marketSentiment: {
    overall: "bullish" | "bearish" | "neutral";
    forex: "bullish" | "bearish" | "neutral";
    indices: "bullish" | "bearish" | "neutral";
    commodities: "bullish" | "bearish" | "neutral";
    crypto: "bullish" | "bearish" | "neutral" | "volatile";
  };
  sessionInfo: {
    currentSession: string;
    nextSession: string;
    timeToNext: string;
  };
}

export async function getMarketOverview(): Promise<MarketOverview> {
  try {
    // Get top performing assets based on recent signal performance
    const topAssetsQuery = await analysisDB.exec`
      SELECT 
        symbol,
        AVG(confidence) as avg_confidence,
        COUNT(*) as signal_count,
        COUNT(CASE WHEN confidence > 75 THEN 1 END) as high_confidence_signals
      FROM trading_signals 
      WHERE timestamp > NOW() - INTERVAL '7 days'
      GROUP BY symbol
      ORDER BY avg_confidence DESC, high_confidence_signals DESC
      LIMIT 10
    `;

    const topAssets: AssetReliability[] = topAssetsQuery.rows.map(row => ({
      symbol: row.symbol,
      category: getCategoryForSymbol(row.symbol),
      reliabilityScore: parseFloat(row.avg_confidence) / 100,
      avgConfidence: parseFloat(row.avg_confidence),
      winRate: 0.68, // Default - would need historical trade data
      recentPerformance: parseFloat(row.high_confidence_signals) / parseFloat(row.signal_count),
      volatility: getVolatilityForSymbol(row.symbol),
      recommendation: getRecommendationFromConfidence(parseFloat(row.avg_confidence)),
      lastAnalyzed: new Date()
    }));

    // Get recent market news (simulated - in production would connect to real news APIs)
    const marketNews: MarketNews[] = [
      {
        id: "news_1",
        title: "Central Bank Policy Updates",
        summary: "Major central banks signal policy shifts affecting currency markets",
        impact: "HIGH",
        affectedAssets: ["EURUSD", "GBPUSD", "USDJPY"],
        source: "Financial Times",
        publishedAt: new Date(Date.now() - 3600000),
        sentiment: "NEUTRAL"
      }
    ];

    // Calculate overall market sentiment
    const sentimentData = await calculateMarketSentiment(topAssets);

    return {
      topAssets,
      marketNews,
      marketSentiment: sentimentData,
      sessionInfo: getCurrentSessionInfo()
    };

  } catch (error) {
    console.error('Error getting market overview:', error);
    throw new Error('Failed to get market overview');
  }
}

export async function getTopSignals(limit: number = 10) {
  try {
    const result = await analysisDB.exec`
      SELECT 
        trade_id as id,
        symbol,
        direction,
        confidence,
        entry_price,
        take_profit,
        stop_loss,
        risk_reward_ratio,
        strategy,
        timestamp,
        expires_at,
        analysis,
        chart_url
      FROM trading_signals 
      WHERE confidence > 70 AND expires_at > NOW()
      ORDER BY confidence DESC, timestamp DESC 
      LIMIT ${limit}
    `;

    return {
      signals: result.rows,
      count: result.rows.length,
      avgConfidence: result.rows.reduce((sum, s) => sum + s.confidence, 0) / result.rows.length,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Error getting top signals:', error);
    throw new Error('Failed to get top signals');
  }
}

export async function getPerformanceStats() {
  try {
    // Get signal performance statistics
    const signalStats = await analysisDB.exec`
      SELECT 
        COUNT(*) as total_signals,
        AVG(confidence) as avg_confidence,
        COUNT(CASE WHEN confidence > 80 THEN 1 END) as high_confidence_count,
        MIN(timestamp) as oldest_signal,
        MAX(timestamp) as newest_signal
      FROM trading_signals
      WHERE timestamp > NOW() - INTERVAL '30 days'
    `;

    const stats = signalStats.rows[0] || {};

    // Get performance by strategy
    const strategyStats = await analysisDB.exec`
      SELECT 
        strategy,
        COUNT(*) as count,
        AVG(confidence) as avg_confidence,
        AVG(risk_reward_ratio) as avg_risk_reward
      FROM trading_signals
      WHERE timestamp > NOW() - INTERVAL '30 days'
      GROUP BY strategy
      ORDER BY avg_confidence DESC
    `;

    // Get performance by symbol
    const symbolStats = await analysisDB.exec`
      SELECT 
        symbol,
        COUNT(*) as count,
        AVG(confidence) as avg_confidence,
        MAX(confidence) as max_confidence
      FROM trading_signals
      WHERE timestamp > NOW() - INTERVAL '30 days'
      GROUP BY symbol
      ORDER BY avg_confidence DESC
      LIMIT 10
    `;

    return {
      totalSignals: parseInt(stats.total_signals) || 0,
      averageConfidence: parseFloat(stats.avg_confidence) || 0,
      highConfidenceSignals: parseInt(stats.high_confidence_count) || 0,
      oldestSignal: stats.oldest_signal,
      newestSignal: stats.newest_signal,
      
      // Simulated performance metrics (in production would calculate from trade results)
      winRate: 68.5,
      profitFactor: 1.42,
      totalProfitLoss: 2847.50,
      bestTrade: 456.78,
      worstTrade: -123.45,
      currentStreak: 5,
      sharpeRatio: 1.28,
      maxDrawdown: 8.3,
      
      byStrategy: strategyStats.rows.map(row => ({
        strategy: row.strategy,
        count: parseInt(row.count),
        avgConfidence: parseFloat(row.avg_confidence),
        avgRiskReward: parseFloat(row.avg_risk_reward)
      })),
      
      bySymbol: symbolStats.rows.map(row => ({
        symbol: row.symbol,
        count: parseInt(row.count),
        avgConfidence: parseFloat(row.avg_confidence),
        maxConfidence: parseFloat(row.max_confidence)
      })),
      
      byTimeframe: [
        { timeframe: "5m", signals: 45, avgConfidence: 73.2 },
        { timeframe: "15m", signals: 38, avgConfidence: 76.8 },
        { timeframe: "30m", signals: 29, avgConfidence: 78.5 },
        { timeframe: "1h", signals: 22, avgConfidence: 81.3 }
      ]
    };
  } catch (error) {
    console.error('Error getting performance stats:', error);
    throw new Error('Failed to get performance statistics');
  }
}

// Helper functions
function getCategoryForSymbol(symbol: string): string {
  if (symbol.includes('USD') || symbol.includes('EUR') || symbol.includes('GBP')) return 'Forex';
  if (symbol.includes('BTC') || symbol.includes('ETH')) return 'Crypto';
  if (symbol.includes('XAU') || symbol.includes('CRUDE')) return 'Commodities';
  if (symbol.includes('US500') || symbol.includes('NAS100')) return 'Indices';
  return 'Unknown';
}

function getVolatilityForSymbol(symbol: string): "LOW" | "MEDIUM" | "HIGH" {
  const highVolatility = ['BTCUSD', 'ETHUSD', 'CRUDE'];
  const lowVolatility = ['EURUSD', 'GBPUSD'];
  
  if (highVolatility.includes(symbol)) return 'HIGH';
  if (lowVolatility.includes(symbol)) return 'LOW';
  return 'MEDIUM';
}

function getRecommendationFromConfidence(confidence: number): "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL" {
  if (confidence >= 85) return 'STRONG_BUY';
  if (confidence >= 75) return 'BUY';
  if (confidence >= 65) return 'HOLD';
  if (confidence >= 55) return 'SELL';
  return 'STRONG_SELL';
}

async function calculateMarketSentiment(assets: AssetReliability[]) {
  const forexAssets = assets.filter(a => a.category === 'Forex');
  const cryptoAssets = assets.filter(a => a.category === 'Crypto');
  const commodityAssets = assets.filter(a => a.category === 'Commodities');
  const indexAssets = assets.filter(a => a.category === 'Indices');

  const calculateSentiment = (assetList: AssetReliability[]) => {
    if (assetList.length === 0) return 'neutral';
    const avgReliability = assetList.reduce((sum, a) => sum + a.reliabilityScore, 0) / assetList.length;
    if (avgReliability > 0.75) return 'bullish';
    if (avgReliability < 0.65) return 'bearish';
    return 'neutral';
  };

  const overallAvg = assets.reduce((sum, a) => sum + a.reliabilityScore, 0) / assets.length;

  return {
    overall: calculateSentiment(assets) as "bullish" | "bearish" | "neutral",
    forex: calculateSentiment(forexAssets) as "bullish" | "bearish" | "neutral", 
    indices: calculateSentiment(indexAssets) as "bullish" | "bearish" | "neutral",
    commodities: calculateSentiment(commodityAssets) as "bullish" | "bearish" | "neutral",
    crypto: cryptoAssets.some(a => a.volatility === 'HIGH') ? 'volatile' as const : calculateSentiment(cryptoAssets) as "bullish" | "bearish" | "neutral"
  };
}

function getCurrentSessionInfo() {
  const now = new Date();
  const utcHour = now.getUTCHours();
  
  // Trading session times (UTC)
  if (utcHour >= 0 && utcHour < 7) {
    return {
      currentSession: "Asian",
      nextSession: "London",
      timeToNext: `${7 - utcHour}h ${60 - now.getUTCMinutes()}m`
    };
  } else if (utcHour >= 7 && utcHour < 15) {
    return {
      currentSession: "London", 
      nextSession: "New York",
      timeToNext: `${15 - utcHour}h ${60 - now.getUTCMinutes()}m`
    };
  } else if (utcHour >= 15 && utcHour < 22) {
    return {
      currentSession: "New York",
      nextSession: "Asian", 
      timeToNext: `${24 - utcHour + 0}h ${60 - now.getUTCMinutes()}m`
    };
  } else {
    return {
      currentSession: "After Hours",
      nextSession: "Asian",
      timeToNext: `${24 - utcHour}h ${60 - now.getUTCMinutes()}m`
    };
  }
}