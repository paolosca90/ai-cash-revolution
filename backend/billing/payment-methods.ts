import { api, APIError } from "encore.dev/api";
import { billingDB } from "./db";
import { stripe } from "./stripe-client";

// Add payment method to customer
export const addPaymentMethod = api<{
  userId: number;
  paymentMethodId: string;
  setAsDefault?: boolean;
}, { success: boolean; paymentMethod: any }>({
  method: "POST",
  path: "/billing/payment-methods/add",
  expose: true,
}, async ({ userId, paymentMethodId, setAsDefault = false }) => {
  try {
    // Get user's subscription to find customer ID
    const subscriptionResult = await billingDB.query(`
      SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1
    `, [userId]);

    if (subscriptionResult.rows.length === 0) {
      throw new APIError("NO_CUSTOMER", "No customer found for user");
    }

    const customerId = subscriptionResult.rows[0].stripe_customer_id;

    // Attach payment method to customer
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set as default if requested
    if (setAsDefault) {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Update all other payment methods to not be default
      await billingDB.query(`
        UPDATE payment_methods SET is_default = false WHERE user_id = $1
      `, [userId]);
    }

    // Store in database
    await billingDB.query(`
      INSERT INTO payment_methods (
        user_id, stripe_payment_method_id, type, brand, last_four, 
        exp_month, exp_year, is_default
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (stripe_payment_method_id) 
      DO UPDATE SET is_default = $8, updated_at = CURRENT_TIMESTAMP
    `, [
      userId,
      paymentMethod.id,
      paymentMethod.type,
      paymentMethod.card?.brand || null,
      paymentMethod.card?.last4 || null,
      paymentMethod.card?.exp_month || null,
      paymentMethod.card?.exp_year || null,
      setAsDefault
    ]);

    return { success: true, paymentMethod };
  } catch (error) {
    console.error("Error adding payment method:", error);
    throw new APIError("PAYMENT_METHOD_ERROR", "Failed to add payment method");
  }
});

// Remove payment method
export const removePaymentMethod = api<{
  userId: number;
  paymentMethodId: string;
}, { success: boolean }>({
  method: "DELETE",
  path: "/billing/payment-methods/remove",
  expose: true,
}, async ({ userId, paymentMethodId }) => {
  try {
    // Check if payment method belongs to user
    const result = await billingDB.query(`
      SELECT * FROM payment_methods 
      WHERE user_id = $1 AND stripe_payment_method_id = $2
    `, [userId, paymentMethodId]);

    if (result.rows.length === 0) {
      throw new APIError("PAYMENT_METHOD_NOT_FOUND", "Payment method not found");
    }

    // Detach from Stripe
    await stripe.paymentMethods.detach(paymentMethodId);

    // Remove from database
    await billingDB.query(`
      DELETE FROM payment_methods WHERE stripe_payment_method_id = $1
    `, [paymentMethodId]);

    return { success: true };
  } catch (error) {
    console.error("Error removing payment method:", error);
    throw new APIError("PAYMENT_METHOD_ERROR", "Failed to remove payment method");
  }
});

// Set default payment method
export const setDefaultPaymentMethod = api<{
  userId: number;
  paymentMethodId: string;
}, { success: boolean }>({
  method: "POST",
  path: "/billing/payment-methods/set-default",
  expose: true,
}, async ({ userId, paymentMethodId }) => {
  try {
    // Check if payment method belongs to user
    const result = await billingDB.query(`
      SELECT * FROM payment_methods 
      WHERE user_id = $1 AND stripe_payment_method_id = $2
    `, [userId, paymentMethodId]);

    if (result.rows.length === 0) {
      throw new APIError("PAYMENT_METHOD_NOT_FOUND", "Payment method not found");
    }

    // Get customer ID
    const subscriptionResult = await billingDB.query(`
      SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1
    `, [userId]);

    if (subscriptionResult.rows.length === 0) {
      throw new APIError("NO_CUSTOMER", "No customer found for user");
    }

    const customerId = subscriptionResult.rows[0].stripe_customer_id;

    // Update default in Stripe
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Update in database - set all to false first, then set selected to true
    await billingDB.query(`
      UPDATE payment_methods SET is_default = false WHERE user_id = $1
    `, [userId]);

    await billingDB.query(`
      UPDATE payment_methods 
      SET is_default = true, updated_at = CURRENT_TIMESTAMP 
      WHERE stripe_payment_method_id = $1
    `, [paymentMethodId]);

    return { success: true };
  } catch (error) {
    console.error("Error setting default payment method:", error);
    throw new APIError("PAYMENT_METHOD_ERROR", "Failed to set default payment method");
  }
});

// Update payment method (for cards, this is mainly updating billing address)
export const updatePaymentMethod = api<{
  userId: number;
  paymentMethodId: string;
  billingDetails?: {
    name?: string;
    email?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
}, { success: boolean; paymentMethod: any }>({
  method: "PUT",
  path: "/billing/payment-methods/update",
  expose: true,
}, async ({ userId, paymentMethodId, billingDetails }) => {
  try {
    // Check if payment method belongs to user
    const result = await billingDB.query(`
      SELECT * FROM payment_methods 
      WHERE user_id = $1 AND stripe_payment_method_id = $2
    `, [userId, paymentMethodId]);

    if (result.rows.length === 0) {
      throw new APIError("PAYMENT_METHOD_NOT_FOUND", "Payment method not found");
    }

    // Update payment method in Stripe
    const paymentMethod = await stripe.paymentMethods.update(paymentMethodId, {
      billing_details: billingDetails,
    });

    return { success: true, paymentMethod };
  } catch (error) {
    console.error("Error updating payment method:", error);
    throw new APIError("PAYMENT_METHOD_ERROR", "Failed to update payment method");
  }
});

// Get payment method details with usage information
export const getPaymentMethodDetails = api<{
  userId: number;
  paymentMethodId: string;
}, { paymentMethod: any; usage: any }>({
  method: "GET",
  path: "/billing/payment-methods/details/:userId/:paymentMethodId", 
  expose: true,
}, async ({ userId, paymentMethodId }) => {
  try {
    // Check if payment method belongs to user
    const result = await billingDB.query(`
      SELECT * FROM payment_methods 
      WHERE user_id = $1 AND stripe_payment_method_id = $2
    `, [userId, paymentMethodId]);

    if (result.rows.length === 0) {
      throw new APIError("PAYMENT_METHOD_NOT_FOUND", "Payment method not found");
    }

    // Get payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // Get usage information (recent invoices using this payment method)
    const invoicesResult = await billingDB.query(`
      SELECT i.* FROM invoices i
      JOIN subscriptions s ON s.id = i.subscription_id
      WHERE s.user_id = $1 
      AND i.status = 'paid'
      ORDER BY i.paid_at DESC
      LIMIT 5
    `, [userId]);

    const usage = {
      recentInvoices: invoicesResult.rows.map(row => ({
        id: row.id,
        amount: row.amount_paid / 100,
        currency: row.currency,
        paidAt: row.paid_at,
      })),
      totalPayments: invoicesResult.rows.length,
      lastUsed: invoicesResult.rows[0]?.paid_at || null,
    };

    return { paymentMethod, usage };
  } catch (error) {
    console.error("Error getting payment method details:", error);
    throw new APIError("PAYMENT_METHOD_ERROR", "Failed to get payment method details");
  }
});

// Validate payment method (useful for checking if card is still valid)
export const validatePaymentMethod = api<{
  userId: number;
  paymentMethodId: string;
}, { valid: boolean; issues?: string[] }>({
  method: "POST",
  path: "/billing/payment-methods/validate",
  expose: true,
}, async ({ userId, paymentMethodId }) => {
  try {
    // Check if payment method belongs to user
    const result = await billingDB.query(`
      SELECT * FROM payment_methods 
      WHERE user_id = $1 AND stripe_payment_method_id = $2
    `, [userId, paymentMethodId]);

    if (result.rows.length === 0) {
      throw new APIError("PAYMENT_METHOD_NOT_FOUND", "Payment method not found");
    }

    // Get payment method from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    const issues: string[] = [];
    let valid = true;

    // Check if card is expired
    if (paymentMethod.card) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      if (paymentMethod.card.exp_year < currentYear || 
          (paymentMethod.card.exp_year === currentYear && paymentMethod.card.exp_month < currentMonth)) {
        valid = false;
        issues.push("Card is expired");
      }

      // Check for other potential issues (this would be expanded based on your needs)
      if (paymentMethod.card.funding === 'prepaid') {
        issues.push("Prepaid cards may have limitations");
      }
    }

    return { valid, issues: issues.length > 0 ? issues : undefined };
  } catch (error) {
    console.error("Error validating payment method:", error);
    return { valid: false, issues: ["Unable to validate payment method"] };
  }
});