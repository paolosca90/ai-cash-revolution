// New API client for Express backend
export class ApiClient {
  private baseURL: string;

  constructor() {
    // Use environment variable or fallback to production URL
    this.baseURL = import.meta.env.VITE_API_URL || 
      'https://ai-cah-revolution-lk8egwy60-paolos-projects-dc6990da.vercel.app';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Health check
  async health() {
    return this.request('/api/health');
  }

  // User endpoints
  async getUserPreferences() {
    return this.request('/api/user/preferences');
  }

  async updateUserPreferences(data: { riskPercentage: number; accountBalance: number }) {
    return this.request('/api/user/preferences', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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

  async getTradingAccounts(params: any) {
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

  // Analysis endpoints
  async getTopSignals() {
    return this.request('/api/analysis/top-signals');
  }

  async getSignalStats() {
    return this.request('/api/analysis/signal-stats');
  }

  async getPerformance() {
    return this.request('/api/analysis/performance');
  }

  async predict(params: any) {
    return this.request('/api/analysis/predict', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async execute(params: any) {
    return this.request('/api/analysis/execute', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async listPositions() {
    return this.request('/api/trading/positions');
  }

  async listHistory() {
    return this.request('/api/analysis/history');
  }

  async forceSignalGeneration() {
    return this.request('/api/analysis/force-generation', {
      method: 'POST',
    });
  }

  async getMarketOverview() {
    return this.request('/api/analysis/market-overview');
  }

  // Trading endpoints
  async getTradingPositions() {
    return this.request('/api/trading/positions');
  }

  async getOrders() {
    return this.request('/api/trading/orders');
  }

  async placeOrder(data: any) {
    return this.request('/api/trading/place-order', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async closePosition(params: any) {
    const { positionId, ticket, reason } = params;
    const id = positionId || ticket;
    return this.request(`/api/trading/close-position/${id}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // ML endpoints
  async getMLAnalytics() {
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

  async detectPatterns(params: any) {
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