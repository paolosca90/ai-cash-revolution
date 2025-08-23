# CLAUDE.md

Questo file fornisce indicazioni a Claude Code (claude.ai/code) quando lavora con il codice in questo repository.

## Panoramica del Progetto

Questo è un sistema di trading alimentato da AI costruito con Encore.dev che genera segnali di trading automatizzati utilizzando machine learning e analisi tecnica. Il sistema è composto da:

1. Un'API backend costruita con servizi Encore.dev (TypeScript)
2. Un frontend React con Vite
3. Componenti di machine learning per il rilevamento di pattern e l'addestramento di modelli
4. Generazione automatizzata di segnali di trading con gestione del rischio

## Architettura

L'applicazione è organizzata in diversi servizi Encore:
- `analysis`: Generazione dei segnali di trading principali e analisi di mercato
- `ml`: Componenti di machine learning per addestramento e rilevamento di pattern
- `scheduler`: Esecuzione automatizzata del trading
- `user`: Gestione utenti e configurazione

Il frontend è un'applicazione React che si connette ai servizi backend.

## Comandi Comuni di Sviluppo

### Sviluppo Backend
```bash
# Naviga nella directory backend
cd backend

# Avvia il server di sviluppo Encore
encore run

# Genera il client frontend
encore gen client --target leap
```

### Sviluppo Frontend
```bash
# Naviga nella directory frontend
cd frontend

# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npx vite dev
```

### Compilazione
```bash
# Compila il frontend e integra con il backend
cd backend
bun run build
```

## Deployment

### Piattaforma Encore Cloud
1. Login: `encore auth login`
2. Imposta il git remote: `git remote add encore encore://telegram-trading-bot-d6u2`
3. Deploy: `git push encore`

### Self-hosting
Consulta la documentazione di Encore per le opzioni di deployment Docker.

## Componenti Principali

### Generazione Segnali (backend/analysis/)
- `signal-generator.ts`: Logica principale di generazione dei segnali di trading
- `ai-engine.ts`: Analisi di mercato basata su AI
- `trading-strategies.ts`: Implementazioni di diverse strategie di trading
- `market-data.ts`: Recupero ed elaborazione dei dati di mercato

### Machine Learning (backend/ml/)
- `learning-engine.ts`: Addestramento ML e rilevamento di pattern
- `training.ts`: Endpoint per l'addestramento dei modelli
- `analytics.ts`: Analisi delle performance ML

### Frontend (frontend/)
- `App.tsx`: Routing principale dell'applicazione
- `pages/Dashboard.tsx`: Dashboard principale con segnali di trading e performance
- `components/cards/AutoSignalCard.tsx`: Componenti di visualizzazione dei segnali di trading

## Struttura Database
L'applicazione utilizza PostgreSQL con migrazioni situate in:
- `backend/analysis/migrations/`
- `backend/ml/migrations/`

## Note Importanti
- Il sistema genera automaticamente segnali di trading ogni 2 minuti
- I modelli ML sono addestrati in base alle performance storiche dei trade
- La gestione del rischio è integrata nel processo di generazione dei segnali
- Il frontend utilizza React Query per il recupero e la memorizzazione nella cache dei dati