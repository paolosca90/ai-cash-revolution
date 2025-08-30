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
  // Password is not exposed in the API response for security
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
  // Return your actual VPS MT5 config
  const config: Mt5Config = {
    userId: 1,
    host: "154.61.187.189", // Your actual VPS IP
    port: 8080,
    login: "6001637", // Your actual MT5 account
    server: "PureMGlobal-MT5", // Your actual server
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

// MT5 Status Response interface
export interface Mt5Status {
  isConnected: boolean;
  isValidating: boolean;
  accountInfo?: {
    balance: number;
    equity: number;
    margin: number;
    freeMargin: number;
    marginLevel: number;
    name: string;
    server: string;
    currency: string;
    leverage: number;
    company: string;
  };
  lastUpdate?: Date;
  error?: string;
}

// getMt5Status returns the current MT5 connection status for the demo user.
export const getMt5Status = api<void, { status: Mt5Status }>({
  method: "GET",
  path: "/user/mt5-status",
  expose: true,
}, async () => {
  try {
    // Get user's MT5 config
    const { config } = await getMt5Config();
    
    if (!config) {
      return {
        status: {
          isConnected: false,
          isValidating: false,
          error: "MT5 configuration not found",
          lastUpdate: new Date()
        }
      };
    }

    // Test connection to MT5 Python bridge server
    try {
      const testUrl = `http://${config.host}:${config.port}/status`;
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const bridgeStatus = await response.json();
        
        if (bridgeStatus.connected) {
          // Try to get account info
          const accountResponse = await fetch(`http://${config.host}:${config.port}/account_info`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(3000)
          });

          if (accountResponse.ok) {
            const accountInfo = await accountResponse.json();
            
            return {
              status: {
                isConnected: true,
                isValidating: false,
                accountInfo: {
                  balance: accountInfo.balance || 10000,
                  equity: accountInfo.equity || 10000,
                  margin: accountInfo.margin || 0,
                  freeMargin: accountInfo.free_margin || 10000,
                  marginLevel: accountInfo.margin_level || 0,
                  name: accountInfo.name || `Account ${config.login}`,
                  server: accountInfo.server || config.server,
                  currency: accountInfo.currency || "USD",
                  leverage: accountInfo.leverage || 100,
                  company: accountInfo.company || "MetaQuotes Software Corp"
                },
                lastUpdate: new Date()
              }
            };
          }
        }
        
        return {
          status: {
            isConnected: false,
            isValidating: false,
            error: "MT5 terminal not connected to bridge server",
            lastUpdate: new Date()
          }
        };
      }
    } catch (fetchError) {
      return {
        status: {
          isConnected: false,
          isValidating: false,
          error: "Cannot connect to MT5 bridge server. Make sure the Python bridge is running.",
          lastUpdate: new Date()
        }
      };
    }

    return {
      status: {
        isConnected: false,
        isValidating: false,
        error: "MT5 bridge server not responding",
        lastUpdate: new Date()
      }
    };

  } catch (error) {
    console.error("Error checking MT5 status:", error);
    return {
      status: {
        isConnected: false,
        isValidating: false,
        error: error instanceof Error ? error.message : "Unknown error",
        lastUpdate: new Date()
      }
    };
  }
});

// testMt5Connection tests the connection with provided MT5 configuration.
export const testMt5Connection = api<{ host: string; port: number; login: string; password: string; server: string }, { status: Mt5Status }>({
  method: "POST",
  path: "/user/mt5-test",
  expose: true,
}, async (params) => {
  try {
    const { host, port, login, password, server } = params;
    
    if (!login || !server) {
      return {
        status: {
          isConnected: false,
          isValidating: false,
          error: "Login and server are required",
          lastUpdate: new Date()
        }
      };
    }

    // Test connection to MT5 Python bridge
    try {
      const connectUrl = `http://${host}:${port}/connect`;
      const response = await fetch(connectUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: parseInt(login),
          password: password,
          server: server
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success !== false) {
          return {
            status: {
              isConnected: true,
              isValidating: false,
              accountInfo: {
                balance: result.balance || 10000,
                equity: result.equity || 10000,
                margin: result.margin || 0,
                freeMargin: result.free_margin || 10000,
                marginLevel: result.margin_level || 0,
                name: result.name || `Account ${login}`,
                server: result.server || server,
                currency: result.currency || "USD",
                leverage: result.leverage || 100,
                company: result.company || "MetaQuotes Software Corp"
              },
              lastUpdate: new Date()
            }
          };
        } else {
          return {
            status: {
              isConnected: false,
              isValidating: false,
              error: result.error || "MT5 connection failed",
              lastUpdate: new Date()
            }
          };
        }
      } else {
        const errorText = await response.text();
        return {
          status: {
            isConnected: false,
            isValidating: false,
            error: `Bridge server error: ${response.status} - ${errorText}`,
            lastUpdate: new Date()
          }
        };
      }
    } catch (fetchError: any) {
      let errorMessage = "Cannot connect to MT5 bridge server";
      if (fetchError.name === 'TimeoutError') {
        errorMessage = "Connection timeout. Make sure MT5 terminal and bridge server are running.";
      } else if (fetchError.message?.includes('fetch')) {
        errorMessage = "Bridge server not available. Make sure the Python server is running on the specified host and port.";
      }
      
      return {
        status: {
          isConnected: false,
          isValidating: false,
          error: errorMessage,
          lastUpdate: new Date()
        }
      };
    }

  } catch (error) {
    console.error("Error testing MT5 connection:", error);
    return {
      status: {
        isConnected: false,
        isValidating: false,
        error: error instanceof Error ? error.message : "Unknown error during connection test",
        lastUpdate: new Date()
      }
    };
  }
});
