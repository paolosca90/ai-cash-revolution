import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink,
  Download,
  Play
} from 'lucide-react';
import { mt5Bridge } from '@/lib/mt5-bridge-detector';

interface MT5Status {
  available: boolean;
  connected?: boolean;
  account?: {
    login?: string;
    server?: string;
    balance?: number;
    equity?: number;
    currency?: string;
  };
  error?: string;
}

export default function MT5StatusCard() {
  const [status, setStatus] = useState<MT5Status>({
    available: false,
    connected: false
  });
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkMT5Status = async () => {
    setLoading(true);
    try {
      const bridgeResult = await mt5Bridge.detectLocalBridge();
      
      if (bridgeResult.available) {
        const accountInfo = await mt5Bridge.getAccountInfo();
        
        setStatus({
          available: true,
          connected: !!accountInfo,
          account: accountInfo,
        });
      } else {
        setStatus({
          available: false,
          connected: false,
          error: bridgeResult.error
        });
      }
    } catch (error) {
      setStatus({
        available: false,
        connected: false,
        error: error instanceof Error ? error.message : 'Connection check failed'
      });
    }
    
    setLastCheck(new Date());
    setLoading(false);
  };

  const handleConnect = async () => {
    setLoading(true);
    
    try {
      const result = await mt5Bridge.connectToMT5();
      
      if (result.success) {
        setStatus(prev => ({
          ...prev,
          connected: true,
          account: result.account
        }));
      } else {
        setStatus(prev => ({
          ...prev,
          connected: false,
          error: result.error
        }));
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }));
    }
    
    setLoading(false);
  };

  // Auto-check on component mount
  useEffect(() => {
    checkMT5Status();
    
    // Set up periodic checks
    const interval = setInterval(checkMT5Status, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = () => {
    if (loading) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Checking...
        </Badge>
      );
    }

    if (!status.available) {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800">
          <WifiOff className="h-3 w-3 mr-1" />
          Bridge Offline
        </Badge>
      );
    }

    if (status.connected && status.account) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Connected
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
        <Wifi className="h-3 w-3 mr-1" />
        Bridge Ready
      </Badge>
    );
  };

  const renderAccountInfo = () => {
    if (!status.connected || !status.account) return null;

    const account = status.account;
    
    return (
      <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
        <h4 className="font-semibold text-green-800 mb-2">Account Information</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-600">Login:</span>
            <span className="ml-2 font-mono">{account.login || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-600">Server:</span>
            <span className="ml-2">{account.server || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-600">Balance:</span>
            <span className="ml-2 font-semibold">
              {account.currency || '$'} {account.balance?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Equity:</span>
            <span className="ml-2">
              {account.currency || '$'} {account.equity?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderSetupInstructions = () => {
    if (status.available) return null;

    const instructions = mt5Bridge.getSetupInstructions();

    return (
      <div className="mt-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="mb-2">
              <strong>MT5 Bridge Setup Required</strong>
            </div>
            <div className="space-y-1 text-sm">
              {instructions.map((instruction, index) => (
                <div key={index} className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>{instruction}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.open('https://github.com/your-repo/releases', '_blank')}
              >
                <Download className="h-3 w-3 mr-1" />
                Download Installer
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.open('https://www.metatrader5.com/en/download', '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Get MetaTrader 5
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  const renderError = () => {
    if (!status.error) return null;

    return (
      <Alert className="mt-4 border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700">
          {status.error}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            MT5 Connection
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Controls */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={checkMT5Status}
            disabled={loading}
            className="flex-1"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
          
          {status.available && !status.connected && (
            <Button
              size="sm"
              onClick={handleConnect}
              disabled={loading}
              className="flex-1"
            >
              <Play className="h-3 w-3 mr-1" />
              Connect to MT5
            </Button>
          )}
        </div>

        {/* Last Check Timestamp */}
        {lastCheck && (
          <p className="text-xs text-gray-500">
            Last checked: {lastCheck.toLocaleTimeString()}
          </p>
        )}

        {/* Account Information */}
        {renderAccountInfo()}

        {/* Setup Instructions */}
        {renderSetupInstructions()}

        {/* Error Messages */}
        {renderError()}

        {/* Tips */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>💡 <strong>Tip:</strong> The MT5 bridge runs locally on your computer</div>
          <div>🔒 <strong>Security:</strong> Your MT5 credentials never leave your device</div>
        </div>
      </CardContent>
    </Card>
  );
}