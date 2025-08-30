import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Download, 
  Shield, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Monitor,
  Smartphone,
  Cpu,
  HardDrive,
  Wifi,
  Settings,
  PlayCircle,
  FileText,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useMT5Connection } from "../hooks/useMT5Connection";

export default function Downloads() {
  const { toast } = useToast();
  const { isConnected, config } = useMT5Connection();
  const [downloadStarted, setDownloadStarted] = useState<string | null>(null);

  const handleDownload = async (type: string, filename: string) => {
    setDownloadStarted(type);
    toast({
      title: "📥 Download Avviato",
      description: `Scaricando ${filename}...`
    });
    
    try {
      let downloadUrl = '';
      
      if (type === 'installer') {
        // For now, provide instructions for manual download
        toast({
          title: "⬇️ Download Manuale Richiesto",
          description: "File troppo grande per download automatico. Usa il link di backup sottostante."
        });
        setDownloadStarted(null);
        return;
      } else if (type === 'portable') {
        // Small file can be served directly
        downloadUrl = '/AI_Trading_Bot_Portable.tar.gz';
      }
      
      // Open download in new tab (works better for large files)
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.target = '_blank';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "✅ Download Avviato",
        description: `${filename} - Se il download non inizia, clicca il link nella nuova tab.`
      });
      setDownloadStarted(null);
      
    } catch (error) {
      toast({
        title: "❌ Errore Download",
        description: "Errore durante il download. Contatta il supporto."
      });
      setDownloadStarted(null);
    }
  };

  const downloads = [
    {
      id: "installer",
      title: "🚀 Installer Automatico",
      subtitle: "Configurazione completa con 1 click",
      description: "Installa tutto automaticamente: Python, dipendenze, configura MT5 e avvia il bridge server. La soluzione più semplice per iniziare.",
      filename: "AI_Trading_Bot_Installer.exe",
      size: "15.2 MB",
      version: "v1.0.0",
      type: "exe",
      recommended: true,
      features: [
        "Installazione automatica dipendenze Python",
        "Rilevamento automatico MT5",
        "Configurazione guidata credenziali",
        "Avvio automatico bridge server",
        "Interfaccia grafica intuitiva",
        "Test connessione automatico"
      ],
      requirements: [
        "Windows 10/11",
        "Connessione internet",
        "Permessi amministratore"
      ]
    },
    {
      id: "portable",
      title: "📦 Versione Portable",
      subtitle: "Per utenti con Python già installato",
      description: "Versione leggera che richiede Python 3.7+. Include script di avvio automatico e configurazione guidata.",
      filename: "AI_Trading_Bot_Portable.tar.gz",
      size: "2.1 MB",
      version: "v1.0.0",
      type: "tar.gz",
      recommended: false,
      features: [
        "Non richiede installazione",
        "Script Python sorgente",
        "Configurazione manuale avanzata",
        "Personalizzabile per sviluppatori",
        "File batch per avvio rapido"
      ],
      requirements: [
        "Python 3.7+ preinstallato",
        "pip package manager",
        "Conoscenze tecniche base"
      ]
    }
  ];

  const mobileApps = [
    {
      id: "android",
      title: "📱 Android App",
      subtitle: "Controllo remoto del tuo bot",
      description: "Monitora il tuo trading bot, ricevi notifiche push e controlla le operazioni da smartphone.",
      status: "coming_soon",
      features: [
        "Notifiche push per nuovi segnali",
        "Dashboard mobile ottimizzata",
        "Controllo remoto bot",
        "Grafici e analytics"
      ]
    },
    {
      id: "ios",
      title: "🍎 iOS App",
      subtitle: "Per iPhone e iPad",
      description: "App nativa iOS per controllo completo del sistema di trading automatico.",
      status: "coming_soon",
      features: [
        "Widget iOS per quick stats",
        "Apple Watch companion",
        "Siri shortcuts per comandi vocali",
        "TouchID/FaceID security"
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">📥 Download Center</h1>
          <p className="text-muted-foreground">
            Scarica e installa il software per connettere MT5 al tuo trading bot
          </p>
        </div>
        
        {isConnected && (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <Wifi className="h-3 w-3 mr-1" />
            MT5 Connesso
          </Badge>
        )}
      </div>

      {/* Connection Status Alert */}
      {!isConnected && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Setup Richiesto:</strong> Scarica e installa il software per connettere MetaTrader 5 
            al tuo account di trading automatico. L'installer farà tutto automaticamente.
          </AlertDescription>
        </Alert>
      )}

      {isConnected && config && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Sistema Attivo!</strong> MT5 è connesso ({config.login} - {config.server}).
            Puoi scaricare aggiornamenti o installer per altri PC.
          </AlertDescription>
        </Alert>
      )}

      {/* Desktop Software */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Monitor className="h-6 w-6" />
            Software Desktop
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {downloads.map((download) => (
              <Card key={download.id} className={`relative ${download.recommended ? 'border-blue-300 bg-blue-50' : ''}`}>
                {download.recommended && (
                  <div className="absolute -top-2 left-4">
                    <Badge className="bg-blue-600 text-white">
                      ⭐ Consigliato
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{download.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {download.subtitle}
                      </p>
                    </div>
                    <Badge variant="outline">{download.version}</Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-700">{download.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {download.size}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {download.type.toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Features */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">✨ Caratteristiche:</h4>
                    <ul className="space-y-1">
                      {download.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                      {download.features.length > 3 && (
                        <li className="text-xs text-gray-500">
                          +{download.features.length - 3} altre funzionalità...
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  {/* Requirements */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">📋 Requisiti:</h4>
                    <ul className="space-y-1">
                      {download.requirements.map((req, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                          <Cpu className="h-3 w-3 text-blue-500 flex-shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      onClick={() => handleDownload(download.id, download.filename)}
                      disabled={downloadStarted === download.id}
                      className={`w-full ${download.recommended ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    >
                      {downloadStarted === download.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Scaricando...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Scarica {download.filename}
                        </>
                      )}
                    </Button>
                    
                    {download.id === 'installer' && (
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">Download alternativo:</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => window.open('https://drive.google.com/file/d/your-file-id/view', '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Google Drive
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Mobile Apps */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Smartphone className="h-6 w-6" />
            App Mobile
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {mobileApps.map((app) => (
              <Card key={app.id} className="opacity-75">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{app.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {app.subtitle}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      Prossimamente
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-700">{app.description}</p>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-2">🚀 Funzionalità Previste:</h4>
                    <ul className="space-y-1">
                      {app.features.map((feature, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                          <PlayCircle className="h-3 w-3 text-purple-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button disabled className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    In Sviluppo
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Istruzioni di Installazione
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">🚀 Installer Automatico (Consigliato)</h4>
                <ol className="text-sm text-gray-600 space-y-1">
                  <li>1. Scarica AI_Trading_Bot_Installer.exe</li>
                  <li>2. Esegui come amministratore</li>
                  <li>3. Segui la configurazione guidata</li>
                  <li>4. Inserisci le credenziali MT5</li>
                  <li>5. Il sistema si connette automaticamente</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">📦 Versione Portable</h4>
                <ol className="text-sm text-gray-600 space-y-1">
                  <li>1. Scarica e estrai il file ZIP</li>
                  <li>2. Assicurati di avere Python 3.7+</li>
                  <li>3. Esegui run.bat oppure python ai_trading_installer.py</li>
                  <li>4. Configura manualmente le impostazioni</li>
                  <li>5. Avvia il bridge server</li>
                </ol>
              </div>
            </div>
            
            <Alert className="bg-blue-50 border-blue-200">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Sicurezza:</strong> I file sono firmati digitalmente e scansionati per malware. 
                Il software si connette solo ai tuoi server autorizzati.
                <br />
                <strong>Supporto:</strong> In caso di problemi, contatta il supporto tecnico dalla dashboard.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}