-- Down migration for data_enrichment tables

DROP TABLE IF EXISTS options_0dte_data;
DROP TABLE IF EXISTS volume_profile_data;
DROP TABLE IF EXISTS cboe_daily_data;
DROP TABLE IF EXISTS cme_daily_data;

-- Drop indexes
DROP INDEX IF EXISTS idx_options_0dte_date_symbol;
DROP INDEX IF EXISTS idx_volume_profile_date_symbol;
DROP INDEX IF EXISTS idx_cme_date_symbol;