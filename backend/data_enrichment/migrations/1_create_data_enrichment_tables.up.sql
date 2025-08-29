-- Database schema for data_enrichment service

-- Table to store processed CME data
CREATE TABLE cme_daily_data (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    volume BIGINT,
    open_interest BIGINT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table to store processed CBOE data
CREATE TABLE cboe_daily_data (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    put_call_ratio DECIMAL(10, 4),
    total_put_volume BIGINT,
    total_call_volume BIGINT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table to store calculated Volume Profile data
CREATE TABLE volume_profile_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    poc DECIMAL(15, 5), -- Point of Control
    vah DECIMAL(15, 5), -- Value Area High
    val DECIMAL(15, 5), -- Value Area Low
    hvn_levels JSONB, -- High Volume Node levels
    lvn_levels JSONB, -- Low Volume Node levels
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table to store calculated Options data (0DTE)
CREATE TABLE options_0dte_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    gex_levels JSONB, -- Gamma Exposure levels
    put_call_ratio DECIMAL(10, 4),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_cme_date_symbol ON cme_daily_data(date, symbol);
CREATE INDEX idx_volume_profile_date_symbol ON volume_profile_data(date, symbol);
CREATE INDEX idx_options_0dte_date_symbol ON options_0dte_data(date, symbol);