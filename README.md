# 🚀 AI Trading System - Encore Cloud

Un sistema di trading avanzato basato su AI e machine learning, deployato con Encore Cloud per massima scalabilità e semplicità.

## 🌟 Caratteristiche

- **Backend Encore Cloud**: Deploy automatico e scalabile
- **AI Trading**: Analisi di mercato avanzata con ML
- **Sistema Multi-Servizio**: Architettura microservizi
- **Frontend React**: Dashboard moderna e reattiva
- **Gestione Utenti**: Sistema completo di auth e pagamenti

## 📁 Struttura Progetto

```
├── backend/              # Servizi Encore
│   ├── encore.app       # Configurazione Encore
│   ├── admin/           # Servizio amministrazione
│   ├── analysis/        # Servizio analisi AI
│   ├── auth/            # Servizio autenticazione
│   ├── email/           # Servizio email
│   ├── frontend/        # Servizio frontend statico
│   ├── installer/       # Servizio installazione
│   ├── ml/              # Servizio machine learning
│   ├── payments/        # Servizio pagamenti
│   ├── scheduler/       # Servizio scheduling
│   └── user/            # Servizio utenti
└── frontend/            # App React/TypeScript
    ├── components/      # Componenti UI
    ├── pages/           # Pagine dell'app
    └── hooks/           # React hooks
```

## 🚀 Deploy con Encore Cloud

### 1. Setup Iniziale

```bash
# Installare Encore CLI
curl -L https://encore.dev/install.sh | bash

# Login a Encore
encore auth login

# Installare dipendenze
bun install
```

### 2. Development

```bash
# Sviluppo locale
bun run dev

# Test
bun run test

# Build frontend
bun run build
```

### 3. Deploy su Encore Cloud

```bash
# Deploy automatico
bun run deploy

# O direttamente dalla cartella backend
cd backend && encore deploy
```

### 4. Connessione GitHub

1. **Push su GitHub**:
   ```bash
   git add .
   git commit -m "Configured for Encore Cloud"
   git push origin main
   ```

2. **Setup Encore GitHub Integration**:
   - Vai su [Encore Cloud Dashboard](https://app.encore.cloud)
   - Collega il tuo repository GitHub
   - Configura il deploy automatico su push

## 🔧 Configurazione

### File Principali

- `backend/encore.app` - Configurazione app Encore
- `backend/package.json` - Dipendenze backend
- `frontend/package.json` - Dipendenze frontend

### Variabili Ambiente

Configura le seguenti variabili in Encore Cloud Dashboard:

```env
DATABASE_URL=        # Gestito automaticamente da Encore
SENDGRID_API_KEY=    # Per email
JWT_SECRET=          # Per autenticazione
MT5_SERVER_HOST=     # Server MetaTrader 5
```

## 🎯 Servizi Disponibili

### API Endpoints

- `/admin/*` - Amministrazione sistema
- `/auth/*` - Autenticazione utenti  
- `/analysis/*` - Analisi trading AI
- `/ml/*` - Machine learning
- `/payments/*` - Gestione pagamenti
- `/user/*` - Gestione utenti
- `/email/*` - Servizio email

### Database

Encore gestisce automaticamente PostgreSQL con:
- Migrazioni automatiche
- Backup e recovery
- Scaling automatico

## 🔐 Sicurezza

- Autenticazione JWT
- Rate limiting automatico
- Encryption a riposo
- HTTPS automatico
- Monitoring integrato

## 📊 Monitoring

Dashboard automatico disponibile su Encore Cloud per:
- Performance metrics
- Error tracking  
- Request tracing
- Database metrics

## 🆘 Supporto

- **Encore Docs**: https://encore.dev/docs
- **Dashboard**: https://app.encore.cloud
- **Encore Community**: https://community.encore.dev

---

**Deploy semplificato con Encore Cloud - scalabile, sicuro, monitorato** 🚀