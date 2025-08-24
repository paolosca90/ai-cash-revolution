CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  symbol TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('MARKET', 'LIMIT', 'STOP')),
  side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
  quantity DOUBLE PRECISION NOT NULL CHECK (quantity > 0),
  price DOUBLE PRECISION,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'FILLED', 'CANCELLED', 'REJECTED')) DEFAULT 'PENDING',
  filled_quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
  average_price DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_symbol ON orders(symbol);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
