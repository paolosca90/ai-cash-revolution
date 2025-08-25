# Setup Database PostgreSQL con Supabase

## 🎯 Supabase Setup (5 minuti)

### Step 1: Crea Account Supabase
1. **Vai su**: https://supabase.com
2. **Sign up** con GitHub o email
3. **Crea nuovo progetto**:
   - Nome: `ai-trading-bot`
   - Password DB: `TradingBot2025!`
   - Regione: `Central EU (Frankfurt)` (più vicino)

### Step 2: Ottieni Connection String
1. **Settings** → **Database**
2. **Connection string** → **URI**
3. **Copia** la stringa (formato: `postgresql://postgres:[password]@[host]:5432/postgres`)

### Step 3: Crea Tabelle
1. **SQL Editor** in Supabase
2. **Incolla ed esegui** questo SQL:

```sql
-- Tabella Clienti
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    subscription_type VARCHAR(50) DEFAULT 'basic', -- basic, premium, enterprise
    subscription_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    
    -- Trading Settings
    max_concurrent_trades INTEGER DEFAULT 3,
    max_lot_size DECIMAL(10,2) DEFAULT 0.1,
    allowed_symbols TEXT[] DEFAULT '{"EURUSD","GBPUSD","USDJPY"}'::TEXT[]
);

-- Tabella Configurazioni MT5
CREATE TABLE client_mt5_configs (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    config_name VARCHAR(100) DEFAULT 'Default',
    
    -- MT5 Connection
    mt5_host VARCHAR(255),
    mt5_port INTEGER DEFAULT 8080,
    mt5_login VARCHAR(100),
    mt5_password_encrypted TEXT,
    mt5_server VARCHAR(100),
    mt5_broker VARCHAR(100),
    
    -- Trading Settings
    default_lot_size DECIMAL(10,2) DEFAULT 0.01,
    risk_level VARCHAR(20) DEFAULT 'medium',
    auto_trading_enabled BOOLEAN DEFAULT false,
    
    -- Status
    connection_status VARCHAR(20) DEFAULT 'not_tested',
    last_connection_test TIMESTAMP,
    last_error_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Tabella VPS Instances
CREATE TABLE client_vps_instances (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- contabo, vultr, aws
    instance_id VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    region VARCHAR(50),
    admin_password VARCHAR(255),
    monthly_cost DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'creating', -- creating, provisioning, active, error
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    configured_at TIMESTAMP,
    
    -- Provider specific
    product_id VARCHAR(100),
    image_id VARCHAR(100),
    datacenter_id VARCHAR(100),
    server_id VARCHAR(100),
    volume_id VARCHAR(100)
);

-- Tabella Activity Logs
CREATE TABLE client_activity_logs (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    activity_type VARCHAR(50), -- login, vps_created, trade_executed, etc
    description TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella Trading Sessions
CREATE TABLE trading_sessions (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE,
    mt5_config_id INTEGER REFERENCES client_mt5_configs(id),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    trades_executed INTEGER DEFAULT 0,
    total_profit_loss DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' -- active, ended, error
);

-- Tabella Payments/Subscriptions
CREATE TABLE client_payments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    payment_id VARCHAR(255), -- Stripe payment ID
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status VARCHAR(50), -- paid, failed, refunded
    payment_method VARCHAR(50), -- card, paypal
    subscription_period_start DATE,
    subscription_period_end DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Indici per performance
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_subscription ON clients(subscription_type, subscription_expires);
CREATE INDEX idx_vps_client ON client_vps_instances(client_id);
CREATE INDEX idx_vps_status ON client_vps_instances(status);
CREATE INDEX idx_activity_client_date ON client_activity_logs(client_id, created_at);
CREATE INDEX idx_payments_client ON client_payments(client_id, created_at);

-- Trigger per update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mt5_configs_updated_at BEFORE UPDATE ON client_mt5_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Dati di test (opzionale)
INSERT INTO clients (email, password_hash, full_name, subscription_type) VALUES 
('demo@test.com', '$2b$10$demo_hash_here', 'Demo User', 'premium');
```

### Step 4: Configura Row Level Security (Sicurezza)
```sql
-- Abilita RLS per tutte le tabelle
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_mt5_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_vps_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_payments ENABLE ROW LEVEL SECURITY;

-- Policy di base (può essere raffinata dopo)
CREATE POLICY "Users can view own data" ON clients FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own data" ON clients FOR UPDATE USING (auth.uid()::text = id::text);
```

## ✅ Dopo Setup Database

1. **Copia** la connection string da Supabase
2. **Aggiungi** su Vercel Environment Variables:
   ```
   DATABASE_URL = postgresql://postgres:[password]@[host]:5432/postgres
   ```
3. **Rideploy** automatico su Vercel
4. **Database pronto** per salvare clienti e VPS

## 🎯 Prossimo: Setup Stripe Payments

Una volta completato il database, configureremo i pagamenti con Stripe per accettare carte di credito automaticamente.