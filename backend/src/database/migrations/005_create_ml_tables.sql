-- Create ML model metrics table
CREATE TABLE IF NOT EXISTS ml_model_metrics (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    accuracy DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    training_data_size INTEGER,
    training_time_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(model_name, model_version)
);

-- Create ML feature importance table
CREATE TABLE IF NOT EXISTS ml_feature_importance (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    importance_score DECIMAL(8,6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ML prediction accuracy tracking
CREATE TABLE IF NOT EXISTS ml_prediction_accuracy (
    id SERIAL PRIMARY KEY,
    trade_id VARCHAR(100),
    predicted_direction VARCHAR(10) NOT NULL,
    actual_direction VARCHAR(10),
    predicted_confidence DECIMAL(5,4),
    actual_outcome VARCHAR(20),
    accuracy_score DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ML market patterns table
CREATE TABLE IF NOT EXISTS ml_market_patterns (
    id SERIAL PRIMARY KEY,
    pattern_name VARCHAR(100) NOT NULL,
    pattern_type VARCHAR(50) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    confidence DECIMAL(5,4) NOT NULL,
    pattern_data JSONB,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ml_model_metrics_name_version ON ml_model_metrics(model_name, model_version);
CREATE INDEX IF NOT EXISTS idx_ml_feature_importance_model ON ml_feature_importance(model_name, model_version);
CREATE INDEX IF NOT EXISTS idx_ml_prediction_accuracy_trade_id ON ml_prediction_accuracy(trade_id);
CREATE INDEX IF NOT EXISTS idx_ml_market_patterns_symbol ON ml_market_patterns(symbol);
CREATE INDEX IF NOT EXISTS idx_ml_market_patterns_type ON ml_market_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_ml_market_patterns_detected_at ON ml_market_patterns(detected_at DESC);