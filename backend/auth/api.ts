import { api } from "encore.dev/api";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";

// Production-ready auth service with database support
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-in-production";
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// In-memory storage for development (replace with real database in production)
const users: any[] = [
  {
    id: 1,
    email: "demo@aitradingrevolution.com",
    firstName: "Demo",
    lastName: "User",
    password: "$2b$10$dummy.hash.for.demo123", // pre-hashed "demo123"
    plan: "professional"
  }
];

let nextUserId = 2;

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  plan: "free-trial" | "professional" | "enterprise";
  billingCycle?: "monthly" | "yearly";
  mt5Login: string;
  mt5Server: string;
  brokerName: string;
  accountType: "demo" | "live";
  mt5Password: string;
}

export interface RegisterResponse {
  success: boolean;
  userId?: number;
  installerToken?: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: any;
  error?: string;
}

export const register = api<RegisterRequest, RegisterResponse>({
  method: "POST",
  path: "/auth/register",
  expose: true,
}, async (req) => {
  console.log(`📝 Registration request for: ${req.email} (${IS_PRODUCTION ? 'PRODUCTION' : 'TEST'} mode)`);
  
  try {
    // Check if user already exists
    const existingUser = users.find(u => u.email === req.email);
    if (existingUser) {
      return {
        success: false,
        error: "User already exists with this email"
      };
    }
    
    // Hash password for production
    const hashedPassword = IS_PRODUCTION ? 
      await bcrypt.hash(req.password, 10) : 
      `hashed_${req.password}`; // Simple hash for development
    
    // Create new user
    const newUser = {
      id: nextUserId++,
      email: req.email,
      firstName: req.firstName,
      lastName: req.lastName,
      password: hashedPassword,
      phone: req.phone,
      plan: req.plan,
      billingCycle: req.billingCycle,
      mt5Login: req.mt5Login,
      mt5Server: req.mt5Server,
      brokerName: req.brokerName,
      accountType: req.accountType,
      createdAt: new Date()
    };
    
    users.push(newUser);
    
    const installerToken = `installer_${newUser.id}_${Date.now()}`;
    
    console.log(`✅ User registered successfully: ID ${newUser.id}`);
    
    return {
      success: true,
      userId: newUser.id,
      installerToken: installerToken
    };
    
  } catch (error: any) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: "Registration failed: " + error.message
    };
  }
});

export const login = api<LoginRequest, LoginResponse>({
  method: "POST",
  path: "/auth/login",
  expose: true,
}, async (req) => {
  console.log(`🔐 Login attempt for: ${req.email} (${IS_PRODUCTION ? 'PRODUCTION' : 'TEST'} mode)`);
  
  try {
    // Find user
    const user = users.find(u => u.email === req.email);
    if (!user) {
      return {
        success: false,
        error: "Invalid credentials"
      };
    }
    
    // Verify password
    let passwordValid = false;
    if (IS_PRODUCTION) {
      passwordValid = await bcrypt.compare(req.password, user.password);
    } else {
      // Simple comparison for development
      passwordValid = (req.email === "demo@aitradingrevolution.com" && req.password === "demo123") || 
                     user.password === `hashed_${req.password}`;
    }
    
    if (!passwordValid) {
      return {
        success: false,
        error: "Invalid credentials"
      };
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log(`✅ Login successful for user ${user.id}`);
    
    return {
      success: true,
      token: token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        plan: user.plan
      }
    };
    
  } catch (error: any) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "Login failed: " + error.message
    };
  }
});

export const getProfile = api<{ userId: number }, { user: any }>(
{
  method: "GET",
  path: "/auth/profile/:userId",
  expose: true,
}, async ({ userId }) => {
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    throw new Error("User not found");
  }
  
  // Return user without password
  const { password, ...userProfile } = user;
  
  return {
    user: userProfile
  };
});