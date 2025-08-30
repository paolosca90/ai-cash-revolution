import { Router } from 'express';

const router = Router();

// Mock trading data for demonstration
const mockPositions = [
  {
    id: 'pos_1',
    symbol: 'EURUSD',
    type: 'BUY',
    volume: 0.1,
    openPrice: 1.1200,
    currentPrice: 1.1234,
    profit: 34.56,
    timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  },
  {
    id: 'pos_2',
    symbol: 'GBPUSD',
    type: 'SELL',
    volume: 0.05,
    openPrice: 1.3400,
    currentPrice: 1.3392,
    profit: 40.12,
    timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
  }
];

const mockOrders = [
  {
    id: 'order_1',
    symbol: 'EURUSD',
    orderType: 'BUY',
    volume: 0.1,
    price: 1.1200,
    status: 'FILLED',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'order_2',
    symbol: 'GBPUSD',
    orderType: 'SELL',
    volume: 0.05,
    price: 1.3400,
    status: 'FILLED',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString()
  }
];

// Get trading positions
router.get('/positions', (req, res) => {
  res.json({
    positions: mockPositions
  });
});

// Get orders
router.get('/orders', (req, res) => {
  res.json({
    orders: mockOrders
  });
});

// Place order
router.post('/place-order', (req, res) => {
  const { symbol, orderType, volume, price } = req.body;
  res.json({
    success: true,
    order: {
      id: `order_${Date.now()}`,
      symbol,
      orderType,
      volume,
      price,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
});

// Close position
router.post('/close-position/:positionId', (req, res) => {
  const { positionId } = req.params;
  const { reason } = req.body;
  res.json({
    success: true,
    message: `Position ${positionId} closed successfully`,
    closedAt: new Date().toISOString(),
    reason
  });
});

export default router;