import { api, APIError } from "encore.dev/api";
import { billingDB } from "./db";
import { stripe, getWebhookSecret } from "./stripe-client";
import { sendEmail } from "./notifications";
import Stripe from "stripe";

// Stripe webhook handler
export const handleWebhook = api<
  void,
  { received: boolean },
  { raw: true; method: "POST" }
>({
  method: "POST",
  path: "/billing/webhook",
  expose: true,
  raw: true,
}, async (req) => {
  const sig = req.headers["stripe-signature"] as string;
  const body = req.body as Buffer;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, getWebhookSecret());
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    throw new APIError("WEBHOOK_ERROR", "Invalid signature");
  }

  console.log(`Received webhook event: ${event.type}`);

  // Log the event
  await logBillingEvent(event);

  try {
    // Handle the event
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.created":
        await handleInvoiceCreated(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.trial_will_end":
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      case "payment_method.attached":
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;

      case "payment_method.detached":
        await handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await markEventProcessed(event.id);

    return { received: true };
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error);
    throw new APIError("WEBHOOK_PROCESSING_ERROR", "Failed to process webhook");
  }
});

// Log billing event to database
async function logBillingEvent(event: Stripe.Event) {
  const userId = await getUserIdFromEvent(event);
  
  await billingDB.query(`
    INSERT INTO billing_events (user_id, event_type, stripe_event_id, data, processed)
    VALUES ($1, $2, $3, $4, false)
    ON CONFLICT (stripe_event_id) DO NOTHING
  `, [userId, event.type, event.id, JSON.stringify(event.data.object)]);
}

// Mark event as processed
async function markEventProcessed(eventId: string) {
  await billingDB.query(`
    UPDATE billing_events 
    SET processed = true 
    WHERE stripe_event_id = $1
  `, [eventId]);
}

// Get user ID from Stripe event
async function getUserIdFromEvent(event: Stripe.Event): Promise<number | null> {
  try {
    let customerId: string | null = null;

    // Extract customer ID based on event type
    const obj = event.data.object as any;
    if (obj.customer) {
      customerId = obj.customer;
    } else if (obj.subscription?.customer) {
      customerId = obj.subscription.customer;
    }

    if (!customerId) return null;

    // Look up user ID from customer ID
    const result = await billingDB.query(`
      SELECT user_id FROM subscriptions WHERE stripe_customer_id = $1
    `, [customerId]);

    return result.rows.length > 0 ? result.rows[0].user_id : null;
  } catch (error) {
    console.error("Error getting user ID from event:", error);
    return null;
  }
}

// Handle subscription created
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("Processing subscription created:", subscription.id);
  
  const userId = await getUserIdFromCustomerId(subscription.customer as string);
  if (!userId) return;

  await billingDB.query(`
    UPDATE subscriptions
    SET stripe_subscription_id = $1,
        status = $2,
        current_period_start = $3,
        current_period_end = $4,
        trial_start = $5,
        trial_end = $6,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $7
  `, [
    subscription.id,
    subscription.status,
    new Date(subscription.current_period_start * 1000),
    new Date(subscription.current_period_end * 1000),
    subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
    subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    userId
  ]);

  // Update revenue analytics
  await updateRevenueAnalytics(subscription, "new_subscription");

  // Send welcome email
  await sendEmail({
    to: await getUserEmail(userId),
    template: "subscription_created",
    data: { subscription }
  });
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("Processing subscription updated:", subscription.id);
  
  const userId = await getUserIdFromCustomerId(subscription.customer as string);
  if (!userId) return;

  await billingDB.query(`
    UPDATE subscriptions
    SET status = $1,
        current_period_start = $2,
        current_period_end = $3,
        cancel_at_period_end = $4,
        cancelled_at = $5,
        updated_at = CURRENT_TIMESTAMP
    WHERE stripe_subscription_id = $6
  `, [
    subscription.status,
    new Date(subscription.current_period_start * 1000),
    new Date(subscription.current_period_end * 1000),
    subscription.cancel_at_period_end,
    subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    subscription.id
  ]);

  // Send email for significant changes
  if (subscription.cancel_at_period_end) {
    await sendEmail({
      to: await getUserEmail(userId),
      template: "subscription_cancelled",
      data: { subscription }
    });
  }
}

// Handle subscription deleted (cancelled)
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("Processing subscription deleted:", subscription.id);
  
  const userId = await getUserIdFromCustomerId(subscription.customer as string);
  if (!userId) return;

  await billingDB.query(`
    UPDATE subscriptions
    SET status = 'cancelled',
        plan = 'free',
        cancelled_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE stripe_subscription_id = $1
  `, [subscription.id]);

  // Update revenue analytics
  await updateRevenueAnalytics(subscription, "churn");

  // Send cancellation confirmation email
  await sendEmail({
    to: await getUserEmail(userId),
    template: "subscription_ended",
    data: { subscription }
  });
}

// Handle invoice created
async function handleInvoiceCreated(invoice: Stripe.Invoice) {
  console.log("Processing invoice created:", invoice.id);
  
  const userId = await getUserIdFromCustomerId(invoice.customer as string);
  if (!userId) return;

  // Get subscription ID from our database
  const subscriptionResult = await billingDB.query(`
    SELECT id FROM subscriptions WHERE stripe_customer_id = $1
  `, [invoice.customer]);

  const subscriptionId = subscriptionResult.rows[0]?.id;

  await billingDB.query(`
    INSERT INTO invoices (
      user_id, stripe_invoice_id, subscription_id, amount_due, 
      amount_paid, currency, status, period_start, period_end, 
      due_date, hosted_invoice_url, invoice_pdf
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (stripe_invoice_id) 
    DO UPDATE SET
      amount_due = $4,
      status = $7,
      due_date = $10,
      updated_at = CURRENT_TIMESTAMP
  `, [
    userId,
    invoice.id,
    subscriptionId,
    invoice.amount_due || 0,
    invoice.amount_paid || 0,
    invoice.currency,
    invoice.status,
    invoice.period_start ? new Date(invoice.period_start * 1000) : null,
    invoice.period_end ? new Date(invoice.period_end * 1000) : null,
    invoice.due_date ? new Date(invoice.due_date * 1000) : null,
    invoice.hosted_invoice_url,
    invoice.invoice_pdf
  ]);
}

// Handle successful payment
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("Processing payment succeeded:", invoice.id);
  
  const userId = await getUserIdFromCustomerId(invoice.customer as string);
  if (!userId) return;

  await billingDB.query(`
    UPDATE invoices
    SET amount_paid = $1,
        status = $2,
        paid_at = $3,
        updated_at = CURRENT_TIMESTAMP
    WHERE stripe_invoice_id = $4
  `, [
    invoice.amount_paid || 0,
    invoice.status,
    new Date(),
    invoice.id
  ]);

  // Update revenue analytics
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    await updateRevenueAnalytics(subscription, "payment_succeeded", invoice.amount_paid || 0);
  }

  // Send payment confirmation email
  await sendEmail({
    to: await getUserEmail(userId),
    template: "payment_succeeded",
    data: { invoice }
  });
}

// Handle failed payment
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("Processing payment failed:", invoice.id);
  
  const userId = await getUserIdFromCustomerId(invoice.customer as string);
  if (!userId) return;

  await billingDB.query(`
    UPDATE invoices
    SET status = $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE stripe_invoice_id = $2
  `, [invoice.status, invoice.id]);

  // Send payment failure email
  await sendEmail({
    to: await getUserEmail(userId),
    template: "payment_failed",
    data: { invoice }
  });
}

// Handle trial ending soon
async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  console.log("Processing trial will end:", subscription.id);
  
  const userId = await getUserIdFromCustomerId(subscription.customer as string);
  if (!userId) return;

  // Send trial ending email
  await sendEmail({
    to: await getUserEmail(userId),
    template: "trial_ending",
    data: { subscription }
  });
}

// Handle payment method attached
async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  console.log("Processing payment method attached:", paymentMethod.id);
  
  if (!paymentMethod.customer) return;
  
  const userId = await getUserIdFromCustomerId(paymentMethod.customer as string);
  if (!userId) return;

  // Store payment method in database
  await billingDB.query(`
    INSERT INTO payment_methods (
      user_id, stripe_payment_method_id, type, brand, last_four, exp_month, exp_year
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (stripe_payment_method_id) DO NOTHING
  `, [
    userId,
    paymentMethod.id,
    paymentMethod.type,
    paymentMethod.card?.brand,
    paymentMethod.card?.last4,
    paymentMethod.card?.exp_month,
    paymentMethod.card?.exp_year
  ]);
}

// Handle payment method detached
async function handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod) {
  console.log("Processing payment method detached:", paymentMethod.id);
  
  // Remove payment method from database
  await billingDB.query(`
    DELETE FROM payment_methods WHERE stripe_payment_method_id = $1
  `, [paymentMethod.id]);
}

// Helper functions
async function getUserIdFromCustomerId(customerId: string): Promise<number | null> {
  const result = await billingDB.query(`
    SELECT user_id FROM subscriptions WHERE stripe_customer_id = $1
  `, [customerId]);
  
  return result.rows.length > 0 ? result.rows[0].user_id : null;
}

async function getUserEmail(userId: number): Promise<string> {
  // This would normally fetch from your user service
  // For now, return a placeholder email
  return `user${userId}@example.com`;
}

// Update revenue analytics
async function updateRevenueAnalytics(
  subscription: Stripe.Subscription, 
  eventType: "new_subscription" | "churn" | "payment_succeeded" | "trial_conversion",
  revenue?: number
) {
  const today = new Date().toISOString().split('T')[0];
  const plan = getPlanFromSubscription(subscription);

  let updateData: any = { date: today, plan };

  switch (eventType) {
    case "new_subscription":
      updateData.new_subscriptions = 1;
      updateData.active_subscriptions = 1;
      if (subscription.trial_end && subscription.trial_end > Date.now() / 1000) {
        // This is a trial subscription
        updateData.new_subscriptions = 0;
      }
      break;
      
    case "churn":
      updateData.churned_subscriptions = 1;
      updateData.active_subscriptions = -1;
      break;
      
    case "payment_succeeded":
      updateData.revenue_cents = revenue || 0;
      // Calculate MRR based on subscription
      if (subscription.items.data[0]?.price.recurring?.interval === "month") {
        updateData.mrr_cents = revenue || 0;
      } else if (subscription.items.data[0]?.price.recurring?.interval === "year") {
        updateData.mrr_cents = Math.round((revenue || 0) / 12);
      }
      break;
      
    case "trial_conversion":
      updateData.trial_conversions = 1;
      break;
  }

  // Upsert analytics data
  await billingDB.query(`
    INSERT INTO revenue_analytics (date, plan, new_subscriptions, churned_subscriptions, revenue_cents, mrr_cents, active_subscriptions, trial_conversions)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (date, plan) DO UPDATE SET
      new_subscriptions = revenue_analytics.new_subscriptions + COALESCE(EXCLUDED.new_subscriptions, 0),
      churned_subscriptions = revenue_analytics.churned_subscriptions + COALESCE(EXCLUDED.churned_subscriptions, 0),
      revenue_cents = revenue_analytics.revenue_cents + COALESCE(EXCLUDED.revenue_cents, 0),
      mrr_cents = revenue_analytics.mrr_cents + COALESCE(EXCLUDED.mrr_cents, 0),
      active_subscriptions = revenue_analytics.active_subscriptions + COALESCE(EXCLUDED.active_subscriptions, 0),
      trial_conversions = revenue_analytics.trial_conversions + COALESCE(EXCLUDED.trial_conversions, 0)
  `, [
    today,
    plan,
    updateData.new_subscriptions || 0,
    updateData.churned_subscriptions || 0,  
    updateData.revenue_cents || 0,
    updateData.mrr_cents || 0,
    updateData.active_subscriptions || 0,
    updateData.trial_conversions || 0
  ]);
}

function getPlanFromSubscription(subscription: Stripe.Subscription): string {
  // Extract plan from subscription
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) return "free";
  
  // Map price ID to plan (you'd implement this based on your price IDs)
  if (priceId.includes("pro")) return "pro";
  if (priceId.includes("enterprise")) return "enterprise";
  return "free";
}