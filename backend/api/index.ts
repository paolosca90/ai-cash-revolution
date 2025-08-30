import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import analysisRoutes from './analysis';
import mlRoutes from './ml';
import userRoutes from './user';
import tradingRoutes from './trading';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for API
}));

// CORS middleware - allow specific origins for production
app.use(cors({
  origin: [
    'https://ai-cash-revolution-frontend.vercel.app',
    'https://ai-cash-revolution.vercel.app',
    'https://ai-money-generator-main.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/analysis', analysisRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/user', userRoutes);
app.use('/api/trading', tradingRoutes);

// Simple authentication middleware for downloads only
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // In a real app, you'd check JWT tokens or session
  // For now, just check if user has set MT5 config (basic protection)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required to download files' });
  }
  next();
};

// Download endpoints for installer files (protected)
app.get('/api/download/installer', requireAuth, (req, res) => {
  const filePath = path.join(__dirname, '..', 'dist', 'AI_Trading_Bot_Installer.exe');
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Installer file not found' });
  }
  
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename="AI_Trading_Bot_Installer.exe"');
  res.sendFile(filePath);
});

app.get('/api/download/portable', requireAuth, (req, res) => {
  const portableDir = path.join(__dirname, '..', 'dist', 'AI_Trading_Bot_Portable');
  
  if (!fs.existsSync(portableDir)) {
    return res.status(404).json({ error: 'Portable version not found' });
  }
  
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="AI_Trading_Bot_Portable.zip"');
  
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);
  archive.directory(portableDir, false);
  archive.finalize();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'trading-bot-backend'
  });
});

// Root endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'AI Trading Bot API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      analysis: '/api/analysis/*',
      ml: '/api/ml/*',
      user: '/api/user/*',
      trading: '/api/trading/*'
    }
  });
});

export default app;