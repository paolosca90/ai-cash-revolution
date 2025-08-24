import React from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

// Make sure to replace with your actual publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");

interface StripeProviderProps {
  children: React.ReactNode;
  clientSecret?: string;
  appearance?: {
    theme?: "stripe" | "night" | "flat";
    variables?: {
      colorPrimary?: string;
      colorBackground?: string;
      colorText?: string;
      colorDanger?: string;
      fontFamily?: string;
      spacingUnit?: string;
      borderRadius?: string;
    };
  };
}

export function StripeProvider({ 
  children, 
  clientSecret,
  appearance = {
    theme: "stripe",
    variables: {
      colorPrimary: "#2563eb",
      colorBackground: "#ffffff",
      colorText: "#1f2937",
      fontFamily: "system-ui, -apple-system, sans-serif",
      borderRadius: "8px"
    }
  }
}: StripeProviderProps) {
  const options = {
    clientSecret,
    appearance,
    loader: "auto" as const,
  };

  return (
    <Elements stripe={stripePromise} options={clientSecret ? options : { appearance }}>
      {children}
    </Elements>
  );
}