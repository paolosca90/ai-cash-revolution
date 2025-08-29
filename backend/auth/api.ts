// ========================================
// 🔐 SERVIZIO AUTENTICAZIONE - API ENCORE
// ========================================
// Questo servizio gestisce registrazione, login e profili utenti
// Utilizza JWT per l'autenticazione e bcrypt per l'hashing delle password

// Importazioni Encore e librerie di sicurezza
import { api } from "encore.dev/api";           // Framework API di Encore
import * as bcrypt from "bcrypt";               // Hashing sicuro delle password
import * as jwt from "jsonwebtoken";            // JSON Web Tokens per autenticazione

// ========================================
// 🔑 CONFIGURAZIONE SICUREZZA
// ========================================
// Chiave segreta per firmare i JWT (DEVE essere cambiata in produzione!)
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-in-production";

// Flag per distinguere ambiente di sviluppo da produzione
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ========================================
// 💾 DATABASE TEMPORANEO (SOLO PER SVILUPPO)
// ========================================
// ATTENZIONE: In produzione questo dovrebbe essere sostituito con un database vero
// come PostgreSQL, MySQL, etc. Per ora usiamo memoria per semplicità

const users: any[] = [
  {
    id: 1,                                              // ID utente univoco
    email: "demo@aitradingrevolution.com",             // Email di login
    firstName: "Demo",                                  // Nome utente
    lastName: "User",                                   // Cognome utente
    password: "$2b$10$dummy.hash.for.demo123",         // Password hashata (demo: "demo123")
    plan: "professional"                                // Piano sottoscritto
  }
];

// Contatore per generare ID utenti unici
let nextUserId = 2;

// ========================================
// 📋 INTERFACCE API - DEFINIZIONI DATI
// ========================================

// ===== REGISTRAZIONE NUOVO UTENTE =====
export interface RegisterRequest {
  // Dati personali
  firstName: string;                                      // Nome dell'utente
  lastName: string;                                       // Cognome dell'utente
  email: string;                                          // Email (usata per il login)
  password: string;                                       // Password in chiaro (verrà hashata)
  phone?: string;                                         // Telefono (opzionale)
  
  // Piano e fatturazione
  plan: "free-trial" | "professional" | "enterprise";    // Piano sottoscritto
  billingCycle?: "monthly" | "yearly";                   // Ciclo di fatturazione (opzionale)
  
  // Configurazione MetaTrader 5 (piattaforma di trading)
  mt5Login: string;                                       // Login account MT5
  mt5Server: string;                                      // Server MT5 del broker
  brokerName: string;                                     // Nome del broker
  accountType: "demo" | "live";                           // Tipo account (demo o reale)
  mt5Password: string;                                    // Password account MT5
}

// ===== RISPOSTA REGISTRAZIONE =====
export interface RegisterResponse {
  success: boolean;                                       // Successo della registrazione
  userId?: number;                                        // ID utente creato (se successo)
  installerToken?: string;                                // Token per installazione software
  error?: string;                                         // Messaggio di errore (se fallita)
}

// ===== RICHIESTA LOGIN =====
export interface LoginRequest {
  email: string;                                          // Email dell'utente
  password: string;                                       // Password in chiaro
}

// ===== RISPOSTA LOGIN =====
export interface LoginResponse {
  success: boolean;                                       // Successo del login
  token?: string;                                         // Token JWT per autenticazione
  user?: any;                                             // Dati utente (se successo)
  error?: string;                                         // Messaggio di errore (se fallito)
}

// ========================================
// 📝 API ENDPOINT: REGISTRAZIONE UTENTE
// ========================================
// POST /auth/register
// Registra un nuovo utente nel sistema
export const register = api<RegisterRequest, RegisterResponse>({
  method: "POST",                         // Metodo HTTP
  path: "/auth/register",                 // Percorso API
  expose: true,                           // Endpoint pubblico (accessibile senza autenticazione)
}, async (req) => {
  console.log(`📝 Richiesta registrazione per: ${req.email} (modalità ${IS_PRODUCTION ? 'PRODUZIONE' : 'TEST'})`);
  
  try {
    // ===== FASE 1: CONTROLLO UTENTE ESISTENTE =====
    // Verifichiamo se esiste già un utente con questa email
    const existingUser = users.find(u => u.email === req.email);
    if (existingUser) {
      return {
        success: false,
        error: "Utente già esistente con questa email"
      };
    }
    
    // ===== FASE 2: HASHING SICURO DELLA PASSWORD =====
    // In produzione usiamo bcrypt (sicuro), in sviluppo un hash semplice
    const hashedPassword = IS_PRODUCTION ? 
      await bcrypt.hash(req.password, 10) :        // Hash sicuro con bcrypt (10 rounds)
      `hashed_${req.password}`;                     // Hash semplice per sviluppo
    
    // ===== FASE 3: CREAZIONE NUOVO UTENTE =====
    // Creiamo l'oggetto utente con tutti i dati forniti
    const newUser = {
      id: nextUserId++,                    // ID autoincrementale
      email: req.email,                    // Email per il login
      firstName: req.firstName,            // Nome
      lastName: req.lastName,              // Cognome
      password: hashedPassword,            // Password hashata (SICURA!)
      phone: req.phone,                    // Telefono (opzionale)
      plan: req.plan,                      // Piano sottoscritto
      billingCycle: req.billingCycle,      // Ciclo fatturazione
      mt5Login: req.mt5Login,              // Login MetaTrader 5
      mt5Server: req.mt5Server,            // Server MT5
      brokerName: req.brokerName,          // Nome broker
      accountType: req.accountType,        // Tipo account (demo/live)
      createdAt: new Date()                // Data creazione
    };
    
    // ===== FASE 4: SALVATAGGIO NEL DATABASE =====
    // Aggiungiamo il nuovo utente al nostro "database" temporaneo
    users.push(newUser);
    
    // ===== FASE 5: GENERAZIONE TOKEN INSTALLER =====
    // Token per scaricare/installare il software di trading
    const installerToken = `installer_${newUser.id}_${Date.now()}`;
    
    console.log(`✅ Utente registrato con successo: ID ${newUser.id}`);
    
    // ===== FASE 6: RISPOSTA DI SUCCESSO =====
    return {
      success: true,
      userId: newUser.id,
      installerToken: installerToken
    };
    
  } catch (error: any) {
    // ===== GESTIONE ERRORI =====
    console.error("Errore registrazione:", error);
    return {
      success: false,
      error: "Registrazione fallita: " + error.message
    };
  }
});

// ========================================
// 🔐 API ENDPOINT: LOGIN UTENTE
// ========================================
// POST /auth/login
// Autentica un utente e restituisce un token JWT
export const login = api<LoginRequest, LoginResponse>({
  method: "POST",                         // Metodo HTTP
  path: "/auth/login",                    // Percorso API
  expose: true,                           // Endpoint pubblico
}, async (req) => {
  console.log(`🔐 Tentativo login per: ${req.email} (modalità ${IS_PRODUCTION ? 'PRODUZIONE' : 'TEST'})`);
  
  try {
    // ===== FASE 1: RICERCA UTENTE =====
    // Cerchiamo l'utente nel nostro database usando l'email
    const user = users.find(u => u.email === req.email);
    if (!user) {
      return {
        success: false,
        error: "Credenziali non valide"          // Non specifichiamo se email o password è sbagliata (sicurezza)
      };
    }
    
    // ===== FASE 2: VERIFICA PASSWORD =====
    // Confrontiamo la password fornita con quella hashata salvata
    let passwordValid = false;
    
    if (IS_PRODUCTION) {
      // In produzione usiamo bcrypt.compare (sicuro)
      passwordValid = await bcrypt.compare(req.password, user.password);
    } else {
      // In sviluppo usiamo confronto semplice + account demo
      passwordValid = (req.email === "demo@aitradingrevolution.com" && req.password === "demo123") || 
                     user.password === `hashed_${req.password}`;
    }
    
    if (!passwordValid) {
      return {
        success: false,
        error: "Credenziali non valide"          // Stesso messaggio per non dare indizi
      };
    }
    
    // ===== FASE 3: GENERAZIONE TOKEN JWT =====
    // Creiamo un token JWT che l'utente userà per autenticarsi nelle prossime richieste
    const token = jwt.sign(
      { userId: user.id, email: user.email },   // Payload del token (dati utente)
      JWT_SECRET,                               // Chiave segreta per firmare
      { expiresIn: '24h' }                      // Token valido per 24 ore
    );
    
    console.log(`✅ Login riuscito per utente ${user.id}`);
    
    // ===== FASE 4: RISPOSTA DI SUCCESSO =====
    return {
      success: true,
      token: token,                             // Token JWT per autenticazione
      user: {                                   // Dati utente (SENZA password!)
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        plan: user.plan
      }
    };
    
  } catch (error: any) {
    // ===== GESTIONE ERRORI =====
    console.error("Errore login:", error);
    return {
      success: false,
      error: "Login fallito: " + error.message
    };
  }
});

// ========================================
// 👤 API ENDPOINT: PROFILO UTENTE
// ========================================
// GET /auth/profile/:userId
// Restituisce il profilo completo di un utente (senza password)
export const getProfile = api<{ userId: number }, { user: any }>(
{
  method: "GET",                          // Metodo HTTP
  path: "/auth/profile/:userId",          // Percorso con parametro dinamico userId
  expose: true,                           // Endpoint pubblico (ma dovrebbe essere protetto!)
}, async ({ userId }) => {
  // ===== FASE 1: RICERCA UTENTE =====
  // Cerchiamo l'utente tramite il suo ID univoco
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    throw new Error("Utente non trovato");
  }
  
  // ===== FASE 2: RIMOZIONE DATI SENSIBILI =====
  // Rimuoviamo la password dall'oggetto utente prima di restituirlo
  // Usiamo destructuring per separare password dal resto
  const { password, ...userProfile } = user;
  
  // ===== FASE 3: RISPOSTA CON PROFILO SICURO =====
  return {
    user: userProfile                     // Profilo utente completo SENZA password
  };
});