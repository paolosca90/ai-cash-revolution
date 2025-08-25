// Main API entry point per Vercel
import express from 'express';
import cors from 'cors';

// Import routes
import subscriptionManager from '../subscription/subscription-manager';
import stripeIntegration from '../payments/stripe-integration';
import adminPanel from '../admin/admin-panel';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.raw({ type: 'application/json' })); // Per Stripe webhooks

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Trading Bot API is working!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      subscription: '/api/subscription/*',
      payments: '/api/payments/*', 
      admin: '/api/admin/*'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

// Routes
app.use('/subscription', subscriptionManager);
app.use('/payments', stripeIntegration);
app.use('/admin', adminPanel);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error('API Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

export default app;