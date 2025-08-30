// New API client for Express backend
export class ApiClient {
  private baseURL: string;

  constructor() {
    // Connect to the Express backend server (which connects to MT5 bridge internally)
    this.baseURL = import.meta.env.VITE_API_URL ||
      (import.meta.env.PROD
        ? 'https://backend-c10yefh44-paolos-projects-dc6990da.vercel.app'
        : 'http://localhost:3001');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get authentication token from localStorage
    const token = localStorage.getItem('auth_token') || localStorage.getItem('supabase.auth.token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Check if we hit a Vercel authentication page (deployment protection)
      if (response.headers.get('content-type')?.includes('text/html') && 
          (await response.clone().text()).includes('Authentication Required')) {
        throw new Error('Backend is protected by Vercel authentication. Please configure proper authentication.');
      }
      
      // If we get a 401, try again without headers
      if (response.status === 401) {
        const retryResponse = await fetch(url, {
          ...config,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!retryResponse.ok) {
          // If still fails, throw error
          throw new Error(`Authentication failed: ${retryResponse.status} ${retryResponse.statusText}`);
        }
        
        const data = await retryResponse.json();
        return data;
      }
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Ignore JSON parse errors, use default message
        }
        
        // PRODUCTION: Always throw errors for failed requests - no mock fallbacks
        console.error(`Backend error (${response.status}): ${errorMessage}`);
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      
      // PRODUCTION: Always throw real errors - zero tolerance for mock data
      console.error(`API request failed: ${endpoint}`, error);
      
      // Provide more specific error messages for common issues
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
      }
      
      if (error instanceof Error && error.message.includes('CORS')) {
        throw new Error('CORS error: The server is not configured to accept requests from this domain.');
      }
      
      throw error;
    }
  }

  // PRODUCTION: No mock data - all responses must be real

  // Health check
  async health() {
    return this.request('/api/health');
  }

  // User endpoints - Real user management
  async getUserPreferences(userId: string) {
    return this.request(`/api/users/preferences?userId=${userId}`);
  }

  async updateUserPreferences(userId: string, data: { riskPercentage: number; accountBalance: number }) {
    return this.request(`/api/users/preferences?userId=${userId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addTradingAccount(data: {
    userId: string;
    accountType: 'MT4' | 'MT5' | 'BINANCE' | 'BYBIT' | 'COINBASE' | 'ALPACA';
    accountName: string;
    brokerName: string;
    serverUrl?: string;
    accountNumber?: string;
    apiKey?: string;
    apiSecret?: string;
  }) {
    return this.request('/api/users/trading-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTradingAccounts(userId: string) {
    return this.request(`/api/users/trading-accounts/${userId}`);
  }

  async testTradingAccount(accountId: string, userId: string) {
    return this.request(`/api/users/trading-accounts/${accountId}/test`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async deleteTradingAccount(accountId: string, userId: string) {
    return this.request(`/api/users/trading-accounts/${accountId}?userId=${userId}`, {
      method: 'DELETE',
    });
  }

  async getTradingAccountStatus(accountId: string, userId: string) {
    return this.request(`/api/users/trading-accounts/${accountId}/status?userId=${userId}`);
  }

  async getMt5Config() {
    return this.request('/api/user/mt5-config');
  }

  async updateMt5Config(data: any) {
    return this.request('/api/user/mt5-config', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSubscription() {
    return this.request('/api/user/subscription');
  }

  async getUserProfile(params: any) {
    return this.request('/api/user/profile', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getUserTradingAccounts(params: any) {
    return this.request('/api/user/trading-accounts', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getSubscriptionPlans() {
    return this.request('/api/user/subscription-plans');
  }

  async upgradeSubscription(params: any) {
    return this.request('/api/user/upgrade-subscription', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async login(credentials: any) {
    return this.request('/api/user/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: any) {
    return this.request('/api/user/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Analysis endpoints - Real implementations with sophisticated AI
  async getTopSignals() {
    return this.request('/api/analysis/top-signals');
  }

  async generateSignal(params: { symbol: string; timeframe?: string; strategy?: string }) {
    return this.request('/api/analysis/signal', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getPerformance() {
    return this.request('/api/analysis/performance');
  }

  async predict(params: { symbol: string; strategy?: string }) {
    return this.request('/api/analysis/predict', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async listHistory() {
    return this.request('/api/analysis/history');
  }

  async forceSignalGeneration(params?: { symbols?: string[] }) {
    return this.request('/api/analysis/force-generation', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  async getMarketOverview() {
    return this.request('/api/analysis/market-overview');
  }

  async getSignalStats() {
    return this.request('/api/analysis/signal-stats');
  }

  // ML-specific analysis endpoints
  async trainMLModel() {
    return this.request('/api/analysis/ml/train', {
      method: 'POST',
    });
  }

  async detectPatterns(params: { symbol: string }) {
    return this.request('/api/analysis/ml/detect-patterns', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getMLAnalytics() {
    return this.request('/api/analysis/ml/analytics');
  }

  // Trading endpoints - Real MT5 integration
  async getOrders(params?: { userId?: string; limit?: number }) {
    const queryParams = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/api/trading/orders${queryParams}`);
  }

  async getOrderStatus(orderId: string, userId: string) {
    return this.request(`/api/trading/orders/${orderId}?userId=${userId}`);
  }

  async placeOrder(data: {
    userId: string;
    accountId: string;
    symbol: string;
    orderType: 'BUY' | 'SELL' | 'BUY_LIMIT' | 'SELL_LIMIT' | 'BUY_STOP' | 'SELL_STOP';
    volume: number;
    price?: number;
    stopLoss?: number;
    takeProfit?: number;
    comment?: string;
  }) {
    return this.request('/api/trading/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async closePosition(positionId: string, data: {
    userId: string;
    accountId: string;
    volume?: number;
  }) {
    return this.request(`/api/trading/positions/${positionId}/close`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTradingStats(userId: string) {
    return this.request(`/api/trading/stats/${userId}`);
  }

  // Positions endpoint
  async listPositions() {
    return this.request('/api/analysis/positions');
  }

  // ML endpoints
  async getMLDashboardAnalytics() {
    return this.request('/api/ml/analytics');
  }

  async getMLTrainingAnalytics() {
    return this.request('/api/ml/training-analytics');
  }

  async getRecommendations() {
    return this.request('/api/ml/recommendations');
  }

  async trainModel(params: any) {
    return this.request('/api/ml/train-model', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async detectMLPatterns(params: any) {
    return this.request('/api/ml/detect-patterns', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getFeedbackMetrics() {
    return this.request('/api/ml/feedback-metrics');
  }

  async getAdaptiveLearningStatus() {
    return this.request('/api/ml/adaptive-learning-status');
  }

  async analyzeModelPerformance() {
    return this.request('/api/ml/analyze-model-performance');
  }

  async optimizeModel(params: any) {
    return this.request('/api/ml/optimize-model', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();