/**
 * Mock Backend Server per Testing
 * Server semplificato per testare il sistema senza Encore.dev
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 4001;

// Middleware
app.use(cors());
app.use(express.json());

// Dati mock per il testing
const mockData = {
  // Top Signals Mock (formato corretto per AutoSignalCard)
  topSignals: {
    signals: [
      {
        tradeId: "BTC001",
        symbol: "BTCUSD",
        direction: "LONG", // Cambiato da "action: BUY"
        confidence: 85.5,
        entryPrice: 43250.00,
        stopLoss: 42800.00,
        takeProfit: 44500.00,
        riskRewardRatio: 2.1,
        timestamp: new Date().toISOString(),
        strategy: "Neural Network + Smart Money",
        timeframe: "1H",
        maxConfidence: 100,
        validUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        status: "pending",
        analysis: {
          rsi: 68.5,
          macd: 0.15,
          trend: "BULLISH",
          volatility: "MEDIUM"
        }
      },
      {
        tradeId: "ETH002", 
        symbol: "ETHUSD",
        direction: "SHORT", // Cambiato da "action: SELL"
        confidence: 78.2,
        entryPrice: 2650.00,
        stopLoss: 2720.00,
        takeProfit: 2500.00,
        riskRewardRatio: 2.8,
        timestamp: new Date().toISOString(),
        strategy: "Price Action + Volume",
        timeframe: "4H",
        maxConfidence: 100,
        validUntil: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
        status: "pending",
        analysis: {
          rsi: 75.3,
          macd: -0.08,
          trend: "BEARISH",
          volatility: "HIGH"
        }
      },
      {
        tradeId: "EUR003",
        symbol: "EURUSD", 
        direction: "LONG", // Cambiato da "action: BUY"
        confidence: 92.1,
        entryPrice: 1.0850,
        stopLoss: 1.0820,
        takeProfit: 1.0920,
        riskRewardRatio: 2.3,
        timestamp: new Date().toISOString(),
        strategy: "Smart Money Flow",
        timeframe: "1D",
        maxConfidence: 100,
        validUntil: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
        status: "executed",
        executionPrice: 1.0855,
        pnl: 15.50,
        analysis: {
          rsi: 45.8,
          macd: 0.22,
          trend: "BULLISH",
          volatility: "LOW"
        }
      }
    ]
  },

  // Performance Mock
  performance: {
    totalProfitLoss: 2847.50,
    winRate: 73.2,
    profitFactor: 1.85,
    bestTrade: 1250.00,
    currentStreak: 5,
    sharpeRatio: 1.42,
    totalTrades: 156,
    maxDrawdown: 8.5
  },

  // Signal Stats Mock  
  signalStats: {
    totalGenerated: 847,
    totalExecuted: 634,
    totalClosed: 589,
    avgConfidence: 76.8,
    lastGenerationTime: new Date().toISOString(),
    topPerformingSymbol: "EURUSD"
  },

  // ML Analytics Mock
  mlAnalytics: {
    modelPerformance: {
      accuracy: 0.785,
      precision: 0.812,
      recall: 0.756,
      f1Score: 0.783,
      sharpeRatio: 1.42
    },
    predictionStats: {
      totalPredictions: 1247,
      winRate: 0.742,
      avgConfidence: 76.8
    },
    performanceTimeline: Array.from({length: 30}, (_, i) => ({
      date: new Date(Date.now() - (29-i) * 24 * 60 * 60 * 1000).toISOString(),
      accuracy: 0.7 + Math.random() * 0.2,
      profitLoss: (Math.random() - 0.3) * 500,
      predictions: Math.floor(Math.random() * 50) + 20
    })),
    featureImportance: [
      { feature: "Smart Money Flow", importance: 0.85, type: "institutional" },
      { feature: "Price Action", importance: 0.78, type: "technical" },
      { feature: "Volume Profile", importance: 0.72, type: "volume" },
      { feature: "News Sentiment", importance: 0.65, type: "fundamental" },
      { feature: "Market Structure", importance: 0.58, type: "technical" },
      { feature: "Liquidity Zones", importance: 0.52, type: "institutional" }
    ],
    learningProgress: Array.from({length: 50}, (_, i) => ({
      epoch: i + 1,
      trainingLoss: 1.2 - (i * 0.02) + Math.random() * 0.1,
      validationLoss: 1.1 - (i * 0.018) + Math.random() * 0.1,
      accuracy: 0.5 + (i * 0.006) + Math.random() * 0.02
    })),
    marketPatterns: [
      {
        pattern: "Double Bottom",
        type: "Reversal", 
        confidence: 0.87,
        successRate: 0.74,
        avgProfit: 180,
        detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        pattern: "Bull Flag",
        type: "Continuation",
        confidence: 0.82,
        successRate: 0.78,
        avgProfit: 150,
        detectedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      }
    ],
    signalAnalytics: {
      successRateBySymbol: [
        { symbol: "BTCUSD", successRate: 78.5, totalSignals: 145, successfulSignals: 114, avgGenerationTime: 850 },
        { symbol: "ETHUSD", successRate: 73.2, totalSignals: 132, successfulSignals: 96, avgGenerationTime: 720 },
        { symbol: "EURUSD", successRate: 81.3, totalSignals: 98, successfulSignals: 79, avgGenerationTime: 650 }
      ],
      performanceByConditions: [
        { sessionType: "London", volatilityState: "High", signalCount: 45, avgConfidence: 82.1, successfulCount: 38 },
        { sessionType: "New York", volatilityState: "Medium", signalCount: 67, avgConfidence: 75.8, successfulCount: 49 }
      ],
      trendAnalysis: Array.from({length: 24}, (_, i) => ({
        hour: new Date(Date.now() - (23-i) * 60 * 60 * 1000).toISOString(),
        signalsGenerated: Math.floor(Math.random() * 15) + 5,
        avgConfidence: 70 + Math.random() * 20,
        successfulSignals: Math.floor(Math.random() * 10) + 3
      }))
    },
    adaptiveParameters: [
      {
        parameter: "Learning Rate",
        currentValue: 0.001,
        adaptationReason: "High volatility detected",
        performanceImprovement: 0.05
      }
    ]
  },

  // Positions Mock
  positions: {
    positions: [
      {
        tradeId: "BTC001",
        symbol: "BTCUSD", 
        action: "BUY",
        entryPrice: 43250.00,
        currentPrice: 43420.00,
        lotSize: 0.1,
        profitLoss: 17.00,
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      }
    ]
  },

  // History Mock
  history: {
    signals: Array.from({length: 20}, (_, i) => ({
      tradeId: `HIST${i+1}`,
      symbol: ["BTCUSD", "ETHUSD", "EURUSD"][i % 3],
      direction: ["LONG", "SHORT"][i % 2],
      action: ["BUY", "SELL"][i % 2], // Manteniamo per compatibilità
      entryPrice: 1000 + Math.random() * 50000,
      exitPrice: 1000 + Math.random() * 50000,
      profitLoss: (Math.random() - 0.3) * 500,
      confidence: 60 + Math.random() * 30,
      timestamp: new Date(Date.now() - i * 2 * 60 * 60 * 1000).toISOString(),
      status: "CLOSED",
      timeframe: ["1H", "4H", "1D"][i % 3],
      strategy: ["Neural Network", "Smart Money", "Price Action"][i % 3],
      analysis: {
        rsi: 30 + Math.random() * 40,
        macd: (Math.random() - 0.5) * 0.5,
        trend: ["BULLISH", "BEARISH", "SIDEWAYS"][i % 3],
        volatility: ["LOW", "MEDIUM", "HIGH"][i % 3]
      }
    }))
  },

  // Feedback Metrics Mock
  feedbackMetrics: {
    metrics: {
      totalTrades: 589,
      correctPredictions: 431,
      accuracy: 73.2,
      profitFactor: 1.85,
      sharpeRatio: 1.42,
      maxDrawdown: 8.5,
      avgWin: 125.50,
      avgLoss: 67.80,
      winRate: 73.2,
      strategyPerformance: new Map([
        ["Neural Network + Smart Money", { trades: 245, accuracy: 78.5, profitLoss: 1250.00, avgConfidence: 82.1 }],
        ["Price Action + Volume", { trades: 189, accuracy: 71.2, profitLoss: 890.50, avgConfidence: 75.8 }],
        ["Smart Money Flow", { trades: 155, accuracy: 69.8, profitLoss: 707.00, avgConfidence: 73.5 }]
      ]),
      errorAnalysis: {
        falsePositives: 45,
        falseNegatives: 38,
        lowConfidenceWins: 23,
        highConfidenceLosses: 17,
        commonFailurePatterns: [
          "High volatility environments cause frequent losses",
          "Low volume conditions reduce prediction accuracy"
        ]
      }
    }
  },

  // Adaptive Learning Status Mock
  adaptiveLearningStatus: {
    status: {
      learningRate: 0.001,
      adaptationScore: 78.5,
      lastOptimization: new Date(Date.now() - 2 * 60 * 60 * 1000),
      pendingAdjustments: 3,
      performanceTrend: "IMPROVING",
      confidenceLevel: 82.1,
      nextOptimizationETA: "2 days"
    }
  },

  // Model Analysis Mock
  modelAnalysis: {
    analysis: {
      overallScore: 78.5,
      strengths: [
        "Excellent prediction accuracy: 73.2%",
        "Strong profit factor: 1.85",
        "High win rate: 73.2%",
        "Good risk-adjusted returns: Sharpe 1.42"
      ],
      weaknesses: [
        "Could improve in high volatility conditions",
        "News integration needs enhancement"
      ],
      recommendations: [
        "Consider increasing position size for high-confidence signals",
        "Implement stricter risk management during news events"
      ],
      suggestedAdjustments: [
        {
          adjustmentType: "THRESHOLD_ADJUSTMENT",
          description: "Increase confidence threshold for trade execution",
          expectedImprovement: 3.5,
          confidenceLevel: 0.85
        },
        {
          adjustmentType: "WEIGHT_UPDATE", 
          description: "Update neural network weights to improve accuracy",
          expectedImprovement: 2.8,
          confidenceLevel: 0.75
        }
      ]
    }
  }
};

// Routes per il testing

// Analysis routes
app.get('/analysis/top-signals', (req, res) => {
  res.json(mockData.topSignals);
});

app.get('/analysis/performance', (req, res) => {
  res.json(mockData.performance);
});

app.get('/analysis/signal-stats', (req, res) => {
  res.json(mockData.signalStats);
});

app.get('/analysis/positions', (req, res) => {
  res.json(mockData.positions);
});

app.get('/analysis/history', (req, res) => {
  res.json(mockData.history);
});

app.post('/analysis/force-generation', (req, res) => {
  res.json({ success: true, message: "Signal generation triggered" });
});

// ML routes
app.get('/ml/analytics', (req, res) => {
  res.json(mockData.mlAnalytics);
});

app.post('/ml/train', (req, res) => {
  res.json({ 
    success: true, 
    metrics: { accuracy: 0.785 }
  });
});

app.post('/ml/detect-patterns', (req, res) => {
  res.json({ 
    success: true, 
    patternsDetected: Math.floor(Math.random() * 5) + 1
  });
});

app.get('/ml/feedback-metrics', (req, res) => {
  res.json(mockData.feedbackMetrics);
});

app.get('/ml/adaptive-learning-status', (req, res) => {
  res.json(mockData.adaptiveLearningStatus);
});

app.post('/ml/analyze-performance', (req, res) => {
  res.json(mockData.modelAnalysis);
});

app.post('/ml/optimize', (req, res) => {
  res.json({
    success: true,
    improvementEstimate: 5.2,
    newModelVersion: `v${Date.now()}`
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock Backend Server running on http://localhost:${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   GET  /analysis/top-signals`);
  console.log(`   GET  /analysis/performance`);
  console.log(`   GET  /analysis/signal-stats`);
  console.log(`   GET  /analysis/positions`);
  console.log(`   GET  /analysis/history`);
  console.log(`   POST /analysis/force-generation`);
  console.log(`   GET  /ml/analytics`);
  console.log(`   POST /ml/train`);
  console.log(`   POST /ml/detect-patterns`);
  console.log(`   GET  /ml/feedback-metrics`);
  console.log(`   GET  /ml/adaptive-learning-status`);
  console.log(`   POST /ml/analyze-performance`);
  console.log(`   POST /ml/optimize`);
  console.log(`   GET  /health`);
  console.log(`\n💡 Frontend disponibile su: http://localhost:5173`);
});