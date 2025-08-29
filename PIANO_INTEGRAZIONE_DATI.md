# Piano di Integrazione per Dati Volumetrici e Opzioni 0DTE

## I. Panoramica Strategica e Architetturale

### Executive Summary

Questo piano descrive l'integrazione di dati volumetrici (Volume Profile, VWAP) e dati di opzioni 0DTE (Zero Days To Expiration) in un sistema esistente di segnali di trading basato su AI/ML. L'obiettivo è aumentare l'accuratezza e l'affidabilità dei segnali generati.

L'architettura proposta si basa su due componenti principali:
1.  **Backend Python:** Un nuovo motore di elaborazione dati responsabile dell'acquisizione (ETL), pulizia e analisi dei dati volumetrici e delle opzioni 0DTE.
2.  **Client MQL5 (Expert Advisor):** Un componente intelligente per la piattaforma MetaTrader 5 che consuma i segnali dal backend, esegue calcoli finali (aggiustamento basis) e permette l'esecuzione con un click.

Il flusso è: Fonti Dati EOD/Intraday -> Backend Python (Elaborazione) -> API REST -> EA MQL5 (Consumo, Calcolo, Visualizzazione, Esecuzione).

### Stack Tecnologico

*   **Backend:** Python 3.x (Pandas, NumPy, Scikit-learn, pdfplumber, Flask/FastAPI)
*   **Frontend (Client):** MQL5 (MetaTrader 5 EA, Standard Library per GUI)
*   **Comunicazione:** API RESTful JSON (chiamata da MQL5 con `WebRequest`)

### Considerazioni Critiche

L'utilizzo esclusivo di fonti dati *gratuite* introduce complessità significative. Queste fonti sono spesso non strutturate (PDF), di fine giornata (EOD) o soggette a limiti (API rate-limiting). Ciò richiede la costruzione di una pipeline ETL (Extract, Transform, Load) robusta e difensiva, con gestione errori, caching, persistenza e meccanismi di fallback, trasformando il progetto da una semplice integrazione a una costruzione di infrastruttura dati critica.

## II. Acquisizione Dati e Architettura della Pipeline

### 2.1. Fonti Dati EOD Gratuite

*   **CME Group:** Daily Bulletin PDF (Volume/Open Interest Futures & Options).
    *   *Strategia:* Script Python per download giornaliero + `pdfplumber` per parsing.
*   **CBOE:** U.S. Options Market Volume Summary CSV (Put/Call Ratios Aggregati).
    *   *Strategia:* Script Python con `requests` per download CSV.

### 2.2. Fonti Dati Intraday Gratuite

*   **Sfida:** Dati gratuiti sono limitati.
*   **yfinance:** Non adatta (scraping, limiti severi).
*   **Finnhub API (Raccomandata):** Limite 60 richieste/minuto, dati in tempo reale (azioni/forex/futures?).
    *   *Strategia:* Fonte primaria per catene opzioni 0DTE. Wrapper robusto per rate-limiting/errori.

### 2.3. Architettura Pipeline Dati

1.  **Job Schedulati:** Automazione download CME/CBOE giornaliero.
2.  **Modulo Parsing:** Trasforma PDF/CSS in strutture dati Pandas.
3.  **Pulizia/Archiviazione:** Validazione e salvataggio in DB/file (es. PostgreSQL/Parquet).
4.  **Servizio Polling Intraday:** Interroga Finnhub regolarmente per dati 0DTE.
5.  **Caching:** Memorizza dati recenti per accesso rapido.

*   **Approccio Difensivo:** Logging, allerte, fallback (es. usa dati EOD se intraday fallisce).

## III. Logica di Arricchimento del Segnale nel Backend

### 3.1. Modulo Analisi Volumetrica (Python)

*   **Volume Profile:** Suddivide il range di prezzo in "bin" e somma il volume. Calcola POC, VAH, VAL.
*   **VWAP:** Calcolo standard del prezzo medio ponderato per volume intraday.
*   **HVN/LVN:** Identifica nodi di alto/basso volume dal profilo. Candidati per SL/TP.

### 3.2. Modulo Analisi Opzioni 0DTE (Python)

*   **Gamma Exposure (GEX):** Stima la posizione gamma netta dei market maker da volumi/open interest 0DTE. Identifica livelli di "pinning".
*   **Sentiment 0DTE:** Calcola Put/Call ratio intraday basato su volumi 0DTE.

### 3.3. Integrazione con ML Esistente

*   **Feature Engineering:** Nuove metriche (es. `distance_to_poc`, `net_gex_at_price`, `0dte_pc_ratio`) vengono integrate come input al modello ML.
*   **Ricalibrazione Modello:** Il modello esistente viene riaddestrato con le nuove feature.
*   **SL/TP Dinamici:** I livelli di Stop Loss e Take Profit vengono calcolati algoritmicamente basandosi su HVN/LVN e indicazioni di GEX, rendendo i segnali più contestualizzati e precisi.

## IV. Integrazione con MetaTrader 5 e Protocollo di Esecuzione

### 4.1. Protocollo Comunicazione Backend-Client

*   **API REST:** Il backend espone un endpoint (es. `/get_signal`) che restituisce un payload JSON strutturato.
*   **Implementazione MQL5:** L'EA usa `WebRequest` per interrogare l'API periodicamente.

### 4.2. Elaborazione e Visualizzazione su MT5 (MQL5)

*   **Parsing JSON:** L'EA analizza la risposta JSON ricevuta.
*   **Aggiustamento Basis:** Calcolo differenza tra prezzo Future (nel payload) e CFD (locale) per tracciare livelli accurati.
    *   `Livello_Aggiustato = Livello_Future - (Prezzo_Future - Prezzo_CFD)`
*   **Plotting:** Disegna linee per entry, SL, TP sul grafico usando oggetti MQL5.

### 4.3. Interfaccia Trading One-Click (MQL5)

*   **GUI:** Pannello con `CAppDialog` e controlli (`CLabel`, `CButton`) per visualizzare il segnale e un pulsante "EXECUTE TRADE".
*   **Esecuzione:** Il click sul pulsante attiva `OrderSend()` per eseguire l'ordine con i parametri ricevuti e aggiustati.

*   **Client Pesante:** L'EA ha responsabilità critiche (basis, plotting). Aggiornamenti richiedono redistribuzione del file `.ex5`.

## V. Roadmap di Implementazione e Raccomandazioni

### 5.1. Piano Fasi

1.  **Fase 1 (Sett. 1-4):** Costruire la pipeline dati Python (CME, CBOE, Finnhub).
2.  **Fase 2 (Sett. 5-8):** Sviluppare moduli analitici (Volume, 0DTE) e integrarli con il modello ML.
3.  **Fase 3 (Sett. 9-12):** Sviluppare l'Expert Advisor MQL5 (API, basis, plotting, GUI).
4.  **Fase 4 (Sett. 13-14):** Test end-to-end, correzioni, preparazione al rilascio.

### 5.2. Rischi e Mitigazioni

*   **Rischio 1 (Instabilità Fonti):** Cambiamenti nei formati o accesso.
    *   *Mitigazione:* Monitoraggio, allerte, fallback.
*   **Rischio 2 (Performance):** Parsing/Esecuzione lenti.
    *   *Mitigazione:* Ottimizzazione codice, caching.
*   **Rischio 3 (Basis Impreciso):** Calcolo basato su dati EOD potrebbe essere insufficiente.
    *   *Mitigazione:* Fornire prezzo future quasi real-time dal backend nel payload.

### 5.3. Raccomandazioni Strategiche

*   **Design Difensivo:** Assunto di base: le fonti gratuite sono fragili. Robustezza è obbligatoria.
*   **Modello Dati "Freemium":** Progettare l'accesso ai dati in modo che l'integrazione futura di fonti a pagamento sia semplice (configurazione, non riscrittura).
*   **Logging/Monitoraggio:** Implementare logging completo in ogni componente per facilitare debugging e monitoraggio del sistema distribuito.