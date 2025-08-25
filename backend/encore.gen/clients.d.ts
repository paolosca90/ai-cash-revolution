export declare const user: {
    getMt5Config: () => Promise<{
        config: {
            userId: number;
            host: string;
            port: number;
            login: string;
            server: string;
        };
    }>;
    getPreferences: () => Promise<{
        preferences: {
            userId: number;
            riskPercentage: number;
            accountBalance: number;
            updatedAt: Date;
        };
    }>;
};
export declare const analysis: {
    predict: () => Promise<{}>;
    execute: () => Promise<{}>;
    closePosition: () => Promise<{}>;
    listPositions: () => Promise<{
        positions: never[];
    }>;
    getPerformance: () => Promise<{}>;
};
export declare const ml: {
    getMLAnalytics: () => Promise<{}>;
    getMLTrainingAnalytics: () => Promise<{}>;
    getRecommendations: () => Promise<{}>;
    trainModel: () => Promise<{}>;
    detectPatterns: () => Promise<{}>;
};
