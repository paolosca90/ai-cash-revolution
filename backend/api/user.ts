import { Router } from 'express';

const router = Router();

// Mock user data for demonstration
const mockUser = {
  id: 'user_123456',
  username: 'demo_user',
  email: 'demo@example.com',
  createdAt: '2025-01-01T00:00:00Z'
};

// Mock preferences
const mockPreferences = {
  riskPercentage: 2.5,
  accountBalance: 10000
};

// Mock MT5 config
const mockMt5Config = {
  host: 'mt5.example.com',
  port: 8080,
  login: '123456',
  server: 'DemoServer',
  broker: 'DemoBroker'
};

// Mock subscription
const mockSubscription = {
  type: 'premium',
  expires: '2026-01-01T00:00:00Z',
  isActive: true
};

// Get user preferences
router.get('/preferences', (req, res) => {
  res.json({
    preferences: mockPreferences
  });
});

// Update user preferences
router.post('/preferences', (req, res) => {
  const { riskPercentage, accountBalance } = req.body;
  res.json({
    success: true,
    preferences: {
      riskPercentage,
      accountBalance
    }
  });
});

// Get MT5 config
router.get('/mt5-config', (req, res) => {
  res.json({
    config: mockMt5Config
  });
});

// Update MT5 config
router.post('/mt5-config', (req, res) => {
  res.json({
    success: true,
    config: req.body
  });
});

// Get subscription
router.get('/subscription', (req, res) => {
  res.json({
    subscription: mockSubscription
  });
});

// Get user profile
router.post('/profile', (req, res) => {
  res.json({
    user: mockUser
  });
});

// Get trading accounts
router.post('/trading-accounts', (req, res) => {
  res.json({
    accounts: [
      {
        id: 'account_1',
        userId: 'user_123456',
        accountType: 'MT5',
        accountName: 'Demo Account',
        brokerName: 'DemoBroker',
        serverUrl: 'mt5.example.com:8080',
        accountNumber: '123456',
        isConnected: true,
        lastConnectionTest: new Date().toISOString(),
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: new Date().toISOString()
      }
    ]
  });
});

// Get subscription plans
router.get('/subscription-plans', (req, res) => {
  res.json({
    plans: [
      {
        id: 'basic',
        name: 'Basic',
        price: 29,
        features: ['3 signals/day', 'Basic analytics', 'Email support']
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 99,
        features: ['Unlimited signals', 'Advanced analytics', 'AI predictions', '24/7 support']
      }
    ]
  });
});

// Upgrade subscription
router.post('/upgrade-subscription', (req, res) => {
  res.json({
    success: true,
    message: 'Subscription upgraded successfully',
    subscription: {
      ...mockSubscription,
      type: req.body.planId
    }
  });
});

// User login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock validation
  if (email === 'demo@example.com' && password === 'demo123') {
    res.json({
      success: true,
      user: mockUser,
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzEyMzQ1NiIsImVtYWlsIjoiZGVtb0BleGFtcGxlLmNvbSIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    });
  } else {
    res.status(401).json({
      error: 'Invalid credentials'
    });
  }
});

// User registration
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  
  // Mock validation
  if (username && email && password && password.length >= 6) {
    res.status(201).json({
      success: true,
      user: {
        id: 'user_' + Date.now(),
        username,
        email,
        createdAt: new Date().toISOString()
      },
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzEyMzQ1NiIsImVtYWlsIjoiZGVtb0BleGFtcGxlLmNvbSIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    });
  } else {
    res.status(400).json({
      error: 'Invalid input'
    });
  }
});

export default router;