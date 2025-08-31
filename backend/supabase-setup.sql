-- Supabase Database Setup for AI Trading Bot
-- Run these commands in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (if not using auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'trial',
  subscription_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  risk_percentage DECIMAL DEFAULT 2.0,
  account_balance DECIMAL DEFAULT 10000.0,
  max_trades INTEGER DEFAULT 5,
  preferred_symbols TEXT[] DEFAULT '{"EURUSD","GBPUSD","USDJPY"}',
  trading_hours JSONB DEFAULT '{"start": "08:00", "end": "18:00"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trading accounts table
CREATE TABLE IF NOT EXISTS public.trading_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL, -- 'MT5', 'MT4', 'BINANCE', etc.
  account_name TEXT NOT NULL,
  broker_name TEXT,
  server_url TEXT,
  account_number TEXT,
  api_key TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_connection TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trading orders table
CREATE TABLE IF NOT EXISTS public.trading_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  order_type TEXT NOT NULL, -- 'BUY', 'SELL', 'BUY_LIMIT', etc.
  volume DECIMAL NOT NULL,
  open_price DECIMAL,
  close_price DECIMAL,
  stop_loss DECIMAL,
  take_profit DECIMAL,
  status TEXT DEFAULT 'pending', -- 'pending', 'open', 'closed', 'cancelled'
  profit DECIMAL DEFAULT 0.0,
  comment TEXT,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trading signals table
CREATE TABLE IF NOT EXISTS public.trading_signals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  symbol TEXT NOT NULL,
  signal_type TEXT NOT NULL, -- 'BUY', 'SELL'
  strength DECIMAL NOT NULL, -- 0.0 to 100.0
  entry_price DECIMAL,
  stop_loss DECIMAL,
  take_profit DECIMAL,
  confidence DECIMAL, -- 0.0 to 100.0
  strategy TEXT, -- 'RSI', 'MACD', 'ML_PREDICTION', etc.
  timeframe TEXT DEFAULT '1H',
  status TEXT DEFAULT 'active', -- 'active', 'executed', 'expired'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '4 hours')
);

-- Create ML analytics table
CREATE TABLE IF NOT EXISTS public.ml_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  model_name TEXT NOT NULL,
  accuracy DECIMAL,
  precision_score DECIMAL,
  recall DECIMAL,
  f1_score DECIMAL,
  training_data_size INTEGER,
  last_trained TIMESTAMPTZ,
  predictions_count INTEGER DEFAULT 0,
  successful_predictions INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- 'active', 'training', 'inactive'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create market data table for caching
CREATE TABLE IF NOT EXISTS public.market_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  open_price DECIMAL NOT NULL,
  close_price DECIMAL NOT NULL,
  high_price DECIMAL NOT NULL,
  low_price DECIMAL NOT NULL,
  volume DECIMAL DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, timeframe, timestamp)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_trading_orders_user_id ON public.trading_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_symbol ON public.trading_orders(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_orders_status ON public.trading_orders(status);
CREATE INDEX IF NOT EXISTS idx_trading_signals_symbol ON public.trading_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_signals_created_at ON public.trading_signals(created_at);
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timeframe ON public.market_data(symbol, timeframe);
CREATE INDEX IF NOT EXISTS idx_market_data_timestamp ON public.market_data(timestamp);

-- Insert some demo trading signals
INSERT INTO public.trading_signals (symbol, signal_type, strength, entry_price, stop_loss, take_profit, confidence, strategy) VALUES
('EURUSD', 'BUY', 78.5, 1.0950, 1.0920, 1.1000, 85.2, 'ML_PREDICTION'),
('GBPUSD', 'SELL', 82.1, 1.2650, 1.2680, 1.2600, 89.7, 'RSI_MACD_COMBO'),
('USDJPY', 'BUY', 71.3, 149.20, 148.80, 150.00, 76.4, 'BREAKOUT_STRATEGY'),
('AUDUSD', 'SELL', 69.8, 0.6720, 0.6750, 0.6680, 72.1, 'TREND_FOLLOWING'),
('USDCAD', 'BUY', 75.2, 1.3580, 1.3550, 1.3630, 80.3, 'SUPPORT_RESISTANCE')
ON CONFLICT DO NOTHING;

-- Insert demo ML analytics data
INSERT INTO public.ml_analytics (model_name, accuracy, precision_score, recall, f1_score, training_data_size, last_trained, predictions_count, successful_predictions) VALUES
('LSTM_Price_Predictor', 87.3, 0.89, 0.85, 0.87, 50000, NOW() - INTERVAL '2 hours', 1250, 1091),
('Random_Forest_Signal', 82.1, 0.84, 0.80, 0.82, 35000, NOW() - INTERVAL '6 hours', 890, 730),
('Neural_Network_Trend', 79.8, 0.81, 0.78, 0.79, 42000, NOW() - INTERVAL '12 hours', 567, 452),
('Ensemble_Strategy', 91.2, 0.93, 0.89, 0.91, 75000, NOW() - INTERVAL '1 hour', 2340, 2135)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS) for user data protection
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (users can only access their own data)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own trading accounts" ON public.trading_accounts
  FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own trading orders" ON public.trading_orders
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.user_preferences TO authenticated;
GRANT ALL ON public.trading_accounts TO authenticated;
GRANT ALL ON public.trading_orders TO authenticated;
GRANT SELECT ON public.trading_signals TO authenticated;
GRANT SELECT ON public.ml_analytics TO authenticated;
GRANT SELECT ON public.market_data TO authenticated;