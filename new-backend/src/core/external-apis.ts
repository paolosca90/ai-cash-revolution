import { Config } from './config';

/**
 * External API service manager
 */
export class ExternalAPIManager {
  /**
   * Get Stripe configuration and validate
   */
  static getStripeConfig() {
    const config = Config.getStripeConfig();
    
    if (!config.enabled) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.');
    }
    
    return config;
  }

  /**
   * Get Alpha Vantage API key and validate
   */
  static getAlphaVantageKey(): string {
    const apiKey = Config.ALPHA_VANTAGE_API_KEY;
    
    if (!apiKey) {
      throw new Error('Alpha Vantage API key not configured. Please set ALPHA_VANTAGE_API_KEY in environment variables.');
    }
    
    return apiKey;
  }

  /**
   * Get Finnhub API key and validate
   */
  static getFinnhubKey(): string {
    const apiKey = Config.FINNHUB_API_KEY;
    
    if (!apiKey) {
      throw new Error('Finnhub API key not configured. Please set FINNHUB_API_KEY in environment variables.');
    }
    
    return apiKey;
  }

  /**
   * Get Binance API credentials and validate
   */
  static getBinanceCredentials(): { apiKey: string; secretKey: string } {
    const { binance } = Config.getExternalAPIKeys();
    
    if (!binance.apiKey || !binance.secretKey) {
      throw new Error('Binance credentials not configured. Please set BINANCE_API_KEY and BINANCE_SECRET_KEY in environment variables.');
    }
    
    return {
      apiKey: binance.apiKey,
      secretKey: binance.secretKey
    };
  }

  /**
   * Get OpenAI API key and validate
   */
  static getOpenAIKey(): string {
    const apiKey = Config.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in environment variables.');
    }
    
    return apiKey;
  }

  /**
   * Get QuickChart API key and validate
   */
  static getQuickChartKey(): string {
    const apiKey = Config.QUICKCHART_API_KEY;
    
    if (!apiKey) {
      throw new Error('QuickChart API key not configured. Please set QUICKCHART_API_KEY in environment variables.');
    }
    
    return apiKey;
  }

  /**
   * Get Gemini API key and validate
   */
  static getGeminiKey(): string {
    const apiKey = Config.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY in environment variables.');
    }
    
    return apiKey;
  }

  /**
   * Check which external services are available
   */
  static getAvailableServices(): {
    stripe: boolean;
    alphaVantage: boolean;
    finnhub: boolean;
    binance: boolean;
    openai: boolean;
    quickChart: boolean;
    gemini: boolean;
    anthropic: boolean;
  } {
    const apis = Config.getExternalAPIKeys();
    const stripe = Config.getStripeConfig();
    
    return {
      stripe: stripe.enabled,
      alphaVantage: !!apis.alphaVantage,
      finnhub: !!apis.finnhub,
      binance: !!(apis.binance.apiKey && apis.binance.secretKey),
      openai: !!apis.openai,
      quickChart: !!apis.quickChart,
      gemini: !!apis.gemini,
      anthropic: !!apis.anthropic
    };
  }

  /**
   * Validate all configured API keys (useful for startup checks)
   */
  static validateConfiguredServices(): {
    valid: string[];
    missing: string[];
    warnings: string[];
  } {
    const available = this.getAvailableServices();
    const valid: string[] = [];
    const missing: string[] = [];
    const warnings: string[] = [];

    // Check each service
    Object.entries(available).forEach(([service, isAvailable]) => {
      if (isAvailable) {
        valid.push(service);
      } else {
        missing.push(service);
      }
    });

    // Add specific warnings for important services
    if (!available.stripe) {
      warnings.push('Stripe not configured - payment processing will be unavailable');
    }
    
    if (!available.openai && !available.gemini) {
      warnings.push('No AI service configured - AI analysis features may be limited');
    }
    
    if (!available.alphaVantage && !available.finnhub) {
      warnings.push('No financial data provider configured - market data may be limited');
    }

    return { valid, missing, warnings };
  }

  /**
   * Get appropriate chart generation service
   */
  static getChartService(): 'quickchart' | 'tradingview' | null {
    if (Config.QUICKCHART_API_KEY) {
      return 'quickchart';
    }
    
    // Fallback to TradingView widget (no API key required)
    return 'tradingview';
  }

  /**
   * Get best available AI service
   */
  static getBestAIService(): 'openai' | 'gemini' | 'anthropic' | null {
    const apis = Config.getExternalAPIKeys();
    
    // Priority order: OpenAI > Gemini > Anthropic
    if (apis.openai) return 'openai';
    if (apis.gemini) return 'gemini';
    if (apis.anthropic) return 'anthropic';
    
    return null;
  }

  /**
   * Get financial data provider priority
   */
  static getFinancialDataProvider(): 'alphaVantage' | 'finnhub' | null {
    const apis = Config.getExternalAPIKeys();
    
    // Priority: Alpha Vantage > Finnhub
    if (apis.alphaVantage) return 'alphaVantage';
    if (apis.finnhub) return 'finnhub';
    
    return null;
  }
}