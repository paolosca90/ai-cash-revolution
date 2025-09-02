# Setup Completo: Supabase + MT5 Integration

## ✅ Modifiche Completate

### 1. **Supabase Authentication** ✅
- ✅ Configurato client Supabase (`frontend/lib/supabase.ts`)
- ✅ Aggiornate credenziali Supabase in `.env` files
- ✅ Modificato Login.tsx per usare Supabase
- ✅ Modificato Register.tsx per usare Supabase
- ✅ Installate dipendenze `@supabase/supabase-js`

### 2. **MT5 Integration** ✅
- ✅ Creato sistema integrato (`frontend/lib/mt5-integration.ts`)
- ✅ Migliorato server Python MT5 con nuovi endpoints
- ✅ Aggiunto supporto per login dinamico MT5
- ✅ Configurate variabili ambiente per MT5

### 3. **Database Schema** ✅
- ✅ Schema completo in `backend/supabase-setup.sql`
- ✅ Tabelle per users, trading_accounts, orders, signals
- ✅ Row Level Security (RLS) configurato
- ✅ Policies di sicurezza implementate

## 🚀 Come Testare il Sistema

### Passo 1: Avvia Supabase (se locale)
```bash
cd backend
supabase start
```

### Passo 2: Esegui le migrazioni database
```sql
-- Esegui il contenuto di backend/supabase-setup.sql nella console SQL di Supabase
```

### Passo 3: Avvia il server MT5 Python
```bash
cd backend/analysis
python mt5-python-server.py
```

### Passo 4: Avvia il frontend
```bash
cd frontend
npm run dev
```

### Passo 5: Avvia il backend Encore (opzionale)
```bash
cd backend
encore run
```

## 🔧 Configurazione Variabili

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://jeewrxgqkgvtrphebcxz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_MT5_API_URL=http://localhost:8080
VITE_ENCORE_API_URL=http://localhost:4000
```

### Backend (.env)
```env
SUPABASE_URL=https://jeewrxgqkgvtrphebcxz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
MT5_HOST=localhost
MT5_PORT=8080
MT5_ENABLE_REAL_DATA=true
```

## 📋 Test delle Funzionalità

### 1. Test Autenticazione
1. Vai su `http://localhost:5173/register`
2. Crea un nuovo account
3. Verifica email (se configurato)
4. Login su `http://localhost:5173/login`
5. Verifica che l'utente sia salvato in Supabase

### 2. Test Connessione MT5
1. Apri MT5 terminal
2. Fai login con un account demo/reale
3. Abilita AutoTrading
4. Testa connessione: `GET http://localhost:8080/status`

### 3. Test Integrazione Completa
1. Login nell'app web
2. Vai al dashboard
3. Verifica che vengano mostrati i dati MT5
4. Prova a eseguire un ordine demo

## 🔍 Endpoints Disponibili

### MT5 Server (localhost:8080)
- `GET /status` - Status connessione
- `GET /health` - Health check
- `GET /symbols` - Simboli disponibili  
- `POST /login` - Login con credenziali
- `POST /rates` - Dati storici
- `POST /execute` - Esegui ordine
- `GET /positions` - Posizioni aperte

### Supabase API
- Authentication automatica
- Database RLS policies
- Real-time subscriptions

## ❗ Problemi Comuni

### MT5 Non Si Connette
1. Verifica che MT5 terminal sia aperto
2. Controlla che AutoTrading sia attivo
3. Verifica le credenziali in `.env`
4. Controlla i log del server Python

### Errori Supabase
1. Verifica le URL e chiavi in `.env`
2. Controlla che il progetto Supabase sia attivo
3. Verifica le policies RLS nel database

### CORS Errors
1. Il server Python ha CORS abilitato
2. Verifica che le URL nel frontend siano corrette

## 🎯 Prossimi Step

1. **Test con account MT5 reale**
2. **Configurazione email verification**
3. **Deploy in produzione**
4. **Monitoraggio e logging**
5. **Backup database automatico**

## 📞 Debug e Supporto

### Log Files da Controllare
- Browser Developer Console
- Terminal server Python MT5
- Supabase dashboard logs
- Encore logs (se usato)

### Comandi Utili
```bash
# Test connessione MT5
curl http://localhost:8080/status

# Test Supabase
# Vai su https://jeewrxgqkgvtrphebcxz.supabase.co

# Restart servizi
pkill -f mt5-python-server
python backend/analysis/mt5-python-server.py
```