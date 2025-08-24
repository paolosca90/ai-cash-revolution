import { api, APIError } from "encore.dev/api";
import { billingDB } from "./db";
import { stripe } from "./stripe-client";

// GDPR and privacy compliance interfaces
export interface DataExportRequest {
  userId: number;
  requestedAt: Date;
  status: "pending" | "processing" | "completed" | "failed";
  downloadUrl?: string;
  expiresAt?: Date;
}

export interface DataDeletionRequest {
  userId: number;
  requestedAt: Date;
  status: "pending" | "processing" | "completed" | "failed";
  retentionEndDate?: Date;
  deletedAt?: Date;
}

export interface UserDataSummary {
  subscriptions: any[];
  paymentMethods: any[];
  invoices: any[];
  billingEvents: any[];
  personalData: {
    email?: string;
    customerId?: string;
    subscriptionIds: string[];
  };
}

// Request data export (GDPR Article 15 - Right of Access)
export const requestDataExport = api<{
  userId: number;
  email: string;
}, { success: boolean; requestId: string }>({
  method: "POST",
  path: "/billing/gdpr/export-request",
  expose: true,
}, async ({ userId, email }) => {
  try {
    // Create export request record
    const requestId = `export_${userId}_${Date.now()}`;
    
    await billingDB.query(`
      INSERT INTO billing_events (user_id, event_type, data)
      VALUES ($1, 'gdpr_export_requested', $2)
    `, [userId, JSON.stringify({ requestId, email, requestedAt: new Date() })]);

    // In a real implementation, this would trigger background processing
    // to compile all user data into a downloadable format
    console.log(`Data export requested for user ${userId}, request ID: ${requestId}`);

    return { success: true, requestId };
  } catch (error) {
    console.error("Error requesting data export:", error);
    throw new APIError("EXPORT_REQUEST_ERROR", "Failed to process data export request");
  }
});

// Request data deletion (GDPR Article 17 - Right to Erasure)
export const requestDataDeletion = api<{
  userId: number;
  email: string;
  reason?: string;
}, { success: boolean; requestId: string; retentionPeriod: number }>({
  method: "POST",
  path: "/billing/gdpr/deletion-request",
  expose: true,
}, async ({ userId, email, reason }) => {
  try {
    // Check if user has active subscriptions
    const activeSubscription = await billingDB.query(`
      SELECT * FROM subscriptions 
      WHERE user_id = $1 AND status IN ('active', 'trialing', 'past_due')
    `, [userId]);

    if (activeSubscription.rows.length > 0) {
      throw new APIError("ACTIVE_SUBSCRIPTION", 
        "Cannot delete data while subscription is active. Please cancel your subscription first.");
    }

    // Check for recent financial transactions (legal retention requirements)
    const recentInvoices = await billingDB.query(`
      SELECT COUNT(*) as count FROM invoices 
      WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 years'
    `, [userId]);

    const retentionPeriod = 7; // Years - financial data retention requirement
    const requestId = `deletion_${userId}_${Date.now()}`;
    
    // Create deletion request record
    await billingDB.query(`
      INSERT INTO billing_events (user_id, event_type, data)
      VALUES ($1, 'gdpr_deletion_requested', $2)
    `, [userId, JSON.stringify({ 
      requestId, 
      email, 
      reason,
      requestedAt: new Date(),
      retentionPeriod,
      hasFinancialData: recentInvoices.rows[0].count > 0
    })]);

    return { success: true, requestId, retentionPeriod };
  } catch (error) {
    console.error("Error requesting data deletion:", error);
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError("DELETION_REQUEST_ERROR", "Failed to process data deletion request");
  }
});

// Get user data summary (for transparency)
export const getUserDataSummary = api<{
  userId: number;
}, { data: UserDataSummary }>({
  method: "GET",
  path: "/billing/gdpr/data-summary/:userId",
  expose: true,
}, async ({ userId }) => {
  try {
    // Get subscriptions
    const subscriptions = await billingDB.query(`
      SELECT id, plan, status, created_at, updated_at FROM subscriptions WHERE user_id = $1
    `, [userId]);

    // Get payment methods (without sensitive details)
    const paymentMethods = await billingDB.query(`
      SELECT id, type, brand, last_four, created_at FROM payment_methods WHERE user_id = $1
    `, [userId]);

    // Get invoices
    const invoices = await billingDB.query(`
      SELECT id, amount_due, amount_paid, currency, status, created_at FROM invoices WHERE user_id = $1
    `, [userId]);

    // Get billing events (anonymized)
    const billingEvents = await billingDB.query(`
      SELECT event_type, created_at FROM billing_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10
    `, [userId]);

    // Get personal data from Stripe
    let personalData: any = {};
    const subscription = subscriptions.rows[0];
    if (subscription && subscription.stripe_customer_id) {
      try {
        const customer = await stripe.customers.retrieve(subscription.stripe_customer_id);
        if (typeof customer === 'object' && !customer.deleted) {
          personalData = {
            email: customer.email,
            customerId: customer.id,
            subscriptionIds: subscriptions.rows.map(s => s.stripe_subscription_id).filter(Boolean),
          };
        }
      } catch (stripeError) {
        console.warn("Could not retrieve customer data from Stripe:", stripeError);
      }
    }

    const dataSummary: UserDataSummary = {
      subscriptions: subscriptions.rows,
      paymentMethods: paymentMethods.rows,
      invoices: invoices.rows,
      billingEvents: billingEvents.rows,
      personalData,
    };

    return { data: dataSummary };
  } catch (error) {
    console.error("Error getting user data summary:", error);
    throw new APIError("DATA_SUMMARY_ERROR", "Failed to retrieve user data summary");
  }
});

// Update data processing consent
export const updateConsent = api<{
  userId: number;
  consents: {
    marketing: boolean;
    analytics: boolean;
    essential: boolean;
  };
}, { success: boolean }>({
  method: "POST",
  path: "/billing/gdpr/consent",
  expose: true,
}, async ({ userId, consents }) => {
  try {
    // Log consent changes
    await billingDB.query(`
      INSERT INTO billing_events (user_id, event_type, data)
      VALUES ($1, 'consent_updated', $2)
    `, [userId, JSON.stringify({ consents, updatedAt: new Date() })]);

    // In a real implementation, this would update consent settings
    // in your marketing tools, analytics platforms, etc.
    
    return { success: true };
  } catch (error) {
    console.error("Error updating consent:", error);
    throw new APIError("CONSENT_UPDATE_ERROR", "Failed to update consent settings");
  }
});

// Get data processing activities (GDPR transparency)
export const getDataProcessingInfo = api<void, { 
  activities: Array<{
    purpose: string;
    legalBasis: string;
    dataTypes: string[];
    retention: string;
    thirdParties: string[];
  }>
}>({
  method: "GET",
  path: "/billing/gdpr/processing-info",
  expose: true,
}, async () => {
  const activities = [
    {
      purpose: "Payment Processing",
      legalBasis: "Contract Performance (GDPR Art. 6(1)(b))",
      dataTypes: ["Payment information", "Billing address", "Transaction history"],
      retention: "7 years after last transaction (legal requirement)",
      thirdParties: ["Stripe (payment processor)", "Banking partners"]
    },
    {
      purpose: "Subscription Management", 
      legalBasis: "Contract Performance (GDPR Art. 6(1)(b))",
      dataTypes: ["Account information", "Usage data", "Preferences"],
      retention: "Until account deletion or 3 years after last activity",
      thirdParties: ["Cloud hosting providers"]
    },
    {
      purpose: "Customer Support",
      legalBasis: "Legitimate Interest (GDPR Art. 6(1)(f))",
      dataTypes: ["Communication history", "Technical logs"],
      retention: "2 years after last interaction",
      thirdParties: ["Support ticket system providers"]
    },
    {
      purpose: "Marketing Communications",
      legalBasis: "Consent (GDPR Art. 6(1)(a))",
      dataTypes: ["Email address", "Communication preferences", "Engagement data"],
      retention: "Until consent withdrawn or 3 years of inactivity",
      thirdParties: ["Email service providers", "Analytics platforms"]
    },
    {
      purpose: "Fraud Prevention",
      legalBasis: "Legitimate Interest (GDPR Art. 6(1)(f))",
      dataTypes: ["IP addresses", "Device fingerprints", "Transaction patterns"],
      retention: "5 years or until risk no longer exists",
      thirdParties: ["Fraud detection services"]
    }
  ];

  return { activities };
});

// Anonymize user data (for cases where deletion is not possible due to legal requirements)
export const anonymizeUserData = api<{
  userId: number;
}, { success: boolean; anonymizedFields: string[] }>({
  method: "POST",
  path: "/billing/gdpr/anonymize",
  expose: true,
}, async ({ userId }) => {
  try {
    const anonymizedFields: string[] = [];

    // Anonymize subscription data (keep financial records for legal compliance)
    await billingDB.query(`
      UPDATE subscriptions 
      SET stripe_customer_id = 'anonymized_' || id
      WHERE user_id = $1
    `, [userId]);
    anonymizedFields.push("customer_id");

    // Remove payment methods (but keep transaction history)
    await billingDB.query(`
      DELETE FROM payment_methods WHERE user_id = $1
    `, [userId]);
    anonymizedFields.push("payment_methods");

    // Anonymize billing events (keep essential audit trail)
    await billingDB.query(`
      UPDATE billing_events 
      SET data = jsonb_set(
        data, 
        '{anonymized}', 
        'true'::jsonb
      ) - 'email' - 'personal_data'
      WHERE user_id = $1
    `, [userId]);
    anonymizedFields.push("billing_events_personal_data");

    // Log anonymization
    await billingDB.query(`
      INSERT INTO billing_events (user_id, event_type, data)
      VALUES ($1, 'data_anonymized', $2)
    `, [userId, JSON.stringify({ 
      anonymizedAt: new Date(), 
      fields: anonymizedFields 
    })]);

    return { success: true, anonymizedFields };
  } catch (error) {
    console.error("Error anonymizing user data:", error);
    throw new APIError("ANONYMIZATION_ERROR", "Failed to anonymize user data");
  }
});

// Security audit log
export const getSecurityAuditLog = api<{
  userId: number;
  limit?: number;
}, { events: Array<{
  timestamp: Date;
  eventType: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: any;
}> }>({
  method: "GET",
  path: "/billing/security/audit-log/:userId",
  expose: true,
}, async ({ userId, limit = 50 }) => {
  try {
    // In a real implementation, this would include security-relevant events
    // like login attempts, payment method changes, subscription changes, etc.
    const result = await billingDB.query(`
      SELECT event_type, created_at, data
      FROM billing_events 
      WHERE user_id = $1 
      AND event_type IN (
        'payment_method_added', 'payment_method_removed',
        'subscription_created', 'subscription_updated', 'subscription_cancelled',
        'gdpr_export_requested', 'gdpr_deletion_requested',
        'consent_updated'
      )
      ORDER BY created_at DESC 
      LIMIT $2
    `, [userId, limit]);

    const events = result.rows.map(row => ({
      timestamp: row.created_at,
      eventType: row.event_type,
      success: true, // Assume success if logged
      details: row.data
    }));

    return { events };
  } catch (error) {
    console.error("Error getting security audit log:", error);
    throw new APIError("AUDIT_LOG_ERROR", "Failed to retrieve security audit log");
  }
});