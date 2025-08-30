import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Check, Zap, Shield, Headphones, TrendingUp, ArrowLeft } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  vps_included: boolean;
  max_concurrent_trades: number;
  max_symbols: number;
  popular?: boolean;
}

const PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter Plan',
    price: 29,
    features: ['Trading automatico 24/7', 'VPS dedicato incluso', 'Supporto email', '3 simboli trading', 'Dashboard web + mobile'],
    vps_included: true,
    max_concurrent_trades: 3,
    max_symbols: 3
  },
  {
    id: 'professional',
    name: 'Professional Plan', 
    price: 59,
    features: ['Trading automatico 24/7', 'VPS dedicato incluso', 'Supporto prioritario', '10 simboli trading', 'Strategie avanzate', 'Analisi AI potenziata'],
    vps_included: true,
    max_concurrent_trades: 10,
    max_symbols: 10,
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: 119,
    features: ['Trading automatico 24/7', 'VPS dedicato incluso', 'Supporto telefonico', 'Simboli illimitati', 'Strategie personalizzate', 'API completa', 'Account manager dedicato'],
    vps_included: true,
    max_concurrent_trades: -1,
    max_symbols: -1
  }
];

const Subscribe: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string>('professional');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Plan selection, 2: User details, 3: MT5 config, 4: Payment
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    mt5_login: '',
    mt5_password: '',
    mt5_server: '',
    mt5_broker: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubscribe = async (paymentMethodId: string) => {
    setIsLoading(true);
    
    try {
      // Validazione
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Le password non coincidono');
      }

      if (!formData.email || !formData.full_name || !formData.mt5_login) {
        throw new Error('Compila tutti i campi obbligatori');
      }

      if (!paymentMethodId) {
        throw new Error('Dati carta di credito richiesti');
      }

      // Crea abbonamento con pagamento Stripe
      const response = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          plan_id: selectedPlan,
          mt5_config: {
            login: formData.mt5_login,
            password: formData.mt5_password,
            server: formData.mt5_server,
            broker: formData.mt5_broker
          },
          payment_method_id: paymentMethodId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Successo - mostra conferma e reindirizza
        alert(`✅ Abbonamento attivato! VPS sarà pronto in ${result.vps?.estimated_ready || '10-15 minuti'}`);
        
        // Salva dati utente E token di autenticazione
        localStorage.setItem('auth_token', result.auth_token || 'demo-token-subscription');
        localStorage.setItem('user_data', JSON.stringify({
          id: result.user.id,
          email: result.user.email,
          plan: result.user.plan,
          subscription_active: true
        }));
        
        // Force page refresh to trigger authentication check
        window.location.href = '/dashboard?welcome=true&payment=success';
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      alert(`❌ Errore: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const PlanCard = ({ plan }: { plan: SubscriptionPlan }) => (
    <Card className={`relative cursor-pointer transition-all ${selectedPlan === plan.id ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'} ${plan.popular ? 'border-blue-500' : ''}`}
          onClick={() => setSelectedPlan(plan.id)}>
      {plan.popular && (
        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
          PIÙ POPOLARE
        </Badge>
      )}
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
        <div className="text-3xl font-bold text-blue-600">
          €{plan.price}<span className="text-sm text-gray-500">/mese</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {plan.features.map((feature, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className="text-sm">{feature}</span>
          </div>
        ))}
        
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
            <Zap className="w-4 h-4" />
            Setup automatico in 2-5 minuti
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <Shield className="w-4 h-4" />
            VPS dedicato incluso (valore €15/mese)
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="container mx-auto px-4">
          {/* Back to Home */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alla Home
            </Button>
          </div>
          
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Inizia il Tuo Trading Automatico
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Setup completo in un click. VPS dedicato, MT5 configurato, trading attivo in 5 minuti.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {PLANS.map(plan => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>

          <div className="text-center mt-8 space-y-4">
            <Button 
              onClick={() => setStep(2)} 
              size="lg" 
              className="px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700"
            >
              Continua con {PLANS.find(p => p.id === selectedPlan)?.name}
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-3">
                Garanzia 30 giorni soddisfatti o rimborsati
              </p>
              
              <div className="border-t pt-6">
                <p className="text-sm text-gray-600 mb-3">
                  Vuoi testare la piattaforma prima di abbonarti?
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/login')}
                    className="px-6"
                  >
                    Accedi alla Demo Gratuita
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={() => navigate('/register')}
                    className="px-6"
                  >
                    Crea Account Demo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="container mx-auto px-4 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Crea il Tuo Account</CardTitle>
              <p className="text-center text-gray-600">
                Piano selezionato: <strong>{PLANS.find(p => p.id === selectedPlan)?.name}</strong>
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="la-tua-email@esempio.com"
                />
              </div>
              
              <div>
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input 
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Mario Rossi"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefono</Label>
                <Input 
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+39 123 456 7890"
                />
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <Input 
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Password sicura"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Conferma Password *</Label>
                <Input 
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Ripeti la password"
                />
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Indietro
                </Button>
                <Button 
                  onClick={() => setStep(3)} 
                  className="flex-1"
                  disabled={!formData.email || !formData.full_name || !formData.password}
                >
                  Continua
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="container mx-auto px-4 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Configurazione MetaTrader 5</CardTitle>
              <p className="text-center text-gray-600">
                Inserisci i dati del tuo account MT5
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mt5_login">Account MT5 *</Label>
                <Input 
                  id="mt5_login"
                  value={formData.mt5_login}
                  onChange={(e) => handleInputChange('mt5_login', e.target.value)}
                  placeholder="12345678"
                />
              </div>

              <div>
                <Label htmlFor="mt5_password">Password MT5 *</Label>
                <Input 
                  id="mt5_password"
                  type="password"
                  value={formData.mt5_password}
                  onChange={(e) => handleInputChange('mt5_password', e.target.value)}
                  placeholder="Password del tuo account MT5"
                />
              </div>

              <div>
                <Label htmlFor="mt5_server">Server MT5 *</Label>
                <Input 
                  id="mt5_server"
                  value={formData.mt5_server}
                  onChange={(e) => handleInputChange('mt5_server', e.target.value)}
                  placeholder="es. ICMarkets-Demo, XMGlobal-Demo"
                />
              </div>

              <div>
                <Label htmlFor="mt5_broker">Nome Broker</Label>
                <Input 
                  id="mt5_broker"
                  value={formData.mt5_broker}
                  onChange={(e) => handleInputChange('mt5_broker', e.target.value)}
                  placeholder="es. IC Markets, XM, Exness"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 font-medium mb-2">
                  <Shield className="w-4 h-4" />
                  Le tue credenziali sono sicure
                </div>
                <p className="text-sm text-blue-600">
                  I dati MT5 vengono criptati e utilizzati solo per configurare automaticamente il tuo VPS di trading.
                </p>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Indietro
                </Button>
                <Button 
                  onClick={() => setStep(4)} 
                  className="flex-1"
                  disabled={!formData.mt5_login || !formData.mt5_password || !formData.mt5_server}
                >
                  Continua al Pagamento
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 4: Riepilogo e pagamento
  const selectedPlanDetails = PLANS.find(p => p.id === selectedPlan)!;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Conferma e Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Riepilogo ordine */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Riepilogo Ordine</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Piano: {selectedPlanDetails.name}</span>
                  <span>€{selectedPlanDetails.price}/mese</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>VPS Trading incluso</span>
                  <span>GRATIS (valore €15)</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Setup automatico</span>
                  <span>GRATIS (valore €50)</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-medium text-lg">
                  <span>Totale primo mese:</span>
                  <span>€{selectedPlanDetails.price}</span>
                </div>
              </div>
            </div>

            {/* Dati utente */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">I Tuoi Dati</h3>
              <div className="space-y-1 text-sm">
                <div><strong>Email:</strong> {formData.email}</div>
                <div><strong>Nome:</strong> {formData.full_name}</div>
                <div><strong>Account MT5:</strong> {formData.mt5_login}</div>
                <div><strong>Server:</strong> {formData.mt5_server}</div>
              </div>
            </div>

            {/* Cosa succede dopo */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2 text-green-800">Cosa succede dopo il pagamento:</h3>
              <div className="space-y-2 text-sm text-green-700">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>VPS creato automaticamente (2-3 minuti)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>MT5 configurato con le tue credenziali</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>Trading automatico attivato 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4" />
                  <span>Email di conferma con accesso dashboard</span>
                </div>
              </div>
            </div>

            {/* Demo Payment Form */}
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-blue-700 font-medium">Demo Mode</p>
                <p className="text-sm text-blue-600">
                  Clicca per simulare il pagamento e accedere alla piattaforma
                </p>
              </div>
              
              <Button 
                onClick={() => {
                  // Simulate payment success with proper authentication
                  localStorage.setItem("auth_token", "demo-token-subscription");
                  localStorage.setItem('user_data', JSON.stringify({
                    id: `demo-${Date.now()}`,
                    email: formData.email,
                    full_name: formData.full_name,
                    plan: selectedPlan,
                    subscription_active: true,
                    mt5_configured: true
                  }));
                  // Force full page reload to trigger authentication check
                  window.location.href = '/dashboard?welcome=true&payment=demo';
                }}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                Simula Pagamento e Accedi
              </Button>
            </div>

            <div className="flex gap-4 mt-4">
              <Button variant="outline" onClick={() => setStep(3)} disabled={isLoading}>
                Indietro
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Cliccando su "Paga" accetti i nostri <a href="/terms" className="text-blue-600">Termini di Servizio</a> e 
              l'<a href="/privacy" className="text-blue-600">Informativa sulla Privacy</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Subscribe;