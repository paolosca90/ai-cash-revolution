import { apiClient } from "../lib/api-client";

// Returns the backend client for making API calls.
export function useBackend() {
  // Create wrapper object to maintain compatibility with Encore service structure
  return {
    analysis: {
      getTopSignals: () => apiClient.getTopSignals(),
      getSignalStats: () => apiClient.getSignalStats(),
      getPerformance: () => apiClient.getPerformance(),
      predict: (params: any) => apiClient.predict(params),
      execute: (params: any) => apiClient.execute(params),
      listPositions: () => apiClient.listPositions(),
      listHistory: () => apiClient.listHistory(),
      forceSignalGeneration: () => apiClient.forceSignalGeneration(),
      closePosition: (params: any) => apiClient.closePosition(params),
      getMarketOverview: () => apiClient.getMarketOverview(),
    },
    ml: {
      getMLAnalytics: () => apiClient.getMLAnalytics(),
      getMLTrainingAnalytics: () => apiClient.getMLTrainingAnalytics(),
      getRecommendations: () => apiClient.getRecommendations(),
      trainModel: (params: any) => apiClient.trainModel(params),
      detectPatterns: (params: any) => apiClient.detectPatterns(params),
      getFeedbackMetrics: () => apiClient.getFeedbackMetrics(),
      getAdaptiveLearningStatus: () => apiClient.getAdaptiveLearningStatus(),
      analyzeModelPerformance: () => apiClient.analyzeModelPerformance(),
      optimizeModel: (params: any) => apiClient.optimizeModel(params),
    },
    user: {
      getPreferences: () => apiClient.getUserPreferences(),
      updatePreferences: (data: any) => apiClient.updateUserPreferences(data),
      getMt5Config: () => apiClient.getMt5Config(),
      updateMt5Config: (data: any) => apiClient.updateMt5Config(data),
      getSubscription: () => apiClient.getSubscription(),
      getUserProfile: (params: any) => apiClient.getUserProfile(params),
      getTradingAccounts: (params: any) => apiClient.getTradingAccounts(params),
      getSubscriptionPlans: () => apiClient.getSubscriptionPlans(),
      upgradeSubscription: (params: any) => apiClient.upgradeSubscription(params),
      login: (credentials: any) => apiClient.login(credentials),
      register: (userData: any) => apiClient.register(userData),
    },
    trading: {
      getPositions: () => apiClient.getTradingPositions(),
      getOrders: () => apiClient.getOrders(),
      placeOrder: (data: any) => apiClient.placeOrder(data),
      closePosition: (params: any) => apiClient.closePosition(params),
    }
  };
}
