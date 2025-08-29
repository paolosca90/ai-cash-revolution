import express from 'express';
import cors from 'cors';
import { Config } from './core/config';
import { ExternalAPIManager } from './core/external-apis';

// Import routers
import userRouter from './api/user';
import analysisRouter from './api/analysis';
import mlRouter from './api/ml';
import tradingRouter from './api/trading';
import paymentsRouter from './api/payments';

// Validate configuration on startup
Config.validateRequiredConfig();

const app = express();
const PORT = Config.PORT;

// Middleware
app.use(cors(Config.getCorsConfig()));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'trading-backend'
  });
});

// API Routes
app.use('/api/user', userRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/ml', mlRouter);
app.use('/api/trading', tradingRouter);
app.use('/api/payments', paymentsRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
      details: err.details
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server only in development (Vercel handles this in production)
if (Config.isDevelopment()) {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📊 Health check available at http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${Config.NODE_ENV}`);
    console.log(`🔗 Frontend URL: ${Config.FRONTEND_URL}`);
    console.log(`💾 Database: ${Config.isDevelopment() ? 'Local PostgreSQL' : 'Production Database'}`);
    console.log(`📈 Trading Mode: ${Config.IS_PRODUCTION ? 'LIVE TRADING' : 'DEMO MODE'}`);
    console.log(`🔐 Security: ${Config.isDevelopment() ? 'Development Keys' : 'Production Keys'}`);
    
    // Validate and report configured services
    const serviceValidation = ExternalAPIManager.validateConfiguredServices();
    
    if (serviceValidation.valid.length > 0) {
      console.log(`✅ Configured services: ${serviceValidation.valid.join(', ')}`);
    }
    
    if (serviceValidation.warnings.length > 0) {
      serviceValidation.warnings.forEach(warning => {
        console.warn(`⚠️  ${warning}`);
      });
    }
    
    if (serviceValidation.missing.length > 0) {
      console.log(`ℹ️  Available services not configured: ${serviceValidation.missing.join(', ')}`);
    }
  });
} else {
  // In production, log startup info
  console.log(`🚀 Trading Backend starting in production mode`);
  console.log(`🌍 Environment: ${Config.NODE_ENV}`);
  console.log(`📈 Trading Mode: ${Config.IS_PRODUCTION ? 'LIVE TRADING' : 'DEMO MODE'}`);
}

export default app;