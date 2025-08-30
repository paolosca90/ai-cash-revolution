import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  Brain, 
  TrendingUp, 
  Zap, 
  Shield, 
  DollarSign, 
  BarChart3, 
  Rocket, 
  Users, 
  Star,
  Play,
  CheckCircle,
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: "AI Avanzata",
      description: "Intelligenza artificiale che analizza 100+ indicatori tecnici e flussi di mercato in tempo reale"
    },
    {
      icon: TrendingUp,
      title: "Segnali Precisi",
      description: "Sistema di confidenza multi-livello con valutazione fino a A+"
    },
    {
      icon: Zap,
      title: "Esecuzione Veloce",
      description: "Esecuzione automatica dei trade con connessione diretta a MT5"
    },
    {
      icon: Shield,
      title: "Risk Management",
      description: "Sistema intelligente di gestione del rischio con stop loss/take profit"
    }
  ];

  const stats = [
    { value: "98%", label: "Accuracy AI" },
    { value: "150+", label: "Asset Supportati" },
    { value: "24/7", label: "Trading Automatico" },
    { value: "0.1%", label: "Commissioni Basse" }
  ];

  const testimonials = [
    {
      name: "Marco R.",
      role: "Trader Professionista",
      content: "Ho triplicato le mie performance con il sistema AI. La precisione dei segnali è incredibile!",
      rating: 5
    },
    {
      name: "Sofia M.",
      role: "Investitore Privato",
      content: "Finalmente un sistema che mi permette di dormire sonni tranquilli mentre il trading va avanti automaticamente.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDIwIDAgTCAwIDIwIE0gNDAgMCBMIDAgNDAgTSA2MCAwIEwgMCA2MCBNIDgwIDAgTCAwIDgwIE0gMTAwIDAgTCAwIDEwMCBNIDEyMCAwIEwgMCAxMjAgTSAxNDAgMCBMIDAgMTQwIE0gMTYwIDAgTCAwIDE2MCBNIDE4MCAwIEwgMCAxODAgTSAyMDAgMCBMIDAgMjAwIiBzdHJva2U9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIgLz48L3N2Zz4=')] opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
                <Sparkles className="h-4 w-4" />
                <span>Nuova Versione 3.0 - Con Analisi Istituzionale</span>
              </div>
              
              <div>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  Trading AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Avanzato</span>
                </h1>
                <p className="mt-6 text-xl text-blue-100 max-w-2xl">
                  Piattaforma all-in-one per trading automatizzato con intelligenza artificiale, 
                  analisi tecnica avanzata e connessione MT5 diretta.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-lg py-6 px-8 rounded-xl"
                  onClick={() => navigate('/login')}
                >
                  <Rocket className="h-5 w-5 mr-2" />
                  Accedi alla Demo
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 text-lg py-6 px-8 rounded-xl"
                  onClick={() => navigate('/subscribe')}
                >
                  <Play className="h-5 w-5 mr-2" />
                  Vedi Piani
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-cyan-400">{stat.value}</div>
                    <div className="text-sm text-blue-200 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -top-4 -right-4 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
              <Card className="relative backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-200">Segnale AI in Tempo Reale</span>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        LIVE
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">EURUSD</span>
                        <span className="text-green-400 font-bold">LONG ↑</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-blue-200">Confidenza</div>
                          <div className="font-bold text-cyan-400">92% (A+)</div>
                        </div>
                        <div>
                          <div className="text-blue-200">RR Ratio</div>
                          <div className="font-bold text-green-400">1:2.8</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Entry: 1.0845</span>
                          <span className="text-green-400">TP: 1.0920</span>
                        </div>
                        <div className="w-full bg-blue-900/50 rounded-full h-2">
                          <div className="bg-gradient-to-r from-cyan-500 to-green-500 h-2 rounded-full w-4/5"></div>
                        </div>
                        <div className="text-xs text-right text-green-400">Profitto: +45.2 pips</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Come Funziona in 3 Semplici Passi
            </h2>
            <p className="text-xl text-gray-600">
              Dal setup alla prima operazione in meno di 10 minuti
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Registrati e Accedi</h3>
              <p className="text-gray-600 mb-4">
                Crea il tuo account gratuito e accedi alla piattaforma demo. 
                Nessuna carta di credito richiesta per iniziare.
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate('/register')}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                Registrati Ora
              </Button>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Connetti MT5</h3>
              <p className="text-gray-600 mb-4">
                Collega il tuo account MetaTrader 5 (demo o reale) seguendo 
                la nostra guida passo-passo integrata.
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate('/mt5-setup')}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                Vedi Guida MT5
              </Button>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Trading Automatico</h3>
              <p className="text-gray-600 mb-4">
                Attiva l'AI e inizia a ricevere segnali automatici. 
                Monitora tutto dalla dashboard in tempo reale.
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate('/login')}
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                Inizia Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tecnologia All'avanguardia
            </h2>
            <p className="text-xl text-gray-600">
              Una piattaforma completa che unisce AI, analisi tecnica avanzata e risk management
              per massimizzare i tuoi risultati di trading.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-gray-50 to-white">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Risultati Concreti, Verificabili
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                La nostra piattaforma ha dimostrato risultati superiori nel tempo, 
                con un win rate medio del 78% e un profit factor di 2.3.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Backtesting Verificato</div>
                    <div className="text-gray-600">Oltre 10.000 trade testati negli ultimi 2 anni</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Analisi Istituzionale</div>
                    <div className="text-gray-600">Riconoscimento avanzato di Order Blocks e Fair Value Gaps</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Adattamento Automatico</div>
                    <div className="text-gray-600">AI che si adatta continuamente alle condizioni di mercato</div>
                  </div>
                </div>
              </div>
              
              <Button 
                size="lg" 
                className="mt-8 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-lg py-6 px-8 rounded-xl"
                onClick={() => navigate('/ml')}
              >
                Vedi Performance Dettagliate
              </Button>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Performance Ultimi 30 Giorni</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Profitto Totale</span>
                    <span className="font-bold text-green-600">+12.47%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full w-full"></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Win Rate</span>
                    <span className="font-bold text-blue-600">78%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full w-4/5"></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Profit Factor</span>
                    <span className="font-bold text-purple-600">2.3</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full w-11/12"></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">47</div>
                    <div className="text-sm text-gray-600">Trade Vinti</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">13</div>
                    <div className="text-sm text-gray-600">Trade Persi</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">98%</div>
                    <div className="text-sm text-gray-600">Accuracy AI</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Cosa Dicono i Nostri Utenti
            </h2>
            <p className="text-xl text-gray-600">
              Migliaia di trader stanno già ottenendo risultati straordinari
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-purple-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto a Rivoluzionare il Tuo Trading?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Unisciti a migliaia di trader che stanno già utilizzando la nostra piattaforma 
            per ottenere risultati straordinari nel trading automatico.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-blue-900 hover:bg-blue-50 text-lg py-6 px-8 rounded-xl font-bold"
              onClick={() => navigate('/login')}
            >
              <Rocket className="h-5 w-5 mr-2" />
              Prova Demo Gratuita
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white/10 text-lg py-6 px-8 rounded-xl"
              onClick={() => navigate('/subscribe')}
            >
              <Users className="h-5 w-5 mr-2" />
              Vedi Piani e Prezzi
            </Button>
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-blue-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Nessun impegno
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Cancellazione in qualsiasi momento
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Supporto 24/7
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}