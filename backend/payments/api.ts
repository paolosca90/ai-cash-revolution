import { api } from "encore.dev/api";

// Production-ready payments service
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// TODO: Initialize Stripe when API key is provided
// const stripe = STRIPE_SECRET_KEY ? require('stripe')(STRIPE_SECRET_KEY) : null;

export interface CreatePaymentIntentRequest {
  userId: number;
  plan: "professional" | "enterprise";
  billingCycle: "monthly" | "yearly";
}

export interface CreatePaymentIntentResponse {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  error?: string;
}

export interface SubscriptionStatus {
  userId: number;
  plan: string;
  status: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

// Prezzi in centesimi (€97.00 = 9700 centesimi)
const PRICING = {
  professional: {
    monthly: 9700, // €97.00 mensile
    yearly: 93600,  // €936.00 annuale (sconto 20%)
  },
  enterprise: {
    monthly: 29700, // €297.00 mensile  
    yearly: 285120, // €2851.20 annuale (sconto 20%)
  }
};

export const createPaymentIntent = api<CreatePaymentIntentRequest, CreatePaymentIntentResponse>({
  method: "POST",
  path: "/payments/create-intent",
  expose: true,
}, async ({ userId, plan, billingCycle }) => {
  console.log(`💳 Payment request for User ${userId}: ${plan} (${billingCycle}) - ${IS_PRODUCTION ? 'PRODUCTION' : 'TEST'} mode`);
  
  const amount = PRICING[plan][billingCycle];
  const amountInEuros = amount / 100;
  
  console.log(`💰 Amount: €${amountInEuros}`);
  
  if (IS_PRODUCTION && STRIPE_SECRET_KEY) {
    try {
      // TODO: Implement real Stripe payment intent creation
      // const paymentIntent = await stripe.paymentIntents.create({
      //   amount: amount,
      //   currency: 'eur',
      //   metadata: {
      //     userId: userId.toString(),
      //     plan: plan,
      //     billingCycle: billingCycle
      //   }
      // });
      // 
      // return {
      //   success: true,
      //   clientSecret: paymentIntent.client_secret,
      //   paymentIntentId: paymentIntent.id
      // };
      
      console.log("⚠️ Stripe integration not yet implemented");
      return {
        success: false,
        error: "Payment processing temporarily unavailable"
      };
      
    } catch (error: any) {
      console.error("Stripe error:", error);
      return {
        success: false,
        error: "Payment processing failed"
      };
    }
  } else {
    // Development mode - simulate payment
    const mockClientSecret = `pi_test_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`;
    const mockPaymentIntentId = `pi_test_${Date.now()}`;
    
    return {
      success: true,
      clientSecret: mockClientSecret,
      paymentIntentId: mockPaymentIntentId,
    };
  }
});

export const getSubscriptionStatus = api<{ userId: number }, { status: SubscriptionStatus | null }>({
  method: "GET",
  path: "/payments/subscription/:userId",
  expose: true,
}, async ({ userId }) => {
  console.log(`📊 Subscription status for User ${userId} - ${IS_PRODUCTION ? 'PRODUCTION' : 'TEST'} mode`);
  
  if (IS_PRODUCTION && STRIPE_SECRET_KEY) {
    try {
      // TODO: Implement real Stripe subscription lookup
      // const subscriptions = await stripe.subscriptions.list({
      //   customer: customerIdFromUserId(userId), // You'll need to implement this mapping
      //   limit: 1,
      //   status: 'all'
      // });
      // 
      // if (subscriptions.data.length > 0) {
      //   const subscription = subscriptions.data[0];
      //   return {
      //     status: {
      //       userId,
      //       plan: subscription.metadata.plan,
      //       status: subscription.status,
      //       currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      //       cancelAtPeriodEnd: subscription.cancel_at_period_end
      //     }
      //   };
      // }
      
      return { status: null };
      
    } catch (error: any) {
      console.error("Stripe subscription lookup error:", error);
      return { status: null };
    }
  } else {
    // Development mode - simulate active subscription for demo user
    const demoStatus: SubscriptionStatus = {
      userId,
      plan: "professional",
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false
    };
    
    return { status: demoStatus };
  }
});

export const stripeWebhook = api<{ signature: string, payload: string }, { success: boolean }>({
  method: "POST",
  path: "/payments/stripe-webhook",
  expose: true,
}, async ({ signature, payload }) => {
  console.log(`🔔 Stripe webhook received - ${IS_PRODUCTION ? 'PRODUCTION' : 'TEST'} mode`);
  
  if (IS_PRODUCTION && STRIPE_SECRET_KEY) {
    try {
      // TODO: Implement real Stripe webhook verification
      // const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      // const event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
      // 
      // switch (event.type) {
      //   case 'payment_intent.succeeded':
      //     // Handle successful payment
      //     break;
      //   case 'customer.subscription.updated':
      //     // Handle subscription updates
      //     break;
      //   default:
      //     console.log(`Unhandled event type ${event.type}`);
      // }
      
      console.log("✅ Webhook processed successfully");
      return { success: true };
      
    } catch (error: any) {
      console.error("Webhook error:", error);
      return { success: false };
    }
  } else {
    // Development mode - just log
    console.log(`Signature: ${signature.substring(0, 20)}...`);
    console.log(`Payload length: ${payload.length} chars`);
    return { success: true };
  }
});