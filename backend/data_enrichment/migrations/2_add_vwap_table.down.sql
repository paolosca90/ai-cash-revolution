-- Down migration to remove VWAP data table

DROP TABLE IF EXISTS vwap_data;

-- Drop index
DROP INDEX IF EXISTS idx_vwap_date_symbol;