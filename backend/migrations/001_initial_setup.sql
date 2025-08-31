-- AI Trading Bot - Initial Database Setup
-- This migration will be automatically picked up by Supabase

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium', 'enterprise')),
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'inactive', 'expired')),
  subscription_expires TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  risk_percentage DECIMAL(5,2) DEFAULT 2.0 CHECK (risk_percentage >= 0.1 AND risk_percentage <= 10.0),
  account_balance DECIMAL(15,2) DEFAULT 10000.0,
  max_trades INTEGER DEFAULT 5 CHECK (max_trades >= 1 AND max_trades <= 50),
  preferred_symbols TEXT[] DEFAULT ARRAY['EURUSD','GBPUSD','USDJPY'],
  trading_hours JSONB DEFAULT '{"start": "08:00", "end": "18:00", "timezone": "UTC"}',
  auto_trading BOOLEAN DEFAULT FALSE,
  notification_email BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create trading accounts table
CREATE TABLE IF NOT EXISTS public.trading_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL CHECK (account_type IN ('MT5', 'MT4', 'DEMO')),
  account_name TEXT NOT NULL,
  broker_name TEXT,
  server_url TEXT,
  account_number TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  balance DECIMAL(15,2) DEFAULT 0.0,
  equity DECIMAL(15,2) DEFAULT 0.0,
  margin DECIMAL(15,2) DEFAULT 0.0,
  last_connection TIMESTAMPTZ,
  connection_status TEXT DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trading orders table
CREATE TABLE IF NOT EXISTS public.trading_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  order_id TEXT, -- MT5 order ID
  symbol TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('BUY', 'SELL', 'BUY_LIMIT', 'SELL_LIMIT', 'BUY_STOP', 'SELL_STOP')),
  volume DECIMAL(10,2) NOT NULL CHECK (volume > 0),
  open_price DECIMAL(10,5),
  close_price DECIMAL(10,5),
  current_price DECIMAL(10,5),
  stop_loss DECIMAL(10,5),
  take_profit DECIMAL(10,5),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'closed', 'cancelled', 'rejected')),
  profit DECIMAL(15,2) DEFAULT 0.0,
  commission DECIMAL(10,2) DEFAULT 0.0,
  swap DECIMAL(10,2) DEFAULT 0.0,
  comment TEXT,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trading signals table
CREATE TABLE IF NOT EXISTS public.trading_signals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  symbol TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('BUY', 'SELL')),
  strength DECIMAL(5,2) NOT NULL CHECK (strength >= 0.0 AND strength <= 100.0),
  entry_price DECIMAL(10,5),
  stop_loss DECIMAL(10,5),
  take_profit DECIMAL(10,5),
  confidence DECIMAL(5,2) CHECK (confidence >= 0.0 AND confidence <= 100.0),
  strategy TEXT,
  timeframe TEXT DEFAULT '1H' CHECK (timeframe IN ('5M', '15M', '30M', '1H', '4H', '1D')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'executed', 'expired', 'cancelled')),
  executed_price DECIMAL(10,5),
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '4 hours')
);

-- Create ML analytics table
CREATE TABLE IF NOT EXISTS public.ml_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  model_name TEXT NOT NULL,
  model_type TEXT DEFAULT 'classification' CHECK (model_type IN ('classification', 'regression', 'ensemble')),
  accuracy DECIMAL(5,4) CHECK (accuracy >= 0.0 AND accuracy <= 1.0),
  precision_score DECIMAL(5,4) CHECK (precision_score >= 0.0 AND precision_score <= 1.0),
  recall DECIMAL(5,4) CHECK (recall >= 0.0 AND recall <= 1.0),
  f1_score DECIMAL(5,4) CHECK (f1_score >= 0.0 AND f1_score <= 1.0),
  training_data_size INTEGER CHECK (training_data_size > 0),
  validation_score DECIMAL(5,4),
  last_trained TIMESTAMPTZ,
  training_duration_minutes INTEGER,
  predictions_count INTEGER DEFAULT 0,
  successful_predictions INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'training', 'inactive', 'error')),
  parameters JSONB,
  feature_importance JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create market data cache table
CREATE TABLE IF NOT EXISTS public.market_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  open_price DECIMAL(10,5) NOT NULL,
  close_price DECIMAL(10,5) NOT NULL,
  high_price DECIMAL(10,5) NOT NULL,
  low_price DECIMAL(10,5) NOT NULL,
  volume DECIMAL(15,2) DEFAULT 0,
  tick_volume INTEGER DEFAULT 0,
  spread DECIMAL(4,1),
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, timeframe, timestamp)
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription ON public.users(subscription_status, subscription_expires);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_id ON public.trading_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_status ON public.trading_accounts(connection_status, is_active);
CREATE INDEX IF NOT EXISTS idx_trading_orders_user_id ON public.trading_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_account_id ON public.trading_orders(account_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_symbol ON public.trading_orders(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_orders_status ON public.trading_orders(status);
CREATE INDEX IF NOT EXISTS idx_trading_orders_opened_at ON public.trading_orders(opened_at);
CREATE INDEX IF NOT EXISTS idx_trading_signals_symbol ON public.trading_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_signals_status ON public.trading_signals(status, created_at);
CREATE INDEX IF NOT EXISTS idx_trading_signals_expires_at ON public.trading_signals(expires_at);
CREATE INDEX IF NOT EXISTS idx_ml_analytics_model_name ON public.ml_analytics(model_name);
CREATE INDEX IF NOT EXISTS idx_ml_analytics_status ON public.ml_analytics(status, last_trained);
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timeframe ON public.market_data(symbol, timeframe);
CREATE INDEX IF NOT EXISTS idx_market_data_timestamp ON public.market_data(timestamp DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trading_accounts_updated_at BEFORE UPDATE ON public.trading_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ml_analytics_updated_at BEFORE UPDATE ON public.ml_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();