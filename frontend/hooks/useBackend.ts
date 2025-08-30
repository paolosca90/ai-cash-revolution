import { apiClient } from "../lib/api-client";

// Returns the backend client for making API calls.
export function useBackend() {
  // Create wrapper object to maintain compatibility with Encore service structure
  return {
    analysis: {
      getTopSignals: () => apiClient.getTopSignals(),
      getSignalStats: () => apiClient.getSignalStats ? apiClient.getSignalStats() : apiClient.request('/api/analysis/signal-stats'),
      getPerformance: () => apiClient.getPerformance(),
      predict: (params: any) => apiClient.predict(params),
      execute: (params: any) => apiClient.execute(params),
      listPositions: () => apiClient.getOrders ? apiClient.getOrders() : apiClient.request('/api/analysis/positions'),
      listHistory: () => apiClient.listHistory(),
      forceSignalGeneration: () => apiClient.forceSignalGeneration ? apiClient.forceSignalGeneration() : apiClient.request('/api/analysis/force-generation', { method: 'POST' }),
      closePosition: (params: any) => apiClient.closePosition(params),
      getMarketOverview: () => apiClient.getMarketOverview(),
    },
    ml: {
      getMLAnalytics: () => apiClient.getMLAnalytics(),
      getMLTrainingAnalytics: () => apiClient.getMLTrainingAnalytics ? apiClient.getMLTrainingAnalytics() : apiClient.request('/api/ml/training-analytics'),
      getRecommendations: () => apiClient.getRecommendations(),
      trainModel: (params: any) => apiClient.trainModel(params),
      detectPatterns: (params: any) => apiClient.detectPatterns(params),
      getFeedbackMetrics: () => apiClient.getFeedbackMetrics ? apiClient.getFeedbackMetrics() : apiClient.request('/api/ml/feedback-metrics'),
      getAdaptiveLearningStatus: () => apiClient.getAdaptiveLearningStatus ? apiClient.getAdaptiveLearningStatus() : apiClient.request('/api/ml/adaptive-learning-status'),
      analyzeModelPerformance: () => apiClient.analyzeModelPerformance ? apiClient.analyzeModelPerformance() : apiClient.request('/api/ml/analyze-model-performance'),
      optimizeModel: (params: any) => apiClient.optimizeModel(params),
    },
    user: {
      getPreferences: () => apiClient.getUserPreferences ? apiClient.getUserPreferences('demo') : apiClient.request('/api/user/preferences'),
      updatePreferences: (data: any) => apiClient.updateUserPreferences ? apiClient.updateUserPreferences('demo', data) : apiClient.request('/api/user/preferences', { method: 'POST', body: JSON.stringify(data) }),
      getMt5Config: () => apiClient.getMt5Config(),
      updateMt5Config: (data: any) => apiClient.updateMt5Config(data),
      getSubscription: () => apiClient.getSubscription(),
      getUserProfile: (params: any) => apiClient.getUserProfile(params),
      getTradingAccounts: (params: any) => apiClient.getUserTradingAccounts ? apiClient.getUserTradingAccounts(params) : apiClient.getTradingAccounts ? apiClient.getTradingAccounts('demo') : apiClient.request('/api/user/trading-accounts', { method: 'POST', body: JSON.stringify(params) }),
      getSubscriptionPlans: () => apiClient.getSubscriptionPlans(),
      upgradeSubscription: (params: any) => apiClient.upgradeSubscription(params),
      login: (credentials: any) => apiClient.login(credentials),
      register: (userData: any) => apiClient.register(userData),
    },
    trading: {
      getPositions: () => apiClient.getOrders ? apiClient.getOrders() : apiClient.request('/api/trading/orders'),
      getOrders: () => apiClient.getOrders(),
      placeOrder: (data: any) => apiClient.placeOrder(data),
      closePosition: (params: any) => apiClient.closePosition(params),
    }
  };
}
