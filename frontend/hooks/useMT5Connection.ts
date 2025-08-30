import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

export interface MT5Config {
  login: string;
  password: string;
  server: string;
  broker: string;
  path?: string; // Path to MT5 terminal
}

export interface MT5Status {
  isConnected: boolean;
  isValidating: boolean;
  accountInfo?: {
    balance: number;
    equity: number;
    margin: number;
    freeMargin: number;
    marginLevel: number;
    name: string;
    server: string;
    currency: string;
    leverage: number;
    company: string;
  };
  lastUpdate?: Date;
  error?: string;
}

export const useMT5Connection = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<MT5Config | null>(() => {
    const saved = localStorage.getItem('mt5_config');
    return saved ? JSON.parse(saved) : null;
  });

  // Check if we're in a Vercel deployment (production environment)
  const isVercelDeployment = import.meta.env.PROD && 
    (window.location.hostname.includes('vercel.app') || 
     window.location.hostname.includes('ai-cash-revolution'));

  // Check if MT5 terminal is running (for desktop app)
  const checkMT5Process = useCallback(async (): Promise<boolean> => {
    // In Vercel deployments, we can't access localhost resources
    if (isVercelDeployment) {
      return false;
    }
    
    try {
      // This would require a desktop app or browser extension
      // For now, we'll simulate this check
      return new Promise((resolve) => {
        // Check if we can connect to local MT5 Python server
        fetch('http://localhost:8080/api/mt5/status', {
          method: 'GET',
          timeout: 5000
        })
        .then(response => response.ok)
        .catch(() => false)
        .then(resolve);
      });
    } catch {
      return false;
    }
  }, [isVercelDeployment]);

  // Validate MT5 connection
  const validateConnection = useMutation({
    mutationFn: async (testConfig: MT5Config): Promise<MT5Status> => {
      if (!testConfig.login || !testConfig.server) {
        throw new Error('Login e server sono richiesti');
      }

      // In Vercel deployments, we can't validate local MT5 connections
      if (isVercelDeployment) {
        // Return mock data for demo purposes
        return {
          isConnected: true,
          isValidating: false,
          accountInfo: {
            balance: 10000,
            equity: 10000,
            margin: 0,
            freeMargin: 10000,
            marginLevel: 0,
            name: 'Demo Account',
            server: testConfig.server,
            currency: 'USD',
            leverage: 100,
            company: 'MetaQuotes Software Corp'
          },
          lastUpdate: new Date()
        };
      }

      // First check if MT5 is running locally
      const isLocalMT5Running = await checkMT5Process();
      
      if (!isLocalMT5Running) {
        throw new Error('MetaTrader 5 non è in esecuzione sul PC. Avvia MT5 e riprova.');
      }

      // Try to connect via local Python bridge
      try {
        const response = await fetch('http://localhost:8080/api/mt5/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            login: parseInt(testConfig.login),
            password: testConfig.password,
            server: testConfig.server
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Errore di connessione MT5');
        }

        const accountInfo = await response.json();
        
        return {
          isConnected: true,
          isValidating: false,
          accountInfo: accountInfo,
          lastUpdate: new Date()
        };

      } catch (error: any) {
        // If local connection fails, try cloud-based validation
        if (error.message.includes('fetch')) {
          throw new Error('Server MT5 locale non disponibile. Assicurati che il server Python sia attivo.');
        }
        throw error;
      }
    },
    onSuccess: (status: MT5Status) => {
      toast({
        title: "✅ MT5 Connesso!",
        description: `Account ${config?.login} connesso con successo`
      });
      queryClient.setQueryData(['mt5Status'], status);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Errore Connessione MT5",
        description: error.message
      });
    }
  });

  // Get current MT5 status
  const { data: mt5Status, isLoading: isCheckingStatus, refetch: recheckStatus } = useQuery<MT5Status>({
    queryKey: ['mt5Status'],
    queryFn: async (): Promise<MT5Status> => {
      if (!config) {
        return {
          isConnected: false,
          isValidating: false,
          error: 'Nessuna configurazione MT5 trovata'
        };
      }

      // In Vercel deployments, return mock data
      if (isVercelDeployment) {
        return {
          isConnected: true,
          isValidating: false,
          accountInfo: {
            balance: 10000,
            equity: 10250,
            margin: 1000,
            freeMargin: 9250,
            marginLevel: 1025,
            name: 'Demo Account',
            server: config.server,
            currency: 'USD',
            leverage: 100,
            company: 'MetaQuotes Software Corp'
          },
          lastUpdate: new Date()
        };
      }

      try {
        const response = await fetch('http://localhost:8080/api/mt5/account-info', {
          method: 'GET',
          timeout: 3000
        });

        if (response.ok) {
          const accountInfo = await response.json();
          return {
            isConnected: true,
            isValidating: false,
            accountInfo,
            lastUpdate: new Date()
          };
        } else {
          throw new Error('MT5 disconnesso');
        }
      } catch {
        return {
          isConnected: false,
          isValidating: false,
          error: 'MT5 non raggiungibile. Controlla che sia attivo.',
          lastUpdate: new Date()
        };
      }
    },
    enabled: !!config,
    refetchInterval: 30000, // Check every 30 seconds
    retry: 1,
  });

  // Save MT5 configuration
  const saveMT5Config = useCallback((newConfig: MT5Config) => {
    localStorage.setItem('mt5_config', JSON.stringify(newConfig));
    setConfig(newConfig);
    queryClient.invalidateQueries({ queryKey: ['mt5Status'] });
  }, [queryClient]);

  // Remove MT5 configuration
  const removeMT5Config = useCallback(() => {
    localStorage.removeItem('mt5_config');
    setConfig(null);
    queryClient.setQueryData(['mt5Status'], {
      isConnected: false,
      isValidating: false
    });
  }, [queryClient]);

  // Test connection without saving
  const testConnection = useCallback(async (testConfig: MT5Config): Promise<boolean> => {
    try {
      await validateConnection.mutateAsync(testConfig);
      return true;
    } catch {
      return false;
    }
  }, [validateConnection]);

  // Get live market data
  const getMarketData = useCallback(async (symbols: string[] = ['EURUSD', 'GBPUSD', 'USDJPY']) => {
    // In Vercel deployments, return mock data
    if (isVercelDeployment) {
      return symbols.map(symbol => ({
        symbol,
        bid: Math.random() * 2 + 1,
        ask: Math.random() * 2 + 1.001,
        last: Math.random() * 2 + 1.0005,
        volume: Math.floor(Math.random() * 1000000),
        time: new Date().toISOString()
      }));
    }

    if (!mt5Status?.isConnected) {
      throw new Error('MT5 non connesso');
    }

    try {
      const response = await fetch('http://localhost:8080/api/mt5/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbols }),
      });

      if (!response.ok) {
        throw new Error('Errore nel recupero quotazioni');
      }

      return await response.json();
    } catch (error) {
      console.error('Errore market data:', error);
      throw error;
    }
  }, [mt5Status?.isConnected, isVercelDeployment]);

  return {
    // State
    config,
    mt5Status,
    isConnected: mt5Status?.isConnected || false,
    isValidating: validateConnection.isPending || isCheckingStatus,
    
    // Actions
    testConnection,
    saveMT5Config,
    removeMT5Config,
    recheckStatus,
    validateConnection: validateConnection.mutate,
    getMarketData,
    
    // Computed
    needsSetup: !config,
    hasValidConfig: !!config?.login && !!config?.server,
    statusMessage: mt5Status?.error || (mt5Status?.isConnected ? 'Connesso' : 'Disconnesso')
  };
};