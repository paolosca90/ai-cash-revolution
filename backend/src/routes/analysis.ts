import { Router } from 'express';
import { query } from '../database/connection.js';
import { z } from 'zod';
import { generateSignalForSymbol, TradingSignal } from '../../analysis/signal-generator.js';
import { analyzeWithAI } from '../../analysis/ai-engine.js';
import { fetchMarketData } from '../../analysis/market-data.js';
import { TradingStrategy, TRADING_STRATEGIES } from '../../analysis/trading-strategies.js';
import { analyzeSentiment } from '../../analysis/sentiment-analyzer.js';
import { learningEngine } from '../../ml/learning-engine.js';
import { getMarketOverview, getTopSignals, getPerformanceStats } from '../../analysis/express-wrappers.js';

const router = Router();

// Validation schemas
const GenerateSignalSchema = z.object({
  symbol: z.string(),
  timeframe: z.string().optional(),
  strategy: z.string().optional()
});

const PredictSchema = z.object({
  symbol: z.string(),
  strategy: z.string().optional()
});

// Generate signal endpoint
router.post('/signal', async (req, res) => {
  try {
    const validatedData = GenerateSignalSchema.parse(req.body);
    const { symbol, timeframe = "1h", strategy = "moderate" } = validatedData;
    
    // Get user preferences for signal generation
    const defaultMt5Config = {
      host: process.env.MT5_HOST || 'localhost',
      port: parseInt(process.env.MT5_PORT || '8080'),
      login: process.env.MT5_LOGIN || '',
      server: process.env.MT5_SERVER || '',
      broker: process.env.MT5_BROKER || ''
    };
    
    const defaultTradeParams = {
      accountBalance: 10000,
      riskPercentage: 2
    };
    
    // Map strategy string to TradingStrategy enum
    let tradingStrategy: TradingStrategy;
    switch (strategy.toLowerCase()) {
      case 'aggressive':
      case 'scalping':
        tradingStrategy = TradingStrategy.SCALPING;
        break;
      case 'conservative':
      case 'swing':
        tradingStrategy = TradingStrategy.SWING;
        break;
      case 'intraday':
      case 'day':
        tradingStrategy = TradingStrategy.INTRADAY;
        break;
      default:
        tradingStrategy = TradingStrategy.INTRADAY;
    }
    
    // Generate real trading signal using sophisticated AI engine
    const tradingSignal: TradingSignal = await generateSignalForSymbol(
      symbol,
      defaultMt5Config,
      defaultTradeParams,
      tradingStrategy,
      false // Allow fallback data
    );
    
    // Store signal in database for tracking
    await query(`
      INSERT INTO trading_signals (
        trade_id, symbol, direction, strategy, entry_price, take_profit, stop_loss,
        confidence, risk_reward_ratio, recommended_lot_size, expires_at,
        analysis, chart_url, strategy_recommendation, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
    `, [
      tradingSignal.tradeId,
      tradingSignal.symbol,
      tradingSignal.direction,
      tradingSignal.strategy,
      tradingSignal.entryPrice,
      tradingSignal.takeProfit,
      tradingSignal.stopLoss,
      tradingSignal.confidence,
      tradingSignal.riskRewardRatio,
      tradingSignal.recommendedLotSize,
      tradingSignal.expiresAt,
      JSON.stringify(tradingSignal.analysis),
      tradingSignal.chartUrl,
      tradingSignal.strategyRecommendation
    ]);
    
    // Convert to API response format
    const signal = {
      id: tradingSignal.tradeId,
      symbol: tradingSignal.symbol,
      action: tradingSignal.direction === 'LONG' ? 'BUY' : 'SELL',
      confidence: tradingSignal.confidence / 100,
      price: tradingSignal.entryPrice,
      takeProfit: tradingSignal.takeProfit,
      stopLoss: tradingSignal.stopLoss,
      riskRewardRatio: tradingSignal.riskRewardRatio,
      timestamp: new Date(),
      strategy: tradingSignal.strategy,
      indicators: {
        RSI: tradingSignal.analysis.technical.rsi,
        MACD: tradingSignal.analysis.technical.macd,
        ATR: tradingSignal.analysis.technical.atr,
        SMA: tradingSignal.analysis.enhancedTechnical.indicators5m.sma.sma20,
        BB_UPPER: tradingSignal.analysis.enhancedTechnical.indicators5m.bollinger.upper,
        BB_LOWER: tradingSignal.analysis.enhancedTechnical.indicators5m.bollinger.lower
      },
      analysis: tradingSignal.analysis,
      chartUrl: tradingSignal.chartUrl
    };

    res.json({ signal });
  } catch (error) {
    console.error('Signal generation error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to generate signal', details: error.message });
  }
});

// Predict endpoint
router.post('/predict', async (req, res) => {
  try {
    const validatedData = PredictSchema.parse(req.body);
    const { symbol, strategy } = validatedData;
    
    // Get market data for AI analysis
    const defaultMt5Config = {
      host: process.env.MT5_HOST || 'localhost',
      port: parseInt(process.env.MT5_PORT || '8080'),
      login: process.env.MT5_LOGIN || '',
      server: process.env.MT5_SERVER || '',
      broker: process.env.MT5_BROKER || ''
    };
    
    // Fetch multi-timeframe market data
    const marketData = await fetchMarketData(
      symbol,
      ["5m", "15m", "30m", "1h"],
      defaultMt5Config,
      false
    );
    
    // Map strategy to enum
    let tradingStrategy: TradingStrategy = TradingStrategy.INTRADAY;
    if (strategy) {
      switch (strategy.toLowerCase()) {
        case 'scalping':
        case 'aggressive':
          tradingStrategy = TradingStrategy.SCALPING;
          break;
        case 'swing':
        case 'conservative':
          tradingStrategy = TradingStrategy.SWING;
          break;
        case 'intraday':
        case 'day':
          tradingStrategy = TradingStrategy.INTRADAY;
          break;
      }
    }
    
    // Use sophisticated AI analysis for prediction
    const aiAnalysis = await analyzeWithAI(marketData, symbol, tradingStrategy);
    
    const prediction = {
      symbol,
      action: aiAnalysis.direction === 'LONG' ? 'BUY' : 'SELL',
      confidence: aiAnalysis.confidence / 100,
      price: marketData['5m'].close,
      timestamp: new Date(),
      strategy: tradingStrategy,
      support: aiAnalysis.support,
      resistance: aiAnalysis.resistance,
      indicators: {
        RSI: aiAnalysis.technical.rsi,
        MACD: aiAnalysis.technical.macd,
        ATR: aiAnalysis.technical.atr,
        SMA: aiAnalysis.enhancedTechnical.indicators5m.sma.sma20,
        BB_UPPER: aiAnalysis.enhancedTechnical.indicators5m.bollinger.upper,
        BB_LOWER: aiAnalysis.enhancedTechnical.indicators5m.bollinger.lower
      },
      analysis: {
        sentiment: aiAnalysis.sentiment,
        volatility: aiAnalysis.volatility,
        smartMoney: aiAnalysis.smartMoney,
        priceAction: aiAnalysis.priceAction,
        professionalAnalysis: aiAnalysis.professionalAnalysis,
        enhancedConfidence: aiAnalysis.enhancedConfidence,
        institutionalAnalysis: aiAnalysis.institutionalAnalysis,
        vwap: aiAnalysis.vwap,
        ensembleResult: aiAnalysis.ensembleResult
      }
    };

    res.json(prediction);
  } catch (error) {
    console.error('Prediction error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to generate prediction', details: error.message });
  }
});

// Get market overview
router.get('/market-overview', async (req, res) => {
  try {
    // Use real market overview analysis
    const overview = await getMarketOverview();
    
    res.json(overview);
  } catch (error) {
    console.error('Market overview error:', error);
    res.status(500).json({ error: 'Failed to get market overview', details: error.message });
  }
});

// Get trading history
router.get('/history', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM trading_signals 
      ORDER BY timestamp DESC 
      LIMIT 50
    `);

    const signals = result.rows.map(row => ({
      ...row,
      indicators: typeof row.indicators === 'string' ? JSON.parse(row.indicators) : row.indicators
    }));

    res.json({ signals });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to get trading history' });
  }
});

// Get top signals
router.get('/top-signals', async (req, res) => {
  try {
    // Use real top signals analysis with comprehensive data
    const topSignalsData = await getTopSignals();
    
    // Also get recent signals from database
    const result = await query(`
      SELECT 
        trade_id as id,
        symbol,
        direction,
        strategy,
        entry_price as price,
        take_profit,
        stop_loss,
        confidence,
        risk_reward_ratio,
        analysis,
        chart_url,
        timestamp,
        expires_at
      FROM trading_signals 
      WHERE confidence > 70 AND expires_at > NOW()
      ORDER BY confidence DESC, timestamp DESC 
      LIMIT 10
    `);

    const signals = result.rows.map(row => ({
      id: row.id,
      symbol: row.symbol,
      action: row.direction === 'LONG' ? 'BUY' : 'SELL',
      confidence: row.confidence / 100,
      price: row.price,
      takeProfit: row.take_profit,
      stopLoss: row.stop_loss,
      riskRewardRatio: row.risk_reward_ratio,
      strategy: row.strategy,
      timestamp: row.timestamp,
      expiresAt: row.expires_at,
      chartUrl: row.chart_url,
      analysis: typeof row.analysis === 'string' ? JSON.parse(row.analysis) : row.analysis
    }));
    
    // Combine with real-time top signals
    res.json({ 
      signals,
      topSignalsData,
      count: signals.length,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Top signals error:', error);
    res.status(500).json({ error: 'Failed to get top signals', details: error.message });
  }
});

// Get performance stats
router.get('/performance', async (req, res) => {
  try {
    // Get comprehensive performance statistics
    const performanceStats = await getPerformanceStats();
    
    // Get database statistics for additional insights
    const result = await query(`
      SELECT 
        COUNT(*) as total_signals,
        AVG(confidence) as avg_confidence,
        COUNT(CASE WHEN direction = 'LONG' THEN 1 END) as buy_signals,
        COUNT(CASE WHEN direction = 'SHORT' THEN 1 END) as sell_signals,
        AVG(risk_reward_ratio) as avg_risk_reward,
        MIN(timestamp) as oldest_signal,
        MAX(timestamp) as newest_signal
      FROM trading_signals
      WHERE timestamp > NOW() - INTERVAL '30 days'
    `);

    const stats = result.rows[0] || {
      total_signals: 0,
      avg_confidence: 0,
      buy_signals: 0,
      sell_signals: 0,
      avg_risk_reward: 0,
      oldest_signal: null,
      newest_signal: null
    };
    
    // Get ML performance metrics
    const mlMetrics = await learningEngine.getPerformanceMetrics();

    res.json({
      totalSignals: parseInt(stats.total_signals),
      averageConfidence: parseFloat(stats.avg_confidence) || 0,
      buySignals: parseInt(stats.buy_signals),
      sellSignals: parseInt(stats.sell_signals),
      averageRiskReward: parseFloat(stats.avg_risk_reward) || 0,
      oldestSignal: stats.oldest_signal,
      newestSignal: stats.newest_signal,
      
      // Real performance metrics
      winRate: performanceStats.winRate,
      profitFactor: performanceStats.profitFactor,
      totalProfitLoss: performanceStats.totalProfitLoss,
      bestTrade: performanceStats.bestTrade,
      worstTrade: performanceStats.worstTrade,
      currentStreak: performanceStats.currentStreak,
      sharpeRatio: performanceStats.sharpeRatio,
      maxDrawdown: performanceStats.maxDrawdown,
      
      // ML metrics
      mlPerformance: mlMetrics,
      
      // Additional insights
      performanceByStrategy: performanceStats.byStrategy,
      performanceBySymbol: performanceStats.bySymbol,
      performanceByTimeframe: performanceStats.byTimeframe
    });
  } catch (error) {
    console.error('Performance error:', error);
    res.status(500).json({ error: 'Failed to get performance stats', details: error.message });
  }
});

// Machine learning endpoints
router.post('/ml/train', async (req, res) => {
  try {
    console.log('Starting ML model training...');
    const metrics = await learningEngine.trainModel();
    
    res.json({
      success: true,
      message: 'Model training completed',
      metrics,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('ML training error:', error);
    res.status(500).json({ error: 'Failed to train model', details: error.message });
  }
});

router.post('/ml/detect-patterns', async (req, res) => {
  try {
    const { symbol } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }
    
    // Get market data for pattern detection
    const defaultMt5Config = {
      host: process.env.MT5_HOST || 'localhost',
      port: parseInt(process.env.MT5_PORT || '8080'),
      login: process.env.MT5_LOGIN || '',
      server: process.env.MT5_SERVER || '',
      broker: process.env.MT5_BROKER || ''
    };
    
    const marketData = await fetchMarketData(
      symbol,
      ["5m", "15m", "30m", "1h"],
      defaultMt5Config,
      false
    );
    
    await learningEngine.detectMarketPatterns(symbol, marketData);
    
    res.json({
      success: true,
      symbol,
      message: 'Pattern detection completed',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Pattern detection error:', error);
    res.status(500).json({ error: 'Failed to detect patterns', details: error.message });
  }
});

router.get('/ml/analytics', async (req, res) => {
  try {
    const analytics = await learningEngine.getAnalytics();
    const metrics = await learningEngine.getPerformanceMetrics();
    const patterns = await learningEngine.getRecentPatterns(10);
    
    res.json({
      modelPerformance: metrics,
      analytics,
      recentPatterns: patterns,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('ML analytics error:', error);
    res.status(500).json({ error: 'Failed to get ML analytics', details: error.message });
  }
});

// Force signal generation endpoint
router.post('/force-generation', async (req, res) => {
  try {
    const { symbols = ['EURUSD', 'GBPUSD', 'USDJPY'] } = req.body;
    
    const defaultMt5Config = {
      host: process.env.MT5_HOST || 'localhost',
      port: parseInt(process.env.MT5_PORT || '8080'),
      login: process.env.MT5_LOGIN || '',
      server: process.env.MT5_SERVER || '',
      broker: process.env.MT5_BROKER || ''
    };
    
    const defaultTradeParams = {
      accountBalance: 10000,
      riskPercentage: 2
    };
    
    const generatedSignals = [];
    
    for (const symbol of symbols) {
      try {
        const signal = await generateSignalForSymbol(
          symbol,
          defaultMt5Config,
          defaultTradeParams,
          TradingStrategy.INTRADAY,
          false
        );
        
        // Store in database
        await query(`
          INSERT INTO trading_signals (
            trade_id, symbol, direction, strategy, entry_price, take_profit, stop_loss,
            confidence, risk_reward_ratio, recommended_lot_size, expires_at,
            analysis, chart_url, strategy_recommendation, timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        `, [
          signal.tradeId,
          signal.symbol,
          signal.direction,
          signal.strategy,
          signal.entryPrice,
          signal.takeProfit,
          signal.stopLoss,
          signal.confidence,
          signal.riskRewardRatio,
          signal.recommendedLotSize,
          signal.expiresAt,
          JSON.stringify(signal.analysis),
          signal.chartUrl,
          signal.strategyRecommendation
        ]);
        
        generatedSignals.push(signal);
      } catch (symbolError) {
        console.error(`Failed to generate signal for ${symbol}:`, symbolError);
      }
    }
    
    res.json({
      success: true,
      message: `Generated ${generatedSignals.length} signals`,
      signals: generatedSignals.map(s => ({
        id: s.tradeId,
        symbol: s.symbol,
        action: s.direction === 'LONG' ? 'BUY' : 'SELL',
        confidence: s.confidence / 100
      })),
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Force generation error:', error);
    res.status(500).json({ error: 'Failed to generate signals', details: error.message });
  }
});

export default router;