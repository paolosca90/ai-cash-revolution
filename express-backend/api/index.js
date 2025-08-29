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
      accuracy: 0.732,
      precision: 0.742,
      recall: 0.698,
      f1Score: 0.719
    },
    performanceTimeline: [
      {
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        accuracy: 0.685,
        profitLoss: 45.8,
        predictions: 87
      },
      {
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        accuracy: 0.712,
        profitLoss: 52.3,
        predictions: 94
      },
      {
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        accuracy: 0.732,
        profitLoss: 67.5,
        predictions: 102
      }
    ],
    featureImportance: [
      { feature: "RSI", importance: 0.85, type: "technical" },
      { feature: "MACD", importance: 0.78, type: "technical" },
      { feature: "Volume", importance: 0.65, type: "market" },
      { feature: "Price Action", importance: 0.72, type: "technical" }
    ],
    predictionStats: {
      totalPredictions: 1547,
      correctPredictions: 1132,
      accuracy: 0.732
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
  
  res.json(analytics);
});

// Additional Analysis endpoints
app.get('/api/analysis/signal-stats', (req, res) => {
  const stats = {
    totalGenerated: 45,
    totalExecuted: 38,
    totalClosed: 35,
    avgConfidence: 78.5,
    lastGenerationTime: new Date().toISOString(),
    topPerformingSymbol: "EURUSD"
  };
  res.json(stats);
});

app.get('/api/analysis/performance', (req, res) => {
  const performance = {
    totalProfitLoss: 1250.75,
    winRate: 72.5,
    profitFactor: 1.85,
    bestTrade: 345.20,
    worstTrade: -125.50,
    currentStreak: 4,
    sharpeRatio: 1.65,
    totalTrades: 147,
    winningTrades: 107,
    losingTrades: 40
  };
  res.json(performance);
});

app.post('/api/analysis/predict', (req, res) => {
  const { symbol, strategy } = req.body;
  const prediction = {
    symbol: symbol || "EURUSD",
    prediction: "LONG",
    confidence: 82.5,
    entryPrice: 1.0856,
    takeProfit: 1.0890,
    stopLoss: 1.0830,
    strategy: strategy || "TREND_FOLLOWING"
  };
  res.json(prediction);
});

app.post('/api/analysis/execute', (req, res) => {
  const result = {
    success: true,
    orderId: "ORD_" + Date.now(),
    message: "Order executed successfully",
    executionPrice: 1.0856,
    timestamp: new Date().toISOString()
  };
  res.json(result);
});

app.get('/api/analysis/history', (req, res) => {
  const signals = [
    {
      id: 1,
      symbol: "EURUSD",
      direction: "LONG",
      entryPrice: 1.0856,
      exitPrice: 1.0890,
      profitLoss: 340.0,
      status: "CLOSED",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 2,
      symbol: "GBPUSD",
      direction: "SHORT",
      entryPrice: 1.2640,
      exitPrice: 1.2610,
      profitLoss: 600.0,
      status: "CLOSED",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
    }
  ];
  res.json({ signals });
});

app.post('/api/analysis/force-generation', (req, res) => {
  const result = {
    success: true,
    message: "Signal generation initiated",
    timestamp: new Date().toISOString()
  };
  res.json(result);
});

app.get('/api/analysis/market-overview', (req, res) => {
  const overview = {
    marketSentiment: "BULLISH",
    volatilityIndex: 45.2,
    majorEvents: [
      {
        title: "ECB Interest Rate Decision",
        impact: "HIGH",
        time: "14:00 UTC",
        currency: "EUR"
      }
    ]
  };
  res.json(overview);
});

// Additional ML endpoints
app.get('/api/ml/training-analytics', (req, res) => {
  const analytics = {
    trainingProgress: 85,
    currentEpoch: 42,
    totalEpochs: 50,
    loss: 0.045,
    validationAccuracy: 0.762
  };
  res.json(analytics);
});

app.get('/api/ml/recommendations', (req, res) => {
  const recommendations = [
    {
      type: "OPTIMIZE_FEATURES",
      description: "Consider adding momentum indicators",
      priority: "HIGH"
    },
    {
      type: "RETRAIN_MODEL",
      description: "Model accuracy below threshold",
      priority: "MEDIUM"
    }
  ];
  res.json({ recommendations });
});

app.post('/api/ml/train-model', (req, res) => {
  const result = {
    success: true,
    trainingId: "TRAIN_" + Date.now(),
    metrics: {
      accuracy: 0.785,
      loss: 0.032
    },
    message: "Model training completed successfully"
  };
  res.json(result);
});

app.post('/api/ml/detect-patterns', (req, res) => {
  const { symbol } = req.body;
  const result = {
    patternsDetected: 5,
    patterns: [
      { type: "HEAD_AND_SHOULDERS", confidence: 0.82 },
      { type: "DOUBLE_TOP", confidence: 0.75 }
    ],
    symbol: symbol || "BTCUSD"
  };
  res.json(result);
});

app.get('/api/ml/feedback-metrics', (req, res) => {
  const metrics = {
    totalFeedback: 1250,
    positiveRating: 0.78,
    averageAccuracy: 0.742
  };
  res.json(metrics);
});

app.get('/api/ml/adaptive-learning-status', (req, res) => {
  const status = {
    isActive: true,
    lastUpdate: new Date().toISOString(),
    adaptationRate: 0.15
  };
  res.json(status);
});

app.get('/api/ml/analyze-model-performance', (req, res) => {
  const analysis = {
    overallScore: 85.2,
    strengths: ["Pattern Recognition", "Risk Management"],
    weaknesses: ["News Sentiment", "Volatility Prediction"],
    recommendations: ["Increase training data", "Add sentiment features"]
  };
  res.json(analysis);
});

app.post('/api/ml/optimize-model', (req, res) => {
  const result = {
    success: true,
    optimizationId: "OPT_" + Date.now(),
    improvements: {
      accuracy: "+3.2%",
      speed: "+15%"
    }
  };
  res.json(result);
});

// Additional User endpoints
app.get('/api/user/subscription', (req, res) => {
  const subscription = {
    plan: "PRO",
    status: "ACTIVE",
    renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    features: ["Advanced AI", "Unlimited Signals", "24/7 Support"]
  };
  res.json({ subscription });
});

app.post('/api/user/profile', (req, res) => {
  const profile = {
    id: 1,
    name: "Trading Pro",
    email: "user@example.com",
    joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  };
  res.json(profile);
});

app.post('/api/user/trading-accounts', (req, res) => {
  const accounts = [
    {
      id: 1,
      broker: "PureMG Global",
      accountNumber: "6001637",
      balance: 9518.40,
      currency: "USD",
      status: "CONNECTED"
    }
  ];
  res.json({ accounts });
});

app.get('/api/user/subscription-plans', (req, res) => {
  const plans = [
    {
      id: "basic",
      name: "Basic",
      price: 49,
      features: ["5 Signals/Day", "Basic Support"]
    },
    {
      id: "pro",
      name: "Pro",
      price: 99,
      features: ["Unlimited Signals", "Advanced AI", "24/7 Support"]
    }
  ];
  res.json({ plans });
});

app.post('/api/user/upgrade-subscription', (req, res) => {
  const result = {
    success: true,
    message: "Subscription upgraded successfully",
    newPlan: req.body.tier || "PRO"
  };
  res.json(result);
});

app.post('/api/user/login', (req, res) => {
  const { email, password } = req.body;
  const result = {
    success: true,
    token: "jwt_token_here",
    user: {
      id: 1,
      email: email,
      name: "Trading User"
    }
  };
  res.json(result);
});

app.post('/api/user/register', (req, res) => {
  const { email, password, name } = req.body;
  const result = {
    success: true,
    message: "Registration successful",
    user: {
      id: Date.now(),
      email: email,
      name: name || "New User"
    }
  };
  res.json(result);
});

// Additional Trading endpoints
app.get('/api/trading/orders', (req, res) => {
  const orders = [
    {
      id: 1,
      symbol: "EURUSD",
      type: "BUY_LIMIT",
      volume: 0.1,
      price: 1.0850,
      status: "PENDING"
    }
  ];
  res.json({ orders });
});

app.post('/api/trading/place-order', (req, res) => {
  const result = {
    success: true,
    orderId: "ORDER_" + Date.now(),
    message: "Order placed successfully"
  };
  res.json(result);
});

app.post('/api/trading/close-position/:id', (req, res) => {
  const { id } = req.params;
  const result = {
    success: true,
    message: `Position ${id} closed successfully`,
    closedAt: new Date().toISOString()
  };
  res.json(result);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.url} not found`,
    availableEndpoints: [
      '/',
      '/api/health',
      // User endpoints
      '/api/user/preferences',
      '/api/user/mt5-config',
      '/api/user/subscription',
      '/api/user/profile',
      '/api/user/trading-accounts',
      '/api/user/subscription-plans',
      '/api/user/upgrade-subscription',
      '/api/user/login',
      '/api/user/register',
      // Analysis endpoints
      '/api/analysis/top-signals',
      '/api/analysis/signal-stats',
      '/api/analysis/performance',
      '/api/analysis/predict',
      '/api/analysis/execute',
      '/api/analysis/history',
      '/api/analysis/force-generation',
      '/api/analysis/market-overview',
      // ML endpoints
      '/api/ml/analytics',
      '/api/ml/training-analytics',
      '/api/ml/recommendations',
      '/api/ml/train-model',
      '/api/ml/detect-patterns',
      '/api/ml/feedback-metrics',
      '/api/ml/adaptive-learning-status',
      '/api/ml/analyze-model-performance',
      '/api/ml/optimize-model',
      // Trading endpoints
      '/api/trading/positions',
      '/api/trading/orders',
      '/api/trading/place-order',
      '/api/trading/close-position/:id'
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

const PORT = process.env.PORT || 3002;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 AI Cash Revolution Backend running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;