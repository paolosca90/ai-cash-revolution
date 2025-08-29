-- Migration: Create Feedback System Tables
-- Sistema completo di feedback per il miglioramento continuo dell'AI

-- Tabella per i risultati dei trade
CREATE TABLE IF NOT EXISTS trade_results (
  id BIGSERIAL PRIMARY KEY,
  trade_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  strategy TEXT NOT NULL,
  predicted_outcome TEXT NOT NULL CHECK (predicted_outcome IN ('WIN', 'LOSS')),
  actual_outcome TEXT NOT NULL CHECK (actual_outcome IN ('WIN', 'LOSS')),
  confidence_score DECIMAL(5,2) NOT NULL,
  entry_price DECIMAL(12,5) NOT NULL,
  exit_price DECIMAL(12,5) NOT NULL,
  profit_loss DECIMAL(12,2) NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  max_drawdown DECIMAL(8,4) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Market conditions
  volatility DECIMAL(8,6) NOT NULL,
  trend TEXT NOT NULL CHECK (trend IN ('BULL', 'BEAR', 'SIDEWAYS')),
  volume TEXT NOT NULL CHECK (volume IN ('HIGH', 'MEDIUM', 'LOW')),
  news_impact TEXT NOT NULL CHECK (news_impact IN ('HIGH', 'MEDIUM', 'LOW')),
  session_quality TEXT NOT NULL CHECK (session_quality IN ('EXCELLENT', 'GOOD', 'FAIR', 'POOR')),
  
  -- Feature scores
  price_action_score DECIMAL(5,2) NOT NULL,
  volume_profile_score DECIMAL(5,2) NOT NULL,
  smart_money_score DECIMAL(5,2) NOT NULL,
  technical_indicators_score DECIMAL(5,2) NOT NULL,
  news_score DECIMAL(5,2) NOT NULL,
  market_regime_score DECIMAL(5,2) NOT NULL,
  
  -- Indexes
  UNIQUE(trade_id)
);

-- Indexes for performance
CREATE INDEX idx_trade_results_timestamp ON trade_results(timestamp DESC);
CREATE INDEX idx_trade_results_symbol ON trade_results(symbol);
CREATE INDEX idx_trade_results_strategy ON trade_results(strategy);
CREATE INDEX idx_trade_results_outcome ON trade_results(predicted_outcome, actual_outcome);

-- Tabella per i pattern di apprendimento
CREATE TABLE IF NOT EXISTS learning_patterns (
  id BIGSERIAL PRIMARY KEY,
  trade_id TEXT NOT NULL REFERENCES trade_results(trade_id),
  pattern_type TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  features JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confidence_level DECIMAL(5,2) DEFAULT 50.0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learning_patterns_type ON learning_patterns(pattern_type);
CREATE INDEX idx_learning_patterns_success ON learning_patterns(success);
CREATE INDEX idx_learning_patterns_timestamp ON learning_patterns(timestamp DESC);

-- Tabella per le ottimizzazioni del modello
CREATE TABLE IF NOT EXISTS model_optimizations (
  id BIGSERIAL PRIMARY KEY,
  version TEXT NOT NULL,
  adjustments JSONB NOT NULL,
  expected_improvement DECIMAL(8,4) NOT NULL,
  actual_improvement DECIMAL(8,4),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPLIED', 'REVERTED')),
  
  -- Performance metrics before and after
  accuracy_before DECIMAL(5,2),
  accuracy_after DECIMAL(5,2),
  profit_factor_before DECIMAL(8,4),
  profit_factor_after DECIMAL(8,4),
  
  -- Notes and metadata
  notes TEXT,
  created_by TEXT DEFAULT 'SYSTEM'
);

CREATE INDEX idx_model_optimizations_version ON model_optimizations(version);
CREATE INDEX idx_model_optimizations_status ON model_optimizations(status);
CREATE INDEX idx_model_optimizations_timestamp ON model_optimizations(timestamp DESC);

-- Tabella per le richieste di training
CREATE TABLE IF NOT EXISTS training_requests (
  id BIGSERIAL PRIMARY KEY,
  reason TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  priority INTEGER NOT NULL DEFAULT 5,
  
  -- Training parameters
  training_params JSONB,
  estimated_duration INTEGER, -- in minutes
  
  -- Results
  completion_time TIMESTAMPTZ,
  accuracy_improvement DECIMAL(5,2),
  error_message TEXT,
  
  -- Metadata
  requested_by TEXT DEFAULT 'SYSTEM',
  notes TEXT
);

CREATE INDEX idx_training_requests_status ON training_requests(status);
CREATE INDEX idx_training_requests_priority ON training_requests(priority DESC);
CREATE INDEX idx_training_requests_timestamp ON training_requests(timestamp DESC);

-- Tabella per le metriche di performance
CREATE TABLE IF NOT EXISTS performance_metrics (
  id BIGSERIAL PRIMARY KEY,
  metric_date DATE NOT NULL,
  total_trades INTEGER NOT NULL DEFAULT 0,
  correct_predictions INTEGER NOT NULL DEFAULT 0,
  accuracy DECIMAL(5,2) NOT NULL DEFAULT 0,
  profit_factor DECIMAL(8,4) NOT NULL DEFAULT 0,
  sharpe_ratio DECIMAL(8,4) NOT NULL DEFAULT 0,
  max_drawdown DECIMAL(8,4) NOT NULL DEFAULT 0,
  win_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  avg_confidence DECIMAL(5,2) NOT NULL DEFAULT 0,
  
  -- Strategy breakdowns
  strategy_performance JSONB,
  
  -- Error analysis
  false_positives INTEGER NOT NULL DEFAULT 0,
  false_negatives INTEGER NOT NULL DEFAULT 0,
  high_confidence_losses INTEGER NOT NULL DEFAULT 0,
  low_confidence_wins INTEGER NOT NULL DEFAULT 0,
  
  -- System health
  system_confidence DECIMAL(5,2) NOT NULL DEFAULT 0,
  learning_rate DECIMAL(8,6) NOT NULL DEFAULT 0.001,
  adaptation_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  
  UNIQUE(metric_date)
);

CREATE INDEX idx_performance_metrics_date ON performance_metrics(metric_date DESC);

-- Tabella per il tracking delle feature
CREATE TABLE IF NOT EXISTS feature_importance_tracking (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  feature_name TEXT NOT NULL,
  importance_score DECIMAL(8,6) NOT NULL,
  feature_type TEXT NOT NULL,
  model_version TEXT NOT NULL,
  
  -- Performance impact
  accuracy_contribution DECIMAL(5,2),
  profit_contribution DECIMAL(8,4),
  
  -- Statistical significance
  p_value DECIMAL(10,8),
  confidence_interval JSONB,
  
  -- Metadata
  calculation_method TEXT DEFAULT 'SHAP',
  sample_size INTEGER,
  notes TEXT
);

CREATE INDEX idx_feature_importance_timestamp ON feature_importance_tracking(timestamp DESC);
CREATE INDEX idx_feature_importance_name ON feature_importance_tracking(feature_name);
CREATE INDEX idx_feature_importance_score ON feature_importance_tracking(importance_score DESC);

-- Tabella per l'analisi degli errori dettagliata
CREATE TABLE IF NOT EXISTS error_analysis (
  id BIGSERIAL PRIMARY KEY,
  trade_id TEXT NOT NULL REFERENCES trade_results(trade_id),
  error_type TEXT NOT NULL CHECK (error_type IN ('FALSE_POSITIVE', 'FALSE_NEGATIVE', 'HIGH_CONF_LOSS', 'LOW_CONF_WIN')),
  error_magnitude DECIMAL(8,4) NOT NULL,
  contributing_factors JSONB,
  market_conditions JSONB,
  suggested_improvements JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Analysis metadata
  analyzed_by TEXT DEFAULT 'SYSTEM',
  severity TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'IGNORED')),
  
  -- Resolution tracking
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

CREATE INDEX idx_error_analysis_type ON error_analysis(error_type);
CREATE INDEX idx_error_analysis_severity ON error_analysis(severity);
CREATE INDEX idx_error_analysis_status ON error_analysis(status);
CREATE INDEX idx_error_analysis_timestamp ON error_analysis(timestamp DESC);

-- View per metriche rapide
CREATE OR REPLACE VIEW v_daily_performance AS
SELECT 
  DATE(timestamp) as trade_date,
  COUNT(*) as total_trades,
  COUNT(CASE WHEN predicted_outcome = actual_outcome THEN 1 END) as correct_predictions,
  ROUND(COUNT(CASE WHEN predicted_outcome = actual_outcome THEN 1 END)::DECIMAL / COUNT(*) * 100, 2) as accuracy_pct,
  SUM(profit_loss) as total_pnl,
  COUNT(CASE WHEN profit_loss > 0 THEN 1 END) as winning_trades,
  ROUND(COUNT(CASE WHEN profit_loss > 0 THEN 1 END)::DECIMAL / COUNT(*) * 100, 2) as win_rate_pct,
  AVG(confidence_score) as avg_confidence,
  MAX(profit_loss) as best_trade,
  MIN(profit_loss) as worst_trade,
  STDDEV(profit_loss) as pnl_volatility
FROM trade_results 
GROUP BY DATE(timestamp)
ORDER BY trade_date DESC;

-- View per analisi strategiche
CREATE OR REPLACE VIEW v_strategy_performance AS
SELECT 
  strategy,
  COUNT(*) as total_trades,
  COUNT(CASE WHEN predicted_outcome = actual_outcome THEN 1 END) as correct_predictions,
  ROUND(COUNT(CASE WHEN predicted_outcome = actual_outcome THEN 1 END)::DECIMAL / COUNT(*) * 100, 2) as accuracy_pct,
  SUM(profit_loss) as total_pnl,
  ROUND(SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END) / 
        NULLIF(ABS(SUM(CASE WHEN profit_loss < 0 THEN profit_loss ELSE 0 END)), 0), 2) as profit_factor,
  AVG(confidence_score) as avg_confidence,
  COUNT(CASE WHEN profit_loss > 0 THEN 1 END) as wins,
  COUNT(CASE WHEN profit_loss < 0 THEN 1 END) as losses
FROM trade_results 
GROUP BY strategy
ORDER BY total_pnl DESC;

-- Trigger per aggiornare automaticamente le metriche giornaliere
CREATE OR REPLACE FUNCTION update_daily_metrics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO performance_metrics (
    metric_date, total_trades, correct_predictions, accuracy, 
    win_rate, avg_confidence, false_positives, false_negatives
  )
  SELECT 
    CURRENT_DATE,
    COUNT(*),
    COUNT(CASE WHEN predicted_outcome = actual_outcome THEN 1 END),
    ROUND(COUNT(CASE WHEN predicted_outcome = actual_outcome THEN 1 END)::DECIMAL / COUNT(*) * 100, 2),
    ROUND(COUNT(CASE WHEN profit_loss > 0 THEN 1 END)::DECIMAL / COUNT(*) * 100, 2),
    AVG(confidence_score),
    COUNT(CASE WHEN predicted_outcome = 'WIN' AND actual_outcome = 'LOSS' THEN 1 END),
    COUNT(CASE WHEN predicted_outcome = 'LOSS' AND actual_outcome = 'WIN' THEN 1 END)
  FROM trade_results 
  WHERE DATE(timestamp) = CURRENT_DATE
  ON CONFLICT (metric_date) DO UPDATE SET
    total_trades = EXCLUDED.total_trades,
    correct_predictions = EXCLUDED.correct_predictions,
    accuracy = EXCLUDED.accuracy,
    win_rate = EXCLUDED.win_rate,
    avg_confidence = EXCLUDED.avg_confidence,
    false_positives = EXCLUDED.false_positives,
    false_negatives = EXCLUDED.false_negatives;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
DROP TRIGGER IF EXISTS tr_update_daily_metrics ON trade_results;
CREATE TRIGGER tr_update_daily_metrics
  AFTER INSERT OR UPDATE ON trade_results
  FOR EACH STATEMENT
  EXECUTE FUNCTION update_daily_metrics();

-- Funzione per calcolare il Sharpe Ratio
CREATE OR REPLACE FUNCTION calculate_sharpe_ratio(days INTEGER DEFAULT 30)
RETURNS DECIMAL(8,4) AS $$
DECLARE
  avg_return DECIMAL(12,4);
  return_stddev DECIMAL(12,4);
  sharpe DECIMAL(8,4);
BEGIN
  SELECT 
    AVG(profit_loss),
    STDDEV(profit_loss)
  INTO avg_return, return_stddev
  FROM trade_results 
  WHERE timestamp > CURRENT_DATE - INTERVAL '1 day' * days;
  
  IF return_stddev > 0 THEN
    sharpe := avg_return / return_stddev;
  ELSE
    sharpe := 0;
  END IF;
  
  RETURN sharpe;
END;
$$ LANGUAGE plpgsql;

-- Seed some initial data for testing
INSERT INTO performance_metrics (metric_date) 
VALUES (CURRENT_DATE)
ON CONFLICT (metric_date) DO NOTHING;