// Mock client implementations to resolve import issues
export const user = {
  getMt5Config: async () => ({
    config: {
      userId: 1,
      host: "154.61.187.189",
      port: 8080,
      login: "6001637",
      server: "PureMGlobal-MT5",
    }
  }),
  getPreferences: async () => ({
    preferences: {
      userId: 1,
      riskPercentage: 2.0,
      accountBalance: 9518.40,
      updatedAt: new Date(),
    }
  })
};

// Export other required Encore services
export const analysis = {
  predict: async () => ({}),
  execute: async () => ({}),
  closePosition: async () => ({}),
  listPositions: async () => ({ positions: [] }),
  getPerformance: async () => ({}),
};

export const ml = {
  getMLAnalytics: async () => ({}),
  getMLTrainingAnalytics: async () => ({}),
  getRecommendations: async () => ({}),
  trainModel: async () => ({}),
  detectPatterns: async () => ({}),
};