import { Router } from 'express';

const router = Router();

// Types for ML endpoints
export interface MLMetrics {
  totalModels: number;
  activeModels: number;
  totalPredictions: number;
  accuracyScore: number;
  lastTraining: Date;
  modelPerformance: {
    precision: number;
    recall: number;
    f1Score: number;
  };
  marketPatterns: Array<{
    pattern: string;
    frequency: number;
    accuracy: number;
  }>;
  featureImportance: Array<{
    feature: string;
    importance: number;
  }>;
  recentPredictions: Array<{
    symbol: string;
    prediction: number;
    confidence: number;
    timestamp: Date;
  }>;
}

interface GetMLAnalyticsResponse {
  analytics: MLMetrics;
}

// GET /ml/analytics - Get ML analytics dashboard data
router.get('/analytics', async (req, res) => {
  try {
    console.log("📊 Recuperando analytics ML...");

    // Mock ML analytics data for demo
    const mockAnalytics: MLMetrics = {
      totalModels: 12,
      activeModels: 8,
      totalPredictions: 1547,
      accuracyScore: 73.2,
      lastTraining: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      modelPerformance: {
        precision: 0.742,
        recall: 0.698,
        f1Score: 0.719
      },
      marketPatterns: [
        { pattern: "Double Bottom", frequency: 23, accuracy: 78.5 },
        { pattern: "Bull Flag", frequency: 18, accuracy: 82.1 },
        { pattern: "Head & Shoulders", frequency: 15, accuracy: 75.3 },
        { pattern: "Triangle Breakout", frequency: 12, accuracy: 69.8 }
      ],
      featureImportance: [
        { feature: "RSI", importance: 0.234 },
        { feature: "MACD", importance: 0.198 },
        { feature: "Volume", importance: 0.156 },
        { feature: "Price Action", importance: 0.142 },
        { feature: "Bollinger Bands", importance: 0.128 },
        { feature: "ATR", importance: 0.098 }
      ],
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
        },
        {
          symbol: "USDJPY",
          prediction: 149.80,
          confidence: 0.88,
          timestamp: new Date(Date.now() - 35 * 60 * 1000)
        }
      ]
    };

    const response: GetMLAnalyticsResponse = { analytics: mockAnalytics };
    res.json(response);

  } catch (error) {
    console.error("❌ Errore nel recupero delle analytics ML:", error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch ML analytics'
    });
  }
});

// POST /ml/record-metrics - Record model metrics (internal endpoint)
router.post('/record-metrics', async (req, res) => {
  try {
    const { modelName, accuracy, precision, recall, f1Score } = req.body;
    
    // For demo purposes, just log the metrics
    console.log("📈 Recording metrics for model:", modelName, {
      accuracy,
      precision,
      recall,
      f1Score
    });
    
    res.json({ success: true, message: "Metrics recorded successfully" });
  } catch (error) {
    console.error("❌ Error recording metrics:", error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to record metrics'
    });
  }
});

// POST /ml/record-prediction - Record prediction accuracy
router.post('/record-prediction', async (req, res) => {
  try {
    const { symbol, predictedValue, actualValue, confidence } = req.body;
    
    // For demo purposes, just log the prediction
    console.log("🎯 Recording prediction for symbol:", symbol, {
      predictedValue,
      actualValue,
      confidence,
      accuracy: Math.abs(predictedValue - actualValue) / actualValue
    });
    
    res.json({ success: true, message: "Prediction recorded successfully" });
  } catch (error) {
    console.error("❌ Error recording prediction:", error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to record prediction'
    });
  }
});

export default router;