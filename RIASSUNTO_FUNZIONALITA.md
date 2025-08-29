# Panoramica dell'Applicazione di Trading

Questo progetto è un'applicazione avanzata di generazione e simulazione di segnali di trading basata su intelligenza artificiale. L'applicazione è scritta in TypeScript ed è strutturata come un monorepo con backend e frontend.

## Funzionalità Principali

1.  **Generazione di Segnali di Trading AI-Driven:**
    *   L'applicazione analizza automaticamente una lista predefinita di strumenti finanziari (forex, indici, materie prime, criptovalute).
    *   Raccoglie i dati di mercato (prezzi, indicatori tecnici) da una fonte esterna (ad esempio, MetaTrader 5 tramite un bridge Python).
    *   Se la connessione alla fonte esterna non è disponibile, utilizza dati simulati.
    *   Applica algoritmi di analisi tecnica avanzata, sentiment analysis e modelli AI/ML per generare previsioni sul futuro andamento del prezzo (LONG/SHORT).
    *   Determina un punto d'ingresso, take profit, stop loss e una dimensione del lotto consigliata.
    *   Assegna una "confidence" (livello di confidenza) al segnale generato.

2.  **Esecuzione e Simulazione Automatica:**
    *   Genera periodicamente segnali automatici (ogni 2 minuti per i test).
    *   Seleziona i segnali con confidence più alta.
    *   Simula l'esecuzione di questi segnali (apertura della posizione).
    *   Simula la chiusura delle posizioni dopo un certo periodo di tempo, calcolando un profitto/perdita realistico basato sulla confidence e sulla strategia.
    *   Registra i risultati di queste "simulazioni di trade" nel database.

3.  **Apprendimento Automatico (Machine Learning):**
    *   Traccia le performance dei segnali generati (se sono stati profittevoli o meno).
    *   Utilizza questo storico per "allenare" un modello ML.
    *   Il modello ML mira ad adattarsi e migliorare nel tempo, aumentando la precisione dei segnali futuri.
    *   Rileva anche schemi di mercato ricorrenti (pattern recognition).

4.  **Analisi e Reporting:**
    *   Tiene traccia di statistiche aggregate come il numero totale di segnali, win rate, profitto/perdita totale, confidenza media.
    *   Genera report giornalieri sulle performance.
    *   Fornisce metriche per valutare l'efficacia del modello ML (accuratezza, precisione, ecc.).

## Componenti Principali

*   **Backend (Encore.dev):**
    *   `analysis`: Servizio principale per la generazione dei segnali e l'analisi dei dati.
    *   `ml`: Servizio dedicato all'apprendimento automatico e al miglioramento del modello.
    *   `scheduler`: Gestisce i processi automatici e le simulazioni programmate.
    *   `user`: Gestisce le configurazioni dell'utente (es. impostazioni MT5).
*   **Frontend (React/Vite):**
    *   Interfaccia utente per visualizzare i segnali, le statistiche, le performance e gestire le impostazioni.

In sintesi, l'applicazione funziona come un "bot di trading" intelligente e auto-adattivo che analizza il mercato, prende decisioni basate su AI/ML, le simula in tempo reale e impara continuamente dai risultati per migliorare le sue performance future.