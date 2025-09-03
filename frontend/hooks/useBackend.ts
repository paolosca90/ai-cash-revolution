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
      listPositions: () => apiClient.listPositions(),
      listHistory: () => apiClient.listHistory(),
      forceSignalGeneration: () => apiClient.forceSignalGeneration(),
      getMarketOverview: () => apiClient.getMarketOverview(),
    },
    ml: {
      getMLAnalytics: () => apiClient.getMLDashboardAnalytics(),
      getMLTrainingAnalytics: () => apiClient.getMLTrainingAnalytics(),
      getRecommendations: () => apiClient.getRecommendations(),
      trainModel: (params: any) => apiClient.trainModel(params),
      detectPatterns: (params: any) => apiClient.detectMLPatterns(params),
      getFeedbackMetrics: () => apiClient.getFeedbackMetrics(),
      getAdaptiveLearningStatus: () => apiClient.getAdaptiveLearningStatus(),
      analyzeModelPerformance: () => apiClient.analyzeModelPerformance(),
      optimizeModel: (params: any) => apiClient.optimizeModel(params),
    },
    user: {
      getPreferences: () => apiClient.getUserPreferences('demo'),
      updatePreferences: (data: any) => apiClient.updateUserPreferences('demo', data),
      getMt5Config: () => apiClient.getMt5Config(),
      getMt5Status: () => apiClient.getMt5Config(), // Use getMt5Config for status
      testMt5Connection: (params: any) => apiClient.updateMt5Config(params), // Use updateMt5Config for test
      updateMt5Config: (data: any) => apiClient.updateMt5Config(data),
      getSubscription: () => apiClient.getSubscription(),
      getUserProfile: (params: any) => apiClient.getUserProfile(params),
      getTradingAccounts: (params: any) => apiClient.getTradingAccounts('demo'),
      getSubscriptionPlans: () => apiClient.getSubscriptionPlans(),
      upgradeSubscription: (params: any) => apiClient.upgradeSubscription(params),
      login: (credentials: any) => apiClient.login(credentials),
      register: (userData: any) => apiClient.register(userData),
    },
    trading: {
      getPositions: () => apiClient.getOrders(),
      getOrders: () => apiClient.getOrders(),
      placeOrder: (data: any) => apiClient.placeOrder(data),
      closePosition: (positionId: string, data: any) => apiClient.closePosition(positionId, data),
    }
  };
}