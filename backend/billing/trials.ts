import { api, APIError } from "encore.dev/api";
import { billingDB } from "./db";
import { stripe } from "./stripe-client";
import { sendEmail } from "./notifications";

// Trial management interfaces
export interface TrialInfo {
  userId: number;
  planId: string;
  trialStart: Date;
  trialEnd: Date;
  trialDays: number;
  status: "active" | "ended" | "converted";
  convertedAt?: Date;
}

export interface TrialEligibility {
  eligible: boolean;
  reason?: string;
  previousTrials?: number;
}

// Start trial for a user
export const startTrial = api<{
  userId: number;
  planId: string;
  trialDays?: number;
  email: string;
}, { success: boolean; trial: TrialInfo }>({
  method: "POST",
  path: "/billing/trials/start",
  expose: true,
}, async ({ userId, planId, trialDays = 14, email }) => {
  try {
    // Check trial eligibility
    const eligibility = await checkTrialEligibility({ userId, planId });
    if (!eligibility.eligible) {
      throw new APIError("TRIAL_NOT_ELIGIBLE", eligibility.reason || "Not eligible for trial");
    }

    // Create or get Stripe customer
    let customerId: string;
    const existingSubscription = await billingDB.query(`
      SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1
    `, [userId]);

    if (existingSubscription.rows.length > 0 && existingSubscription.rows[0].stripe_customer_id) {
      customerId = existingSubscription.rows[0].stripe_customer_id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId: userId.toString(),
        },
      });
      customerId = customer.id;
    }

    // Calculate trial dates
    const trialStart = new Date();
    const trialEnd = new Date(trialStart.getTime() + trialDays * 24 * 60 * 60 * 1000);

    // Create or update subscription with trial
    await billingDB.query(`
      INSERT INTO subscriptions (
        user_id, stripe_customer_id, plan, status, 
        trial_start, trial_end, current_period_start, current_period_end
      )
      VALUES ($1, $2, $3, 'trialing', $4, $5, $4, $5)
      ON CONFLICT (user_id)
      DO UPDATE SET
        stripe_customer_id = $2,
        plan = $3,
        status = 'trialing',
        trial_start = $4,
        trial_end = $5,
        current_period_start = $4,
        current_period_end = $5,
        updated_at = CURRENT_TIMESTAMP
    `, [userId, customerId, planId, trialStart, trialEnd]);

    // Log trial started event
    await billingDB.query(`
      INSERT INTO billing_events (user_id, event_type, data)
      VALUES ($1, 'trial_started', $2)
    `, [userId, JSON.stringify({ planId, trialDays, trialStart, trialEnd })]);

    // Send trial welcome email
    await sendEmail({
      to: email,
      template: "trial_started",
      data: { planId, trialDays, trialEnd }
    });

    const trial: TrialInfo = {
      userId,
      planId,
      trialStart,
      trialEnd,
      trialDays,
      status: "active"
    };

    return { success: true, trial };
  } catch (error) {
    console.error("Error starting trial:", error);
    throw new APIError("TRIAL_START_ERROR", "Failed to start trial");
  }
});

// Check trial eligibility
export const checkTrialEligibility = api<{
  userId: number;
  planId: string;
}, TrialEligibility>({
  method: "GET",
  path: "/billing/trials/eligibility/:userId/:planId",
  expose: true,
}, async ({ userId, planId }) => {
  try {
    // Check if user already has or had a trial for this plan
    const existingTrials = await billingDB.query(`
      SELECT COUNT(*) as trial_count
      FROM billing_events 
      WHERE user_id = $1 
      AND event_type = 'trial_started'
      AND data->>'planId' = $2
    `, [userId, planId]);

    const trialCount = parseInt(existingTrials.rows[0].trial_count);

    if (trialCount > 0) {
      return {
        eligible: false,
        reason: "User has already used a trial for this plan",
        previousTrials: trialCount
      };
    }

    // Check if user currently has an active subscription
    const activeSubscription = await billingDB.query(`
      SELECT * FROM subscriptions 
      WHERE user_id = $1 
      AND status IN ('active', 'trialing') 
      AND plan != 'free'
    `, [userId]);

    if (activeSubscription.rows.length > 0) {
      return {
        eligible: false,
        reason: "User already has an active subscription",
        previousTrials: trialCount
      };
    }

    return {
      eligible: true,
      previousTrials: trialCount
    };
  } catch (error) {
    console.error("Error checking trial eligibility:", error);
    return {
      eligible: false,
      reason: "Unable to check eligibility"
    };
  }
});

// Get trial status for user
export const getTrialStatus = api<{
  userId: number;
}, { trial: TrialInfo | null }>({
  method: "GET",
  path: "/billing/trials/status/:userId",
  expose: true,
}, async ({ userId }) => {
  try {
    const result = await billingDB.query(`
      SELECT * FROM subscriptions 
      WHERE user_id = $1 
      AND (status = 'trialing' OR trial_end IS NOT NULL)
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId]);

    if (result.rows.length === 0) {
      return { trial: null };
    }

    const row = result.rows[0];
    
    // Determine trial status
    let status: "active" | "ended" | "converted" = "ended";
    const now = new Date();
    
    if (row.trial_end && new Date(row.trial_end) > now) {
      status = "active";
    } else if (row.status === 'active' && row.plan !== 'free') {
      status = "converted";
    }

    const trial: TrialInfo = {
      userId: row.user_id,
      planId: row.plan,
      trialStart: row.trial_start,
      trialEnd: row.trial_end,
      trialDays: row.trial_start && row.trial_end 
        ? Math.ceil((new Date(row.trial_end).getTime() - new Date(row.trial_start).getTime()) / (24 * 60 * 60 * 1000))
        : 0,
      status,
      convertedAt: status === 'converted' ? row.updated_at : undefined
    };

    return { trial };
  } catch (error) {
    console.error("Error getting trial status:", error);
    throw new APIError("TRIAL_STATUS_ERROR", "Failed to get trial status");
  }
});

// Convert trial to paid subscription
export const convertTrial = api<{
  userId: number;
  priceId: string;
  paymentMethodId?: string;
}, { success: boolean; subscription: any }>({
  method: "POST",
  path: "/billing/trials/convert",
  expose: true,
}, async ({ userId, priceId, paymentMethodId }) => {
  try {
    // Get current trial subscription
    const trialResult = await billingDB.query(`
      SELECT * FROM subscriptions 
      WHERE user_id = $1 AND status = 'trialing'
    `, [userId]);

    if (trialResult.rows.length === 0) {
      throw new APIError("NO_TRIAL", "No active trial found");
    }

    const subscription = trialResult.rows[0];
    const customerId = subscription.stripe_customer_id;

    // Set payment method if provided
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

    // Create Stripe subscription (trial will end, paid subscription starts)
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });

    // Update our database
    await billingDB.query(`
      UPDATE subscriptions
      SET stripe_subscription_id = $1,
          status = $2,
          current_period_start = $3,
          current_period_end = $4,
          trial_start = NULL,
          trial_end = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $5
    `, [
      stripeSubscription.id,
      stripeSubscription.status,
      new Date(stripeSubscription.current_period_start * 1000),
      new Date(stripeSubscription.current_period_end * 1000),
      userId
    ]);

    // Log conversion event
    await billingDB.query(`
      INSERT INTO billing_events (user_id, event_type, data)
      VALUES ($1, 'trial_converted', $2)
    `, [userId, JSON.stringify({ 
      stripeSubscriptionId: stripeSubscription.id,
      priceId,
      convertedAt: new Date()
    })]);

    // Update revenue analytics
    await billingDB.query(`
      INSERT INTO revenue_analytics (date, plan, trial_conversions)
      VALUES (CURRENT_DATE, $1, 1)
      ON CONFLICT (date, plan) DO UPDATE SET
        trial_conversions = revenue_analytics.trial_conversions + 1
    `, [subscription.plan]);

    return { success: true, subscription: stripeSubscription };
  } catch (error) {
    console.error("Error converting trial:", error);
    throw new APIError("TRIAL_CONVERSION_ERROR", "Failed to convert trial");
  }
});

// Extend trial (admin function)
export const extendTrial = api<{
  userId: number;
  additionalDays: number;
  reason?: string;
}, { success: boolean; newTrialEnd: Date }>({
  method: "POST",
  path: "/billing/trials/extend",
  expose: true,
}, async ({ userId, additionalDays, reason }) => {
  try {
    // Get current trial
    const trialResult = await billingDB.query(`
      SELECT * FROM subscriptions 
      WHERE user_id = $1 AND status = 'trialing'
    `, [userId]);

    if (trialResult.rows.length === 0) {
      throw new APIError("NO_TRIAL", "No active trial found");
    }

    const subscription = trialResult.rows[0];
    const currentTrialEnd = new Date(subscription.trial_end);
    const newTrialEnd = new Date(currentTrialEnd.getTime() + additionalDays * 24 * 60 * 60 * 1000);

    // Update trial end date
    await billingDB.query(`
      UPDATE subscriptions
      SET trial_end = $1,
          current_period_end = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
    `, [newTrialEnd, userId]);

    // Log extension event
    await billingDB.query(`
      INSERT INTO billing_events (user_id, event_type, data)
      VALUES ($1, 'trial_extended', $2)
    `, [userId, JSON.stringify({ 
      additionalDays,
      reason,
      oldTrialEnd: currentTrialEnd,
      newTrialEnd,
      extendedAt: new Date()
    })]);

    return { success: true, newTrialEnd };
  } catch (error) {
    console.error("Error extending trial:", error);
    throw new APIError("TRIAL_EXTENSION_ERROR", "Failed to extend trial");
  }
});

// Get trial analytics
export const getTrialAnalytics = api<{
  startDate?: string;
  endDate?: string;
}, { 
  totalTrialsStarted: number;
  totalTrialsConverted: number;
  conversionRate: number;
  averageTrialDuration: number;
  trialsByPlan: Array<{
    plan: string;
    trials: number;
    conversions: number;
    conversionRate: number;
  }>;
}>({
  method: "GET",
  path: "/billing/trials/analytics",
  expose: true,
}, async ({ startDate, endDate }) => {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  try {
    // Get total trials started
    const trialsStartedResult = await billingDB.query(`
      SELECT COUNT(*) as count
      FROM billing_events
      WHERE event_type = 'trial_started'
      AND created_at >= $1 AND created_at <= $2
    `, [start, end]);

    const totalTrialsStarted = parseInt(trialsStartedResult.rows[0].count);

    // Get total trials converted
    const trialsConvertedResult = await billingDB.query(`
      SELECT COUNT(*) as count
      FROM billing_events
      WHERE event_type = 'trial_converted'
      AND created_at >= $1 AND created_at <= $2
    `, [start, end]);

    const totalTrialsConverted = parseInt(trialsConvertedResult.rows[0].count);

    // Calculate conversion rate
    const conversionRate = totalTrialsStarted > 0 ? (totalTrialsConverted / totalTrialsStarted) * 100 : 0;

    // Get average trial duration (simplified)
    const averageTrialDuration = 14; // Default trial length

    // Get trials by plan
    const trialsByPlanResult = await billingDB.query(`
      SELECT 
        data->>'planId' as plan,
        COUNT(*) as trials,
        COUNT(CASE WHEN EXISTS(
          SELECT 1 FROM billing_events be2 
          WHERE be2.user_id = billing_events.user_id 
          AND be2.event_type = 'trial_converted'
          AND be2.created_at > billing_events.created_at
        ) THEN 1 END) as conversions
      FROM billing_events
      WHERE event_type = 'trial_started'
      AND created_at >= $1 AND created_at <= $2
      GROUP BY data->>'planId'
    `, [start, end]);

    const trialsByPlan = trialsByPlanResult.rows.map(row => ({
      plan: row.plan,
      trials: parseInt(row.trials),
      conversions: parseInt(row.conversions),
      conversionRate: row.trials > 0 ? (row.conversions / row.trials) * 100 : 0
    }));

    return {
      totalTrialsStarted,
      totalTrialsConverted,
      conversionRate,
      averageTrialDuration,
      trialsByPlan
    };
  } catch (error) {
    console.error("Error getting trial analytics:", error);
    throw new APIError("TRIAL_ANALYTICS_ERROR", "Failed to get trial analytics");
  }
});