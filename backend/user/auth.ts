import { api, APIError } from "encore.dev/api";
import { Secret } from "encore.dev/config";
import { SQLDatabase } from "encore.dev/storage/sqldb";

// Database connection
const db = new SQLDatabase("user_auth", {
  migrations: "./auth_migrations",
});

// JWT Secret
const jwtSecret = new Secret("JWT_SECRET");

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  subscriptionTier: "FREE" | "BASIC" | "PREMIUM" | "ENTERPRISE";
  subscriptionStatus: "ACTIVE" | "INACTIVE" | "TRIAL" | "EXPIRED";
  trialStartDate?: Date;
  trialEndDate?: Date;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  tradingAccountsConnected: number;
  maxTradingAccounts: number;
  features: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: Omit<User, 'password'>;
  message: string;
  expiresIn?: number;
}

export interface VerifyTokenRequest {
  token: string;
}

// Subscription tiers configuration
const SUBSCRIPTION_TIERS = {
  FREE: {
    name: "Free Trial",
    maxTradingAccounts: 1,
    features: ["basic_signals", "manual_trading", "limited_history"],
    signalsPerDay: 10,
    trialDays: 7
  },
  BASIC: {
    name: "Basic Plan",
    maxTradingAccounts: 2,
    features: ["basic_signals", "manual_trading", "full_history", "email_alerts"],
    signalsPerDay: 50,
    price: 29.99
  },
  PREMIUM: {
    name: "Premium Plan",
    maxTradingAccounts: 5,
    features: ["advanced_signals", "auto_trading", "ml_analytics", "priority_support", "custom_strategies"],
    signalsPerDay: 200,
    price: 79.99
  },
  ENTERPRISE: {
    name: "Enterprise Plan",
    maxTradingAccounts: 10,
    features: ["all_features", "white_label", "api_access", "dedicated_support"],
    signalsPerDay: 1000,
    price: 199.99
  }
};

// Helper function to generate JWT (simplified)
const generateToken = (userId: string, email: string): string => {
  return `token_${userId}_${Date.now()}`;
};

// Helper function to verify JWT (simplified)
const verifyToken = (token: string): any => {
  if (token.startsWith('token_')) {
    const parts = token.split('_');
    return { userId: parts[1], email: 'user@example.com' };
  }
  return null;
};

// Helper function to get user features based on subscription
const getUserFeatures = (tier: string): string[] => {
  const config = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
  return config ? config.features : SUBSCRIPTION_TIERS.FREE.features;
};

// Register new user
export const register = api(
  { method: "POST", path: "/user/register", expose: true },
  async (req: RegisterRequest): Promise<AuthResponse> => {
    try {
      // Validate input
      if (!req.email || !req.password || !req.name) {
        throw APIError.invalidArgument("Email, password, and name are required");
      }

      // Check if user already exists
      const existingUser = await db.query`
        SELECT id FROM users WHERE email = ${req.email}
      `;

      if (existingUser.length > 0) {
        throw APIError.alreadyExists("User with this email already exists");
      }

      // Hash password (simplified)
      const hashedPassword = `hashed_${req.password}`;

      // Create user with trial subscription
      const userId = crypto.randomUUID();
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days trial

      const features = getUserFeatures("FREE");

      await db.exec`
        INSERT INTO users (
          id, email, name, password_hash, subscription_tier, subscription_status,
          trial_start_date, trial_end_date, is_verified, created_at, updated_at,
          trading_accounts_connected, max_trading_accounts, features
        ) VALUES (
          ${userId}, ${req.email}, ${req.name}, ${hashedPassword}, 'FREE', 'TRIAL',
          ${now}, ${trialEnd}, false, ${now}, ${now},
          0, ${SUBSCRIPTION_TIERS.FREE.maxTradingAccounts}, ${JSON.stringify(features)}
        )
      `;

      // Generate token
      const token = generateToken(userId, req.email);

      return {
        success: true,
        token,
        message: "Registration successful! Welcome to your 7-day free trial.",
        expiresIn: 24 * 60 * 60, // 24 hours in seconds
        user: {
          id: userId,
          email: req.email,
          name: req.name,
          subscriptionTier: "FREE",
          subscriptionStatus: "TRIAL",
          trialStartDate: now,
          trialEndDate: trialEnd,
          isVerified: false,
          createdAt: now,
          updatedAt: now,
          tradingAccountsConnected: 0,
          maxTradingAccounts: SUBSCRIPTION_TIERS.FREE.maxTradingAccounts,
          features
        }
      };
    } catch (error: any) {
      console.error("Registration error:", error);
      throw APIError.internal(`Registration failed: ${error.message}`);
    }
  }
);

// Login user
export const login = api(
  { method: "POST", path: "/user/login", expose: true },
  async (req: LoginRequest): Promise<AuthResponse> => {
    try {
      // Validate input
      if (!req.email || !req.password) {
        throw APIError.invalidArgument("Email and password are required");
      }

      // Find user
      const users = await db.query`
        SELECT * FROM users WHERE email = ${req.email}
      `;

      if (users.length === 0) {
        throw APIError.unauthenticated("Invalid email or password");
      }

      const user = users[0];

      // Verify password (simplified)
      const isValidPassword = user.password_hash === `hashed_${req.password}`;
      if (!isValidPassword) {
        throw APIError.unauthenticated("Invalid email or password");
      }

      // Check if trial has expired
      const now = new Date();
      let subscriptionStatus = user.subscription_status;
      
      if (user.subscription_status === 'TRIAL' && user.trial_end_date && now > new Date(user.trial_end_date)) {
        subscriptionStatus = 'EXPIRED';
        await db.exec`
          UPDATE users SET subscription_status = 'EXPIRED', updated_at = ${now}
          WHERE id = ${user.id}
        `;
      }

      // Generate token
      const token = generateToken(user.id, user.email);

      return {
        success: true,
        token,
        message: "Login successful",
        expiresIn: 24 * 60 * 60, // 24 hours in seconds
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          subscriptionTier: user.subscription_tier,
          subscriptionStatus,
          trialStartDate: user.trial_start_date,
          trialEndDate: user.trial_end_date,
          subscriptionStartDate: user.subscription_start_date,
          subscriptionEndDate: user.subscription_end_date,
          isVerified: user.is_verified,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          tradingAccountsConnected: user.trading_accounts_connected,
          maxTradingAccounts: user.max_trading_accounts,
          features: JSON.parse(user.features || '[]')
        }
      };
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code) {
        throw error;
      }
      throw APIError.internal(`Login failed: ${error.message}`);
    }
  }
);

// Verify token
export const verifyToken = api(
  { method: "POST", path: "/user/verify-token", expose: true },
  async (req: VerifyTokenRequest): Promise<AuthResponse> => {
    try {
      const decoded = verifyToken(req.token);
      if (!decoded) {
        throw APIError.unauthenticated("Invalid or expired token");
      }

      // Get fresh user data
      const users = await db.query`
        SELECT * FROM users WHERE id = ${decoded.userId}
      `;

      if (users.length === 0) {
        throw APIError.unauthenticated("User not found");
      }

      const user = users[0];

      return {
        success: true,
        message: "Token is valid",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          subscriptionTier: user.subscription_tier,
          subscriptionStatus: user.subscription_status,
          trialStartDate: user.trial_start_date,
          trialEndDate: user.trial_end_date,
          subscriptionStartDate: user.subscription_start_date,
          subscriptionEndDate: user.subscription_end_date,
          isVerified: user.is_verified,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          tradingAccountsConnected: user.trading_accounts_connected,
          maxTradingAccounts: user.max_trading_accounts,
          features: JSON.parse(user.features || '[]')
        }
      };
    } catch (error: any) {
      console.error("Token verification error:", error);
      if (error.code) {
        throw error;
      }
      throw APIError.internal(`Token verification failed: ${error.message}`);
    }
  }
);

// Get subscription plans
export const getSubscriptionPlans = api(
  { method: "GET", path: "/user/subscription-plans", expose: true },
  async (): Promise<any> => {
    return {
      success: true,
      plans: SUBSCRIPTION_TIERS
    };
  }
);

// Upgrade subscription
export const upgradeSubscription = api(
  { method: "POST", path: "/user/upgrade-subscription", expose: true },
  async (req: { userId: string; tier: string; paymentToken?: string }): Promise<any> => {
    try {
      const { userId, tier } = req;
      
      if (!SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS]) {
        throw APIError.invalidArgument("Invalid subscription tier");
      }

      const now = new Date();
      const subscriptionEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      const features = getUserFeatures(tier);
      const maxAccounts = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS].maxTradingAccounts;

      await db.exec`
        UPDATE users SET 
          subscription_tier = ${tier},
          subscription_status = 'ACTIVE',
          subscription_start_date = ${now},
          subscription_end_date = ${subscriptionEnd},
          max_trading_accounts = ${maxAccounts},
          features = ${JSON.stringify(features)},
          updated_at = ${now}
        WHERE id = ${userId}
      `;

      return {
        success: true,
        message: `Successfully upgraded to ${tier} plan`,
        subscriptionEndDate: subscriptionEnd
      };
    } catch (error: any) {
      console.error("Subscription upgrade error:", error);
      throw APIError.internal(`Subscription upgrade failed: ${error.message}`);
    }
  }
);

// Get user profile
export const getUserProfile = api(
  { method: "GET", path: "/user/profile/:userId", expose: true },
  async ({ userId }: { userId: string }): Promise<any> => {
    try {
      const users = await db.query`
        SELECT * FROM users WHERE id = ${userId}
      `;

      if (users.length === 0) {
        throw APIError.notFound("User not found");
      }

      const user = users[0];
      
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          subscriptionTier: user.subscription_tier,
          subscriptionStatus: user.subscription_status,
          trialStartDate: user.trial_start_date,
          trialEndDate: user.trial_end_date,
          subscriptionStartDate: user.subscription_start_date,
          subscriptionEndDate: user.subscription_end_date,
          isVerified: user.is_verified,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          tradingAccountsConnected: user.trading_accounts_connected,
          maxTradingAccounts: user.max_trading_accounts,
          features: JSON.parse(user.features || '[]')
        }
      };
    } catch (error: any) {
      console.error("Get profile error:", error);
      if (error.code) {
        throw error;
      }
      throw APIError.internal(`Failed to get user profile: ${error.message}`);
    }
  }
);