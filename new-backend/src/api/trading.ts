import { Router } from 'express';
import { Position, Order } from '../types';

const router = Router();

// Types for trading endpoints
interface PlaceOrderRequest {
  symbol: string;
  type: "buy" | "sell";
  volume: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
}

interface PlaceOrderResponse {
  success: boolean;
  orderId?: number;
  message: string;
}

interface GetPositionsResponse {
  positions: Position[];
}

interface GetOrdersResponse {
  orders: Order[];
}

interface ClosePositionRequest {
  positionId: number;
  reason?: string;
}

interface ClosePositionResponse {
  success: boolean;
  message: string;
}

// POST /trading/place-order - Place a trading order
router.post('/place-order', async (req, res) => {
  try {
    const { symbol, type, volume, price, stopLoss, takeProfit }: PlaceOrderRequest = req.body;

    // Validate request
    if (!symbol || !type || !volume) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Missing required fields: symbol, type, volume'
      });
    }

    console.log(`📈 Placing ${type} order for ${symbol} - Volume: ${volume}`);

    // For demo purposes, simulate order placement
    const mockOrderId = Math.floor(Math.random() * 100000) + 1;
    
    const response: PlaceOrderResponse = {
      success: true,
      orderId: mockOrderId,
      message: `Order placed successfully for ${symbol}`
    };

    res.json(response);
  } catch (error) {
    console.error("❌ Error placing order:", error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to place order'
    });
  }
});

// GET /trading/positions - Get current positions
router.get('/positions', async (req, res) => {
  try {
    console.log("📊 Fetching current positions...");

    // Mock positions for demo
    const mockPositions: Position[] = [
      {
        id: 1,
        symbol: "EURUSD",
        type: "buy",
        volume: 0.1,
        openPrice: 1.0856,
        currentPrice: 1.0862,
        stopLoss: 1.0830,
        takeProfit: 1.0890,
        profit: 6.0,
        timestamp: new Date(Date.now() - 45 * 60 * 1000) // 45 minutes ago
      },
      {
        id: 2,
        symbol: "GBPUSD",
        type: "sell",
        volume: 0.2,
        openPrice: 1.2640,
        currentPrice: 1.2635,
        stopLoss: 1.2665,
        takeProfit: 1.2610,
        profit: 10.0,
        timestamp: new Date(Date.now() - 32 * 60 * 1000) // 32 minutes ago
      }
    ];

    const response: GetPositionsResponse = { positions: mockPositions };
    res.json(response);
  } catch (error) {
    console.error("❌ Error fetching positions:", error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch positions'
    });
  }
});

// GET /trading/orders - Get order history
router.get('/orders', async (req, res) => {
  try {
    console.log("📋 Fetching order history...");

    // Mock orders for demo
    const mockOrders: Order[] = [
      {
        id: 1,
        symbol: "EURUSD",
        type: "buy",
        volume: 0.1,
        price: 1.0856,
        status: "executed",
        timestamp: new Date(Date.now() - 45 * 60 * 1000)
      },
      {
        id: 2,
        symbol: "GBPUSD",
        type: "sell",
        volume: 0.2,
        price: 1.2640,
        status: "executed",
        timestamp: new Date(Date.now() - 32 * 60 * 1000)
      },
      {
        id: 3,
        symbol: "USDJPY",
        type: "buy",
        volume: 0.15,
        price: 149.25,
        status: "pending",
        timestamp: new Date(Date.now() - 5 * 60 * 1000)
      }
    ];

    const response: GetOrdersResponse = { orders: mockOrders };
    res.json(response);
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch orders'
    });
  }
});

// POST /trading/close-position - Close a position
router.post('/close-position/:positionId', async (req, res) => {
  try {
    const positionId = parseInt(req.params.positionId);
    const { reason } = req.body;

    if (!positionId) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid position ID'
      });
    }

    console.log(`🔒 Closing position ${positionId}. Reason: ${reason || 'Manual close'}`);

    // For demo purposes, simulate position closing
    const response: ClosePositionResponse = {
      success: true,
      message: `Position ${positionId} closed successfully`
    };

    res.json(response);
  } catch (error) {
    console.error("❌ Error closing position:", error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to close position'
    });
  }
});

export default router;