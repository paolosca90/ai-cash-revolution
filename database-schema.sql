-- Database Schema per Sistema Gestione Clienti
-- PostgreSQL

-- Tabella Clienti
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    subscription_type VARCHAR(50) DEFAULT 'trial', -- trial, basic, premium
    subscription_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    
    -- Trading Permissions
    max_concurrent_trades INTEGER DEFAULT 3,
    max_lot_size DECIMAL(10,2) DEFAULT 0.1,
    allowed_symbols TEXT[] DEFAULT '{"EURUSD","GBPUSD","USDJPY"}'::TEXT[]
);

-- Tabella Configurazioni MT5 per Cliente
CREATE TABLE client_mt5_configs (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    config_name VARCHAR(100) DEFAULT 'Default',
    
    -- MT5 Server Details
    mt5_host VARCHAR(255),
    mt5_port INTEGER DEFAULT 8080,
    
    -- MT5 Account Credentials
    mt5_login VARCHAR(100),
    mt5_password_encrypted TEXT, -- Password criptata
    mt5_server VARCHAR(100),
    mt5_broker VARCHAR(100),
    
    -- Trading Settings
    default_lot_size DECIMAL(10,2) DEFAULT 0.01,
    risk_level VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    auto_trading_enabled BOOLEAN DEFAULT false,
    
    -- Connection Status
    last_connection_test TIMESTAMP,
    connection_status VARCHAR(20) DEFAULT 'not_tested', -- connected, disconnected, error, not_tested
    last_error_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Tabella Admin Users
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin', -- admin, super_admin
    permissions JSON DEFAULT '{"clients": ["read", "write"], "system": ["read"]}'::JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Tabella Log Attività Clienti
CREATE TABLE client_activity_logs (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    activity_type VARCHAR(50), -- login, trade_executed, config_updated, error
    description TEXT,
    metadata JSON, -- Dati extra (IP, trade details, etc.)
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

-- Indici per performance
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_subscription ON clients(subscription_type, subscription_expires);
CREATE INDEX idx_mt5_configs_client ON client_mt5_configs(client_id);
CREATE INDEX idx_activity_logs_client ON client_activity_logs(client_id, created_at);
CREATE INDEX idx_trading_sessions_client ON trading_sessions(client_id, started_at);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mt5_configs_updated_at BEFORE UPDATE ON client_mt5_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserimento admin di default
INSERT INTO admin_users (username, email, password_hash, role) VALUES 
('admin', 'admin@yourdomain.com', '$2b$10$hash_here', 'super_admin');

-- Esempio cliente demo
INSERT INTO clients (email, password_hash, full_name, subscription_type) VALUES 
('demo@example.com', '$2b$10$demo_hash', 'Demo Client', 'trial');