import { Router } from 'express';
import {
  UserPreferences,
  Mt5Config,
  Subscription,
  GetPreferencesResponse,
  UpdatePreferencesRequest,
  UpdatePreferencesResponse,
  GetMt5ConfigResponse,
  UpdateMt5ConfigRequest,
  UpdateMt5ConfigResponse,
  GetSubscriptionResponse,
  GetMt5ConfigForUserRequest,
  GetMt5ConfigForUserResponse
} from '../types';

const router = Router();

// GET /preferences - Get user trading preferences
router.get('/preferences', async (req, res) => {
  try {
    // Return demo preferences (migrated from original Encore logic)
    const preferences: UserPreferences = {
      userId: 1,
      riskPercentage: 2.0,
      accountBalance: 9518.40, // Updated to match your actual MT5 balance
      updatedAt: new Date(),
    };

    const response: GetPreferencesResponse = { preferences };
    res.json(response);
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get user preferences'
    });
  }
});

// POST /preferences - Update user trading preferences
router.post('/preferences', async (req, res) => {
  try {
    const params: UpdatePreferencesRequest = req.body;
    
    // For demo purposes, just return success (migrated from original logic)
    console.log("Demo: Updated preferences", params);
    
    const response: UpdatePreferencesResponse = { success: true };
    res.json(response);
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update user preferences'
    });
  }
});

// GET /mt5-config - Get MT5 configuration
router.get('/mt5-config', async (req, res) => {
  try {
    // Return your actual VPS MT5 config (migrated from original logic)
    const config: Mt5Config = {
      userId: 1,
      host: "154.61.187.189", // Your actual VPS IP
      port: 8080,
      login: "6001637", // Your actual MT5 account
      server: "PureMGlobal-MT5", // Your actual server
    };

    const response: GetMt5ConfigResponse = { config };
    res.json(response);
  } catch (error) {
    console.error('Error getting MT5 config:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get MT5 configuration'
    });
  }
});

// POST /mt5-config - Update MT5 configuration
router.post('/mt5-config', async (req, res) => {
  try {
    const params: UpdateMt5ConfigRequest = req.body;
    
    // For demo purposes, just return success (migrated from original logic)
    console.log("Demo: Updated MT5 config", params);
    
    const response: UpdateMt5ConfigResponse = { success: true };
    res.json(response);
  } catch (error) {
    console.error('Error updating MT5 config:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update MT5 configuration'
    });
  }
});

// GET /subscription - Get subscription status
router.get('/subscription', async (req, res) => {
  try {
    // Return demo subscription (migrated from original logic)
    const subscription: Subscription = {
      userId: 1,
      plan: "free",
      status: "active",
      expiresAt: null,
    };

    const response: GetSubscriptionResponse = { subscription };
    res.json(response);
  } catch (error) {
    console.error('Error getting subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get subscription status'
    });
  }
});

// GET /mt5-config/:userId - Get MT5 configuration for specific user (internal API)
router.get('/mt5-config/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid user ID'
      });
    }

    // For demo purposes, return the same config for all users (migrated logic)
    const config: Mt5Config = {
      userId: userId,
      host: "154.61.187.189", // Your actual VPS IP
      port: 8080,
      login: "6001637", // Your actual MT5 account
      server: "PureMGlobal-MT5", // Your actual server
    };

    const response: GetMt5ConfigForUserResponse = { config };
    res.json(response);
  } catch (error) {
    console.error('Error getting MT5 config for user:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get MT5 configuration for user'
    });
  }
});

export default router;