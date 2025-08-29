import crypto from 'crypto';
import { Config } from './config';

/**
 * Encryption utilities for sensitive data
 */
export class EncryptionHelper {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;

  /**
   * Derive a key from the encryption key string
   */
  private static deriveKey(password: string): Buffer {
    return crypto.pbkdf2Sync(password, 'trading-salt', 10000, this.KEY_LENGTH, 'sha256');
  }

  /**
   * Encrypt sensitive data (passwords, API keys, etc.)
   */
  static encrypt(text: string, keySource?: string): string {
    try {
      const key = this.deriveKey(keySource || Config.TRADING_ACCOUNT_ENCRYPTION_KEY);
      const iv = crypto.randomBytes(this.IV_LENGTH);
      
      const cipher = crypto.createCipher('aes-256-cbc', key);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Combine IV and encrypted data
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedData: string, keySource?: string): string {
    try {
      const key = this.deriveKey(keySource || Config.TRADING_ACCOUNT_ENCRYPTION_KEY);
      
      const parts = encryptedData.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const decipher = crypto.createDecipher('aes-256-cbc', key);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt trading account credentials
   */
  static encryptTradingCredentials(credentials: {
    password?: string;
    apiKey?: string;
    apiSecret?: string;
  }): {
    passwordEncrypted?: string;
    apiKeyEncrypted?: string;
    apiSecretEncrypted?: string;
  } {
    const result: any = {};
    
    if (credentials.password) {
      result.passwordEncrypted = this.encrypt(credentials.password);
    }
    
    if (credentials.apiKey) {
      result.apiKeyEncrypted = this.encrypt(credentials.apiKey);
    }
    
    if (credentials.apiSecret) {
      result.apiSecretEncrypted = this.encrypt(credentials.apiSecret);
    }
    
    return result;
  }

  /**
   * Decrypt trading account credentials
   */
  static decryptTradingCredentials(encryptedCredentials: {
    passwordEncrypted?: string;
    apiKeyEncrypted?: string;
    apiSecretEncrypted?: string;
  }): {
    password?: string;
    apiKey?: string;
    apiSecret?: string;
  } {
    const result: any = {};
    
    if (encryptedCredentials.passwordEncrypted) {
      result.password = this.decrypt(encryptedCredentials.passwordEncrypted);
    }
    
    if (encryptedCredentials.apiKeyEncrypted) {
      result.apiKey = this.decrypt(encryptedCredentials.apiKeyEncrypted);
    }
    
    if (encryptedCredentials.apiSecretEncrypted) {
      result.apiSecret = this.decrypt(encryptedCredentials.apiSecretEncrypted);
    }
    
    return result;
  }

  /**
   * Hash a string using SHA-256 (for non-reversible hashing)
   */
  static hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Generate a random API key
   */
  static generateApiKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Mask sensitive data for logging (show only first and last 4 characters)
   */
  static maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (!data || data.length <= visibleChars * 2) {
      return '***';
    }
    
    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    return `${start}***${end}`;
  }

  /**
   * Validate encryption key strength
   */
  static validateEncryptionKey(key: string): boolean {
    return key.length >= 32;
  }
}