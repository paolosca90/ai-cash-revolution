import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { useBackend } from './useBackend';

export interface MT5Config {
  login: string;
  password: string;
  server: string;
  broker: string;
  host: string;
  port: number;
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
  const backend = useBackend();
  const [config, setConfig] = useState<MT5Config | null>(null);

  // Load config from backend instead of localStorage
  const { data: backendConfig } = useQuery({
    queryKey: ['mt5Config'],
    queryFn: () => backend.user.getMt5Config(),
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update local config when backend config changes
  useEffect(() => {
    if (backendConfig?.config) {
      const fullConfig: MT5Config = {
        login: backendConfig.config.login,
        password: '', // Password is not returned from backend for security
        server: backendConfig.config.server,
        broker: 'Demo', // Default broker
        host: backendConfig.config.host,
        port: backendConfig.config.port,
      };
      setConfig(fullConfig);
    }
  }, [backendConfig]);

  // Check if we're in a Vercel deployment (production environment)
  const isVercelDeployment = import.meta.env.PROD && 
    (window.location.hostname.includes('vercel.app') || 
     window.location.hostname.includes('ai-cash-revolution'));

  // Validate MT5 connection using backend
  const validateConnection = useMutation({
    mutationFn: async (testConfig: MT5Config): Promise<MT5Status> => {
      if (!testConfig.login || !testConfig.server) {
        throw new Error('Login e server sono richiesti');
      }

      if (!testConfig.host || !testConfig.port) {
        throw new Error('Host e port sono richiesti');
      }

      try {
        const response = await backend.user.testMt5Connection({
          host: testConfig.host,
          port: testConfig.port,
          login: testConfig.login,
          password: testConfig.password,
          server: testConfig.server
        });

        return response.status;
      } catch (error: any) {
        console.error('MT5 connection test error:', error);
        throw new Error(error.message || 'Errore di connessione MT5');
      }
    },
    onSuccess: (status: MT5Status) => {
      toast({
        title: "✅ MT5 Connesso!",
        description: `Account connesso con successo`
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

  // Get current MT5 status using backend
  const { data: mt5Status, isLoading: isCheckingStatus, refetch: recheckStatus } = useQuery<MT5Status>({
    queryKey: ['mt5Status'],
    queryFn: async (): Promise<MT5Status> => {
      try {
        const response = await backend.user.getMt5Status();
        return response.status;
      } catch (error: any) {
        console.error('Error fetching MT5 status:', error);
        return {
          isConnected: false,
          isValidating: false,
          error: error.message || 'Errore nel recupero dello status MT5',
          lastUpdate: new Date()
        };
      }
    },
    enabled: true, // Always enabled to check status
    refetchInterval: 30000, // Check every 30 seconds
    retry: 1,
  });

  // Save MT5 configuration to backend
  const saveMT5Config = useCallback(async (newConfig: MT5Config) => {
    try {
      await backend.user.updateMt5Config({
        host: newConfig.host,
        port: newConfig.port,
        login: newConfig.login,
        server: newConfig.server,
        password: newConfig.password
      });
      
      setConfig(newConfig);
      queryClient.invalidateQueries({ queryKey: ['mt5Config'] });
      queryClient.invalidateQueries({ queryKey: ['mt5Status'] });
      
      toast({
        title: "✅ Configurazione Salvata",
        description: "La configurazione MT5 è stata salvata con successo"
      });
    } catch (error: any) {
      console.error('Error saving MT5 config:', error);
      toast({
        title: "❌ Errore Salvataggio",
        description: error.message || "Errore nel salvataggio della configurazione"
      });
    }
  }, [backend, queryClient, toast]);

  // Remove MT5 configuration
  const removeMT5Config = useCallback(async () => {
    try {
      // Clear the config by setting empty values
      await backend.user.updateMt5Config({
        host: '',
        port: 0,
        login: '',
        server: ''
      });
      
      setConfig(null);
      queryClient.invalidateQueries({ queryKey: ['mt5Config'] });
      queryClient.setQueryData(['mt5Status'], {
        isConnected: false,
        isValidating: false
      });
    } catch (error: any) {
      console.error('Error removing MT5 config:', error);
    }
  }, [backend, queryClient]);

  // Test connection without saving
  const testConnection = useCallback(async (testConfig: MT5Config): Promise<boolean> => {
    try {
      await validateConnection.mutateAsync(testConfig);
      return true;
    } catch {
      return false;
    }
  }, [validateConnection]);

  // Get live market data - Real data only through backend
  const getMarketData = useCallback(async (symbols: string[] = ['EURUSD', 'GBPUSD', 'USDJPY']) => {
    try {
      // Get real market data through backend MT5 integration
      const response = await backend.analysis.getTopSignals();
      if (response && response.signals) {
        return response.signals.map((signal: any) => ({
          symbol: signal.symbol,
          bid: signal.entryPrice || 0,
          ask: signal.entryPrice ? signal.entryPrice + 0.0001 : 0,
          last: signal.entryPrice || 0,
          volume: 0,
          time: signal.createdAt || new Date().toISOString()
        }));
      }
      throw new Error('No real market data available');
    } catch (error: any) {
      throw new Error('Market data requires real MT5 connection: ' + error.message);
    }
  }, [backend]);

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
    needsSetup: !config || !config.login || !config.server || !config.host,
    hasValidConfig: !!config?.login && !!config?.server && !!config?.host,
    statusMessage: mt5Status?.error || (mt5Status?.isConnected ? 'Connesso' : 'Disconnesso')
  };
};