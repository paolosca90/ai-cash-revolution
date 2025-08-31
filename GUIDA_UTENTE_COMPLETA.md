# 🤖 Guida Utente Completa - AI Trading Bot

## 📋 Indice

1. [Prerequisiti di Sistema](#prerequisiti-di-sistema)
2. [Processo di Registrazione e Login](#processo-di-registrazione-e-login)
3. [Setup Connessione MT5](#setup-connessione-mt5)
4. [Risoluzione Problemi Comuni](#risoluzione-problemi-comuni)
5. [Accesso al Pannello Amministratore](#accesso-al-pannello-amministratore)
6. [Gestione Utenti](#gestione-utenti)
7. [Query Database Utili](#query-database-utili)
8. [Architettura del Sistema](#architettura-del-sistema)

---

## 🔧 Prerequisiti di Sistema

### Software Necessario

**Per Windows (Raccomandato):**
- Windows 10/11 (64-bit)
- MetaTrader 5 installato
- Python 3.7+ con pip
- Node.js 16+ e npm/bun
- PostgreSQL (per database di produzione)

**Per Sviluppo:**
- Git
- Visual Studio Code o IDE simile
- Browser moderno (Chrome, Firefox, Edge)

### Account Richiesti

1. **Account MT5**: Account demo o reale presso un broker
2. **Account di Trading**: Credenziali broker (login, password, server)
3. **Ambiente di Deploy**: Vercel account (per il deployment)

---

## 👤 Processo di Registrazione e Login

### 1. Registrazione Nuovo Utente

**Percorso Web**: `https://your-domain.vercel.app/register`

**Dati Richiesti:**
- Nome completo
- Email valida
- Password (minimo 8 caratteri)
- Accettazione termini e condizioni

**Processo Backend:**
```javascript
// Endpoint: POST /api/user/register
{
  "name": "Mario Rossi",
  "email": "mario.rossi@email.com",
  "password": "password123"
}
```

**Risposta Successo:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "Mario Rossi",
    "email": "mario.rossi@email.com"
  },
  "token": "jwt-token"
}
```

### 2. Login Utente Esistente

**Percorso Web**: `https://your-domain.vercel.app/login`

**Credenziali Demo Disponibili:**
```
Email: test@example.com
Password: test123456
```

**Processo di Autenticazione:**
1. Inserire email e password
2. Sistema verifica credenziali nel database
3. Genera JWT token per la sessione
4. Reindirizza alla dashboard principale

### 3. Gestione Token e Sessioni

**Token Storage:**
- `localStorage.setItem("auth_token", token)`
- `localStorage.setItem("user_data", userData)`
- Durata token: 7 giorni

**Verifica Token:**
```javascript
// Endpoint: /api/auth/verify
// Headers: Authorization: Bearer <token>
```

---

## 🔌 Setup Connessione MT5

### 1. Installazione Automatica (Raccomandato)

**Esegui l'Installer Python:**
```bash
cd backend
python ai_trading_installer.py
```

**L'installer automaticamente:**
- Verifica dipendenze Python
- Rileva MT5 installato
- Configura credenziali
- Crea bridge server
- Testa connessione

### 2. Configurazione Manuale MT5

**File di configurazione**: `~/.ai_trading_bot/config.json`

```json
{
  "mt5_path": "C:/Program Files/MetaTrader 5/terminal64.exe",
  "credentials": {
    "login": "123456",
    "server": "Demo-Server",
    "broker": "MetaQuotes-Demo"
  },
  "bridge_port": 8080,
  "web_app_url": "https://your-domain.vercel.app",
  "auto_start": false
}
```

### 3. Avvio Bridge Server

**Comando Diretto:**
```bash
cd backend
python mt5_bridge_server.py
```

**Oppure tramite GUI:**
```bash
python ai_trading_installer.py
# Clicca "Avvia Bridge"
```

### 4. Verifica Connessione

**Endpoints di Test:**
- Status: `http://localhost:8080/api/mt5/status`
- Health: `http://localhost:8080/api/health`
- Connect: `http://localhost:8080/api/mt5/connect` (POST)

**Test manuale:**
```bash
curl http://localhost:8080/api/mt5/status
```

**Risposta attesa:**
```json
{
  "connected": true,
  "account": {
    "login": 123456,
    "balance": 10000,
    "server": "Demo-Server"
  },
  "timestamp": 1640995200
}
```

---

## 🚨 Risoluzione Problemi Comuni

### Problema 1: MT5 non si connette

**Sintomi:**
- Bridge server avviato ma status "disconnected"
- Errore "Login failed" nei log

**Soluzioni:**
1. **Verifica credenziali:**
   ```bash
   # Controlla file credenziali
   cat ~/.ai_trading_bot/credentials_mt5.dat
   ```

2. **Verifica MT5 attivo:**
   - Apri MT5 manualmente
   - Verifica login funzionante
   - Abilita "AutoTrading" (Ctrl+E)

3. **Testa connessione manuale:**
   ```python
   import MetaTrader5 as mt5
   if not mt5.initialize():
       print("MT5 initialize failed")
   if not mt5.login(login=123456, password="password", server="server"):
       print("Login failed:", mt5.last_error())
   ```

### Problema 2: Errori di login web

**Sintomi:**
- "Invalid email or password"
- "Authentication failed"

**Soluzioni:**
1. **Verifica database utenti:**
   ```sql
   SELECT id, email, created_at FROM users WHERE email = 'user@email.com';
   ```

2. **Reset password utente:**
   ```sql
   UPDATE users SET password_hash = '$2b$10$...' WHERE email = 'user@email.com';
   ```

3. **Controlla token JWT:**
   - Verifica `localStorage.getItem("auth_token")`
   - Token scaduto? Rifare login

### Problema 3: Errori di deploy

**Sintomi:**
- "Module not found" durante build
- "CORS errors" in produzione

**Soluzioni:**
1. **Build completo:**
   ```bash
   cd backend
   bun run build
   ```

2. **Verifica variabili ambiente:**
   ```bash
   # In .env
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-secret-key
   ENCRYPTION_KEY=your-encryption-key
   ```

3. **Deploy Vercel:**
   ```bash
   cd backend
   vercel --prod
   ```

### Problema 4: Database connection issues

**Sintomi:**
- "Connection refused" errors
- "Database not found"

**Soluzioni:**
1. **Verifica PostgreSQL:**
   ```bash
   psql -h localhost -U postgres -d ai_trading
   ```

2. **Run migrations:**
   ```bash
   cd backend/src/database
   node migrate.js
   ```

3. **Test connection:**
   ```javascript
   const { Pool } = require('pg');
   const pool = new Pool({connectionString: process.env.DATABASE_URL});
   pool.query('SELECT NOW()', (err, res) => console.log(err || res.rows));
   ```

---

## 👨‍💼 Accesso al Pannello Amministratore

### 1. Setup Admin iniziale

**Crea primo admin:**
```sql
-- Connetti al database
\c ai_trading;

-- Crea tabella admin se non esiste
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Aggiungi admin principale
INSERT INTO admin_users (username, email, password_hash, role) 
VALUES ('admin', 'admin@tradingbot.com', '$2b$10$...', 'super_admin');
```

### 2. Login Admin

**Endpoint**: `POST /api/admin/login`
```bash
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tradingbot.com",
    "password": "admin_password"
  }'
```

**Risposta:**
```json
{
  "success": true,
  "token": "admin-jwt-token",
  "admin": {
    "id": 1,
    "username": "admin",
    "email": "admin@tradingbot.com",
    "role": "super_admin"
  }
}
```

### 3. Interfaccia Admin

**Dashboard Admin** (da implementare nel frontend):
- URL: `/admin/dashboard`
- Autenticazione: Token admin nei headers
- Funzionalità: Gestione utenti, statistiche, configurazioni

---

## 👥 Gestione Utenti

### 1. Visualizzare tutti gli utenti

**API Endpoint**: `GET /api/admin/clients`
```bash
curl -H "Authorization: Bearer admin-token" \
  http://localhost:3001/api/admin/clients?page=1&limit=20
```

**Parametri disponibili:**
- `page`: Numero pagina (default: 1)
- `limit`: Utenti per pagina (default: 20)
- `search`: Filtra per email o nome

### 2. Dettagli utente specifico

**API Endpoint**: `GET /api/admin/clients/:id`
```bash
curl -H "Authorization: Bearer admin-token" \
  http://localhost:3001/api/admin/clients/123
```

**Informazioni incluse:**
- Dati profilo utente
- Configurazioni MT5
- Storico attività
- Sessioni trading attive

### 3. Creare nuovo utente

**API Endpoint**: `POST /api/admin/clients`
```bash
curl -X POST -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  http://localhost:3001/api/admin/clients \
  -d '{
    "email": "nuovo@utente.com",
    "password": "password123",
    "full_name": "Nuovo Utente",
    "subscription_type": "trial",
    "max_concurrent_trades": 3,
    "max_lot_size": 0.1,
    "allowed_symbols": ["EURUSD", "GBPUSD"]
  }'
```

### 4. Aggiornare utente

**API Endpoint**: `PUT /api/admin/clients/:id`
```bash
curl -X PUT -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  http://localhost:3001/api/admin/clients/123 \
  -d '{
    "subscription_type": "premium",
    "max_lot_size": 0.5,
    "is_active": true
  }'
```

### 5. Gestione configurazioni MT5 utente

**Aggiungi configurazione MT5**:
```bash
curl -X POST -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  http://localhost:3001/api/admin/clients/123/mt5-config \
  -d '{
    "config_name": "Account Principal",
    "mt5_host": "localhost",
    "mt5_port": 8080,
    "mt5_login": "123456",
    "mt5_password": "password",
    "mt5_server": "Demo-Server",
    "mt5_broker": "MetaQuotes",
    "default_lot_size": 0.01,
    "risk_level": "medium",
    "auto_trading_enabled": true
  }'
```

**Test connessione MT5**:
```bash
curl -X POST -H "Authorization: Bearer admin-token" \
  http://localhost:3001/api/admin/clients/123/mt5-config/456/test
```

---

## 🗄️ Query Database Utili

### 1. Statistiche utenti

```sql
-- Utenti totali per tipo subscription
SELECT subscription_type, COUNT(*) as count 
FROM clients 
WHERE is_active = true 
GROUP BY subscription_type;

-- Utenti registrati nell'ultima settimana
SELECT COUNT(*) as new_users
FROM clients 
WHERE created_at > NOW() - INTERVAL '7 days';

-- Utenti con MT5 configurato
SELECT 
  c.email, 
  c.full_name, 
  COUNT(mt5.id) as mt5_configs,
  MAX(mt5.last_connection_test) as last_test
FROM clients c
LEFT JOIN client_mt5_configs mt5 ON c.id = mt5.client_id
WHERE c.is_active = true
GROUP BY c.id, c.email, c.full_name;
```

### 2. Controllo stato connessioni

```sql
-- Configurazioni MT5 per stato connessione
SELECT 
  connection_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM client_mt5_configs 
WHERE is_active = true 
GROUP BY connection_status;

-- Ultimi test di connessione falliti
SELECT 
  c.email,
  mt5.config_name,
  mt5.last_connection_test,
  mt5.last_error_message
FROM client_mt5_configs mt5
JOIN clients c ON mt5.client_id = c.id
WHERE mt5.connection_status = 'error'
  AND mt5.last_connection_test > NOW() - INTERVAL '24 hours'
ORDER BY mt5.last_connection_test DESC;
```

### 3. Attività utenti recenti

```sql
-- Log attività ultime 24 ore
SELECT 
  c.email,
  a.activity_type,
  a.description,
  a.created_at
FROM client_activity_logs a
JOIN clients c ON a.client_id = c.id
WHERE a.created_at > NOW() - INTERVAL '24 hours'
ORDER BY a.created_at DESC
LIMIT 50;

-- Sessioni trading attive
SELECT 
  c.email,
  s.started_at,
  s.trades_executed,
  s.total_profit_loss,
  s.status
FROM trading_sessions s
JOIN clients c ON s.client_id = c.id
WHERE s.status = 'active'
ORDER BY s.started_at DESC;
```

### 4. Problemi comuni da controllare

```sql
-- Utenti senza configurazioni MT5
SELECT id, email, full_name, created_at
FROM clients c
WHERE NOT EXISTS (
  SELECT 1 FROM client_mt5_configs mt5 
  WHERE mt5.client_id = c.id AND mt5.is_active = true
)
AND c.is_active = true;

-- Configurazioni MT5 mai testate
SELECT 
  c.email,
  mt5.config_name,
  mt5.created_at
FROM client_mt5_configs mt5
JOIN clients c ON mt5.client_id = c.id
WHERE mt5.last_connection_test IS NULL
  AND mt5.is_active = true;

-- Subscription scadute
SELECT 
  email,
  subscription_type,
  subscription_expires,
  created_at
FROM clients
WHERE subscription_expires < NOW()
  AND is_active = true
ORDER BY subscription_expires DESC;
```

---

## 🏗️ Architettura del Sistema

### 1. Panoramica Componenti

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI Trading Bot Architecture                 │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React + Vite)                                       │
│  ├── Pages: Landing, Login, Register, Dashboard, Trade         │
│  ├── Components: Cards, Charts, Tables, UI                     │
│  └── State: TanStack Query, Local Storage                      │
├─────────────────────────────────────────────────────────────────┤
│  Backend Services (Encore.dev + Express)                       │
│  ├── user/         → Authentication & User Management          │
│  ├── analysis/     → Trading Analysis & Signal Generation      │
│  ├── ml/           → Machine Learning & Pattern Recognition    │
│  ├── scheduler/    → Automated Trading & Job Scheduling        │
│  ├── admin/        → Administrative Panel                      │
│  └── trading/      → Order Management & Position Tracking      │
├─────────────────────────────────────────────────────────────────┤
│  Database (PostgreSQL)                                         │
│  ├── users, user_preferences                                   │
│  ├── clients, client_mt5_configs, client_activity_logs         │
│  ├── trading_sessions, trading_signals, orders                 │
│  └── ml_models, ml_training_data, analytics_data              │
├─────────────────────────────────────────────────────────────────┤
│  External Integrations                                          │
│  ├── MT5 Bridge Server (Python Flask)                         │
│  ├── AI/ML Services (TensorFlow, Pandas)                      │
│  └── Market Data APIs (Real-time feeds)                       │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Flusso di Autenticazione

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant D as Database
    participant M as MT5 Bridge

    U->>F: Login (email, password)
    F->>B: POST /api/auth/login
    B->>D: Verify credentials
    D-->>B: User data
    B->>B: Generate JWT token
    B-->>F: {success, user, token}
    F->>F: Store token in localStorage
    F->>M: Test MT5 connection (optional)
    M-->>F: Connection status
    F->>U: Redirect to dashboard
```

### 3. Flusso Trading

```mermaid
sequenceDiagram
    participant D as Dashboard
    participant A as Analysis Service
    participant M as ML Service
    participant T as Trading Service
    participant MT5 as MT5 Bridge

    D->>A: Request signals
    A->>M: Get ML predictions
    M-->>A: Pattern analysis
    A->>A: Generate trading signals
    A-->>D: Display signals
    D->>T: Place order request
    T->>MT5: Execute order
    MT5-->>T: Order confirmation
    T-->>D: Update position
```

### 4. Struttura File Principale

```
ai-money-generator-main/
├── frontend/                 # React Application
│   ├── src/
│   │   ├── components/      # UI Components
│   │   ├── pages/          # Application Pages
│   │   ├── lib/            # Utilities & API Client
│   │   └── hooks/          # Custom React Hooks
│   ├── package.json        # Frontend Dependencies
│   └── vite.config.ts     # Vite Configuration
│
├── backend/                 # Backend Services
│   ├── user/               # User Management
│   ├── analysis/           # Trading Analysis
│   ├── ml/                 # Machine Learning
│   ├── scheduler/          # Automated Trading
│   ├── admin/              # Admin Panel
│   ├── trading/            # Order Management
│   └── src/                # Express Server & Database
│
├── CLAUDE.md               # Project Documentation
└── GUIDA_UTENTE_COMPLETA.md # This User Guide
```

### 5. Configurazione Deployment

**Vercel (Frontend + Backend):**
- Frontend: Automatico da GitHub
- Backend: Serverless functions
- Database: PostgreSQL hosting esterno

**Database Setup:**
```bash
# Locale (sviluppo)
createdb ai_trading
psql ai_trading < backend/src/database/migrations/*.sql

# Produzione (Vercel)
DATABASE_URL=postgresql://user:pass@host:port/database
```

**Environment Variables (.env):**
```bash
# Database
DATABASE_URL=postgresql://...
JWT_SECRET=your-jwt-secret-key
ENCRYPTION_KEY=your-encryption-key

# APIs
VITE_API_URL=https://your-backend.vercel.app

# MT5 Bridge
MT5_BRIDGE_HOST=localhost
MT5_BRIDGE_PORT=8080
```

---

## 📞 Supporto e Manutenzione

### Comandi Utili per Amministratori

**Restart completo sistema:**
```bash
# Stop tutti i processi
pkill -f "python.*bridge"
pkill -f "node.*server"

# Restart database (se locale)
sudo systemctl restart postgresql

# Rebuild e restart
cd backend && bun run build
python ai_trading_installer.py
```

**Backup database:**
```bash
pg_dump -h localhost -U postgres ai_trading > backup_$(date +%Y%m%d).sql
```

**Monitoraggio logs:**
```bash
# Frontend (Vercel)
vercel logs --follow

# Backend locale
tail -f ~/.ai_trading_bot/bridge.log

# Database
tail -f /var/log/postgresql/postgresql-*.log
```

### Contatti Supporto

- **Documentazione Tecnica**: `CLAUDE.md`
- **Issues GitHub**: Repository issues section
- **Log Directory**: `~/.ai_trading_bot/`
- **Config Directory**: `~/.ai_trading_bot/config.json`

---

*© 2024 AI Trading Boost. Guida aggiornata al 31 Agosto 2025.*