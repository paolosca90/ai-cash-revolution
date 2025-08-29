-- Migration to add VWAP data table

-- Table to store calculated VWAP data
CREATE TABLE vwap_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    vwap DECIMAL(15, 5),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for better query performance
CREATE INDEX idx_vwap_date_symbol ON vwap_data(date, symbol);