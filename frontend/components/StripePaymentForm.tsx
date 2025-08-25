import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { CreditCard, Lock, Shield } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_demo');

interface PaymentFormData {
  email: string;
  full_name: string;
  phone?: string;
  plan_name: string;
  amount: number;
}

interface StripePaymentFormProps {
  paymentData: PaymentFormData;
  onPaymentSuccess: (paymentMethodId: string) => void;
  onPaymentError: (error: string) => void;
  isLoading: boolean;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

function PaymentForm({ paymentData, onPaymentSuccess, onPaymentError, isLoading }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setCardError(null);

    const cardNumberElement = elements.getElement(CardNumberElement);

    if (!cardNumberElement) {
      setCardError('Elemento carta non trovato');
      setProcessing(false);
      return;
    }

    try {
      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumberElement,
        billing_details: {
          name: paymentData.full_name,
          email: paymentData.email,
          phone: paymentData.phone,
        },
      });

      if (error) {
        console.error('Payment method creation error:', error);
        setCardError(error.message || 'Errore durante la creazione del metodo di pagamento');
        onPaymentError(error.message || 'Errore pagamento');
      } else {
        console.log('✅ Payment method created:', paymentMethod.id);
        onPaymentSuccess(paymentMethod.id);
      }
    } catch (err: any) {
      console.error('Payment processing error:', err);
      setCardError('Errore durante il processamento del pagamento');
      onPaymentError(err.message || 'Errore sconosciuto');
    } finally {
      setProcessing(false);
    }
  };

  const handleCardChange = (event: any) => {
    if (event.error) {
      setCardError(event.error.message);
    } else {
      setCardError(null);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Pagamento Sicuro
        </CardTitle>
        <div className="text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4 text-green-600" />
            Protetto da crittografia SSL
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Riepilogo ordine */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-medium mb-2">Riepilogo Ordine</h3>
          <div className="flex justify-between items-center">
            <span>{paymentData.plan_name}</span>
            <span className="font-bold">€{paymentData.amount}/mese</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Fatturazione mensile ricorrente
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Numero Carta */}
          <div>
            <Label htmlFor="cardNumber">Numero Carta</Label>
            <div className="mt-1 p-3 border border-gray-300 rounded-md focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
              <CardNumberElement
                id="cardNumber"
                options={CARD_ELEMENT_OPTIONS}
                onChange={handleCardChange}
              />
            </div>
          </div>

          {/* Scadenza e CVC */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cardExpiry">Scadenza</Label>
              <div className="mt-1 p-3 border border-gray-300 rounded-md focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                <CardExpiryElement
                  id="cardExpiry"
                  options={CARD_ELEMENT_OPTIONS}
                  onChange={handleCardChange}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="cardCvc">CVC</Label>
              <div className="mt-1 p-3 border border-gray-300 rounded-md focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                <CardCvcElement
                  id="cardCvc"
                  options={CARD_ELEMENT_OPTIONS}
                  onChange={handleCardChange}
                />
              </div>
            </div>
          </div>

          {/* Error display */}
          {cardError && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {cardError}
            </div>
          )}

          {/* Submit button */}
          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-medium"
            disabled={!stripe || processing || isLoading}
          >
            {processing || isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Processando pagamento...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Paga €{paymentData.amount}/mese
              </div>
            )}
          </Button>

          {/* Security badges */}
          <div className="flex items-center justify-center gap-4 pt-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              SSL Sicuro
            </div>
            <div>•</div>
            <div>Powered by Stripe</div>
            <div>•</div>
            <div>PCI DSS</div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Wrapper component with Stripe Elements provider
export default function StripePaymentForm(props: StripePaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
}