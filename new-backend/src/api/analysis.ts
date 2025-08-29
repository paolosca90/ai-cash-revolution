import { Router } from 'express';

const router = Router();

// Types for analysis endpoints
export interface AutoSignal {
  symbol: string;
  direction: "LONG" | "SHORT";
  confidence: number;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  riskRewardRatio: number;
  strategy: string;
  timeframe: string;
  analysis: {
    rsi: number;
    macd: number;
    trend: string;
    volatility: string;
  };
  createdAt: Date;
  tradeId: string;
}

interface GetTopSignalsResponse {
  signals: AutoSignal[];
}

// GET /analysis/top-signals - Get top trading signals
router.get('/top-signals', async (req, res) => {
  try {
    console.log("🔍 Recuperando i migliori segnali automatici...");

    // For demo purposes, return mock signals
    // In a real implementation, this would query a database
    const mockSignals: AutoSignal[] = [
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
        createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
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
        createdAt: new Date(Date.now() - 22 * 60 * 1000), // 22 minutes ago
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
        createdAt: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
        tradeId: "USDJPY_" + Date.now()
      }
    ];

    const response: GetTopSignalsResponse = { signals: mockSignals };
    res.json(response);

  } catch (error) {
    console.error("❌ Errore nel recupero dei segnali:", error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch top signals'
    });
  }
});

// Additional analysis endpoints can be added here
// For example: market overview, predictions, etc.

export default router;