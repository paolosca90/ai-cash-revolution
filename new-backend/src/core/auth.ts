import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Config } from './config';
import { Request, Response, NextFunction } from 'express';

export interface JWTPayload {
  userId: number;
  email: string;
  role?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

/**
 * Authentication utilities
 */
export class AuthHelper {
  /**
   * Generate JWT token
   */
  static generateToken(payload: JWTPayload, expiresIn: string = '7d'): string {
    return jwt.sign(payload, Config.JWT_SECRET, { expiresIn });
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, Config.JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Hash password
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Extract token from Authorization header
   */
  static extractToken(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  /**
   * Middleware to require authentication
   */
  static requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization;
      const token = AuthHelper.extractToken(authHeader);
      
      if (!token) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'No authentication token provided'
        });
        return;
      }

      const payload = AuthHelper.verifyToken(token);
      req.user = payload;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid authentication token'
      });
    }
  }

  /**
   * Middleware to require specific role
   */
  static requireRole(role: string) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required'
        });
        return;
      }

      if (req.user.role !== role) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: `Requires ${role} role`
        });
        return;
      }

      next();
    };
  }

  /**
   * Middleware for optional authentication (doesn't fail if no token)
   */
  static optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization;
      const token = AuthHelper.extractToken(authHeader);
      
      if (token) {
        const payload = AuthHelper.verifyToken(token);
        req.user = payload;
      }
    } catch (error) {
      // Ignore auth errors for optional auth
      console.warn('Optional auth failed:', error);
    }
    
    next();
  }

  /**
   * Generate secure random token (for password reset, etc.)
   */
  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }
}