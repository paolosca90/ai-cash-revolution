# Setup Variabili Ambiente su Vercel

Per configurare le variabili ambiente sul tuo deployment Vercel:

## 1. Via Vercel Dashboard (Raccomandato)

1. Vai su https://vercel.com/dashboard
2. Clicca sul tuo progetto "ai-trading-bot"
3. Vai in **Settings** → **Environment Variables**
4. Aggiungi queste variabili:

### Database & Security
```
DATABASE_URL = your-database-connection-string
JWT_SECRET = SuperSecretJWTKey123456789!@#$%^&*()
ENCRYPTION_KEY = YourEncryptionKey32CharsLong!@#$
```

### IONOS Cloud API (Le Tue Credenziali)
```
IONOS_USERNAME = paoloscardia@gmail.com
IONOS_PASSWORD = cash-revolution2025
IONOS_API_TOKEN = lizqEDPnV2adDetv_Z8VIjSrOIAK0sgArLjEI6tBDdc5FePvH9KWZb8azDW9cZ__LGLgl0OKbvjiLxaxz6GiiA
IONOS_DATACENTER_ID = (lasciare vuoto - verrà generato automaticamente)
```

### Application Settings
```
NODE_ENV = production
DOMAIN = https://ai-trading-o03rn7a0i-paolos-projects-dc6990da.vercel.app
```

### Optional (Fallback Providers)
```
VULTR_API_KEY = (opzionale - solo se vuoi backup)
AWS_ACCESS_KEY_ID = (opzionale - solo se vuoi backup)
AWS_SECRET_ACCESS_KEY = (opzionale - solo se vuoi backup)
```

### Email & Payment (per dopo)
```
SENDGRID_API_KEY = (quando configuri email)
STRIPE_SECRET_KEY = (quando configuri pagamenti)
```

## 2. Via Vercel CLI (Alternativo)

```bash
# Installa Vercel CLI se non ce l'hai
npm i -g vercel

# Login
vercel login

# Configura environment variables
vercel env add IONOS_USERNAME
# Inserisci: paoloscardia@gmail.com

vercel env add IONOS_PASSWORD  
# Inserisci: cash-revolution2025

vercel env add IONOS_API_TOKEN
# Inserisci: lizqEDPnV2adDetv_Z8VIjSrOIAK0sgArLjEI6tBDdc5FePvH9KWZb8azDW9cZ__LGLgl0OKbvjiLxaxz6GiiA

# Rideploy
vercel --prod
```

## 3. Test Configurazione

Dopo aver configurato tutto:

```bash
# Test API IONOS
curl -X GET "https://api.ionos.com/cloudapi/v6/datacenters" \
  -H "Authorization: Basic $(echo -n 'paoloscardia@gmail.com:cash-revolution2025' | base64)"
```

Se ricevi una risposta JSON con datacenter disponibili, tutto è configurato correttamente!

## 4. Prossimi Passi

Una volta configurate le variabili:

1. **Deploy automatico**: Vercel ribuilderà con le nuove env vars
2. **Test sistema**: Prova a creare un VPS di test
3. **Setup database**: Configura PostgreSQL (Supabase/Railway/Neon)
4. **Test pagamenti**: Configura Stripe per pagamenti reali

## 5. Sicurezza

✅ **Le variabili sono sicure** - Vercel le cripta
✅ **Non visibili nel codice** - Solo runtime access  
✅ **Separate per environment** - Development vs Production

## 6. Database Setup (Prossimo Step)

Ti consiglio **Supabase** (PostgreSQL gratuito):

1. Registrati su https://supabase.com
2. Crea nuovo progetto
3. Copia connection string
4. Aggiungi come `DATABASE_URL` in Vercel
5. Esegui le migrations SQL che ho creato

**Tutto pronto per VPS automatici con IONOS! 🚀**