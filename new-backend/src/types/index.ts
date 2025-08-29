// User Management Types
export interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
}

export interface UserPreferences {
  userId: number;
  riskPercentage: number;
  accountBalance: number;
  updatedAt: Date;
}

export interface Mt5Config {
  userId: number;
  host: string;
  port: number;
  login: string;
  server: string;
}

export interface Subscription {
  userId: number;
  plan: "free" | "pro" | "enterprise";
  status: "active" | "inactive" | "past_due";
  expiresAt: Date | null;
}

// Trading Types
export interface TradingSignal {
  id: number;
  symbol: string;
  action: "buy" | "sell";
  confidence: number;
  price: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: Date;
  reasoning?: string;
}

export interface Position {
  id: number;
  symbol: string;
  type: "buy" | "sell";
  volume: number;
  openPrice: number;
  currentPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  profit?: number;
  timestamp: Date;
}

export interface Order {
  id: number;
  symbol: string;
  type: "buy" | "sell";
  volume: number;
  price: number;
  status: "pending" | "executed" | "cancelled" | "failed";
  timestamp: Date;
}

// Analysis Types
export interface MarketAnalysis {
  symbol: string;
  trend: "bullish" | "bearish" | "neutral";
  confidence: number;
  indicators: Record<string, number>;
  timestamp: Date;
}

export interface BacktestResult {
  strategy: string;
  period: string;
  totalTrades: number;
  winRate: number;
  totalReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

// ML Types
export interface MLPrediction {
  symbol: string;
  prediction: number;
  confidence: number;
  model: string;
  features: Record<string, number>;
  timestamp: Date;
}

// API Request/Response Types
export interface GetPreferencesResponse {
  preferences: UserPreferences | null;
}

export interface UpdatePreferencesRequest {
  riskPercentage: number;
  accountBalance: number;
}

export interface UpdatePreferencesResponse {
  success: boolean;
}

export interface GetMt5ConfigResponse {
  config: Mt5Config | null;
}

export interface UpdateMt5ConfigRequest extends Omit<Mt5Config, "userId"> {
  password?: string;
}

export interface UpdateMt5ConfigResponse {
  success: boolean;
}

export interface GetSubscriptionResponse {
  subscription: Subscription | null;
}

export interface GetMt5ConfigForUserRequest {
  userId: number;
}

export interface GetMt5ConfigForUserResponse {
  config: Mt5Config | null;
}

// Common API Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}