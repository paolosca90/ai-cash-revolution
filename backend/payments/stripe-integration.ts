// Integrazione Stripe per pagamenti automatici
import express from 'express';
import Stripe from 'stripe';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Inizializza Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

interface PaymentRequest {
  email: string;
  full_name: string;
  phone?: string;
  password: string;
  plan_id: 'basic' | 'premium' | 'enterprise';
  mt5_config: {
    login: string;
    password: string;
    server: string;
    broker: string;
  };
  payment_method_id: string; // Stripe Payment Method ID dal frontend
}

const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Basic Plan',
    price: 29,
    price_id: 'price_basic_29_eur', // Stripe Price ID
    features: ['Trading automatico 24/7', 'VPS dedicato', '3 simboli', 'Supporto email']
  },
  premium: {
    name: 'Premium Plan',
    price: 59,
    price_id: 'price_premium_59_eur', // Stripe Price ID
    features: ['Trading automatico 24/7', 'VPS dedicato', '10 simboli', 'Supporto prioritario', 'Strategie avanzate']
  },
  enterprise: {
    name: 'Enterprise Plan',
    price: 119,
    price_id: 'price_enterprise_119_eur', // Stripe Price ID
    features: ['Trading automatico 24/7', 'VPS dedicato', 'Simboli illimitati', 'Supporto telefonico', 'API completa']
  }
};

// Crea abbonamento con pagamento immediato
router.post('/create-subscription', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const paymentRequest: PaymentRequest = req.body;
    const selectedPlan = SUBSCRIPTION_PLANS[paymentRequest.plan_id];
    
    if (!selectedPlan) {
      throw new Error('Piano di abbonamento non valido');
    }

    console.log(`💳 Processando abbonamento ${selectedPlan.name} per ${paymentRequest.email}...`);

    // 1. Verifica email non esistente
    const existingUser = await client.query('SELECT id FROM clients WHERE email = $1', [paymentRequest.email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email già registrata' });
    }

    // 2. Crea customer Stripe
    const customer = await stripe.customers.create({
      email: paymentRequest.email,
      name: paymentRequest.full_name,
      phone: paymentRequest.phone,
      metadata: {
        plan_id: paymentRequest.plan_id,
        mt5_login: paymentRequest.mt5_config.login
      }
    });

    console.log(`✅ Cliente Stripe creato: ${customer.id}`);

    // 3. Allega payment method al customer
    await stripe.paymentMethods.attach(paymentRequest.payment_method_id, {
      customer: customer.id,
    });

    // 4. Imposta come default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentRequest.payment_method_id,
      },
    });

    // 5. Crea abbonamento ricorrente
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        price: selectedPlan.price_id,
      }],
      default_payment_method: paymentRequest.payment_method_id,
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        plan_id: paymentRequest.plan_id,
        user_email: paymentRequest.email
      }
    });

    console.log(`✅ Abbonamento Stripe creato: ${subscription.id}`);

    // 6. Verifica che il primo pagamento sia andato a buon fine
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Pagamento fallito: ${paymentIntent.status}`);
    }

    console.log(`✅ Primo pagamento riuscito: €${selectedPlan.price}`);

    // 7. Crea utente nel database
    const passwordHash = await bcrypt.hash(paymentRequest.password, 10);
    const subscriptionExpires = new Date();
    subscriptionExpires.setMonth(subscriptionExpires.getMonth() + 1);

    const newUser = await client.query(`
      INSERT INTO clients (
        email, password_hash, full_name, phone, subscription_type, 
        subscription_expires, max_concurrent_trades, max_lot_size, 
        allowed_symbols, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
      RETURNING id, email, created_at
    `, [
      paymentRequest.email, passwordHash, paymentRequest.full_name, paymentRequest.phone,
      paymentRequest.plan_id, subscriptionExpires,
      selectedPlan.name === 'Basic Plan' ? 3 : selectedPlan.name === 'Premium Plan' ? 10 : -1,
      0.1, 
      selectedPlan.name === 'Basic Plan' ? ['EURUSD', 'GBPUSD', 'USDJPY'] : null
    ]);

    const userId = newUser.rows[0].id;

    // 8. Salva payment record
    await client.query(`
      INSERT INTO client_payments (
        client_id, payment_id, amount, currency, status, 
        payment_method, subscription_period_start, subscription_period_end, 
        created_at, processed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      userId, paymentIntent.id, selectedPlan.price, 'EUR', 'paid',
      'card', new Date(), subscriptionExpires
    ]);

    // 9. Crea VPS automaticamente (importa la funzione dal subscription manager)
    console.log(`🚀 Creando VPS per utente ${userId}...`);
    
    // Import dinamico per evitare dipendenze circolari
    const { createVPS } = await import('../subscription/subscription-manager');
    
    const vpsResult = await createVPS(userId, paymentRequest.email, paymentRequest.plan_id, paymentRequest.mt5_config);
    
    if (!vpsResult.success) {
      console.error('VPS creation failed, but payment succeeded - will retry later');
      // Non blocchiamo l'abbonamento se VPS fallisce, lo ricreeremo dopo
    }

    // 10. Salva configurazione MT5
    const encryptedMT5Password = encrypt(paymentRequest.mt5_config.password);
    
    await client.query(`
      INSERT INTO client_mt5_configs (
        client_id, config_name, mt5_host, mt5_port,
        mt5_login, mt5_password_encrypted, mt5_server, mt5_broker,
        default_lot_size, auto_trading_enabled, connection_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10)
    `, [
      userId, 'VPS Auto Config', vpsResult.ip_address || 'pending', 8080,
      paymentRequest.mt5_config.login, encryptedMT5Password, 
      paymentRequest.mt5_config.server, paymentRequest.mt5_config.broker,
      0.01, vpsResult.success ? 'provisioning' : 'pending'
    ]);

    // 11. Log attività
    await client.query(`
      INSERT INTO client_activity_logs (client_id, activity_type, description, metadata)
      VALUES ($1, $2, $3, $4)
    `, [userId, 'subscription_created', `Abbonamento ${selectedPlan.name} creato con pagamento Stripe`, JSON.stringify({
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      stripe_payment_intent_id: paymentIntent.id,
      plan_id: paymentRequest.plan_id,
      amount: selectedPlan.price,
      vps_created: vpsResult.success
    })]);

    await client.query('COMMIT');

    // 12. Risposta successo
    res.json({
      success: true,
      message: 'Abbonamento attivato con successo!',
      user: {
        id: userId,
        email: paymentRequest.email,
        plan: selectedPlan.name,
        subscription_expires: subscriptionExpires
      },
      payment: {
        amount: selectedPlan.price,
        currency: 'EUR',
        status: 'paid',
        stripe_payment_id: paymentIntent.id
      },
      vps: vpsResult.success ? {
        ip_address: vpsResult.ip_address,
        status: 'provisioning',
        estimated_ready: '10-15 minuti'
      } : {
        status: 'will_retry',
        message: 'VPS sarà creato a breve'
      },
      subscription: {
        stripe_subscription_id: subscription.id,
        next_payment_date: new Date(subscription.current_period_end * 1000)
      }
    });

    // 13. Invia email di benvenuto (asincrono)
    sendWelcomeEmail(paymentRequest.email, paymentRequest.full_name, {
      plan: selectedPlan.name,
      vps_ip: vpsResult.ip_address,
      login_url: `https://${req.get('host')}/dashboard`
    }).catch(console.error);

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Subscription creation error:', error);
    
    res.status(400).json({
      success: false,
      error: error.message || 'Errore durante la creazione dell\'abbonamento'
    });
  } finally {
    client.release();
  }
});

// Webhook Stripe per gestire eventi automatici
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📨 Webhook ricevuto: ${event.type}`);

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handleSuccessfulPayment(event.data.object as Stripe.Invoice);
        break;
        
      case 'invoice.payment_failed':
        await handleFailedPayment(event.data.object as Stripe.Invoice);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`Error processing webhook: ${error}`);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }

  res.json({ received: true });
});

// Gestisci pagamento riuscito (rinnovo mensile)
async function handleSuccessfulPayment(invoice: Stripe.Invoice) {
  try {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
    
    console.log(`✅ Pagamento riuscito per ${customer.email}: €${(invoice.amount_paid / 100).toFixed(2)}`);
    
    // Aggiorna database - estendi abbonamento
    const newExpiryDate = new Date(subscription.current_period_end * 1000);
    
    await pool.query(`
      UPDATE clients 
      SET subscription_expires = $1, updated_at = CURRENT_TIMESTAMP
      WHERE email = $2
    `, [newExpiryDate, customer.email]);
    
    // Salva payment record
    const userResult = await pool.query('SELECT id FROM clients WHERE email = $1', [customer.email]);
    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;
      
      await pool.query(`
        INSERT INTO client_payments (
          client_id, payment_id, amount, currency, status,
          payment_method, subscription_period_start, subscription_period_end,
          created_at, processed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        userId, invoice.payment_intent, invoice.amount_paid / 100, 'EUR', 'paid',
        'card', new Date(subscription.current_period_start * 1000), newExpiryDate
      ]);
      
      // Log activity
      await pool.query(`
        INSERT INTO client_activity_logs (client_id, activity_type, description, metadata)
        VALUES ($1, $2, $3, $4)
      `, [userId, 'payment_succeeded', `Pagamento mensile riuscito: €${(invoice.amount_paid / 100).toFixed(2)}`, JSON.stringify({
        invoice_id: invoice.id,
        amount: invoice.amount_paid / 100,
        period_end: newExpiryDate
      })]);
    }
    
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

// Gestisci pagamento fallito
async function handleFailedPayment(invoice: Stripe.Invoice) {
  try {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
    
    console.log(`❌ Pagamento fallito per ${customer.email}`);
    
    // Log nel database
    const userResult = await pool.query('SELECT id FROM clients WHERE email = $1', [customer.email]);
    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;
      
      await pool.query(`
        INSERT INTO client_activity_logs (client_id, activity_type, description, metadata)
        VALUES ($1, $2, $3, $4)
      `, [userId, 'payment_failed', 'Pagamento mensile fallito', JSON.stringify({
        invoice_id: invoice.id,
        amount: invoice.amount_due / 100
      })]);
      
      // Se falliscono 3 pagamenti, disattiva servizi (Stripe già gestisce questo)
      // Ma possiamo fermare il VPS per risparmiare costi
    }
    
    // Invia email di notifica
    // sendPaymentFailedEmail(customer.email, customer.name);
    
  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}

// Gestisci cancellazione abbonamento
async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
    
    console.log(`❌ Abbonamento cancellato per ${customer.email}`);
    
    // Disattiva utente nel database
    await pool.query(`
      UPDATE clients 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE email = $1
    `, [customer.email]);
    
    // TODO: Fermare e eliminare VPS per risparmiare costi
    // const vpsResult = await stopUserVPS(customer.email);
    
  } catch (error) {
    console.error('Error handling subscription canceled:', error);
  }
}

// Helper functions
function encrypt(text: string): string {
  const crypto = require('crypto');
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY!);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

async function sendWelcomeEmail(email: string, name: string, data: any) {
  console.log(`📧 Sending welcome email to ${email}`);
  // TODO: Implementare con SendGrid
}

export default router;