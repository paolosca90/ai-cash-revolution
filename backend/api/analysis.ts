import { Router } from 'express';

const router = Router();

// Mock data for demonstration
const mockSignals = [
  {
    id: '1',
    symbol: 'EURUSD',
    action: 'BUY',
    confidence: 85,
    price: 1.1234,
    timestamp: new Date().toISOString(),
    strategy: 'trend-following'
  },
  {
    id: '2',
    symbol: 'GBPUSD',
    action: 'SELL',
    confidence: 78,
    price: 1.3456,
    timestamp: new Date().toISOString(),
    strategy: 'mean-reversion'
  },
  {
    id: '3',
    symbol: 'USDJPY',
    action: 'BUY',
    confidence: 92,
    price: 145.67,
    timestamp: new Date().toISOString(),
    strategy: 'momentum'
  }
];

// Get top trading signals
router.get('/top-signals', (req, res) => {
  res.json({
    signals: mockSignals
  });
});

// Get signal statistics
router.get('/signal-stats', (req, res) => {
  res.json({
    totalGenerated: 127,
    totalExecuted: 89,
    totalClosed: 76,
    avgConfidence: 82.5,
    lastGenerationTime: new Date().toISOString(),
    topPerformingSymbol: 'EURUSD'
  });
});

// Get performance data
router.get('/performance', (req, res) => {
  res.json({
    totalTrades: 142,
    totalProfitLoss: 1245.67,
    winRate: 68.3,
    profitFactor: 1.87,
    bestTrade: 156.32,
    currentStreak: 3,
    sharpeRatio: 1.42
  });
});

// Generate AI prediction
router.post('/predict', (req, res) => {
  const { symbol } = req.body;
  res.json({
    symbol,
    action: Math.random() > 0.5 ? 'BUY' : 'SELL',
    confidence: Math.floor(Math.random() * 20) + 80, // 80-99
    price: 1.2345,
    timestamp: new Date().toISOString(),
    strategy: 'neural-network'
  });
});

// Execute a trading signal
router.post('/execute', (req, res) => {
  const { signalId } = req.body;
  res.json({
    success: true,
    message: `Signal ${signalId} executed successfully`,
    orderId: `order_${Date.now()}`,
    timestamp: new Date().toISOString()
  });
});

// Get open positions
router.get('/positions', (req, res) => {
  res.json({
    positions: [
      {
        id: 'pos_1',
        symbol: 'EURUSD',
        type: 'BUY',
        volume: 0.1,
        openPrice: 1.1200,
        currentPrice: 1.1234,
        profit: 34.56,
        timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      }
    ]
  });
});

// Get trading history
router.get('/history', (req, res) => {
  res.json({
    signals: [
      {
        id: 'hist_1',
        symbol: 'EURUSD',
        action: 'BUY',
        confidence: 85,
        price: 1.1200,
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        result: 'WIN',
        profit: 45.67
      },
      {
        id: 'hist_2',
        symbol: 'GBPUSD',
        action: 'SELL',
        confidence: 72,
        price: 1.3400,
        timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        result: 'LOSS',
        profit: -23.45
      }
    ]
  });
});

// Force signal generation
router.post('/force-generation', (req, res) => {
  res.json({
    success: true,
    message: 'Signal generation initiated',
    timestamp: new Date().toISOString()
  });
});

// Get market overview
router.get('/market-overview', (req, res) => {
  res.json({
    topAssets: [
      { symbol: 'EURUSD', reliability: 0.85, trend: 'bullish', volume: 1000000 },
      { symbol: 'GBPUSD', reliability: 0.78, trend: 'bearish', volume: 800000 }
    ],
    marketNews: [],
    marketSentiment: {
      overall: 'neutral',
      forex: 'bullish',
      indices: 'bearish',
      commodities: 'neutral',
      crypto: 'volatile'
    },
    sessionInfo: {
      currentSession: 'London',
      nextSession: 'New York',
      timeToNext: '4h 30m'
    }
  });
});

export default router;