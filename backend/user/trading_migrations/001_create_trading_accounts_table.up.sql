-- Create trading_accounts table for user trading account management
CREATE TABLE IF NOT EXISTS trading_accounts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    
    -- Account identification
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('MT4', 'MT5', 'BINANCE', 'BYBIT', 'COINBASE', 'ALPACA')),
    account_name VARCHAR(255) NOT NULL,
    broker_name VARCHAR(255) NOT NULL,
    
    -- Connection details (sensitive data encrypted)
    server_url VARCHAR(255),
    account_number VARCHAR(100),
    password_encrypted TEXT, -- Encrypted password
    api_key VARCHAR(255),
    api_secret_encrypted TEXT, -- Encrypted API secret
    
    -- Account information
    account_balance DECIMAL(15,2) DEFAULT 0,
    equity DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    leverage INTEGER DEFAULT 100,
    
    -- Account status and settings
    is_active BOOLEAN DEFAULT true,
    is_connected BOOLEAN DEFAULT false,
    auto_trading_enabled BOOLEAN DEFAULT false,
    
    -- Risk management settings
    max_risk_per_trade DECIMAL(5,2) DEFAULT 2.0, -- Percentage
    max_daily_loss DECIMAL(5,2) DEFAULT 5.0, -- Percentage
    
    -- Trading preferences (JSON arrays)
    allowed_symbols TEXT DEFAULT '[]', -- JSON array of allowed trading symbols
    blocked_symbols TEXT DEFAULT '[]', -- JSON array of blocked trading symbols
    trading_hours TEXT DEFAULT '{"start":"09:00","end":"17:00"}', -- JSON object with start/end times
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_connection_at TIMESTAMPTZ,
    
    -- Foreign key constraint
    CONSTRAINT fk_trading_accounts_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_id ON trading_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_type ON trading_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_active ON trading_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_connected ON trading_accounts(is_connected);

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_trading_accounts_updated_at 
    BEFORE UPDATE ON trading_accounts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();