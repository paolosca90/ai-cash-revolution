import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Settings, 
  Play,
  PlayCircle,
  ExternalLink,
  Zap,
  Shield,
  Terminal,
  FileText
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useMT5Connection } from "../hooks/useMT5Connection";

interface MT5Config {
  login: string;
  password: string;
  server: string;
  broker: string;
}

export default function MT5Setup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1); // 1: Guide, 2: Config
  
  // Use real MT5 connection hook
  const {
    config: savedConfig,
    testConnection,
    saveMT5Config,
    isValidating,
    mt5Status,
    isConnected
  } = useMT5Connection();
  
  const [config, setConfig] = useState<MT5Config>({
    login: savedConfig?.login || "",
    password: savedConfig?.password || "",
    server: savedConfig?.server || "",
    broker: savedConfig?.broker || ""
  });

  const handleConfigChange = (field: keyof MT5Config, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleTestConnection = async () => {
    const success = await testConnection(config);
    if (success) {
      // Connection successful, now save the config
      saveMT5Config(config);
    }
  };

  const saveAndContinue = () => {
    saveMT5Config(config);
    navigate('/dashboard');
  };

  const MT5Guide = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Configurazione MT5
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Setup automatico con 1 click! Il nostro installer configura tutto per te: 
          Python, dipendenze, bridge server e connessione MT5. Bastano 5 minuti.
        </p>
      </div>

      {/* Panoramica Flusso Completo */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <PlayCircle className="h-5 w-5" />
            🚀 Flusso Completo per Nuovo Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">1</div>
              <h4 className="font-semibold text-sm">Download</h4>
              <p className="text-xs text-gray-600">Scarica installer automatico (15.2MB)</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">2</div>
              <h4 className="font-semibold text-sm">Setup Automatico</h4>
              <p className="text-xs text-gray-600">Installa Python + dipendenze + bridge</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">3</div>
              <h4 className="font-semibold text-sm">Trading Live</h4>
              <p className="text-xs text-gray-600">Inserisci credenziali MT5 e inizia</p>
            </div>
          </div>
          
          <Alert className="bg-blue-50 border-blue-200">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Vantaggi:</strong> ✅ Setup con 1 Click ✅ Zero Configurazione Manuale ✅ Sicurezza Locale 
              ✅ Trading in Tempo Reale ✅ Interface Moderna
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Download className="h-5 w-5" />
              1. Scarica MT5
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Se non hai già MetaTrader 5, scaricalo dal sito ufficiale del tuo broker.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('https://www.metatrader5.com/en/download', '_blank')}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Scarica MT5
            </Button>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Settings className="h-5 w-5" />
              2. Abilita Trading Automatico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              In MT5, vai su Strumenti → Opzioni → Expert Advisor e abilita:
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>✓ Consenti trading automatico</li>
              <li>✓ Consenti importazione DLL</li>
              <li>✓ Consenti WebRequest</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Shield className="h-5 w-5" />
              3. Account Demo (Consigliato)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Per iniziare, usa un account demo per testare le strategie AI senza rischi.
            </p>
            <div className="space-y-1 text-xs text-gray-600">
              <div>✅ Fondi virtuali illimitati</div>
              <div>✅ Testa tutte le funzionalità</div>
              <div>✅ Passa al live quando sei pronto</div>
            </div>
            <Badge className="bg-purple-100 text-purple-800">
              Nessun rischio reale
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Terminal className="h-5 w-5" />
              4. Installer Automatico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Il nostro installer configura automaticamente tutto il necessario per il trading.
            </p>
            <div className="space-y-1 text-xs text-gray-600">
              <div>🔧 Installa Python 3.7+ automaticamente</div>
              <div>📦 Configura tutte le dipendenze</div>
              <div>🌉 Avvia bridge server MT5</div>
              <div>🔗 Testa connessione automatica</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Architettura del Sistema */}
      <Card className="border-indigo-200 bg-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-800">
            <Zap className="h-5 w-5" />
            🔧 Come Funziona il Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-indigo-200">
            <h4 className="font-semibold text-indigo-900 mb-3">Architettura del Sistema:</h4>
            <div className="flex items-center justify-center space-x-2 text-sm">
              <div className="bg-blue-100 px-3 py-2 rounded">Web App Frontend</div>
              <span>←→</span>
              <div className="bg-green-100 px-3 py-2 rounded">Backend API</div>
              <span>←→</span>
              <div className="bg-purple-100 px-3 py-2 rounded">Bridge Server</div>
              <span>←→</span>
              <div className="bg-orange-100 px-3 py-2 rounded">MetaTrader 5</div>
            </div>
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 mt-2">
              <span>(React)</span>
              <span></span>
              <span>(Node.js)</span>
              <span></span>
              <span>(Python)</span>
              <span></span>
              <span>(Desktop)</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm mb-2 text-indigo-800">📊 Dashboard Operativa</h4>
              <ul className="space-y-1 text-xs text-gray-700">
                <li>• Segnali AI in tempo reale</li>
                <li>• Posizioni MT5 live</li>
                <li>• Performance del portafoglio</li>
                <li>• Controlli risk management</li>
                <li>• Analytics ML e predizioni</li>
                <li>• Storico operazioni</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2 text-indigo-800">🔄 Flusso dei Dati</h4>
              <ol className="space-y-1 text-xs text-gray-700">
                <li>1. Frontend invia richieste al backend</li>
                <li>2. Backend comunica con bridge server (porta 8080)</li>
                <li>3. Bridge Python esegue operazioni su MT5</li>
                <li>4. Risultati tornano al frontend</li>
                <li>5. Dashboard si aggiorna in tempo reale</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Automatico */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Settings className="h-5 w-5" />
            ⚡ Setup Automatico (Raccomandato)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-3">Cosa fa l'installer automatico:</h4>
            <div className="space-y-2 text-sm text-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Rileva se Python è installato (se no, lo installa automaticamente)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Installa dipendenze: <code className="bg-green-100 px-1 rounded text-xs">MetaTrader5 flask flask-cors pandas</code></span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Configura e avvia automaticamente il bridge server sulla porta 8080</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Testa la connessione con MT5 e mostra lo stato</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Crea servizio Windows per avvio automatico</span>
              </div>
            </div>
          </div>

          <Alert className="bg-green-100 border-green-200">
            <Shield className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Sicurezza Garantita:</strong> Il bridge server rimane locale sul tuo PC. 
              Le credenziali MT5 non vengono mai inviate online. Controllo completo sui tuoi dati.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Prossimi Passi */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <PlayCircle className="h-5 w-5" />
            🎯 Prossimi Passi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
              <div>
                <h4 className="font-semibold text-blue-900">Vai alla pagina Downloads</h4>
                <p className="text-sm text-blue-700">Scarica l'installer automatico AI_Trading_Bot_Installer.exe (15.2MB)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
              <div>
                <h4 className="font-semibold text-blue-900">Esegui l'installer</h4>
                <p className="text-sm text-blue-700">L'installer configura tutto automaticamente in 2-3 minuti</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</div>
              <div>
                <h4 className="font-semibold text-blue-900">Configura credenziali MT5</h4>
                <p className="text-sm text-blue-700">Inserisci login, password e server del tuo account MT5</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">4</div>
              <div>
                <h4 className="font-semibold text-blue-900">Inizia il Trading AI!</h4>
                <p className="text-sm text-blue-700">La dashboard si attiva e puoi iniziare a vedere i segnali in tempo reale</p>
              </div>
            </div>
          </div>

          <Alert className="bg-blue-100 border-blue-300">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Importante:</strong> Usa sempre un account MT5 demo per i primi test. 
              Il sistema è completamente sicuro e locale - le tue credenziali non lasciano mai il tuo PC.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="text-center space-y-3">
        <Button 
          onClick={() => navigate('/downloads')}
          size="lg"
          className="bg-green-600 hover:bg-green-700 mr-3"
        >
          <Download className="h-4 w-4 mr-2" />
          Vai ai Downloads
        </Button>
        <Button 
          onClick={() => setStep(2)}
          size="lg"
          variant="outline"
          className="border-blue-300 text-blue-700 hover:bg-blue-50"
        >
          Configura Manualmente
          <Play className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const ConfigForm = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Connetti il Tuo Account MT5
        </h1>
        <p className="text-gray-600">
          Inserisci i dati del tuo account MetaTrader 5
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurazione Account MT5
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="login">Login MT5</Label>
              <Input
                id="login"
                placeholder="es. 1234567"
                value={config.login}
                onChange={(e) => handleConfigChange('login', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="server">Server</Label>
              <Input
                id="server"
                placeholder="es. Demo-Server"
                value={config.server}
                onChange={(e) => handleConfigChange('server', e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Password MT5"
                value={config.password}
                onChange={(e) => handleConfigChange('password', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="broker">Broker</Label>
              <Input
                id="broker"
                placeholder="es. XM, FXTM, IC Markets"
                value={config.broker}
                onChange={(e) => handleConfigChange('broker', e.target.value)}
              />
            </div>
          </div>

          {/* Real MT5 Connection Status */}
          {isConnected && mt5Status?.accountInfo && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✅ <strong>MT5 Connesso!</strong><br/>
                Account: {mt5Status.accountInfo.name} | 
                Saldo: ${mt5Status.accountInfo.balance?.toFixed(2)} | 
                Server: {mt5Status.accountInfo.server}
              </AlertDescription>
            </Alert>
          )}

          {mt5Status?.error && !isConnected && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                ❌ <strong>Errore:</strong> {mt5Status.error}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button 
              onClick={handleTestConnection}
              disabled={isValidating || !config.login}
              className="flex-1"
            >
              {isValidating ? 'Testando...' : 'Testa Connessione MT5'}
            </Button>
            
            {isConnected && (
              <Button 
                onClick={saveAndContinue}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Salva e Vai al Trading
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800 mb-1">Per la Sicurezza</h3>
              <p className="text-sm text-yellow-700">
                I tuoi dati MT5 sono crittografati e memorizzati in sicurezza. 
                Non condividiamo mai le tue credenziali con terzi.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => step === 1 ? navigate(-1) : setStep(step - 1)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {step === 1 ? 'Indietro' : 'Passo Precedente'}
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'
            }`}>
              2
            </div>
          </div>
        </div>

        {step === 1 && <MT5Guide />}
        {step === 2 && <ConfigForm />}
      </div>
    </div>
  );
}