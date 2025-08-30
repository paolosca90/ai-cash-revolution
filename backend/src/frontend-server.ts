import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for frontend serving
}));

// CORS middleware
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

// Serve static frontend files
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDistPath));

// Basic API routes for frontend functionality
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'trading-bot-frontend'
  });
});

// Mock API endpoints for demo functionality
app.post('/api/auth/login', (req, res) => {
  // Mock login for demo
  res.json({ 
    success: true, 
    token: 'demo-token-' + Date.now(),
    user: { id: 1, email: 'demo@example.com', name: 'Demo User' }
  });
});

app.post('/api/auth/register', (req, res) => {
  // Mock registration for demo
  res.json({ 
    success: true, 
    message: 'Registration successful',
    user: { id: 1, email: req.body.email, name: req.body.name }
  });
});

app.get('/api/analysis/signals', (req, res) => {
  // Mock trading signals for demo
  res.json({
    signals: [
      {
        id: 1,
        symbol: 'EURUSD',
        type: 'LONG',
        confidence: 92,
        grade: 'A+',
        entry: 1.0845,
        takeProfit: 1.0920,
        stopLoss: 1.0820,
        timestamp: new Date().toISOString()
      }
    ]
  });
});

// Catch-all handler: send back React's index.html file for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Simple Frontend Server running on port ${PORT}`);
  console.log(`📁 Serving frontend from: ${frontendDistPath}`);
  console.log(`🌐 Frontend URL: http://localhost:${PORT}`);
});

export default app;