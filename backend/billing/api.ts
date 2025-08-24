import { api, APIError } from "encore.dev/api";
import { billingDB } from "./db";
import { stripe, PLANS, getPlanPricing } from "./stripe-client";
import Stripe from "stripe";

// Types
export interface Subscription {
  id: number;
  userId: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan: string;
  status: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: number;
  userId: number;
  stripePaymentMethodId: string;
  type: string;
  brand?: string;
  lastFour?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: number;
  userId: number;
  stripeInvoiceId: string;
  subscriptionId?: number;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: string;
  periodStart?: Date;
  periodEnd?: Date;
  dueDate?: Date;
  paidAt?: Date;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanDetails {
  id: string;
  name: string;
  description: string;
  features: string[];
  pricing: {
    monthly?: number;
    yearly?: number;
  };
  limits: {
    mt5Configs: number;
    apiCallsPerMonth: number;
    supportLevel: string;
  };
}

// Get available plans with pricing
export const getPlans = api<void, { plans: PlanDetails[] }>({
  method: "GET",
  path: "/billing/plans",
  expose: true,
}, async () => {
  const plans: PlanDetails[] = [];
  
  for (const [planId, planConfig] of Object.entries(PLANS)) {
    const pricing = await getPlanPricing(planId);
    
    plans.push({
      id: planConfig.id,
      name: planConfig.name,
      description: planConfig.description,
      features: planConfig.features,
      pricing: pricing || {},
      limits: planConfig.limits
    });
  }

  return { plans };
});

// Get user's subscription details
export const getSubscription = api<{ userId: number }, { subscription: Subscription | null }>({
  method: "GET",
  path: "/billing/subscription/:userId",
  expose: true,
}, async ({ userId }) => {
  const result = await billingDB.query(`
    SELECT * FROM subscriptions WHERE user_id = $1
  `, [userId]);

  if (result.rows.length === 0) {
    return { subscription: null };
  }

  const row = result.rows[0];
  const subscription: Subscription = {
    id: row.id,
    userId: row.user_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    plan: row.plan,
    status: row.status,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    trialStart: row.trial_start,
    trialEnd: row.trial_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  return { subscription };
});

// Create Stripe customer and setup intent for payment
export const createSetupIntent = api<{ userId: number; email: string }, { clientSecret: string; customerId: string }>({
  method: "POST",
  path: "/billing/setup-intent",
  expose: true,
}, async ({ userId, email }) => {
  try {
    // Check if customer already exists
    let customer: Stripe.Customer;
    const existingSubscription = await getSubscription({ userId });
    
    if (existingSubscription.subscription?.stripeCustomerId) {
      customer = await stripe.customers.retrieve(existingSubscription.subscription.stripeCustomerId) as Stripe.Customer;
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email,
        metadata: {
          userId: userId.toString(),
        },
      });

      // Update subscription with customer ID
      await billingDB.query(`
        INSERT INTO subscriptions (user_id, stripe_customer_id, plan, status)
        VALUES ($1, $2, 'free', 'active')
        ON CONFLICT (user_id) 
        DO UPDATE SET stripe_customer_id = $2, updated_at = CURRENT_TIMESTAMP
      `, [userId, customer.id]);
    }

    // Create setup intent for saving payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      usage: 'off_session',
    });

    if (!setupIntent.client_secret) {
      throw new APIError("SETUP_INTENT_ERROR", "Failed to create setup intent");
    }

    return {
      clientSecret: setupIntent.client_secret,
      customerId: customer.id,
    };
  } catch (error) {
    console.error("Error creating setup intent:", error);
    throw new APIError("SETUP_INTENT_ERROR", "Failed to create setup intent");
  }
});

// Create subscription
export const createSubscription = api<{
  userId: number;
  priceId: string;
  paymentMethodId?: string;
  trialDays?: number;
}, { subscription: any; clientSecret?: string }>({
  method: "POST", 
  path: "/billing/subscription/create",
  expose: true,
}, async ({ userId, priceId, paymentMethodId, trialDays }) => {
  try {
    const userSubscription = await getSubscription({ userId });
    
    if (!userSubscription.subscription?.stripeCustomerId) {
      throw new APIError("NO_CUSTOMER", "No Stripe customer found for user");
    }

    const customerId = userSubscription.subscription.stripeCustomerId;

    // Set default payment method if provided
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Create subscription
    const subscriptionData: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    };

    if (trialDays && trialDays > 0) {
      subscriptionData.trial_period_days = trialDays;
    }

    const subscription = await stripe.subscriptions.create(subscriptionData);

    // Update our database
    const planId = getPlanIdFromPriceId(priceId);
    await billingDB.query(`
      UPDATE subscriptions 
      SET stripe_subscription_id = $1, 
          plan = $2, 
          status = $3,
          current_period_start = $4,
          current_period_end = $5,
          trial_start = $6,
          trial_end = $7,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $8
    `, [
      subscription.id,
      planId,
      subscription.status,
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000),
      subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      userId
    ]);

    // Extract client secret for payment confirmation if needed
    let clientSecret;
    if (subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
      const invoice = subscription.latest_invoice as Stripe.Invoice;
      if (invoice.payment_intent && typeof invoice.payment_intent === 'object') {
        const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
        clientSecret = paymentIntent.client_secret;
      }
    }

    return { subscription, clientSecret };
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw new APIError("SUBSCRIPTION_ERROR", "Failed to create subscription");
  }
});

// Update subscription (upgrade/downgrade)
export const updateSubscription = api<{
  userId: number;
  newPriceId: string;
  prorationBehavior?: "create_prorations" | "none";
}, { subscription: any }>({
  method: "POST",
  path: "/billing/subscription/update", 
  expose: true,
}, async ({ userId, newPriceId, prorationBehavior = "create_prorations" }) => {
  try {
    const userSubscription = await getSubscription({ userId });
    
    if (!userSubscription.subscription?.stripeSubscriptionId) {
      throw new APIError("NO_SUBSCRIPTION", "No active subscription found");
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(userSubscription.subscription.stripeSubscriptionId);
    
    // Update subscription
    const updatedSubscription = await stripe.subscriptions.update(stripeSubscription.id, {
      items: [{
        id: stripeSubscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: prorationBehavior,
    });

    // Update our database
    const planId = getPlanIdFromPriceId(newPriceId);
    await billingDB.query(`
      UPDATE subscriptions 
      SET plan = $1,
          status = $2,
          current_period_start = $3,
          current_period_end = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $5
    `, [
      planId,
      updatedSubscription.status,
      new Date(updatedSubscription.current_period_start * 1000),
      new Date(updatedSubscription.current_period_end * 1000),
      userId
    ]);

    return { subscription: updatedSubscription };
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw new APIError("SUBSCRIPTION_UPDATE_ERROR", "Failed to update subscription");
  }
});

// Cancel subscription
export const cancelSubscription = api<{
  userId: number;
  cancelAtPeriodEnd?: boolean;
}, { subscription: any }>({
  method: "POST",
  path: "/billing/subscription/cancel",
  expose: true,
}, async ({ userId, cancelAtPeriodEnd = true }) => {
  try {
    const userSubscription = await getSubscription({ userId });
    
    if (!userSubscription.subscription?.stripeSubscriptionId) {
      throw new APIError("NO_SUBSCRIPTION", "No active subscription found");
    }

    let updatedSubscription;
    
    if (cancelAtPeriodEnd) {
      // Cancel at period end
      updatedSubscription = await stripe.subscriptions.update(userSubscription.subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      // Cancel immediately
      updatedSubscription = await stripe.subscriptions.cancel(userSubscription.subscription.stripeSubscriptionId);
    }

    // Update our database
    await billingDB.query(`
      UPDATE subscriptions 
      SET status = $1,
          cancel_at_period_end = $2,
          cancelled_at = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $4
    `, [
      updatedSubscription.status,
      cancelAtPeriodEnd,
      cancelAtPeriodEnd ? null : new Date(),
      userId
    ]);

    return { subscription: updatedSubscription };
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    throw new APIError("SUBSCRIPTION_CANCEL_ERROR", "Failed to cancel subscription");
  }
});

// Get user's payment methods
export const getPaymentMethods = api<{ userId: number }, { paymentMethods: PaymentMethod[] }>({
  method: "GET",
  path: "/billing/payment-methods/:userId",
  expose: true,
}, async ({ userId }) => {
  const result = await billingDB.query(`
    SELECT * FROM payment_methods WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC
  `, [userId]);

  const paymentMethods: PaymentMethod[] = result.rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    stripePaymentMethodId: row.stripe_payment_method_id,
    type: row.type,
    brand: row.brand,
    lastFour: row.last_four,
    expMonth: row.exp_month,
    expYear: row.exp_year,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return { paymentMethods };
});

// Get user's invoices
export const getInvoices = api<{ userId: number; limit?: number }, { invoices: Invoice[] }>({
  method: "GET", 
  path: "/billing/invoices/:userId",
  expose: true,
}, async ({ userId, limit = 10 }) => {
  const result = await billingDB.query(`
    SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2
  `, [userId, limit]);

  const invoices: Invoice[] = result.rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    stripeInvoiceId: row.stripe_invoice_id,
    subscriptionId: row.subscription_id,
    amountDue: row.amount_due,
    amountPaid: row.amount_paid,
    currency: row.currency,
    status: row.status,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    dueDate: row.due_date,
    paidAt: row.paid_at,
    hostedInvoiceUrl: row.hosted_invoice_url,
    invoicePdf: row.invoice_pdf,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return { invoices };
});

// Helper function to map price ID to plan ID
function getPlanIdFromPriceId(priceId: string): string {
  for (const [planId, planConfig] of Object.entries(PLANS)) {
    if (Object.values(planConfig.stripePriceIds).includes(priceId)) {
      return planId;
    }
  }
  return "free"; // Default fallback
}