# 🚀 Deploy Manuale su Vercel

## Opzione 1: Deploy via Vercel Dashboard (Raccomandato)

### Step 1: Preparazione Repository

```bash
# 1. Commit tutte le modifiche
git add .
git commit -m "🚀 Prepare for Vercel deployment with Supabase integration"
git push origin main
```

### Step 2: Collegamento a Vercel

1. Vai su **https://vercel.com**
2. Fai login con GitHub/GitLab
3. Click **"Add New..."** → **"Project"**
4. Seleziona il repository **AI-money-generator-main**
5. Click **"Import"**

### Step 3: Configurazione Progetto

**Framework Preset:** Other
**Root Directory:** `./` (leave blank)
**Build Command:** `npm run build`
**Output Directory:** `frontend/dist`
**Install Command:** `cd frontend && npm install`

### Step 4: Environment Variables

Aggiungi le seguenti variabili nella sezione **Environment Variables**:

```
VITE_SUPABASE_URL = https://jeewrxgqkgvtrphebcxz.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplZXdyeGdxa2d2dHJwaGViY3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MjQzOTIsImV4cCI6MjA1MTUwMDM5Mn0.UHcVqf4kSUWrQQoTRPP1uv7IHGf7RdtXjmJqZBVXl8g
VITE_MT5_API_URL = https://your-vps-domain.com:8080
VITE_ENCORE_API_URL = https://backend-c10yefh44-paolos-projects-dc6990da.vercel.app
VITE_PRODUCTION_API_URL = https://backend-c10yefh44-paolos-projects-dc6990da.vercel.app
VITE_FRONTEND_URL = https://ai-trading-boost.vercel.app
VITE_STRIPE_PUBLISHABLE_KEY = pk_test_your_stripe_key_here
VITE_ENABLE_REAL_TRADING = false
VITE_ENABLE_DEMO_MODE = true
VITE_ENABLE_DEBUG = false
```

### Step 5: Deploy

1. Click **"Deploy"**
2. Attendi il completamento (2-5 minuti)
3. Ottieni l'URL di produzione

---

## Opzione 2: Deploy via CLI

### Step 1: Login Vercel CLI

```bash
vercel login
# Segui le istruzioni per GitHub/Google login
```

### Step 2: Setup Progetto

```bash
cd "/path/to/AI-money-generator-main"
vercel
```

Rispondi alle domande:
- **Set up and deploy?** Yes
- **Which scope?** Your account
- **Link to existing project?** No
- **Project name?** ai-trading-boost
- **Directory?** ./
- **Want to override settings?** Yes
  - **Build Command:** `npm run build`
  - **Output Directory:** `frontend/dist`
  - **Development Command:** `npm run dev`

### Step 3: Deploy Produzione

```bash
vercel --prod
```

---

## Opzione 3: Deploy via Git Integration

### Step 1: Push to Main Branch

```bash
git add .
git commit -m "🚀 Production deployment"
git push origin main
```

### Step 2: Auto-Deploy

- Vercel rileva automaticamente il push
- Avvia build e deploy automaticamente
- Ricevi notifica di completamento

---

## Post-Deploy Tasks

### 1. Aggiornare Supabase URLs

Nel dashboard Supabase:
1. Vai a **Authentication** → **URL Configuration**
2. **Site URL:** `https://your-app.vercel.app`
3. **Redirect URLs:** Aggiungi:
   - `https://your-app.vercel.app`
   - `https://your-app.vercel.app/auth/callback`

### 2. Testare l'Applicazione

```bash
# Test endpoints
curl https://your-app.vercel.app/
curl https://your-app.vercel.app/login
```

### 3. Verificare Funzionalità

- ✅ Homepage caricamento
- ✅ Registrazione utente
- ✅ Login/Logout
- ✅ Dashboard accesso
- ✅ Supabase connessione
- ⚠️ MT5 server (richiede VPS separato)

---

## Troubleshooting

### Build Fallisce

```bash
# Testare build in locale
npm run build

# Verificare logs Vercel
vercel logs
```

### Environment Variables

```bash
# Verificare in browser console
console.log(import.meta.env.VITE_SUPABASE_URL);
```

### CORS Errors

Aggiornare domini in:
- Supabase Dashboard
- MT5 Server configuration (se usato)

---

## Monitoring e Maintenance

### Performance

- Vercel Analytics: Abilitare nella dashboard
- Core Web Vitals: Monitor automatico

### Logs

```bash
# Real-time logs
vercel logs --follow

# Function logs
vercel logs --function
```

### Updates

```bash
# Aggiornamenti automatici su git push main
git push origin main

# Deploy manuale
vercel --prod
```

---

## 🎯 URL Finali Attesi

- **Frontend:** `https://ai-trading-boost.vercel.app`
- **Supabase:** `https://jeewrxgqkgvtrphebcxz.supabase.co`
- **Backend API:** Existing Vercel deployment
- **MT5 Server:** Requires separate VPS deployment

---

## 📞 Supporto

Se riscontri problemi:

1. **Vercel Docs:** https://vercel.com/docs
2. **Build Logs:** Dashboard Vercel → Project → Functions tab
3. **GitHub Issues:** Repository issues section
4. **Supabase Docs:** https://supabase.com/docs