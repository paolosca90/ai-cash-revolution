-- Create orders table for order management and routing
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    account_id VARCHAR(36) NOT NULL,
    
    -- External broker ticket/order ID
    external_ticket BIGINT,
    
    -- Order details
    symbol VARCHAR(20) NOT NULL,
    action VARCHAR(4) NOT NULL CHECK (action IN ('BUY', 'SELL')),
    order_type VARCHAR(15) NOT NULL CHECK (order_type IN ('MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT')),
    volume DECIMAL(10,2) NOT NULL,
    
    -- Pricing
    requested_price DECIMAL(15,5) DEFAULT 0,
    execution_price DECIMAL(15,5) DEFAULT 0,
    current_price DECIMAL(15,5) DEFAULT 0,
    stop_loss DECIMAL(15,5) DEFAULT 0,
    take_profit DECIMAL(15,5) DEFAULT 0,
    
    -- Order status and execution
    status VARCHAR(15) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'FILLED', 'PARTIAL', 'CANCELLED', 'REJECTED', 'EXPIRED')),
    comment TEXT,
    
    -- Financial details
    commission DECIMAL(10,2) DEFAULT 0,
    swap DECIMAL(10,2) DEFAULT 0,
    pnl DECIMAL(15,2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    executed_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT fk_orders_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_orders_account_id 
        FOREIGN KEY (account_id) REFERENCES trading_accounts(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_account_id ON orders(account_id);
CREATE INDEX IF NOT EXISTS idx_orders_symbol ON orders(symbol);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_external_ticket ON orders(external_ticket);

-- Create positions view for active positions
CREATE OR REPLACE VIEW active_positions AS
SELECT 
    o.*,
    ta.account_name,
    ta.broker_name,
    ta.account_type,
    EXTRACT(EPOCH FROM (NOW() - o.executed_at))/3600 as hours_open
FROM orders o
JOIN trading_accounts ta ON o.account_id = ta.id
WHERE o.status = 'FILLED' 
  AND o.closed_at IS NULL;

-- Create trigger for PnL calculation updates
CREATE OR REPLACE FUNCTION calculate_pnl()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_price IS NOT NULL AND NEW.execution_price IS NOT NULL THEN
        IF NEW.action = 'BUY' THEN
            NEW.pnl = (NEW.current_price - NEW.execution_price) * NEW.volume;
        ELSE
            NEW.pnl = (NEW.execution_price - NEW.current_price) * NEW.volume;
        END IF;
        
        -- Subtract commission and swap
        NEW.pnl = NEW.pnl - COALESCE(NEW.commission, 0) - COALESCE(NEW.swap, 0);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_order_pnl 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION calculate_pnl();

-- Create order statistics view
CREATE OR REPLACE VIEW order_statistics AS
SELECT 
    user_id,
    account_id,
    DATE_TRUNC('day', created_at) as trade_date,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN status = 'FILLED' THEN 1 END) as filled_orders,
    COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_orders,
    ROUND(AVG(CASE WHEN status = 'FILLED' AND execution_price > 0 
              THEN ABS(execution_price - requested_price) ELSE NULL END), 5) as avg_slippage,
    SUM(CASE WHEN status = 'FILLED' THEN volume ELSE 0 END) as total_volume,
    SUM(CASE WHEN status = 'FILLED' THEN commission ELSE 0 END) as total_commission,
    SUM(CASE WHEN status = 'FILLED' THEN pnl ELSE 0 END) as total_pnl
FROM orders 
GROUP BY user_id, account_id, DATE_TRUNC('day', created_at);

-- Insert initial demo data (optional)
-- This can be uncommented for testing purposes
/*
INSERT INTO orders (
    id, user_id, account_id, symbol, action, order_type, volume,
    requested_price, execution_price, status, comment, created_at, executed_at
) VALUES 
    ('demo-order-1', 'demo-user-1', 'demo-account-1', 'EURUSD', 'BUY', 'MARKET', 0.10,
     1.08500, 1.08505, 'FILLED', 'Demo trade', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
    ('demo-order-2', 'demo-user-1', 'demo-account-1', 'GBPUSD', 'SELL', 'LIMIT', 0.05,
     1.25000, 1.24995, 'FILLED', 'Demo trade', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours');
*/