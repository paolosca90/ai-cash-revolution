import express, { Router } from 'express';
import Stripe from 'stripe';
import { ExternalAPIManager } from '../core/external-apis';

const router = Router();

// Initialize Stripe (only if configured)
let stripe: Stripe | null = null;

try {
  const stripeConfig = ExternalAPIManager.getStripeConfig();
  stripe = new Stripe(stripeConfig.secretKey!, {
    apiVersion: '2023-10-16',
  });
} catch (error) {
  console.warn('⚠️ Stripe not configured. Payment endpoints will return mock data.');
}

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free Plan',
    price: 0,
    priceId: '', // Free plan doesn't need Stripe price ID
    features: ['Basic signals', 'Demo trading']
  },
  basic: {
    name: 'Basic Plan',
    price: 29,
    priceId: 'price_basic_29_eur', // Replace with actual Stripe Price ID
    features: ['Advanced signals', 'Live trading', 'Basic analytics']
  },
  premium: {
    name: 'Premium Plan',
    price: 59,
    priceId: 'price_premium_59_eur', // Replace with actual Stripe Price ID
    features: ['All signals', 'Advanced analytics', 'ML predictions', 'Priority support']
  },
  enterprise: {
    name: 'Enterprise Plan',
    price: 119,
    priceId: 'price_enterprise_119_eur', // Replace with actual Stripe Price ID
    features: ['Custom strategies', 'API access', 'White-label', 'Dedicated support']
  }
};

// Types for payment requests
interface CreatePaymentIntentRequest {
  userId: number;
  plan: keyof typeof SUBSCRIPTION_PLANS;
  paymentMethodId: string;
  billingCycle: 'monthly' | 'yearly';
}

interface CreatePaymentIntentResponse {
  success: boolean;
  clientSecret?: string;
  subscriptionId?: string;
  error?: string;
}

// POST /payments/create-intent - Create payment intent for subscription
router.post('/create-intent', async (req, res) => {
  try {
    const { userId, plan, paymentMethodId, billingCycle }: CreatePaymentIntentRequest = req.body;

    // Validate request
    if (!userId || !plan || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, plan, paymentMethodId'
      });
    }

    if (!SUBSCRIPTION_PLANS[plan]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid subscription plan'
      });
    }

    // Handle free plan
    if (plan === 'free') {
      return res.json({
        success: true,
        message: 'Free plan activated successfully'
      });
    }

    // If Stripe is not configured, return mock response
    if (!stripe) {
      console.log(`Mock: Creating ${plan} subscription for user ${userId}`);
      return res.json({
        success: true,
        clientSecret: 'mock_client_secret',
        subscriptionId: 'mock_sub_' + Date.now(),
        message: 'Mock payment intent created (Stripe not configured)'
      });
    }

    const selectedPlan = SUBSCRIPTION_PLANS[plan];
    
    console.log(`Creating ${plan} subscription for user ${userId}`);

    // Create Stripe customer
    const customer = await stripe.customers.create({
      metadata: {
        userId: userId.toString(),
        plan: plan,
        billingCycle: billingCycle
      }
    });

    console.log(`✅ Stripe customer created: ${customer.id}`);

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });

    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        price: selectedPlan.priceId,
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    console.log(`✅ Stripe subscription created: ${subscription.id}`);

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    const response: CreatePaymentIntentResponse = {
      success: true,
      clientSecret: paymentIntent.client_secret!,
      subscriptionId: subscription.id
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment intent',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /payments/plans - Get available subscription plans
router.get('/plans', (req, res) => {
  try {
    const plans = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
      id: key,
      name: plan.name,
      price: plan.price,
      features: plan.features,
      popular: key === 'premium' // Mark premium as popular
    }));

    res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('❌ Error fetching plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription plans'
    });
  }
});

// POST /payments/webhook - Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!stripe) {
      return res.status(400).json({ error: 'Stripe not configured' });
    }

    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    console.log(`🔔 Received Stripe webhook: ${event.type}`);

    // Handle different event types
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

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Webhook event handlers
async function handleSuccessfulPayment(invoice: Stripe.Invoice) {
  try {
    console.log(`✅ Payment successful for invoice: ${invoice.id}`);
    
    if (stripe) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
      
      console.log(`Payment successful for customer: ${customer.metadata?.userId}`);
      
      // Here you would update your database to activate the subscription
      // Example: Update user subscription status, extend billing period, etc.
    }
  } catch (error) {
    console.error('❌ Error handling successful payment:', error);
  }
}

async function handleFailedPayment(invoice: Stripe.Invoice) {
  try {
    console.log(`❌ Payment failed for invoice: ${invoice.id}`);
    
    if (stripe) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
      
      console.log(`Payment failed for customer: ${customer.metadata?.userId}`);
      
      // Here you would handle payment failure
      // Example: Send notification, retry payment, downgrade plan, etc.
    }
  } catch (error) {
    console.error('❌ Error handling failed payment:', error);
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  try {
    console.log(`🚫 Subscription canceled: ${subscription.id}`);
    
    if (stripe) {
      const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
      
      console.log(`Subscription canceled for customer: ${customer.metadata?.userId}`);
      
      // Here you would handle subscription cancellation
      // Example: Downgrade to free plan, disable premium features, etc.
    }
  } catch (error) {
    console.error('❌ Error handling subscription cancellation:', error);
  }
}

export default router;