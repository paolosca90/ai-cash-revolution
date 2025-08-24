-- Drop the trigger
DROP TRIGGER IF EXISTS update_trading_accounts_updated_at ON trading_accounts;

-- Drop indexes
DROP INDEX IF EXISTS idx_trading_accounts_user_id;
DROP INDEX IF EXISTS idx_trading_accounts_type;
DROP INDEX IF EXISTS idx_trading_accounts_active;
DROP INDEX IF EXISTS idx_trading_accounts_connected;

-- Drop the trading_accounts table
DROP TABLE IF EXISTS trading_accounts;