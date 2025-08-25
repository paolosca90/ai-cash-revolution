-- Create trading signals table
CREATE TABLE IF NOT EXISTS trading_signals (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('BUY', 'SELL', 'HOLD')),
    confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    price DECIMAL(15,8) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    strategy VARCHAR(50) DEFAULT 'moderate',
    indicators JSONB,
    
    -- Performance tracking (filled after execution)
    executed BOOLEAN DEFAULT FALSE,
    execution_price DECIMAL(15,8),
    execution_timestamp TIMESTAMP WITH TIME ZONE,
    outcome VARCHAR(20) CHECK (outcome IN ('WIN', 'LOSS', 'BREAKEVEN')),
    pnl DECIMAL(15,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trading_signals_symbol ON trading_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_signals_timestamp ON trading_signals(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trading_signals_confidence ON trading_signals(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_trading_signals_executed ON trading_signals(executed);

-- Create composite index for performance queries
CREATE INDEX IF NOT EXISTS idx_trading_signals_symbol_timestamp ON trading_signals(symbol, timestamp DESC);