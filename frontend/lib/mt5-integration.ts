// MT5 Integration with Supabase Authentication
import { supabase, getCurrentUser } from './supabase';

export interface MT5ConnectionConfig {
  host: string;
  port: number;
  login?: string;
  password?: string;
  server?: string;
  broker?: string;
}

export interface MT5Status {
  connected: boolean;
  trade_allowed: boolean;
  server?: string;
  login?: string;
  balance?: number;
  equity?: number;
  margin?: number;
  free_margin?: number;
  margin_level?: number;
  error?: string;
}

export interface MT5Order {
  symbol: string;
  action: 'BUY' | 'SELL';
  volume: number;
  sl?: number;
  tp?: number;
  comment?: string;
}

export interface MT5Position {
  ticket: number;
  symbol: string;
  type: number;
  volume: number;
  price_open: number;
  price_current: number;
  profit: number;
  swap: number;
  comment: string;
}

class MT5Integration {
  private baseURL: string;
  
  constructor() {
    // In production, MT5 server should be on a VPS
    if (import.meta.env.PROD) {
      this.baseURL = import.meta.env.VITE_MT5_API_URL || 'https://your-vps-domain.com:8080';
    } else {
      this.baseURL = import.meta.env.VITE_MT5_API_URL || 'http://localhost:8080';
    }
    
    console.log(`MT5 Integration initialized with baseURL: ${this.baseURL}`);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MT5 API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('MT5 API request failed:', error);
      throw error;
    }
  }

  // Get MT5 connection status
  async getStatus(): Promise<MT5Status> {
    return this.request<MT5Status>('/status');
  }

  // Get market data for a symbol
  async getRates(symbol: string, timeframe = '5m', count = 50) {
    return this.request('/rates', {
      method: 'POST',
      body: JSON.stringify({ symbol, timeframe, count }),
    });
  }

  // Get symbol information
  async getSymbolInfo(symbol: string) {
    return this.request('/symbol_info', {
      method: 'POST',
      body: JSON.stringify({ symbol }),
    });
  }

  // Execute an order
  async executeOrder(order: MT5Order) {
    // Check if user is authenticated with Supabase first
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to execute orders');
    }

    // Log the order attempt in Supabase
    try {
      await supabase.from('trading_orders').insert([{
        user_id: user.id,
        account_id: 'mt5-direct', // Default for direct MT5 connection
        symbol: order.symbol,
        order_type: order.action,
        volume: order.volume,
        stop_loss: order.sl,
        take_profit: order.tp,
        status: 'pending',
        comment: order.comment || 'MT5 Direct Order',
        opened_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }]);
    } catch (error) {
      console.warn('Failed to log order in Supabase:', error);
    }

    return this.request('/execute', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  // Get current positions
  async getPositions(): Promise<{ positions: MT5Position[] }> {
    return this.request('/positions');
  }

  // Close a position
  async closePosition(ticket: number) {
    // Check if user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to close positions');
    }

    return this.request('/close_position', {
      method: 'POST',
      body: JSON.stringify({ ticket }),
    });
  }

  // Save MT5 configuration to user preferences in Supabase
  async saveMT5Config(config: MT5ConnectionConfig) {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to save MT5 configuration');
    }

    // Store configuration in user preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert([{
        user_id: user.id,
        mt5_config: config,
        updated_at: new Date().toISOString()
      }]);

    if (error) {
      throw error;
    }

    return data;
  }

  // Load MT5 configuration from Supabase
  async loadMT5Config(): Promise<MT5ConnectionConfig | null> {
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('mt5_config')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Failed to load MT5 config:', error);
      return null;
    }

    return data?.mt5_config || null;
  }

  // Test MT5 connection
  async testConnection(config?: MT5ConnectionConfig): Promise<boolean> {
    try {
      const status = await this.getStatus();
      return status.connected;
    } catch (error) {
      console.error('MT5 connection test failed:', error);
      return false;
    }
  }

  // Get real market data for multiple symbols
  async getMultipleSymbolData(symbols: string[], timeframe = '1h', count = 24) {
    const promises = symbols.map(symbol => 
      this.getRates(symbol, timeframe, count).catch(error => ({
        symbol,
        error: error.message,
        rates: []
      }))
    );

    return Promise.all(promises);
  }

  // Execute multiple orders (batch execution)
  async executeMultipleOrders(orders: MT5Order[]) {
    const results = [];
    
    for (const order of orders) {
      try {
        const result = await this.executeOrder(order);
        results.push({ ...result, symbol: order.symbol });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          symbol: order.symbol 
        });
      }
    }

    return results;
  }
}

// Export singleton instance
export const mt5Integration = new MT5Integration();

// Helper functions for common operations
export const connectToMT5 = async (): Promise<MT5Status> => {
  return mt5Integration.getStatus();
};

export const getMT5MarketData = async (symbol: string, timeframe = '1h', count = 24) => {
  return mt5Integration.getRates(symbol, timeframe, count);
};

export const executeMT5Order = async (order: MT5Order) => {
  return mt5Integration.executeOrder(order);
};

export const getMT5Positions = async (): Promise<MT5Position[]> => {
  const result = await mt5Integration.getPositions();
  return result.positions || [];
};

export const closeMT5Position = async (ticket: number) => {
  return mt5Integration.closePosition(ticket);
};

// Configuration helpers
export const saveMT5Configuration = async (config: MT5ConnectionConfig) => {
  return mt5Integration.saveMT5Config(config);
};

export const loadMT5Configuration = async (): Promise<MT5ConnectionConfig | null> => {
  return mt5Integration.loadMT5Config();
};

export const testMT5Connection = async (config?: MT5ConnectionConfig): Promise<boolean> => {
  return mt5Integration.testConnection(config);
};