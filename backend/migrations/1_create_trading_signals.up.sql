CREATE TABLE trading_signals (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('BUY', 'SELL', 'HOLD')),
  confidence DOUBLE PRECISION NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  price DOUBLE PRECISION NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  strategy TEXT NOT NULL,
  indicators JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trading_signals_symbol ON trading_signals(symbol);
CREATE INDEX idx_trading_signals_timestamp ON trading_signals(timestamp);
CREATE INDEX idx_trading_signals_action ON trading_signals(action);
