import { Router } from 'express';
import { query } from '../database/connection.js';
import { z } from 'zod';

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
    
    // TODO: Import and use signal generation logic
    // For now, return mock data
    const signal = {
      symbol,
      action: "BUY" as const,
      confidence: 0.75,
      price: 1.2345,
      timestamp: new Date(),
      strategy,
      indicators: {
        RSI: 65,
        MACD: 0.001,
        SMA: 1.2300,
        BB_UPPER: 1.2400,
        BB_LOWER: 1.2200
      }
    };

    res.json({ signal });
  } catch (error) {
    console.error('Signal generation error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to generate signal' });
  }
});

// Predict endpoint
router.post('/predict', async (req, res) => {
  try {
    const validatedData = PredictSchema.parse(req.body);
    const { symbol, strategy } = validatedData;
    
    // TODO: Import and use prediction logic
    const prediction = {
      symbol,
      action: "BUY" as const,
      confidence: 0.82,
      price: 1.2345,
      timestamp: new Date(),
      strategy: strategy || "moderate",
      indicators: {
        RSI: 45,
        MACD: 0.002,
        SMA: 1.2300,
        BB_UPPER: 1.2400,
        BB_LOWER: 1.2200
      }
    };

    res.json(prediction);
  } catch (error) {
    console.error('Prediction error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to generate prediction' });
  }
});

// Get market overview
router.get('/market-overview', async (req, res) => {
  try {
    // TODO: Implement actual market overview logic
    const overview = {
      topAssets: [
        { symbol: "EURUSD", reliability: 0.85, trend: "bullish", volume: 1000000 },
        { symbol: "GBPUSD", reliability: 0.78, trend: "bearish", volume: 800000 }
      ],
      marketNews: [],
      marketSentiment: {
        overall: "neutral",
        forex: "bullish",
        indices: "bearish",
        commodities: "neutral",
        crypto: "volatile"
      },
      sessionInfo: {
        currentSession: "London",
        nextSession: "New York",
        timeToNext: "4h 30m"
      }
    };

    res.json(overview);
  } catch (error) {
    console.error('Market overview error:', error);
    res.status(500).json({ error: 'Failed to get market overview' });
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
    const result = await query(`
      SELECT * FROM trading_signals 
      WHERE confidence > 0.7 
      ORDER BY confidence DESC, timestamp DESC 
      LIMIT 10
    `);

    const signals = result.rows.map(row => ({
      ...row,
      indicators: typeof row.indicators === 'string' ? JSON.parse(row.indicators) : row.indicators
    }));

    res.json({ signals });
  } catch (error) {
    console.error('Top signals error:', error);
    res.status(500).json({ error: 'Failed to get top signals' });
  }
});

// Get performance stats
router.get('/performance', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_signals,
        AVG(confidence) as avg_confidence,
        COUNT(CASE WHEN action = 'BUY' THEN 1 END) as buy_signals,
        COUNT(CASE WHEN action = 'SELL' THEN 1 END) as sell_signals,
        COUNT(CASE WHEN action = 'HOLD' THEN 1 END) as hold_signals
      FROM trading_signals
      WHERE timestamp > NOW() - INTERVAL '30 days'
    `);

    const stats = result.rows[0] || {
      total_signals: 0,
      avg_confidence: 0,
      buy_signals: 0,
      sell_signals: 0,
      hold_signals: 0
    };

    res.json({
      totalSignals: parseInt(stats.total_signals),
      averageConfidence: parseFloat(stats.avg_confidence) || 0,
      buySignals: parseInt(stats.buy_signals),
      sellSignals: parseInt(stats.sell_signals),
      holdSignals: parseInt(stats.hold_signals),
      winRate: 0.65, // TODO: Calculate actual win rate
      profitFactor: 1.2 // TODO: Calculate actual profit factor
    });
  } catch (error) {
    console.error('Performance error:', error);
    res.status(500).json({ error: 'Failed to get performance stats' });
  }
});

export default router;