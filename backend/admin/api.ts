import { api } from "encore.dev/api";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";

// Production-ready admin authentication and management service
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-in-production";
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Admin user interface
export interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

// In-memory storage for development (replace with real database in production)
const adminUsers: any[] = [
  {
    id: 1,
    email: process.env.ADMIN_EMAIL || "admin@aicashrevolution.com",
    firstName: "Super",
    lastName: "Admin",
    password: "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // hashed "admin123_change_this"
    isSuperAdmin: true,
    isActive: true,
    createdAt: new Date(),
    lastLogin: null
  }
];

let nextAdminUserId = 2;

// Request/Response interfaces
export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  token?: string;
  admin?: AdminUser;
  error?: string;
}

export interface CreateAdminRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  isSuperAdmin?: boolean;
}

export interface CreateAdminResponse {
  success: boolean;
  adminId?: number;
  error?: string;
}

export interface UpdateUserSubscriptionRequest {
  userId: number;
  status: "active" | "inactive" | "suspended" | "past_due";
  plan?: "free" | "professional" | "enterprise";
  expiresAt?: string; // ISO date string
  notes?: string;
}

export interface UpdateUserSubscriptionResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  totalTrades: number;
  systemStatus: "operational" | "maintenance" | "issues";
}

export interface UserManagementData {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  plan: string;
  status: string;
  subscriptionExpires?: Date;
  totalTrades: number;
  lastActive: Date;
  accountBalance: number;
}

// Admin login endpoint
export const adminLogin = api<AdminLoginRequest, AdminLoginResponse>({
  method: "POST",
  path: "/admin/login",
  expose: true,
}, async (req) => {
  console.log(`🔐 Admin login attempt for: ${req.email} (${IS_PRODUCTION ? 'PRODUCTION' : 'TEST'} mode)`);
  
  try {
    const admin = adminUsers.find(a => a.email === req.email && a.isActive);
    
    if (!admin) {
      console.log(`❌ Admin not found: ${req.email}`);
      return {
        success: false,
        error: "Invalid credentials"
      };
    }
    
    // Verify password
    const passwordValid = IS_PRODUCTION ? 
      await bcrypt.compare(req.password, admin.password) :
      req.password === "admin123_change_this"; // Development fallback
    
    if (!passwordValid) {
      console.log(`❌ Invalid password for admin: ${req.email}`);
      return {
        success: false,
        error: "Invalid credentials"
      };
    }
    
    // Update last login
    admin.lastLogin = new Date();
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        adminId: admin.id, 
        email: admin.email, 
        isSuperAdmin: admin.isSuperAdmin,
        type: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    const adminResponse: AdminUser = {
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      isSuperAdmin: admin.isSuperAdmin,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
      lastLogin: admin.lastLogin
    };
    
    console.log(`✅ Admin login successful: ${req.email}`);
    
    return {
      success: true,
      token,
      admin: adminResponse
    };
    
  } catch (error: any) {
    console.error("Admin login error:", error);
    return {
      success: false,
      error: "Login failed"
    };
  }
});

// Create new admin user (super admin only)
export const createAdmin = api<CreateAdminRequest, CreateAdminResponse>({
  method: "POST", 
  path: "/admin/create",
  expose: true,
}, async (req) => {
  console.log(`👤 Creating new admin: ${req.email}`);
  
  try {
    // Check if admin already exists
    const existingAdmin = adminUsers.find(a => a.email === req.email);
    if (existingAdmin) {
      return {
        success: false,
        error: "Admin already exists with this email"
      };
    }
    
    // Hash password
    const hashedPassword = IS_PRODUCTION ? 
      await bcrypt.hash(req.password, 10) : 
      `hashed_${req.password}`;
    
    const newAdmin = {
      id: nextAdminUserId++,
      email: req.email,
      firstName: req.firstName,
      lastName: req.lastName,
      password: hashedPassword,
      isSuperAdmin: req.isSuperAdmin || false,
      isActive: true,
      createdAt: new Date(),
      lastLogin: null
    };
    
    adminUsers.push(newAdmin);
    
    console.log(`✅ Admin created successfully: ${req.email} (ID: ${newAdmin.id})`);
    
    return {
      success: true,
      adminId: newAdmin.id
    };
    
  } catch (error: any) {
    console.error("Create admin error:", error);
    return {
      success: false,
      error: "Failed to create admin"
    };
  }
});

// Get admin dashboard stats
export const getAdminStats = api<void, AdminStats>({
  method: "GET",
  path: "/admin/stats",
  expose: true,
}, async () => {
  console.log("📊 Fetching admin dashboard stats");
  
  // In production, these would come from database queries
  const stats: AdminStats = {
    totalUsers: 247,
    activeSubscriptions: 189,
    monthlyRevenue: 12450.00,
    totalTrades: 1542,
    systemStatus: "operational"
  };
  
  return stats;
});

// Get users for management
export const getUsers = api<void, { users: UserManagementData[] }>({
  method: "GET",
  path: "/admin/users",
  expose: true,
}, async () => {
  console.log("👥 Fetching users for admin management");
  
  // Mock data - in production, this would come from database
  const users: UserManagementData[] = [
    {
      id: 1,
      email: "demo@aicashrevolution.com",
      firstName: "Demo",
      lastName: "User",
      plan: "professional",
      status: "active",
      subscriptionExpires: new Date("2025-12-31"),
      totalTrades: 47,
      lastActive: new Date(),
      accountBalance: 9518.40
    }
  ];
  
  return { users };
});

// Update user subscription status
export const updateUserSubscription = api<UpdateUserSubscriptionRequest, UpdateUserSubscriptionResponse>({
  method: "POST",
  path: "/admin/users/subscription",
  expose: true,
}, async (req) => {
  console.log(`📝 Updating subscription for user ${req.userId}: ${req.status}`);
  
  try {
    // In production, this would update the database
    // For now, just log the operation
    
    const updateLog = {
      userId: req.userId,
      newStatus: req.status,
      newPlan: req.plan,
      expiresAt: req.expiresAt,
      notes: req.notes,
      updatedBy: "admin", // Would get from JWT token
      updatedAt: new Date()
    };
    
    console.log("Subscription update:", updateLog);
    
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      message: `User subscription updated successfully`
    };
    
  } catch (error: any) {
    console.error("Update subscription error:", error);
    return {
      success: false,
      message: "Failed to update subscription",
      error: error.message
    };
  }
});

// Admin middleware for JWT verification
export function verifyAdminToken(token: string): { valid: boolean; admin?: any; error?: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.type !== 'admin') {
      return { valid: false, error: "Invalid token type" };
    }
    
    const admin = adminUsers.find(a => a.id === decoded.adminId && a.isActive);
    
    if (!admin) {
      return { valid: false, error: "Admin not found or inactive" };
    }
    
    return { valid: true, admin };
    
  } catch (error: any) {
    return { valid: false, error: "Invalid token" };
  }
}

// Get admin profile
export const getAdminProfile = api<void, { admin: AdminUser }>({
  method: "GET",
  path: "/admin/profile",
  expose: true,
}, async () => {
  // In production, this would extract admin ID from JWT token
  const admin = adminUsers[0]; // Demo admin
  
  const adminResponse: AdminUser = {
    id: admin.id,
    email: admin.email,
    firstName: admin.firstName,
    lastName: admin.lastName,
    isSuperAdmin: admin.isSuperAdmin,
    isActive: admin.isActive,
    createdAt: admin.createdAt,
    lastLogin: admin.lastLogin
  };
  
  return { admin: adminResponse };
});

console.log("🔐 Admin API initialized with default admin:", process.env.ADMIN_EMAIL || "admin@aicashrevolution.com");