-- AI Cash R-evolution Database Initialization
-- This script sets up the database structure

-- Create database (run as postgres user)
-- CREATE DATABASE aicash_revolution;
-- CREATE USER aicash WITH ENCRYPTED PASSWORD 'secure_password_2025!';
-- GRANT ALL PRIVILEGES ON DATABASE aicash_revolution TO aicash;

-- Connect to the database
\c aicash_revolution;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    subscription_type VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'inactive',
    stripe_customer_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    plan_type VARCHAR(50) NOT NULL, -- 'professional', 'enterprise'
    status VARCHAR(50) NOT NULL, -- 'active', 'canceled', 'past_due', etc.
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    canceled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MT5 accounts table
CREATE TABLE IF NOT EXISTS mt5_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_number VARCHAR(50) NOT NULL,
    server VARCHAR(100) NOT NULL,
    password_encrypted TEXT NOT NULL, -- Encrypted password
    is_active BOOLEAN DEFAULT false,
    last_connection TIMESTAMP,
    balance DECIMAL(15, 2),
    equity DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trading signals table
CREATE TABLE IF NOT EXISTS trading_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    signal_type VARCHAR(10) NOT NULL, -- 'BUY', 'SELL'
    entry_price DECIMAL(10, 5),
    stop_loss DECIMAL(10, 5),
    take_profit DECIMAL(10, 5),
    confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'executed', 'closed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP,
    closed_at TIMESTAMP
);

-- User signal subscriptions
CREATE TABLE IF NOT EXISTS user_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    signal_id UUID REFERENCES trading_signals(id) ON DELETE CASCADE,
    is_executed BOOLEAN DEFAULT false,
    execution_price DECIMAL(10, 5),
    profit_loss DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email_type VARCHAR(50) NOT NULL, -- 'welcome', 'verification', 'reset_password', 'signal_alert'
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    error_message TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(10) NOT NULL, -- 'info', 'warn', 'error'
    message TEXT NOT NULL,
    component VARCHAR(50), -- 'auth', 'trading', 'email', 'payment'
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment logs table
CREATE TABLE IF NOT EXISTS payment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    stripe_event_id VARCHAR(255),
    event_type VARCHAR(50), -- 'payment_success', 'payment_failed', 'subscription_created'
    amount DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'EUR',
    status VARCHAR(20),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_mt5_accounts_user_id ON mt5_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_signals_created_at ON trading_signals(created_at);
CREATE INDEX IF NOT EXISTS idx_trading_signals_status ON trading_signals(status);
CREATE INDEX IF NOT EXISTS idx_user_signals_user_id ON user_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mt5_accounts_updated_at BEFORE UPDATE ON mt5_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_signals_updated_at BEFORE UPDATE ON user_signals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user
-- Password: CashRev2025!SecureAdmin#
INSERT INTO admin_users (email, password_hash, name) 
VALUES (
    'admin@ai.cash-revolution.com',
    '$2b$12$rQJ8YnCZGvF7XhQxNkJwGOzQw9YpGvF7XhQxNkJwGOzQw9YpGvF7Xh', -- This should be properly hashed
    'System Administrator'
) ON CONFLICT (email) DO NOTHING;

-- Create a view for active subscriptions
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    s.plan_type,
    s.status,
    s.current_period_end
FROM users u
JOIN subscriptions s ON u.id = s.user_id
WHERE s.status = 'active' AND s.current_period_end > CURRENT_TIMESTAMP;

-- Grant permissions to aicash user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aicash;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aicash;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO aicash;