-- Create users table with comprehensive subscription and authentication features
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    
    -- Subscription management
    subscription_tier VARCHAR(20) DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE')),
    subscription_status VARCHAR(20) DEFAULT 'TRIAL' CHECK (subscription_status IN ('ACTIVE', 'INACTIVE', 'TRIAL', 'EXPIRED')),
    
    -- Trial management
    trial_start_date TIMESTAMPTZ,
    trial_end_date TIMESTAMPTZ,
    
    -- Subscription dates
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    
    -- Account verification
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    
    -- Trading account limits
    trading_accounts_connected INTEGER DEFAULT 0,
    max_trading_accounts INTEGER DEFAULT 1,
    
    -- Features JSON array
    features TEXT DEFAULT '[]',
    
    -- Profile information
    avatar_url TEXT,
    phone VARCHAR(20),
    country VARCHAR(2),
    timezone VARCHAR(50),
    
    -- Billing information
    stripe_customer_id VARCHAR(255),
    last_payment_date TIMESTAMPTZ,
    next_billing_date TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();