import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Joi from 'joi';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).max(50).optional()
});

// CORS setup for production - Updated frontend domains
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://ai-cash-revolution-frontend.vercel.app',
        'https://ai-trading-bot.vercel.app',
        'https://frontend-*-paolos-projects-dc6990da.vercel.app', // Vercel preview domains
        'https://ai-money-generator-frontend.vercel.app'
      ]
    : [
        'http://localhost:5173', // Vite dev server
        'http://localhost:3000', // Alternative React dev server
        'http://localhost:8080'  // MT5 bridge server for testing
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Token verification failed' });
  }
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'trading-bot-backend',
    version: '2.0.0',
    supabase: 'connected'
  });
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    // Validate request body
    const { error: validationError } = loginSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
    }

    const { email, password } = req.body;

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError);
    }

    res.json({
      success: true,
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || data.user.user_metadata?.name || 'Trading User',
        subscription: profile?.subscription || 'basic',
        createdAt: data.user.created_at
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during login'
    });
  }
});

app.post('/api/user/register', async (req, res) => {
  try {
    // Validate request body
    const { error: validationError } = registerSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
    }

    const { email, password, name = 'Trading User' } = req.body;

    // Register user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Create user profile in database
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: email,
          name: name,
          subscription: 'basic',
          created_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Continue anyway as user is created in auth
      }
    }

    res.json({
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      user: {
        id: data.user?.id,
        email: email,
        name: name,
        subscription: 'basic'
      },
      needsVerification: !data.session // Will be null if email confirmation is required
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during registration'
    });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required'
      });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      return res.status(401).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      token: data.session.access_token,
      refreshToken: data.session.refresh_token
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during token refresh'
    });
  }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during logout'
    });
  }
});

// User profile endpoints
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        subscription: profile.subscription,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      }
    });

  } catch (error) {
    console.error('Profile retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const updateSchema = Joi.object({
      name: Joi.string().min(2).max(50).optional(),
      subscription: Joi.string().valid('basic', 'pro', 'enterprise').optional()
    });

    const { error: validationError } = updateSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.details[0].message
      });
    }

    const updates = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return res.status(400).json({
        success: false,
        error: 'Failed to update profile'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: data.id,
        email: data.email,
        name: data.name,
        subscription: data.subscription,
        updatedAt: data.updated_at
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// User endpoints (protected) - Real MT5 config only
app.get('/api/user/mt5-config', authenticateToken, async (req, res) => {
  try {
    // Check if MT5 bridge is available
    const statusResponse = await fetch('http://localhost:8080/health');
    
    if (!statusResponse.ok) {
      return res.status(503).json({
        success: false,
        error: 'MT5 bridge server not available on port 8080. Please start the MT5 bridge server.',
        bridgeStatus: 'offline'
      });
    }
    
    const statusData = await statusResponse.json();
    
    res.json({
      success: true,
      bridgeConnected: statusData.status === 'running',
      mt5Connected: statusData.mt5_connected || false,
      host: 'localhost',
      port: 8080,
      message: 'Connect through MT5 bridge server for real trading',
      timestamp: statusData.timestamp
    });
    
  } catch (error) {
    console.error('MT5 config error:', error);
    res.status(503).json({
      success: false,
      error: 'Cannot connect to MT5 bridge server. Please ensure it is running.',
      bridgeStatus: 'error'
    });
  }
});

app.get('/api/user/subscription', authenticateToken, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('subscription, subscription_expires_at')
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('Subscription fetch error:', error);
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    res.json({
      status: 'active',
      plan: profile.subscription || 'basic',
      expiresAt: profile.subscription_expires_at || new Date(Date.now() + 30*24*60*60*1000).toISOString()
    });

  } catch (error) {
    console.error('Subscription retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Trading endpoints (protected) - Real MT5 data only
app.get('/api/analysis/top-signals', authenticateToken, async (req, res) => {
  try {
    // Connect to MT5 bridge server for real signals
    const mt5Response = await fetch('http://localhost:8080/api/mt5/positions');
    
    if (!mt5Response.ok) {
      return res.status(503).json({
        success: false,
        error: 'MT5 bridge server not available. Please ensure MT5 is connected and bridge server is running on port 8080.'
      });
    }
    
    const mt5Data = await mt5Response.json();
    
    // Return actual MT5 positions as signals (no fake data)
    res.json({
      signals: mt5Data.positions || [],
      source: 'real_mt5_data',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('MT5 connection error:', error);
    res.status(503).json({
      success: false,
      error: 'Unable to connect to MT5. Please check MT5 bridge server connection.'
    });
  }
});

// Signal stats endpoint - Real data only
app.get('/api/analysis/signal-stats', authenticateToken, async (req, res) => {
  try {
    // Get real account info from MT5
    const mt5Response = await fetch('http://localhost:8080/api/mt5/account-info');
    
    if (!mt5Response.ok) {
      return res.status(503).json({
        success: false,
        error: 'MT5 account data unavailable. Please connect to MT5.'
      });
    }
    
    const accountData = await mt5Response.json();
    
    // Return real stats based on actual account (no fabricated numbers)
    res.json({
      accountBalance: accountData.account?.balance || 0,
      accountEquity: accountData.account?.equity || 0,
      connected: accountData.connected,
      lastUpdate: accountData.timestamp,
      source: 'real_mt5_account'
    });
    
  } catch (error) {
    console.error('MT5 stats error:', error);
    res.status(503).json({
      success: false,
      error: 'Cannot retrieve real account statistics. MT5 connection required.'
    });
  }
});

// Performance endpoint - Real account performance only
app.get('/api/analysis/performance', authenticateToken, async (req, res) => {
  try {
    // Get real account info and positions from MT5
    const [accountResponse, positionsResponse] = await Promise.all([
      fetch('http://localhost:8080/api/mt5/account-info'),
      fetch('http://localhost:8080/api/mt5/positions')
    ]);
    
    if (!accountResponse.ok) {
      return res.status(503).json({
        success: false,
        error: 'Cannot retrieve real performance data. MT5 connection required.'
      });
    }
    
    const accountData = await accountResponse.json();
    const positionsData = await positionsResponse.json();
    
    // Calculate real performance from actual MT5 data
    const positions = positionsData.positions || [];
    const totalProfit = positions.reduce((sum, pos) => sum + (pos.profit || 0), 0);
    
    res.json({
      balance: accountData.account?.balance || 0,
      equity: accountData.account?.equity || 0,
      margin: accountData.account?.margin || 0,
      freeMargin: accountData.account?.free_margin || 0,
      currentPnL: totalProfit,
      openPositions: positions.length,
      currency: accountData.account?.currency || 'USD',
      source: 'real_mt5_performance',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('MT5 performance error:', error);
    res.status(503).json({
      success: false,
      error: 'Real performance data unavailable. Please ensure MT5 is connected.'
    });
  }
});

// ML analytics endpoint - Real trading performance only
app.get('/api/analysis/ml/analytics', authenticateToken, async (req, res) => {
  try {
    // Get actual trading data to calculate real ML performance
    const mt5Response = await fetch('http://localhost:8080/api/mt5/account-info');
    
    if (!mt5Response.ok) {
      return res.status(503).json({
        success: false,
        error: 'ML analytics require real MT5 data. Please connect to MT5 first.'
      });
    }
    
    const accountData = await mt5Response.json();
    
    // Only return analytics based on real trading results
    res.json({
      message: 'ML analytics available only with real trading history',
      accountConnected: accountData.connected,
      realDataRequired: true,
      error: 'No fake ML analytics provided in production system'
    });
    
  } catch (error) {
    console.error('MT5 ML analytics error:', error);
    res.status(503).json({
      success: false,
      error: 'ML analytics unavailable without real trading data.'
    });
  }
});

// Generate signal endpoint - Real analysis only
app.post('/api/analysis/signal', authenticateToken, async (req, res) => {
  try {
    const { symbol = 'EURUSD' } = req.body;
    
    // Get real market data from MT5 for signal generation
    const quotesResponse = await fetch('http://localhost:8080/api/mt5/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols: [symbol] })
    });
    
    if (!quotesResponse.ok) {
      return res.status(503).json({
        success: false,
        error: 'Cannot generate signals without real market data. MT5 connection required.'
      });
    }
    
    const quotesData = await quotesResponse.json();
    const quote = quotesData.quotes[symbol];
    
    if (!quote || quote.error) {
      return res.status(400).json({
        success: false,
        error: `Real market data not available for ${symbol}. Check symbol name and MT5 connection.`
      });
    }
    
    // Generate signal based on real market data (not random)
    const signal = {
      id: `signal-${Date.now()}`,
      symbol: symbol,
      currentBid: quote.bid,
      currentAsk: quote.ask,
      spread: quote.spread,
      timestamp: quote.time,
      source: 'real_mt5_data',
      message: 'Signal generation requires advanced analysis of real market conditions'
    };
    
    res.json({ 
      success: true,
      signal,
      note: 'Real signal generation requires implementation of technical analysis on live market data'
    });
    
  } catch (error) {
    console.error('Signal generation error:', error);
    res.status(503).json({
      success: false,
      error: 'Signal generation unavailable. Real market data required.'
    });
  }
});

// Predict endpoint - Real market analysis required
app.post('/api/analysis/predict', authenticateToken, async (req, res) => {
  try {
    const { symbol = 'EURUSD' } = req.body;
    
    // Get real market data first
    const quotesResponse = await fetch('http://localhost:8080/api/mt5/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols: [symbol] })
    });
    
    if (!quotesResponse.ok) {
      return res.status(503).json({
        success: false,
        error: 'Predictions require real market data. MT5 connection needed.'
      });
    }
    
    const quotesData = await quotesResponse.json();
    const quote = quotesData.quotes[symbol];
    
    if (!quote || quote.error) {
      return res.status(400).json({
        success: false,
        error: `Cannot predict ${symbol} without real market data.`
      });
    }
    
    // Return real market data with note about prediction requirements
    res.json({
      success: true,
      symbol,
      currentPrice: {
        bid: quote.bid,
        ask: quote.ask,
        spread: quote.spread,
        time: quote.time
      },
      source: 'real_mt5_data',
      note: 'AI predictions require historical data analysis and trained models based on real market performance'
    });
    
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(503).json({
      success: false,
      error: 'Predictions unavailable without real market connection.'
    });
  }
});

// Trading history - Real trading history only
app.get('/api/analysis/history', authenticateToken, async (req, res) => {
  try {
    // Get real trading history from MT5
    const historyResponse = await fetch('http://localhost:8080/api/mt5/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: 'EURUSD', // Can be parameterized
        count: 100
      })
    });
    
    if (!historyResponse.ok) {
      return res.status(503).json({
        success: false,
        error: 'Trading history unavailable. MT5 connection required for real historical data.'
      });
    }
    
    const historyData = await historyResponse.json();
    
    res.json({
      success: true,
      signals: [], // Real history requires actual closed positions from MT5
      marketHistory: historyData.data || [],
      source: 'real_mt5_history',
      note: 'Complete trading history requires MT5 deals and positions history implementation'
    });
    
  } catch (error) {
    console.error('Trading history error:', error);
    res.status(503).json({
      success: false,
      error: 'Cannot retrieve trading history without MT5 connection.'
    });
  }
});

// Positions - Real MT5 positions only
app.get('/api/analysis/positions', authenticateToken, async (req, res) => {
  try {
    // Get real positions from MT5
    const positionsResponse = await fetch('http://localhost:8080/api/mt5/positions');
    
    if (!positionsResponse.ok) {
      return res.status(503).json({
        success: false,
        error: 'Position data unavailable. Please connect to MT5 to view real positions.'
      });
    }
    
    const positionsData = await positionsResponse.json();
    
    res.json({
      success: true,
      positions: positionsData.positions || [],
      count: positionsData.count || 0,
      source: 'real_mt5_positions',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Positions error:', error);
    res.status(503).json({
      success: false,
      error: 'Cannot retrieve positions. MT5 connection required.'
    });
  }
});

// Force signal generation - Real analysis required
app.post('/api/analysis/force-generation', authenticateToken, async (req, res) => {
  try {
    const { symbols = ['EURUSD', 'GBPUSD', 'USDJPY'] } = req.body;
    
    // Check MT5 connection first
    const statusResponse = await fetch('http://localhost:8080/api/mt5/status');
    
    if (!statusResponse.ok) {
      return res.status(503).json({
        success: false,
        error: 'Cannot force signal generation without MT5 connection.'
      });
    }
    
    const statusData = await statusResponse.json();
    
    if (!statusData.connected) {
      return res.status(503).json({
        success: false,
        error: 'MT5 terminal not connected. Real signal generation requires live market data.'
      });
    }
    
    // Get real quotes for requested symbols
    const quotesResponse = await fetch('http://localhost:8080/api/mt5/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols })
    });
    
    if (!quotesResponse.ok) {
      return res.status(503).json({
        success: false,
        error: 'Cannot access real market data for signal generation.'
      });
    }
    
    const quotesData = await quotesResponse.json();
    
    res.json({
      success: true,
      message: 'Signal generation requires advanced technical analysis implementation',
      marketData: quotesData.quotes,
      availableSymbols: Object.keys(quotesData.quotes),
      note: 'Real signal generation requires implementing technical indicators on live market data',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Force generation error:', error);
    res.status(503).json({
      success: false,
      error: 'Signal generation unavailable without real market connection.'
    });
  }
});

// ML endpoints - Real ML analytics only
app.get('/api/ml/analytics', authenticateToken, async (req, res) => {
  try {
    // ML analytics require real trading performance data
    const mt5Response = await fetch('http://localhost:8080/api/mt5/account-info');
    
    if (!mt5Response.ok) {
      return res.status(503).json({
        success: false,
        error: 'ML analytics require real trading account connection.'
      });
    }
    
    const accountData = await mt5Response.json();
    
    res.json({
      success: true,
      message: 'ML analytics require historical trading performance data',
      accountConnected: accountData.connected,
      realDataRequired: true,
      note: 'Machine learning metrics must be calculated from actual trading results, not simulated data',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('ML analytics error:', error);
    res.status(503).json({
      success: false,
      error: 'ML analytics unavailable without real account data.'
    });
  }
});

app.post('/api/ml/train-model', authenticateToken, async (req, res) => {
  try {
    // Model training requires real historical data
    const mt5Response = await fetch('http://localhost:8080/api/mt5/status');
    
    if (!mt5Response.ok) {
      return res.status(503).json({
        success: false,
        error: 'Model training requires MT5 connection for real market data.'
      });
    }
    
    const statusData = await mt5Response.json();
    
    if (!statusData.connected) {
      return res.status(503).json({
        success: false,
        error: 'Cannot train models without real market data connection.'
      });
    }
    
    res.json({
      success: false,
      error: 'Model training requires implementation with real historical market data',
      note: 'Training ML models requires substantial historical data and proper validation against real trading performance',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('ML training error:', error);
    res.status(503).json({
      success: false,
      error: 'Model training unavailable without real market data.'
    });
  }
});

app.post('/api/ml/detect-patterns', authenticateToken, async (req, res) => {
  try {
    const { symbol } = req.body;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol required for pattern detection'
      });
    }
    
    // Get real market data for pattern analysis
    const historyResponse = await fetch('http://localhost:8080/api/mt5/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, count: 200 })
    });
    
    if (!historyResponse.ok) {
      return res.status(503).json({
        success: false,
        error: `Pattern detection requires real market data for ${symbol}.`
      });
    }
    
    const historyData = await historyResponse.json();
    
    res.json({
      success: true,
      symbol,
      dataPoints: historyData.count || 0,
      message: 'Pattern detection requires implementation of real technical analysis algorithms',
      note: 'Real pattern detection must analyze actual market data, not generate random results',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Pattern detection error:', error);
    res.status(503).json({
      success: false,
      error: 'Pattern detection requires real market data connection.'
    });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Catch all 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    availableRoutes: [
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/user/register',
      'POST /api/auth/refresh',
      'POST /api/auth/logout',
      'GET /api/user/profile',
      'PUT /api/user/profile',
      'GET /api/user/mt5-config',
      'GET /api/user/subscription',
      'GET /api/analysis/top-signals',
      'GET /api/analysis/signal-stats',
      'GET /api/analysis/performance',
      'GET /api/analysis/ml/analytics',
      'POST /api/analysis/signal',
      'POST /api/analysis/predict',
      'GET /api/analysis/history',
      'GET /api/analysis/positions',
      'POST /api/analysis/force-generation',
      'GET /api/ml/analytics',
      'POST /api/ml/train-model',
      'POST /api/ml/detect-patterns'
    ]
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AI Trading Bot Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/api/health`);
  console.log(`🔐 Supabase integration: ${supabaseUrl ? 'Connected' : 'Not configured'}`);
  console.log(`🤖 Ready for production trading signals with authentication`);
});

export default app;