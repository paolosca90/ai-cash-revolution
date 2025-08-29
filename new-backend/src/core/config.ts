import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Centralized configuration management for the trading backend
 */
export class Config {
  // Server Configuration
  static readonly PORT = parseInt(process.env.PORT || '3001', 10);
  static readonly NODE_ENV = process.env.NODE_ENV || 'development';
  static readonly FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  // Database Configuration
  static readonly DB_HOST = process.env.DB_HOST || 'localhost';
  static readonly DB_PORT = parseInt(process.env.DB_PORT || '5432', 10);
  static readonly DB_NAME = process.env.DB_NAME || 'trading_bot';
  static readonly DB_USER = process.env.DB_USER || 'postgres';
  static readonly DB_PASSWORD = process.env.DB_PASSWORD || 'password';
  static readonly DATABASE_URL = process.env.DATABASE_URL || 
    `postgresql://${this.DB_USER}:${this.DB_PASSWORD}@${this.DB_HOST}:${this.DB_PORT}/${this.DB_NAME}`;

  // Security Configuration
  static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-local-development';
  static readonly TRADING_ACCOUNT_ENCRYPTION_KEY = process.env.TRADING_ACCOUNT_ENCRYPTION_KEY || 'your-local-encryption-key-32-chars';
  static readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'fallback-encryption-key-32-chars';

  // MT5 Configuration
  static readonly MT5_HOST = process.env.MT5_HOST || '154.61.187.189';
  static readonly MT5_PORT = parseInt(process.env.MT5_PORT || '8080', 10);
  static readonly MT5_LOGIN = process.env.MT5_LOGIN || '6001637';
  static readonly MT5_SERVER = process.env.MT5_SERVER || 'PureMGlobal-MT5';
  static readonly MT5_PASSWORD = process.env.MT5_PASSWORD; // Optional

  // Trading Configuration
  static readonly IS_PRODUCTION = process.env.IS_PRODUCTION === 'true';
  static readonly DEFAULT_ACCOUNT_BALANCE = parseFloat(process.env.DEFAULT_ACCOUNT_BALANCE || '9518.40');
  static readonly DEFAULT_RISK_PERCENTAGE = parseFloat(process.env.DEFAULT_RISK_PERCENTAGE || '2.0');

  // Stripe Configuration
  static readonly STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  static readonly STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;
  static readonly STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

  // External API Keys
  static readonly ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
  static readonly BINANCE_API_KEY = process.env.BINANCE_API_KEY;
  static readonly BINANCE_SECRET_KEY = process.env.BINANCE_SECRET_KEY;
  static readonly FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
  static readonly QUICKCHART_API_KEY = process.env.QUICKCHART_API_KEY;
  static readonly GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  // AI/ML Configuration
  static readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  static readonly ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  
  // Logging Configuration
  static readonly LOG_LEVEL = process.env.LOG_LEVEL || 'info';
  static readonly ENABLE_REQUEST_LOGGING = process.env.ENABLE_REQUEST_LOGGING === 'true';

  // Rate Limiting Configuration
  static readonly RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 minutes
  static readonly RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

  /**
   * Validate required environment variables
   */
  static validateRequiredConfig(): void {
    const requiredKeys = [
      'JWT_SECRET',
      'TRADING_ACCOUNT_ENCRYPTION_KEY'
    ];

    const missingKeys = requiredKeys.filter(key => !process.env[key]);
    
    if (missingKeys.length > 0) {
      console.error(`❌ Missing required environment variables: ${missingKeys.join(', ')}`);
      console.error('Please check your .env file and ensure all required variables are set.');
      
      if (this.NODE_ENV === 'production') {
        process.exit(1);
      } else {
        console.warn('⚠️  Running in development mode with default values. This is NOT secure for production!');
      }
    }
  }

  /**
   * Get Stripe configuration
   */
  static getStripeConfig() {
    return {
      secretKey: this.STRIPE_SECRET_KEY,
      publishableKey: this.STRIPE_PUBLISHABLE_KEY,
      webhookSecret: this.STRIPE_WEBHOOK_SECRET,
      enabled: !!this.STRIPE_SECRET_KEY
    };
  }

  /**
   * Get database connection config
   */
  static getDatabaseConfig() {
    return {
      host: this.DB_HOST,
      port: this.DB_PORT,
      database: this.DB_NAME,
      user: this.DB_USER,
      password: this.DB_PASSWORD,
      connectionString: this.DATABASE_URL
    };
  }

  /**
   * Get MT5 connection config
   */
  static getMT5Config() {
    return {
      host: this.MT5_HOST,
      port: this.MT5_PORT,
      login: this.MT5_LOGIN,
      server: this.MT5_SERVER,
      password: this.MT5_PASSWORD
    };
  }

  /**
   * Get trading configuration
   */
  static getTradingConfig() {
    return {
      isProduction: this.IS_PRODUCTION,
      defaultAccountBalance: this.DEFAULT_ACCOUNT_BALANCE,
      defaultRiskPercentage: this.DEFAULT_RISK_PERCENTAGE
    };
  }

  /**
   * Get external API keys configuration
   */
  static getExternalAPIKeys() {
    return {
      alphaVantage: this.ALPHA_VANTAGE_API_KEY,
      binance: {
        apiKey: this.BINANCE_API_KEY,
        secretKey: this.BINANCE_SECRET_KEY
      },
      finnhub: this.FINNHUB_API_KEY,
      quickChart: this.QUICKCHART_API_KEY,
      gemini: this.GEMINI_API_KEY,
      openai: this.OPENAI_API_KEY,
      anthropic: this.ANTHROPIC_API_KEY
    };
  }

  /**
   * Check if running in development mode
   */
  static isDevelopment(): boolean {
    return this.NODE_ENV === 'development';
  }

  /**
   * Check if running in production mode
   */
  static isProduction(): boolean {
    return this.NODE_ENV === 'production';
  }

  /**
   * Get CORS configuration
   */
  static getCorsConfig() {
    return {
      origin: this.isDevelopment() ? 
        [this.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'] :
        [this.FRONTEND_URL],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature']
    };
  }
}