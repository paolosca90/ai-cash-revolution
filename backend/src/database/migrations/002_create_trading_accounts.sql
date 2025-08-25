-- Create trading accounts table
CREATE TABLE IF NOT EXISTS trading_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('MT4', 'MT5', 'BINANCE', 'BYBIT', 'COINBASE', 'ALPACA')),
    account_name VARCHAR(100) NOT NULL,
    broker_name VARCHAR(100) NOT NULL,
    
    -- Connection details (these should be encrypted in production)
    server_url VARCHAR(255),
    account_number VARCHAR(100),
    password_encrypted TEXT,
    api_key TEXT,
    api_secret TEXT,
    
    -- Account info
    account_balance DECIMAL(15,2) DEFAULT 0,
    equity DECIMAL(15,2) DEFAULT 0,
    leverage INTEGER DEFAULT 1,
    currency VARCHAR(10) DEFAULT 'USD',
    
    -- Connection status
    is_connected BOOLEAN DEFAULT FALSE,
    last_connection_test TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_id ON trading_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_type ON trading_accounts(account_type);