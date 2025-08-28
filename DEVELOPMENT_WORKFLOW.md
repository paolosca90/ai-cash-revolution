# 🔄 AI Cash R-evolution - Development Workflow

## 🎯 Setup Iniziale (Una Volta Sola)

### 1. **Deploy Iniziale**
```bash
# Upload cartella e deploy
scp -r DEPLOY26-08-2025-main/ root@VPS_IP:/tmp/
ssh root@VPS_IP
cd /tmp/DEPLOY26-08-2025-main/
chmod +x quick-deploy.sh
./quick-deploy.sh ai.cash-revolution.com
```

### 2. **Setup Git Repository**
```bash
# Sul tuo PC - crea repository
git init
git add .
git commit -m "Initial AI Cash R-evolution setup"
git branch -M main
git remote add origin https://github.com/USERNAME/ai-cash-revolution.git
git push -u origin main

# Sulla VPS - setup git deployment
./setup-git-deploy.sh ai.cash-revolution.com
git remote add origin https://github.com/USERNAME/ai-cash-revolution.git
```

---

## 🚀 Workflow di Sviluppo Quotidiano

### **Sviluppo Locale**
```bash
# Fai le tue modifiche
vim backend/analysis/some-file.ts

# Test locale  
npm run dev

# Commit changes
git add .
git commit -m "Enhanced trading algorithm"
git push origin main
```

### **Deploy Aggiornamento (10 secondi!)**
```bash
# Sulla VPS
ssh root@VPS_IP
cd /var/www/ai-cash-revolution
./update.sh
```

**Oppure deploy automatico con webhook!**

---

## ⚡ Metodi di Deploy

### **Metodo 1: Manuale Veloce** ⭐
```bash
./update.sh    # Sulla VPS
```

### **Metodo 2: Automatico (Webhook)**
```bash
# Setup una volta sola
# Vai su GitHub → Settings → Webhooks
# URL: https://ai.cash-revolution.com:3001/webhook
# Ogni push fa deploy automatico!
```

### **Metodo 3: Hot Reload (Sviluppo)**
```bash
# Solo per development
pm2 start backend/server.js --watch --name "ai-cash-dev"
```

---

## 📁 Struttura Deploy Ottimale

### **File che vanno sempre aggiornati:**
- `backend/` - Logica applicazione
- `frontend/` - Interfaccia utente  
- `.env.production` - Solo se nuove variabili

### **File che NON vanno toccati:**
- `node_modules/` - Gestiti da npm
- Database - Rimane intatto
- SSL certificates - Auto-rinnovati
- Nginx config - Solo se cambi dominio

---

## 🔧 Comandi Utili

### **Monitoraggio**
```bash
pm2 list                          # Stato servizi
pm2 logs ai-cash-revolution       # Logs app
pm2 monit                         # Monitor performance
curl https://ai.cash-revolution.com/health  # Health check
```

### **Troubleshooting**
```bash
pm2 restart ai-cash-revolution    # Riavvia app
systemctl restart nginx          # Riavvia nginx
./update.sh                       # Forza aggiornamento
pm2 logs ai-cash-revolution --lines 50  # Ultimi 50 logs
```

### **Database**
```bash
sudo -u postgres psql aicash_revolution  # Connetti DB
./backup.sh                              # Backup manuale
```

---

## 🎯 Vantaggi di Questo Workflow

✅ **Deploy in 10 secondi** - Solo `./update.sh`  
✅ **Zero downtime** - PM2 fa restart graceful  
✅ **Auto-backup** - DB backup automatico  
✅ **Rollback facile** - `git checkout <commit>`  
✅ **Logs completi** - Tutto tracciato  
✅ **SSL automatico** - Nessuna configurazione  

---

## 🚨 Workflow di Emergenza

### **Se qualcosa va male:**
```bash
# 1. Rollback veloce
git log --oneline                 # Vedi commits
git checkout COMMIT_PRECEDENTE    # Torna indietro
./update.sh                       # Applica rollback

# 2. Restart completo
pm2 restart all
systemctl restart nginx

# 3. Check salute sistema
curl https://ai.cash-revolution.com/health
pm2 logs ai-cash-revolution
```

---

## 💡 Pro Tips

1. **Sviluppa sempre in branch separati**
2. **Testa sempre prima di push su main**
3. **Fai commit piccoli e frequenti**
4. **Usa messaggi commit descrittivi**
5. **Controlla sempre i logs dopo deploy**

**Il tuo workflow ora è veloce, professionale e sicuro!** 🚀