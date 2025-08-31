-- AI Trading Bot - Seed Data
-- Insert demo data for testing and demonstration

-- Insert demo trading signals
INSERT INTO public.trading_signals (symbol, signal_type, strength, entry_price, stop_loss, take_profit, confidence, strategy, timeframe) VALUES
('EURUSD', 'BUY', 78.50, 1.0950, 1.0920, 1.1000, 85.20, 'ML_PREDICTION', '1H'),
('GBPUSD', 'SELL', 82.10, 1.2650, 1.2680, 1.2600, 89.70, 'RSI_MACD_COMBO', '4H'),
('USDJPY', 'BUY', 71.30, 149.20, 148.80, 150.00, 76.40, 'BREAKOUT_STRATEGY', '1H'),
('AUDUSD', 'SELL', 69.80, 0.6720, 0.6750, 0.6680, 72.10, 'TREND_FOLLOWING', '1D'),
('USDCAD', 'BUY', 75.20, 1.3580, 1.3550, 1.3630, 80.30, 'SUPPORT_RESISTANCE', '4H'),
('EURGBP', 'SELL', 73.60, 0.8450, 0.8470, 0.8420, 77.80, 'MOMENTUM_STRATEGY', '1H'),
('NZDUSD', 'BUY', 66.90, 0.5980, 0.5950, 0.6020, 70.20, 'ML_ENSEMBLE', '4H'),
('USDCHF', 'SELL', 79.40, 0.8730, 0.8760, 0.8690, 83.50, 'PATTERN_RECOGNITION', '1H')
ON CONFLICT DO NOTHING;

-- Insert demo ML analytics data
INSERT INTO public.ml_analytics (model_name, model_type, accuracy, precision_score, recall, f1_score, training_data_size, validation_score, last_trained, training_duration_minutes, predictions_count, successful_predictions, parameters, feature_importance) VALUES
('LSTM_Price_Predictor', 'regression', 0.8730, 0.8900, 0.8500, 0.8700, 50000, 0.8650, NOW() - INTERVAL '2 hours', 45, 1250, 1091, 
 '{"layers": [128, 64, 32], "dropout": 0.2, "learning_rate": 0.001, "batch_size": 32}',
 '{"price_ma_20": 0.25, "rsi": 0.18, "macd": 0.15, "volume": 0.12, "bollinger_bands": 0.10}'),

('Random_Forest_Signal', 'classification', 0.8210, 0.8400, 0.8000, 0.8200, 35000, 0.8150, NOW() - INTERVAL '6 hours', 23, 890, 730,
 '{"n_estimators": 200, "max_depth": 15, "min_samples_split": 5, "random_state": 42}',
 '{"technical_indicators": 0.35, "price_action": 0.28, "volume_profile": 0.20, "market_sentiment": 0.17}'),

('Neural_Network_Trend', 'classification', 0.7980, 0.8100, 0.7800, 0.7900, 42000, 0.7950, NOW() - INTERVAL '12 hours', 67, 567, 452,
 '{"hidden_layers": [256, 128, 64], "activation": "relu", "optimizer": "adam", "epochs": 100}',
 '{"trend_strength": 0.30, "support_resistance": 0.22, "momentum": 0.25, "volatility": 0.23}'),

('Ensemble_Strategy', 'ensemble', 0.9120, 0.9300, 0.8900, 0.9100, 75000, 0.9080, NOW() - INTERVAL '1 hour', 89, 2340, 2135,
 '{"models": ["lstm", "random_forest", "svm"], "voting": "soft", "weights": [0.4, 0.35, 0.25]}',
 '{"combined_predictions": 0.40, "model_consensus": 0.35, "confidence_weighting": 0.25}')
ON CONFLICT DO NOTHING;

-- Insert sample market data for major pairs
INSERT INTO public.market_data (symbol, timeframe, open_price, close_price, high_price, low_price, volume, tick_volume, spread, timestamp) VALUES
-- EURUSD 1H data
('EURUSD', '1H', 1.0945, 1.0952, 1.0958, 1.0943, 1250.50, 12450, 1.2, NOW() - INTERVAL '1 hour'),
('EURUSD', '1H', 1.0952, 1.0948, 1.0956, 1.0946, 1180.30, 11890, 1.1, NOW() - INTERVAL '2 hours'),
('EURUSD', '1H', 1.0948, 1.0955, 1.0959, 1.0945, 1340.80, 13280, 1.3, NOW() - INTERVAL '3 hours'),

-- GBPUSD 1H data
('GBPUSD', '1H', 1.2648, 1.2642, 1.2655, 1.2640, 980.40, 9650, 1.8, NOW() - INTERVAL '1 hour'),
('GBPUSD', '1H', 1.2655, 1.2648, 1.2659, 1.2645, 1050.60, 10320, 1.7, NOW() - INTERVAL '2 hours'),
('GBPUSD', '1H', 1.2642, 1.2655, 1.2661, 1.2638, 1120.90, 11080, 1.9, NOW() - INTERVAL '3 hours'),

-- USDJPY 1H data  
('USDJPY', '1H', 149.18, 149.25, 149.32, 149.15, 2340.70, 23180, 2.1, NOW() - INTERVAL '1 hour'),
('USDJPY', '1H', 149.25, 149.18, 149.28, 149.12, 2180.50, 21650, 2.0, NOW() - INTERVAL '2 hours'),
('USDJPY', '1H', 149.12, 149.25, 149.35, 149.08, 2450.80, 24320, 2.2, NOW() - INTERVAL '3 hours')
ON CONFLICT DO NOTHING;

-- Create a function to generate realistic trading data
CREATE OR REPLACE FUNCTION generate_market_data(p_symbol TEXT, p_hours INTEGER DEFAULT 24)
RETURNS VOID AS $$
DECLARE
    base_price DECIMAL(10,5);
    current_price DECIMAL(10,5);
    i INTEGER;
    price_change DECIMAL(10,5);
    new_open DECIMAL(10,5);
    new_close DECIMAL(10,5);
    new_high DECIMAL(10,5);
    new_low DECIMAL(10,5);
BEGIN
    -- Set base price for different symbols
    CASE p_symbol
        WHEN 'EURUSD' THEN base_price := 1.0950;
        WHEN 'GBPUSD' THEN base_price := 1.2650;
        WHEN 'USDJPY' THEN base_price := 149.20;
        WHEN 'AUDUSD' THEN base_price := 0.6720;
        WHEN 'USDCAD' THEN base_price := 1.3580;
        ELSE base_price := 1.0000;
    END CASE;
    
    current_price := base_price;
    
    FOR i IN 1..p_hours LOOP
        -- Generate random price change (-0.5% to +0.5%)
        price_change := (RANDOM() - 0.5) * current_price * 0.01;
        
        new_open := current_price;
        new_close := current_price + price_change;
        new_high := GREATEST(new_open, new_close) + (RANDOM() * current_price * 0.002);
        new_low := LEAST(new_open, new_close) - (RANDOM() * current_price * 0.002);
        
        INSERT INTO public.market_data 
        (symbol, timeframe, open_price, close_price, high_price, low_price, volume, tick_volume, spread, timestamp)
        VALUES 
        (p_symbol, '1H', new_open, new_close, new_high, new_low, 
         1000 + RANDOM() * 1000, 10000 + RANDOM() * 10000, 
         1.0 + RANDOM() * 2.0, NOW() - (i || ' hours')::INTERVAL)
        ON CONFLICT DO NOTHING;
        
        current_price := new_close;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate historical data for major pairs
SELECT generate_market_data('EURUSD', 168); -- 1 week
SELECT generate_market_data('GBPUSD', 168);
SELECT generate_market_data('USDJPY', 168);
SELECT generate_market_data('AUDUSD', 168);
SELECT generate_market_data('USDCAD', 168);