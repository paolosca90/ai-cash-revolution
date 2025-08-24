import React, { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard } from "lucide-react";
import { useBackend } from "@/hooks/useBackend";
import { useToast } from "@/components/ui/use-toast";

interface PaymentMethodFormProps {
  onSuccess?: (paymentMethod: any) => void;
  onError?: (error: string) => void;
  setAsDefault?: boolean;
  userId: number;
  showTitle?: boolean;
  buttonText?: string;
}

export function PaymentMethodForm({
  onSuccess,
  onError,
  setAsDefault = true,
  userId,
  showTitle = true,
  buttonText = "Add Payment Method"
}: PaymentMethodFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const backend = useBackend();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
    hidePostalCode: false,
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create setup intent
      const { clientSecret } = await backend.billing.createSetupIntent({
        userId,
        email: `user${userId}@example.com`, // You should get this from your user context
      });

      // Confirm setup intent with payment method
      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              // You can add billing details here if needed
            },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message || "An error occurred while processing your payment method.");
        onError?.(stripeError.message || "Payment method processing failed");
        return;
      }

      if (setupIntent?.payment_method) {
        // Add payment method to our system
        const result = await backend.billing.addPaymentMethod({
          userId,
          paymentMethodId: setupIntent.payment_method.id,
          setAsDefault,
        });

        if (result.success) {
          toast({
            title: "Payment method added",
            description: "Your payment method has been successfully added.",
          });
          onSuccess?.(result.paymentMethod);
        } else {
          throw new Error("Failed to save payment method");
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add payment method";
      setError(errorMessage);
      onError?.(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add Payment Method
          </CardTitle>
          <CardDescription>
            Add a credit or debit card to your account for payments.
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <CardElement
              options={cardElementOptions}
              onChange={(event) => {
                setCardComplete(event.complete);
                setError(event.error?.message || null);
              }}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={!stripe || !cardComplete || isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {buttonText}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}