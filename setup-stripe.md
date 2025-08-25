# Setup Stripe per Pagamenti Automatici

## 🎯 Stripe Setup (10 minuti)

### Step 1: Crea Account Stripe
1. **Vai su**: https://stripe.com
2. **Create account** con email business
3. **Attiva account**: Completa verifica identità e business
4. **Country**: Italia (per EUR automatici)

### Step 2: Ottieni API Keys
1. **Dashboard Stripe** → **Developers** → **API Keys**
2. **Copia queste chiavi**:
   - **Publishable Key**: `pk_live_...` (per frontend)
   - **Secret Key**: `sk_live_...` (per backend)

### Step 3: Crea Products e Prices
1. **Products** → **Add Product**:

**Basic Plan:**
```
Name: Trading Bot Basic Plan
Price: €29/month
Recurring: Monthly
Price ID: price_basic_29_eur (Stripe lo genera)
```

**Premium Plan:**
```
Name: Trading Bot Premium Plan  
Price: €59/month
Recurring: Monthly
Price ID: price_premium_59_eur
```

**Enterprise Plan:**
```
Name: Trading Bot Enterprise Plan
Price: €119/month
Recurring: Monthly  
Price ID: price_enterprise_119_eur
```

### Step 4: Setup Webhooks
1. **Developers** → **Webhooks** → **Add endpoint**
2. **Endpoint URL**: `https://tuo-dominio.vercel.app/api/payments/webhook`
3. **Events to send**:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`

### Step 5: Configura Environment Variables
**Aggiungi su Vercel**:
```
STRIPE_PUBLISHABLE_KEY = pk_live_your_key_here
STRIPE_SECRET_KEY = sk_live_your_key_here
STRIPE_WEBHOOK_SECRET = whsec_your_webhook_secret
```

**Aggiungi Price IDs**:
```
STRIPE_PRICE_BASIC = price_basic_29_eur
STRIPE_PRICE_PREMIUM = price_premium_59_eur  
STRIPE_PRICE_ENTERPRISE = price_enterprise_119_eur
```

## 💳 Frontend Payment Component

### Step 6: Update Subscribe Page
Il form di pagamento richiede integrazione Stripe Elements per raccogliere carta di credito in modo sicuro.

```tsx
// Nel componente Subscribe.tsx
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Component per raccogliere pagamento
function PaymentForm({ planData, userData, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) return;
    
    const cardElement = elements.getElement(CardElement);
    
    // 1. Crea Payment Method
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: userData.full_name,
        email: userData.email,
      },
    });
    
    if (error) {
      console.error(error);
      return;
    }
    
    // 2. Invia al backend per creare abbonamento
    const response = await fetch('/api/payments/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...userData,
        payment_method_id: paymentMethod.id
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      onSuccess(result);
    } else {
      console.error(result.error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe}>
        Paga €{planData.price}/mese
      </button>
    </form>
  );
}
```

## 🔄 Workflow Completo

### Customer Journey:
1. **Cliente** sceglie piano Premium €59
2. **Inserisce** dati personali + MT5 credentials  
3. **Inserisce** carta di credito (Stripe Elements)
4. **Clicca** "Paga €59/mese"
5. **Sistema**:
   - Crea customer Stripe
   - Processa primo pagamento €59
   - Crea abbonamento ricorrente mensile
   - Salva cliente nel database
   - Crea VPS Contabo automaticamente
   - Invia email di benvenuto
6. **Cliente riceve** IP VPS + accesso dashboard
7. **Pagamenti automatici** ogni mese via Stripe

## 💰 Economics Finale

### Per ogni cliente Premium (€59/mese):
- **Incasso**: €59/mese (Stripe incassa per te)
- **Costi**: 
  - Stripe fee: €1.85 (3.2% + €0.25)
  - VPS Contabo: €10/mese
  - **Totale costi**: €11.85
- **PROFITTO**: €47.15/mese per cliente (80% margin!)

### Proiezione annuale:
- **10 clienti**: €5.658/anno
- **50 clienti**: €28.290/anno
- **100 clienti**: €56.580/anno

## ✅ Test Stripe

### Mode Test:
1. Usa **Test API Keys** per sviluppo
2. **Carte di test**: 4242 4242 4242 4242
3. Testa tutto il flusso senza soldi reali

### Go Live:
1. Switch a **Live API Keys**
2. **Attiva account** Stripe (verifica business)
3. Sistema pronto per incassare!

## 🚨 Compliance e Sicurezza

- ✅ **PCI DSS**: Stripe gestisce sicurezza carte
- ✅ **GDPR**: Dati processati in UE
- ✅ **SCA**: Strong Customer Authentication automatica
- ✅ **Fatturazione**: Stripe genera fatture automatiche
- ✅ **Rimborsi**: Gestibili da dashboard Stripe

**Sistema completo per incassare €47+ per cliente ogni mese! 💰**