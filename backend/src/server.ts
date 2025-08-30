import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import rateLimit from 'express-rate-limit';
import { learningEngine } from '../ml/learning-engine.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Security and Rate Limiting Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://ai-cash-revolution.vercel.app', process.env.FRONTEND_URL] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limiting for trading endpoints
const tradingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 trading requests per minute max
  message: 'Too many trading requests, please slow down.',
});
app.use('/trading', tradingLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
    next();
  });
}

// Root endpoint with production info
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Trading Bot API - Production Ready',
    status: 'running',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: {
      aiAnalysis: 'Advanced Gemini AI + Ensemble ML Models',
      trading: 'Real MT5 Integration',
      riskManagement: 'Sophisticated Risk Controls',
      patterns: 'ML Pattern Recognition',
      sentiment: 'Real-time News Sentiment',
      vwap: 'VWAP Analysis',
      institutional: 'Smart Money Tracking'
    },
    endpoints: {
      health: '/health',
      auth: '/auth/*',
      analysis: '/analysis/*',
      trading: '/trading/*',
      users: '/users/*'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'trading-bot-backend'
  });
});

// Import and use route modules
import authRoutes from './routes/auth.js';
import analysisRoutes from './routes/analysis.js';
import tradingRoutes from './routes/trading.js';
import userRoutes from './routes/users.js';
import { testConnection } from './database/connection.js';

// Test database connection and initialize ML engine on startup
testConnection().catch(console.error);

// Initialize ML learning engine
if (process.env.ENABLE_ML_ANALYTICS !== 'false') {
  console.log('🤖 Initializing ML Learning Engine...');
  learningEngine.initializeEngine().then(() => {
    console.log('✅ ML Engine initialized successfully');
    
    // Start ML training cycle if enabled
    if (process.env.ENABLE_AUTO_TRAINING !== 'false') {
      console.log('🔄 Starting automated ML training cycle...');
      // Train every 6 hours in production
      const trainingInterval = process.env.NODE_ENV === 'production' ? 6 * 60 * 60 * 1000 : 60 * 60 * 1000;
      setInterval(async () => {
        try {
          console.log('🤖 Starting scheduled ML training...');
          await learningEngine.trainModel();
          console.log('✅ Scheduled ML training completed');
        } catch (error) {
          console.error('❌ Scheduled ML training failed:', error);
        }
      }, trainingInterval);
    }
  }).catch(error => {
    console.error('❌ ML Engine initialization failed:', error);
  });
}

// Simple authentication middleware for downloads
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required to download files' });
  }
  next();
};

// Download endpoints for installer files (protected)
app.get('/api/download/installer', requireAuth, (req, res) => {
  const filePath = path.join(__dirname, '..', 'dist', 'AI_Trading_Bot_Installer.exe');
  
  console.log('Looking for installer at:', filePath);
  console.log('File exists:', fs.existsSync(filePath));
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Installer file not found', path: filePath });
  }
  
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename="AI_Trading_Bot_Installer.exe"');
  res.sendFile(filePath);
});

app.get('/api/download/portable', requireAuth, (req, res) => {
  const portableDir = path.join(__dirname, '..', 'dist', 'AI_Trading_Bot_Portable');
  
  console.log('Looking for portable at:', portableDir);
  console.log('Dir exists:', fs.existsSync(portableDir));
  
  if (!fs.existsSync(portableDir)) {
    return res.status(404).json({ error: 'Portable version not found', path: portableDir });
  }
  
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="AI_Trading_Bot_Portable.zip"');
  
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);
  archive.directory(portableDir, false);
  archive.finalize();
});

// Production-ready routes with proper prefixing
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes); // Alternative prefix for compatibility
app.use('/analysis', analysisRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/trading', tradingRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/users', userRoutes); // Fixed: was /user, now /users
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AI Trading Bot Backend (Production) running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🤖 AI Engine: ${process.env.ENABLE_ML_ANALYTICS !== 'false' ? 'Enabled' : 'Disabled'}`);
  console.log(`💰 Real Trading: ${process.env.ENABLE_REAL_TRADING === 'true' ? 'Enabled' : 'Demo Only'}`);
  console.log(`🛡️ Security: Enhanced with Rate Limiting & Encryption`);
  console.log(`📈 Features: Advanced AI Analysis, Real MT5, Pattern Recognition`);
});

export default app;