import { api } from "encore.dev/api";

interface TradingStrategy {
  name: string;
  description: string;
  indicators: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  thresholds: {
    buy: number;
    sell: number;
  };
}

interface ListStrategiesResponse {
  strategies: TradingStrategy[];
}

const AVAILABLE_STRATEGIES: TradingStrategy[] = [
  {
    name: "conservative",
    description: "Low-risk strategy using SMA and RSI indicators",
    indicators: ["SMA", "RSI"],
    riskLevel: "LOW",
    thresholds: { buy: 0.7, sell: 0.3 }
  },
  {
    name: "moderate",
    description: "Balanced strategy using SMA, RSI, and MACD indicators",
    indicators: ["SMA", "RSI", "MACD"],
    riskLevel: "MEDIUM",
    thresholds: { buy: 0.6, sell: 0.4 }
  },
  {
    name: "aggressive",
    description: "High-risk strategy using multiple technical indicators",
    indicators: ["SMA", "RSI", "MACD", "BB"],
    riskLevel: "HIGH",
    thresholds: { buy: 0.5, sell: 0.5 }
  }
];

// Lists all available trading strategies
export const listStrategies = api<void, ListStrategiesResponse>(
  { expose: true, method: "GET", path: "/strategies" },
  async () => {
    return { strategies: AVAILABLE_STRATEGIES };
  }
);
