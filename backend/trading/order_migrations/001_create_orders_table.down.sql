-- Drop triggers
DROP TRIGGER IF EXISTS calculate_order_pnl ON orders;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_pnl();

-- Drop views
DROP VIEW IF EXISTS order_statistics;
DROP VIEW IF EXISTS active_positions;

-- Drop indexes
DROP INDEX IF EXISTS idx_orders_user_id;
DROP INDEX IF EXISTS idx_orders_account_id;
DROP INDEX IF EXISTS idx_orders_symbol;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_created_at;
DROP INDEX IF EXISTS idx_orders_external_ticket;

-- Drop the orders table
DROP TABLE IF EXISTS orders;