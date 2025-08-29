# 🚀 Vercel Deployment Guide - Fix 404 Error

## ❌ **Problema Risolto: 404 NOT_FOUND**

Il codice è stato aggiornato per essere compatibile con l'ambiente serverless di Vercel.

## 🔧 **File di Configurazione Creati**

### 1. `vercel.json` - Configurazione Vercel
- Routing corretto per tutte le API routes
- Build configuration per TypeScript
- Function settings ottimizzate

### 2. `api/index.ts` - Entry Point Serverless
- Punto di ingresso per le serverless functions
- Import dell'app Express principale

### 3. Server Updates
- Conditional server start (solo in development)
- Export dell'app per Vercel

## 🚀 **Steps per Deployment Corretto**

### **Step 1: Commit e Push delle Modifiche**
```bash
# Dalla root del progetto
git add .
git commit -m "Add Vercel configuration and fix 404 routing issues"
git push origin main
```

### **Step 2: Deploy su Vercel**
```bash
# Installa Vercel CLI se non ce l'hai
npm i -g vercel

# Login su Vercel
vercel login

# Deploy dal folder new-backend
cd new-backend
vercel --prod

# Segui le istruzioni:
# - Set up and deploy? Y
# - Which scope? (seleziona il tuo account)
# - Link to existing project? N (per nuovo progetto)
# - What's your project's name? ai-cash-revolution-backend
# - In which directory is your code located? ./
```

### **Step 3: Configura Environment Variables**

Vai su [vercel.com](https://vercel.com) > Il tuo progetto > Settings > Environment Variables

Aggiungi le seguenti variabili:

```env
# REQUIRED - Sicurezza
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
TRADING_ACCOUNT_ENCRYPTION_KEY=your-encryption-key-32-chars-minimum

# Database
DATABASE_URL=your-postgres-connection-string

# MT5 Trading
MT5_HOST=154.61.187.189
MT5_PORT=8080
MT5_LOGIN=6001637
MT5_SERVER=PureMGlobal-MT5

# API Keys (aggiungi solo quelle che usi)
STRIPE_SECRET_KEY=sk_live_your_stripe_key
OPENAI_API_KEY=sk-your_openai_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
```

### **Step 4: Test degli Endpoints**

Una volta deployato, testa questi URL:

```
✅ Health Check
https://your-app.vercel.app/health

✅ User API  
https://your-app.vercel.app/api/user/preferences

✅ Trading Signals
https://your-app.vercel.app/api/analysis/top-signals

✅ ML Analytics
https://your-app.vercel.app/api/ml/analytics

✅ Trading API
https://your-app.vercel.app/api/trading/positions
```

## 🔧 **Risoluzione Problemi Comuni**

### **404 Error Persiste**
```bash
# 1. Controlla che vercel.json sia nella root di new-backend
# 2. Redeploy
vercel --prod --force

# 3. Controlla i logs
vercel logs your-deployment-url
```

### **Environment Variables Non Caricate**
```bash
# Lista le env vars
vercel env ls

# Redeploy dopo aver aggiunto env vars
vercel --prod
```

### **Function Timeout**
Se le funzioni vanno in timeout:

1. Vai su Vercel Dashboard
2. Settings > Functions
3. Aumenta il timeout a 15s (Pro plan) o 10s (Hobby)

## 📊 **Struttura URL Finale**

Dopo il deployment corretto avrai:

```
🌐 Frontend: https://your-frontend.vercel.app
🔧 Backend API: https://your-backend.vercel.app/api/*
💊 Health Check: https://your-backend.vercel.app/health
```

## 🎯 **Next Steps**

1. **Frontend Connection**: Aggiorna il frontend per puntare al nuovo backend URL
2. **Domain Custom**: Configura un dominio personalizzato se necessario
3. **Monitoring**: Setup di monitoraggio e alerting
4. **Database**: Configura PostgreSQL su Supabase o PlanetScale

## 🆘 **Vercel CLI Commands Utili**

```bash
# Lista progetti
vercel list

# Logs in real-time
vercel logs --follow

# Info sul deployment
vercel inspect your-deployment-url

# Remove deployment
vercel remove your-project-name
```

## ✅ **Checklist Deployment**

- [ ] File `vercel.json` presente in new-backend/
- [ ] File `api/index.ts` presente
- [ ] Environment variables configurate su Vercel
- [ ] Test di `/health` endpoint funzionante
- [ ] Test delle API routes principali
- [ ] Frontend aggiornato con nuovo backend URL

Una volta completati questi steps, il tuo backend Express sarà completamente funzionante su Vercel! 🎉