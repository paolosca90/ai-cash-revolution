# 🚀 AI Trading Boost - Deployment Guide

## Vercel Deployment

### Prerequisites
- Account Vercel
- Repository GitHub/GitLab
- Progetto Supabase attivo
- (Opzionale) VPS per MT5 server

### Step 1: Preparazione Repository

```bash
# Commit all changes
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Collegamento a Vercel

1. Vai su [vercel.com](https://vercel.com)
2. Click "New Project"
3. Importa il repository GitHub
4. Seleziona "ai-trading-boost"

### Step 3: Configurazione Build Vercel

**Framework Preset:** Vite
**Root Directory:** `frontend`
**Build Command:** `npm run build`
**Output Directory:** `dist`

### Step 4: Environment Variables in Vercel

Aggiungi queste variabili nella dashboard Vercel:

```env
VITE_SUPABASE_URL=https://jeewrxgqkgvtrphebcxz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplZXdyeGdxa2d2dHJwaGViY3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MjQzOTIsImV4cCI6MjA1MTUwMDM5Mn0.UHcVqf4kSUWrQQoTRPP1uv7IHGf7RdtXjmJqZBVXl8g
VITE_MT5_API_URL=https://your-vps-domain.com:8080
VITE_ENCORE_API_URL=https://backend-c10yefh44-paolos-projects-dc6990da.vercel.app
VITE_PRODUCTION_API_URL=https://backend-c10yefh44-paolos-projects-dc6990da.vercel.app
VITE_FRONTEND_URL=https://ai-trading-boost.vercel.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
VITE_ENABLE_REAL_TRADING=false
VITE_ENABLE_DEMO_MODE=true
VITE_ENABLE_DEBUG=false
```

### Step 5: Deploy

1. Click "Deploy"
2. Attendi il completamento
3. Ottieni l'URL di produzione

### Step 6: Post-Deployment

#### Aggiornare Supabase Authentication URLs

Nel dashboard Supabase, aggiorna:
- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** Aggiungi l'URL Vercel

#### Testare l'Applicazione

1. ✅ Registrazione utente
2. ✅ Login/Logout
3. ✅ Dashboard caricamento
4. ✅ Connessione Supabase
5. ⚠️ MT5 connection (richiede VPS)

## MT5 Server Deployment (VPS)

### Opzione 1: VPS Linux

```bash
# Installare Python e MT5 su VPS Windows
pip install MetaTrader5 flask flask-cors

# Copiare mt5-python-server.py
# Configurare reverse proxy (nginx)
# Avviare il servizio
```

### Opzione 2: Locale con Tunnel

```bash
# Per sviluppo, usare ngrok per esporre localhost
ngrok http 8080
# Aggiornare VITE_MT5_API_URL con l'URL ngrok
```

## Monitoraggio

### Vercel Analytics
- Abilitare Vercel Analytics
- Monitor performance e errori

### Supabase Monitoring
- Dashboard Supabase per DB performance
- Logs authentication e queries

### Logs e Debug

```javascript
// Frontend logs visibili in browser console
console.log('API Client baseURL:', baseURL);
console.log('MT5 Integration baseURL:', mt5BaseURL);
```

## Troubleshooting

### Build Errors
- Verificare dipendenze in package.json
- Controllare TypeScript errors
- Verificare environment variables

### API Errors
- Testare endpoints manualmente
- Verificare CORS configuration
- Controllare Supabase policies

### MT5 Connection Issues
- Verificare VPS/server MT5 attivo
- Testare endpoint direttamente
- Controllare firewall e ports

## Rollback Procedure

```bash
# Se necessario rollback
git revert HEAD
git push origin main
# Re-deploy automatico su Vercel
```

## Performance Optimization

### Bundle Size
```bash
# Analisi bundle size
npm run build
npx vite-bundle-analyzer dist/
```

### Caching
- Static assets: 1 year cache
- API calls: Appropriate cache headers
- Supabase: Built-in caching

### CDN
- Vercel Edge Network
- Global distribution
- Automatic optimization

## Security Checklist

- ✅ Environment variables secure
- ✅ Supabase RLS policies active
- ✅ No sensitive data in frontend
- ✅ HTTPS enforced
- ✅ CORS properly configured

## Post-Launch Tasks

1. **Monitor performance** primina settimana
2. **Setup alerting** per downtime
3. **Database backup** configuration
4. **SSL certificate** renewal tracking
5. **User feedback** collection