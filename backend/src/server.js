import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
// Load environment variables
dotenv.config();
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;
// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
// Test database connection on startup
testConnection().catch(console.error);
// Routes
app.use('/auth', authRoutes);
app.use('/analysis', analysisRoutes);
app.use('/trading', tradingRoutes);
app.use('/user', userRoutes);
// Error handling middleware
app.use((err, req, res, next) => {
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
server.listen(PORT, () => {
    console.log(`🚀 Trading Bot Backend running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
export default app;
//# sourceMappingURL=server.js.map