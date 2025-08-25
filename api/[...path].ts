import express from 'express';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Trading Bot API is working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

app.get('/signals', (req, res) => {
  res.json({
    signals: [
      { pair: 'EURUSD', signal: 'BUY', confidence: 0.85, timestamp: new Date().toISOString() },
      { pair: 'GBPUSD', signal: 'SELL', confidence: 0.72, timestamp: new Date().toISOString() },
      { pair: 'USDJPY', signal: 'BUY', confidence: 0.68, timestamp: new Date().toISOString() }
    ],
    timestamp: new Date().toISOString()
  });
});

app.get('/performance', (req, res) => {
  res.json({
    totalTrades: 150,
    winRate: 72.5,
    profitLoss: 2847.50,
    monthlyReturn: 8.3,
    timestamp: new Date().toISOString()
  });
});

export default app;