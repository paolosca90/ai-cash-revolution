import { Router } from 'express';
import { query } from '../database/connection.js';
import { z } from 'zod';
const router = Router();
// Validation schemas
const PlaceOrderSchema = z.object({
    userId: z.string(),
    accountId: z.string(),
    symbol: z.string(),
    orderType: z.enum(['BUY', 'SELL', 'BUY_LIMIT', 'SELL_LIMIT', 'BUY_STOP', 'SELL_STOP']),
    volume: z.number().positive(),
    price: z.number().positive().optional(),
    stopLoss: z.number().positive().optional(),
    takeProfit: z.number().positive().optional(),
    comment: z.string().optional()
});
const ClosePositionSchema = z.object({
    userId: z.string(),
    accountId: z.string(),
    positionId: z.string(),
    volume: z.number().positive().optional()
});
// Place order endpoint
router.post('/orders', async (req, res) => {
    try {
        const validatedData = PlaceOrderSchema.parse(req.body);
        const { userId, accountId, symbol, orderType, volume, price, stopLoss, takeProfit, comment } = validatedData;
        // TODO: Implement actual order placing logic with trading account
        // For now, create a mock order in database
        const result = await query(`
      INSERT INTO orders (
        user_id, account_id, symbol, order_type, volume, price, 
        stop_loss, take_profit, comment, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING', NOW(), NOW())
      RETURNING *
    `, [userId, accountId, symbol, orderType, volume, price, stopLoss, takeProfit, comment]);
        const order = result.rows[0];
        res.status(201).json({
            success: true,
            order: {
                id: order.id,
                symbol: order.symbol,
                orderType: order.order_type,
                volume: order.volume,
                price: order.price,
                status: order.status,
                createdAt: order.created_at
            }
        });
    }
    catch (error) {
        console.error('Place order error:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to place order' });
    }
});
// Get order status
router.get('/orders/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { userId } = req.query;
        const result = await query(`
      SELECT o.*, ta.account_name, ta.broker_name 
      FROM orders o
      LEFT JOIN trading_accounts ta ON o.account_id = ta.id
      WHERE o.id = $1 AND o.user_id = $2
    `, [orderId, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const order = result.rows[0];
        res.json({
            id: order.id,
            symbol: order.symbol,
            orderType: order.order_type,
            volume: order.volume,
            price: order.price,
            status: order.status,
            accountName: order.account_name,
            brokerName: order.broker_name,
            createdAt: order.created_at,
            updatedAt: order.updated_at
        });
    }
    catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Failed to get order status' });
    }
});
// List orders for user
router.get('/orders', async (req, res) => {
    try {
        const { userId, limit = '50' } = req.query;
        const result = await query(`
      SELECT o.*, ta.account_name, ta.broker_name 
      FROM orders o
      LEFT JOIN trading_accounts ta ON o.account_id = ta.id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
      LIMIT $2
    `, [userId, parseInt(limit)]);
        const orders = result.rows.map(order => ({
            id: order.id,
            symbol: order.symbol,
            orderType: order.order_type,
            volume: order.volume,
            price: order.price,
            status: order.status,
            accountName: order.account_name,
            brokerName: order.broker_name,
            createdAt: order.created_at,
            updatedAt: order.updated_at
        }));
        res.json({
            orders,
            totalCount: orders.length,
            hasMore: orders.length === parseInt(limit)
        });
    }
    catch (error) {
        console.error('List orders error:', error);
        res.status(500).json({ error: 'Failed to list orders' });
    }
});
// Close position
router.post('/positions/:positionId/close', async (req, res) => {
    try {
        const { positionId } = req.params;
        const validatedData = ClosePositionSchema.parse(req.body);
        const { userId, accountId, volume } = validatedData;
        // TODO: Implement actual position closing logic
        // For now, update order status to CLOSED
        const result = await query(`
      UPDATE orders 
      SET status = 'CLOSED', updated_at = NOW()
      WHERE id = $1 AND user_id = $2 AND account_id = $3
      RETURNING *
    `, [positionId, userId, accountId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Position not found' });
        }
        const closedPosition = result.rows[0];
        res.json({
            success: true,
            order: {
                id: closedPosition.id,
                status: closedPosition.status,
                closedAt: closedPosition.updated_at
            }
        });
    }
    catch (error) {
        console.error('Close position error:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to close position' });
    }
});
// Get trading stats for user
router.get('/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'FILLED' THEN 1 END) as filled_orders,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_orders,
        SUM(volume) as total_volume,
        AVG(price) as avg_price
      FROM orders
      WHERE user_id = $1
    `, [userId]);
        const stats = result.rows[0] || {
            total_orders: 0,
            pending_orders: 0,
            filled_orders: 0,
            cancelled_orders: 0,
            total_volume: 0,
            avg_price: 0
        };
        res.json({
            totalOrders: parseInt(stats.total_orders),
            pendingOrders: parseInt(stats.pending_orders),
            filledOrders: parseInt(stats.filled_orders),
            cancelledOrders: parseInt(stats.cancelled_orders),
            totalVolume: parseFloat(stats.total_volume) || 0,
            totalPnL: 0 // TODO: Calculate actual P&L
        });
    }
    catch (error) {
        console.error('Trading stats error:', error);
        res.status(500).json({ error: 'Failed to get trading stats' });
    }
});
export default router;
//# sourceMappingURL=trading.js.map