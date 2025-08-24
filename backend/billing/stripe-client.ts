import Stripe from "stripe";
import { secret } from "encore.dev/config";

// Stripe configuration
const stripeSecretKey = secret("StripeSecretKey");
const stripeWebhookSecret = secret("StripeWebhookSecret");

export const stripe = new Stripe(stripeSecretKey(), {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});

export const getWebhookSecret = () => stripeWebhookSecret();

// Stripe product and price configuration
export const STRIPE_PRODUCTS = {
  PRO: "prod_pro_plan", // Replace with actual Stripe product ID
  ENTERPRISE: "prod_enterprise_plan", // Replace with actual Stripe product ID
} as const;

export const STRIPE_PRICES = {
  PRO_MONTHLY: "price_pro_monthly", // Replace with actual Stripe price ID
  PRO_YEARLY: "price_pro_yearly", // Replace with actual Stripe price ID  
  ENTERPRISE_MONTHLY: "price_enterprise_monthly", // Replace with actual Stripe price ID
  ENTERPRISE_YEARLY: "price_enterprise_yearly", // Replace with actual Stripe price ID
} as const;

// Plan configuration
export interface PlanConfig {
  id: string;
  name: string;
  description: string;
  features: string[];
  stripePriceIds: {
    monthly?: string;
    yearly?: string;
  };
  limits: {
    mt5Configs: number;
    apiCallsPerMonth: number;
    supportLevel: "standard" | "priority" | "dedicated";
  };
}

export const PLANS: Record<string, PlanConfig> = {
  free: {
    id: "free",
    name: "Free Plan",
    description: "Basic trading signals and features",
    features: [
      "Basic trading signals",
      "1 MT5 configuration",
      "Standard support",
      "Limited API calls"
    ],
    stripePriceIds: {},
    limits: {
      mt5Configs: 1,
      apiCallsPerMonth: 1000,
      supportLevel: "standard"
    }
  },
  pro: {
    id: "pro", 
    name: "Pro Plan",
    description: "Advanced trading features for serious traders",
    features: [
      "Advanced trading signals",
      "5 MT5 configurations", 
      "In-depth analysis",
      "Priority support",
      "Risk management tools",
      "Backtesting access"
    ],
    stripePriceIds: {
      monthly: STRIPE_PRICES.PRO_MONTHLY,
      yearly: STRIPE_PRICES.PRO_YEARLY
    },
    limits: {
      mt5Configs: 5,
      apiCallsPerMonth: 10000,
      supportLevel: "priority"
    }
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise Plan", 
    description: "Custom solutions for institutions and large traders",
    features: [
      "All Pro features",
      "Unlimited MT5 configurations",
      "Custom trading strategies",
      "Advanced backtesting",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantees"
    ],
    stripePriceIds: {
      monthly: STRIPE_PRICES.ENTERPRISE_MONTHLY,
      yearly: STRIPE_PRICES.ENTERPRISE_YEARLY
    },
    limits: {
      mt5Configs: -1, // Unlimited
      apiCallsPerMonth: -1, // Unlimited
      supportLevel: "dedicated"
    }
  }
};

// Helper function to get plan pricing
export async function getPlanPricing(planId: string): Promise<{ monthly?: number; yearly?: number } | null> {
  const plan = PLANS[planId];
  if (!plan || !plan.stripePriceIds) return null;

  const pricing: { monthly?: number; yearly?: number } = {};

  try {
    if (plan.stripePriceIds.monthly) {
      const monthlyPrice = await stripe.prices.retrieve(plan.stripePriceIds.monthly);
      pricing.monthly = monthlyPrice.unit_amount || 0;
    }

    if (plan.stripePriceIds.yearly) {
      const yearlyPrice = await stripe.prices.retrieve(plan.stripePriceIds.yearly);
      pricing.yearly = yearlyPrice.unit_amount || 0;
    }

    return pricing;
  } catch (error) {
    console.error("Error fetching plan pricing:", error);
    return null;
  }
}