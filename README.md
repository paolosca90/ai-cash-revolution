# 🚀 AI Cash R-evolution - Deploy Finali

Questo repository contiene solo i file necessari per il deploy finale della piattaforma AI Cash R-evolution.

## 📁 Cartelle Principali:

### 1. `VPS_READY_FIXED` - Deploy su IP (porta 4000)
- Accesso diretto tramite IP: http://154.61.187.189:4000
- Senza Docker, solo Node.js
- Script di installazione e avvio inclusi

### 2. `VPS_READY_SUBDOMAIN_FIXED` - Deploy su sottodominio (porta 8080)
- Accesso tramite sottodominio: http://ai.cash-revolution.com:8080
- Senza Docker, solo Node.js
- Script di installazione e avvio inclusi

## 🎯 Istruzioni per il Deploy:

### Per IP (porta 4000):
1. Copiare la cartella `VPS_READY_FIXED` sul VPS
2. Eseguire `INSTALL.bat` come amministratore
3. Eseguire `START.bat`
4. Accesso: http://154.61.187.189:4000

### Per Sottodominio (porta 8080):
1. Configurare DNS su IONOS:
   - Record A: Nome "ai", Valore "154.61.187.189"
2. Copiare la cartella `VPS_READY_SUBDOMAIN_FIXED` sul VPS
3. Eseguire `INSTALL.bat` come amministratore
4. Eseguire `START.bat`
5. Accesso: http://ai.cash-revolution.com:8080

## 🔐 Credenziali Admin:
- Email: admin@cash-revolution.com
- Password: CashRev2025!SecureAdmin# (da cambiare al primo accesso)