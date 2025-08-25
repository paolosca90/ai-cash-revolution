# Setup IONOS Cloud API per VPS Automatico

Questa guida ti aiuta a configurare IONOS Cloud per creare VPS automaticamente per i tuoi clienti.

## 1. Registrazione IONOS Cloud

1. **Vai su**: https://cloud.ionos.com
2. **Crea account** o fai login
3. **Aggiungi carta di credito** per fatturazione automatica
4. **Verifica account** (potrebbero richiedere documenti)

## 2. Ottieni Credenziali API

### Metodo A: API Token (Raccomandato)
1. Vai in **DCD (Data Center Designer)**
2. Menu → **Management** → **API**  
3. Clicca **"Generate Token"**
4. Copia il token generato

### Metodo B: Username/Password
1. Usa le stesse credenziali del tuo account IONOS
2. Username = la tua email IONOS
3. Password = la tua password IONOS

## 3. Configurazione Variabili Ambiente

Aggiungi queste variabili al tuo deployment:

```bash
# IONOS Cloud API
IONOS_API_TOKEN=your-api-token-here
IONOS_USERNAME=your-email@domain.com  
IONOS_PASSWORD=your-ionos-password
IONOS_DATACENTER_ID=  # Verrà creato automaticamente

# Alternative providers (fallback)
VULTR_API_KEY=your-vultr-key (opzionale)
AWS_ACCESS_KEY_ID=your-aws-key (opzionale)
```

## 4. Test Configurazione

### Test API Connection
```bash
curl -X GET "https://api.ionos.com/cloudapi/v6/datacenters" \
  -H "Authorization: Basic $(echo -n 'username:password' | base64)"
```

### Test nel tuo sistema
```javascript
// Nel tuo codice di test
const { ionosProvider } = require('./backend/subscription/ionos-provider');

// Test creazione VPS
const testRequest = {
  userId: 999,
  email: 'test@example.com',
  planType: 'basic',
  mt5Config: {
    login: 'test123',
    password: 'testpass',
    server: 'TestServer',
    broker: 'TestBroker'
  }
};

ionosProvider.createTradingVPS(testRequest)
  .then(result => console.log('✅ Test IONOS riuscito:', result))
  .catch(error => console.error('❌ Test IONOS fallito:', error));
```

## 5. Costi IONOS

### Pricing per VPS Trading

| Piano Cliente | IONOS Specs | Costo IONOS | Prezzo Cliente | Margine |
|---------------|-------------|-------------|----------------|---------|
| **Basic €29** | 1 core, 1GB RAM, 25GB SSD | €4/mese | €29/mese | **€25** |
| **Premium €59** | 2 core, 2GB RAM, 50GB SSD | €8/mese | €59/mese | **€51** |
| **Enterprise €99** | 2 core, 4GB RAM, 80GB SSD | €16/mese | €99/mese | **€83** |

### Costi Extra (automatici)
- **IP Pubblico**: €1/mese (incluso automaticamente)
- **Windows License**: Inclusa nel prezzo VPS
- **Traffico**: Primo TB gratuito (sufficiente per trading)

### Fatturazione
- **Pay-as-you-go**: Paghi solo per VPS attivi
- **Fatturazione oraria**: €0.005-0.02/ora
- **Cancellazione VPS**: Stop costi immediatamente

## 6. Limiti e Quote

### Account Limits (default)
- **VPS simultanei**: 50 (aumentabile su richiesta)
- **CPU cores totali**: 100 
- **RAM totale**: 200GB
- **Storage totale**: 2TB

### Richiesta aumento limiti
Se prevedi molti clienti:
1. Contatta supporto IONOS
2. Spiega il tuo business case
3. Richiedi aumento quote

## 7. Monitoraggio Costi

### Dashboard IONOS
- **Costi real-time**: https://cloud.ionos.com/billing
- **Usage alerts**: Configura notifiche a €100, €500, €1000
- **Budget limits**: Imposta limiti mensili

### Nel tuo sistema
```sql
-- Query per monitorare costi
SELECT 
  DATE_TRUNC('month', created_at) as month,
  provider,
  COUNT(*) as vps_count,
  SUM(monthly_cost) as total_cost,
  AVG(monthly_cost) as avg_cost
FROM client_vps_instances 
WHERE status = 'active'
GROUP BY month, provider
ORDER BY month DESC;
```

## 8. Troubleshooting

### Errori Comuni

**"Unauthorized"**
```bash
# Verifica credenziali
curl -X GET "https://api.ionos.com/cloudapi/v6/datacenters" \
  -H "Authorization: Basic $(echo -n 'username:password' | base64)" \
  -v
```

**"Quota Exceeded"**
- Controlla limiti account in IONOS Console
- Richiedi aumento quote al supporto

**"Datacenter Creation Failed"**
- IONOS potrebbe richiedere verifica account per primi datacenter
- Contatta supporto per accelerare processo

**VPS Setup Timeout**
- Windows può richiedere 10-15 minuti per primo boot
- Script PowerShell esegue installazioni pesanti
- Monitora logs: `C:\setup-log.txt` nel VPS

### Log Debugging

Nel tuo sistema:
```bash
# Logs creazione VPS
grep "IONOS" /var/log/app.log | tail -50

# Logs setup VPS
ssh administrator@VPS_IP "type C:\setup-log.txt"
```

## 9. Backup e Disaster Recovery

### Automatic Snapshots
```javascript
// Crea snapshot automatico dopo setup
await ionosProvider.createSnapshot(serverId, `trading-bot-${userId}-initial`);
```

### VPS Migration
Se IONOS ha problemi, il sistema automaticamente:
1. Crea backup configurazione cliente  
2. Crea nuovo VPS su Vultr/AWS
3. Ripristina configurazione
4. Aggiorna IP nel database

## 10. Sicurezza

### API Keys
- **Mai committare** API keys nel codice
- Usa solo **variabili ambiente**
- **Rota keys** ogni 3-6 mesi

### VPS Access
- Password amministratore generate automaticamente (16 chars)
- Solo porte necessarie aperte (8080 per API)
- Windows Updates automatici disabilitati per stabilità

### Compliance
- **GDPR**: Datacenter IONOS in Germania
- **Data encryption**: Credenziali MT5 criptate in database
- **Access logs**: Tutti gli accessi API loggati

## 11. Performance Optimization

### VPS Locations
```javascript
// Scegli datacenter per latenza
const regions = {
  'eu-central': 'de/fra',  // Germania - Forex Europeo
  'us-east': 'us/ewr',     // USA East - Forex Americano  
  'us-west': 'us/lax'      // USA West - Forex Asiatico
};
```

### Resource Monitoring
- CPU usage < 80%
- RAM usage < 85%  
- Disk I/O monitoring
- Network latency < 50ms verso broker

---

## ✅ Checklist Setup Completo

- [ ] Account IONOS creato e verificato
- [ ] API credentials ottenute
- [ ] Variabili ambiente configurate
- [ ] Test API connection riuscito
- [ ] Test creazione VPS riuscito
- [ ] Monitoring costi configurato
- [ ] Limiti account verificati
- [ ] Sistema backup configurato

**Dopo questo setup, i tuoi clienti avranno VPS automatici in 5-8 minuti!**

## 🚀 Go Live!

Una volta completato tutto:

1. **Deploy il sistema** in produzione
2. **Test end-to-end** con account demo
3. **Onboarding primi 3-5 clienti** beta
4. **Monitor performance** per 48-72 ore
5. **Launch pubblico** con fiducia!

**Costo operativo**: €4-16 per VPS cliente
**Margine**: €25-83 per cliente al mese
**Scalabilità**: Fino a 50+ VPS automatici