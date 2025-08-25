import express from 'express';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Trading Bot API is working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

app.get('/api/signals', (req, res) => {
  res.json({
    signals: [
      { pair: 'EURUSD', signal: 'BUY', confidence: 0.85 },
      { pair: 'GBPUSD', signal: 'SELL', confidence: 0.72 }
    ],
    timestamp: new Date().toISOString()
  });
});

export default app;