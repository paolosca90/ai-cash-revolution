const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'AI Cash Revolution Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ai-cash-revolution-backend'
  });
});

app.get('/api/user/preferences', (req, res) => {
  const preferences = {
    userId: 1,
    riskPercentage: 2.0,
    accountBalance: 9518.40,
    updatedAt: new Date().toISOString(),
  };
  res.json({ preferences });
});

app.post('/api/user/preferences', (req, res) => {
  console.log('Updated preferences:', req.body);
  res.json({ success: true });
});

app.get('/api/user/mt5-config', (req, res) => {
  const config = {
    userId: 1,
    host: process.env.MT5_HOST || "154.61.187.189",
    port: parseInt(process.env.MT5_PORT || "8080"),
    login: process.env.MT5_LOGIN || "6001637",
    server: process.env.MT5_SERVER || "PureMGlobal-MT5",
  };
  res.json({ config });
});

app.get('/api/analysis/top-signals', (req, res) => {
  const signals = [
    {
      symbol: "EURUSD",
      direction: "LONG",
      confidence: 85,
      entryPrice: 1.0856,
      takeProfit: 1.0890,
      stopLoss: 1.0830,
      riskRewardRatio: 1.31,
      strategy: "TREND_FOLLOWING",
      timeframe: "15m",
      analysis: {
        rsi: 65.2,
        macd: 0.0012,
        trend: "BULLISH",
        volatility: "MEDIUM"
      },
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
      tradeId: "EURUSD_" + Date.now()
    },
    {
      symbol: "GBPUSD", 
      direction: "SHORT",
      confidence: 78,
      entryPrice: 1.2640,
      takeProfit: 1.2610,
      stopLoss: 1.2665,
      riskRewardRatio: 1.20,
      strategy: "MEAN_REVERSION",
      timeframe: "30m",
      analysis: {
        rsi: 72.8,
        macd: -0.0008,
        trend: "BEARISH",
        volatility: "HIGH"
      },
      createdAt: new Date(Date.now() - 22 * 60 * 1000),
      tradeId: "GBPUSD_" + Date.now()
    },
    {
      symbol: "USDJPY",
      direction: "LONG", 
      confidence: 82,
      entryPrice: 149.25,
      takeProfit: 149.85,
      stopLoss: 148.90,
      riskRewardRatio: 1.71,
      strategy: "SCALPING",
      timeframe: "5m",
      analysis: {
        rsi: 58.4,
        macd: 0.15,
        trend: "BULLISH", 
        volatility: "LOW"
      },
      createdAt: new Date(Date.now() - 8 * 60 * 1000),
      tradeId: "USDJPY_" + Date.now()
    }
  ];
  
  res.json({ signals });
});

app.get('/api/trading/positions', (req, res) => {
  const positions = [
    {
      id: 1,
      symbol: "EURUSD",
      type: "buy",
      volume: 0.1,
      openPrice: 1.0856,
      currentPrice: 1.0862,
      stopLoss: 1.0830,
      takeProfit: 1.0890,
      profit: 6.0,
      timestamp: new Date(Date.now() - 45 * 60 * 1000)
    },
    {
      id: 2,
      symbol: "GBPUSD",
      type: "sell", 
      volume: 0.2,
      openPrice: 1.2640,
      currentPrice: 1.2635,
      stopLoss: 1.2665,
      takeProfit: 1.2610,
      profit: 10.0,
      timestamp: new Date(Date.now() - 32 * 60 * 1000)
    }
  ];
  
  res.json({ positions });
});

app.get('/api/ml/analytics', (req, res) => {
  const analytics = {
    totalModels: 12,
    activeModels: 8,
    totalPredictions: 1547,
    accuracyScore: 73.2,
    lastTraining: new Date(Date.now() - 2 * 60 * 60 * 1000),
    modelPerformance: {
      precision: 0.742,
      recall: 0.698,
      f1Score: 0.719
    },
    recentPredictions: [
      {
        symbol: "EURUSD",
        prediction: 1.0875,
        confidence: 0.84,
        timestamp: new Date(Date.now() - 15 * 60 * 1000)
      },
      {
        symbol: "GBPUSD",
        prediction: 1.2620, 
        confidence: 0.79,
        timestamp: new Date(Date.now() - 25 * 60 * 1000)
      }
    ]
  };
  
  res.json({ analytics });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.url} not found`,
    availableEndpoints: [
      '/',
      '/api/health',
      '/api/user/preferences',
      '/api/user/mt5-config',
      '/api/analysis/top-signals',
      '/api/trading/positions',
      '/api/ml/analytics'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong!'
  });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 AI Cash Revolution Backend running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;