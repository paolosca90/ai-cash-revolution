import { api, APIError } from "encore.dev/api";

// User represents a user in our system.
export interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
}

// UserPreferences defines the user's trading settings.
export interface UserPreferences {
  userId: number;
  riskPercentage: number;
  accountBalance: number;
  updatedAt: Date;
}

// Mt5Config defines the user's MT5 connection details.
export interface Mt5Config {
  userId: number;
  host: string;
  port: number;
  login: string;
  server: string;
  isConnected?: boolean;
  lastConnectionTest?: Date;
  connectionStatus?: "connected" | "disconnected" | "testing" | "error";
  // Password is not exposed in the API response for security
}

// Mt5ConnectionTestResult defines the result of testing MT5 connection
export interface Mt5ConnectionTestResult {
  success: boolean;
  message: string;
  accountInfo?: {
    balance: number;
    equity: number;
    currency: string;
    leverage: number;
  };
  error?: string;
}

// Subscription defines the user's subscription plan.
export interface Subscription {
  userId: number;
  plan: "free" | "pro" | "enterprise";
  status: "active" | "inactive" | "past_due";
  expiresAt: Date | null;
}

// getPreferences returns the trading preferences for the demo user.
export const getPreferences = api<void, { preferences: UserPreferences | null }>({
  method: "GET",
  path: "/user/preferences",
  expose: true,
}, async () => {
  // Return demo preferences
  const preferences: UserPreferences = {
    userId: 1,
    riskPercentage: 2.0,
    accountBalance: 9518.40, // Updated to match your actual MT5 balance
    updatedAt: new Date(),
  };
  return { preferences };
});

// updatePreferences updates the trading preferences for the demo user.
export const updatePreferences = api<{ riskPercentage: number; accountBalance: number }, { success: boolean }>({
  method: "POST",
  path: "/user/preferences",
  expose: true,
}, async (params) => {
  // For demo purposes, just return success
  console.log("Demo: Updated preferences", params);
  return { success: true };
});

// getMt5Config returns the MT5 configuration for the demo user.
export const getMt5Config = api<void, { config: Mt5Config | null }>({
  method: "GET",
  path: "/user/mt5-config",
  expose: true,
}, async () => {
  // Return production-ready MT5 config with environment variables
  const config: Mt5Config = {
    userId: 1,
    host: process.env.MT5_HOST || "localhost",
    port: parseInt(process.env.MT5_PORT || "8080"),
    login: process.env.MT5_LOGIN || "demo_login",
    server: process.env.MT5_SERVER || "demo_server",
    connectionStatus: "disconnected",
    lastConnectionTest: new Date()
  };
  return { config };
});

// updateMt5Config updates the MT5 configuration for the demo user.
export const updateMt5Config = api<Omit<Mt5Config, "userId"> & { password?: string }, { success: boolean }>({
  method: "POST",
  path: "/user/mt5-config",
  expose: true,
}, async (params) => {
  // For demo purposes, just return success
  console.log("Demo: Updated MT5 config", params);
  return { success: true };
});

// testMt5Connection tests the MT5 connection with provided credentials
export const testMt5Connection = api<{ host: string; port: number; login: string; server: string; password: string }, Mt5ConnectionTestResult>({
  method: "POST",
  path: "/user/mt5-test-connection",
  expose: true,
}, async (params) => {
  console.log(`Testing MT5 connection to ${params.host}:${params.port} with login ${params.login}`);
  
  try {
    // In production, this would connect to actual MT5 terminal/server
    // For now, simulate connection test based on environment
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // TODO: Implement actual MT5 connection test using MT5 API
      // This could use MetaTrader 5 Python API or similar
      console.log("Production MT5 connection test - implement actual connection logic here");
      
      return {
        success: false,
        message: "MT5 connection test not yet implemented for production",
        error: "Connection test functionality is being developed"
      };
    } else {
      // Development mode - simulate successful connection
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate connection delay
      
      return {
        success: true,
        message: "Connection test successful (demo mode)",
        accountInfo: {
          balance: 10000.00,
          equity: 10000.00,
          currency: "USD",
          leverage: 100
        }
      };
    }
  } catch (error: any) {
    console.error("MT5 connection test failed:", error);
    return {
      success: false,
      message: "Connection test failed",
      error: error.message || "Unknown error occurred"
    };
  }
});

// getSubscription returns the subscription status for the demo user.
export const getSubscription = api<void, { subscription: Subscription | null }>({
  method: "GET",
  path: "/user/subscription",
  expose: true,
}, async () => {
  // Return demo subscription
  const subscription: Subscription = {
    userId: 1,
    plan: "free",
    status: "active",
    expiresAt: null,
  };
  return { subscription };
});

// getMt5ConfigForUser returns the MT5 configuration for a specific user (used by scheduler).
export const getMt5ConfigForUser = api<{ userId: number }, { config: Mt5Config | null }>({
  method: "GET",
  path: "/user/mt5-config/:userId",
  expose: false, // Internal API for scheduler
}, async (params) => {
  // For demo purposes, return the same config for all users
  const config: Mt5Config = {
    userId: params.userId,
    host: "154.61.187.189", // Your actual VPS IP
    port: 8080,
    login: "6001637", // Your actual MT5 account
    server: "PureMGlobal-MT5", // Your actual server
  };
  return { config };
});
