import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = SQLDatabase.named("trading");

interface TradingSignal {
  id: number;
  symbol: string;
  action: "BUY" | "SELL" | "HOLD";
  confidence: number;
  price: number;
  timestamp: Date;
  strategy: string;
  indicators: Record<string, number>;
  createdAt: Date;
}

interface GetSignalsRequest {
  symbol?: string;
  limit?: number;
  strategy?: string;
}

interface GetSignalsResponse {
  signals: TradingSignal[];
}

// Retrieves trading signals from the database
export const getSignals = api<GetSignalsRequest, GetSignalsResponse>(
  { expose: true, method: "GET", path: "/signals" },
  async (req) => {
    const { symbol, limit = 50, strategy } = req;
    
    let query = `
      SELECT id, symbol, action, confidence, price, timestamp, strategy, indicators, created_at
      FROM trading_signals
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (symbol) {
      query += ` AND symbol = $${paramIndex}`;
      params.push(symbol);
      paramIndex++;
    }
    
    if (strategy) {
      query += ` AND strategy = $${paramIndex}`;
      params.push(strategy);
      paramIndex++;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);
    
    const rows = await db.rawQueryAll<{
      id: number;
      symbol: string;
      action: "BUY" | "SELL" | "HOLD";
      confidence: number;
      price: number;
      timestamp: Date;
      strategy: string;
      indicators: string;
      created_at: Date;
    }>(query, ...params);
    
    const signals: TradingSignal[] = rows.map(row => ({
      id: row.id,
      symbol: row.symbol,
      action: row.action,
      confidence: row.confidence,
      price: row.price,
      timestamp: row.timestamp,
      strategy: row.strategy,
      indicators: JSON.parse(row.indicators),
      createdAt: row.created_at
    }));
    
    return { signals };
  }
);
