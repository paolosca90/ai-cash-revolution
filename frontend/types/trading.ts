// Trading Types - migrated from backend Encore types

export enum TradingStrategy {
  SCALPING = 'scalping',
  INTRADAY = 'intraday',
  SWING = 'swing',
  LONG_TERM = 'long_term'
}

export interface TradingStrategyInfo {
  name: string;
  description: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeframe: string;
  parameters?: Record<string, any>;
}

export interface TradingSignal {
  id: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  confidence: number;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  riskRewardRatio: number;
  strategy: string;
  timeframe: string;
  analysis?: {
    rsi?: number;
    macd?: number;
    trend?: string;
    volatility?: string;
  };
  createdAt: Date;
  tradeId: string;
  status?: 'PENDING' | 'EXECUTED' | 'CLOSED' | 'CANCELLED';
}

export interface MT5Position {
  ticket: number;
  symbol: string;
  type: number; // 0 for BUY, 1 for SELL
  volume: number;
  openPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  profit: number;
  timestamp: Date;
  comment?: string;
}

export interface AssetReliability {
  symbol: string;
  reliability: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
  volume: number;
  lastUpdate: Date;
}

export interface MarketNews {
  id: string;
  title: string;
  content: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  currency: string;
  publishedAt: Date;
  source: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}