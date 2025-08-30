import { Router } from 'express';
import { query } from '../database/connection.js';
import { z } from 'zod';
import { executeTrade } from '../../analysis/execute.js';
import { closePosition } from '../../analysis/close-position.js';
import { getPositions } from '../../analysis/positions.js';
import { Mt5Bridge } from '../../analysis/mt5-bridge.js';

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

    // Get trading account configuration
    const accountResult = await query(`
      SELECT * FROM trading_accounts WHERE id = $1 AND user_id = $2
    `, [accountId, userId]);
    
    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trading account not found' });
    }
    
    const account = accountResult.rows[0];
    
    // Create MT5 configuration from account
    const mt5Config = {
      host: account.server_url || process.env.MT5_HOST || 'localhost',
      port: parseInt(process.env.MT5_PORT || '8080'),
      login: account.account_number || '',
      server: account.broker_name || '',
      broker: account.broker_name || ''
    };
    
    // Execute trade using sophisticated trading engine
    try {
      const tradeResult = await executeTrade({
        symbol,
        action: orderType.startsWith('BUY') ? 'BUY' : 'SELL',
        volume,
        price: price || 0, // Market order if no price
        stopLoss,
        takeProfit,
        comment: comment || `Order ${orderType} ${symbol}`,
        mt5Config
      });
      
      // Store successful order in database
      const result = await query(`
        INSERT INTO orders (
          user_id, account_id, symbol, order_type, volume, price, 
          stop_loss, take_profit, comment, status, mt5_ticket, 
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *
      `, [userId, accountId, symbol, orderType, volume, 
          tradeResult.openPrice || price, stopLoss, takeProfit, comment, 
          tradeResult.success ? 'FILLED' : 'FAILED', tradeResult.ticket]);

      const order = result.rows[0];

      res.status(201).json({
        success: tradeResult.success,
        order: {
          id: order.id,
          symbol: order.symbol,
          orderType: order.order_type,
          volume: order.volume,
          price: order.price,
          status: order.status,
          mt5Ticket: order.mt5_ticket,
          createdAt: order.created_at
        },
        mt5Result: tradeResult
      });
      
    } catch (tradeError) {
      console.error('Trade execution error:', tradeError);
      
      // Store failed order in database for tracking
      await query(`
        INSERT INTO orders (
          user_id, account_id, symbol, order_type, volume, price, 
          stop_loss, take_profit, comment, status, error_message,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'FAILED', $10, NOW(), NOW())
      `, [userId, accountId, symbol, orderType, volume, price, stopLoss, takeProfit, comment, tradeError.message]);
      
      return res.status(500).json({
        success: false,
        error: 'Trade execution failed',
        details: tradeError.message
      });
    }

  } catch (error) {
    console.error('Place order error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to place order', details: error.message });
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

  } catch (error) {
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
    `, [userId, parseInt(limit as string)]);

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
      hasMore: orders.length === parseInt(limit as string)
    });

  } catch (error) {
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

    // Get position details from database
    const positionResult = await query(`
      SELECT o.*, ta.server_url, ta.broker_name, ta.account_number
      FROM orders o
      JOIN trading_accounts ta ON o.account_id = ta.id
      WHERE o.id = $1 AND o.user_id = $2 AND o.account_id = $3 AND o.status IN ('FILLED', 'PARTIAL')
    `, [positionId, userId, accountId]);

    if (positionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Position not found or already closed' });
    }

    const position = positionResult.rows[0];
    
    // Create MT5 configuration
    const mt5Config = {
      host: position.server_url || process.env.MT5_HOST || 'localhost',
      port: parseInt(process.env.MT5_PORT || '8080'),
      login: position.account_number || '',
      server: position.broker_name || '',
      broker: position.broker_name || ''
    };
    
    try {
      // Close position using sophisticated trading engine
      const closeResult = await closePosition({
        ticket: position.mt5_ticket,
        symbol: position.symbol,
        volume: volume || position.volume,
        mt5Config
      });
      
      // Update position status in database
      const result = await query(`
        UPDATE orders 
        SET status = 'CLOSED', close_price = $1, close_time = NOW(), 
            profit_loss = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `, [closeResult.closePrice, closeResult.profit, positionId]);

      const closedPosition = result.rows[0];

      res.json({
        success: closeResult.success,
        order: {
          id: closedPosition.id,
          status: closedPosition.status,
          closePrice: closedPosition.close_price,
          profitLoss: closedPosition.profit_loss,
          closedAt: closedPosition.close_time
        },
        mt5Result: closeResult
      });
      
    } catch (closeError) {
      console.error('Position close error:', closeError);
      
      // Update position with error status
      await query(`
        UPDATE orders 
        SET status = 'CLOSE_FAILED', error_message = $1, updated_at = NOW()
        WHERE id = $2
      `, [closeError.message, positionId]);
      
      return res.status(500).json({
        success: false,
        error: 'Position close failed',
        details: closeError.message
      });
    }

  } catch (error) {
    console.error('Close position error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to close position', details: error.message });
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
        COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as closed_orders,
        SUM(volume) as total_volume,
        AVG(price) as avg_price,
        SUM(CASE WHEN profit_loss IS NOT NULL THEN profit_loss ELSE 0 END) as total_profit_loss,
        AVG(CASE WHEN profit_loss IS NOT NULL THEN profit_loss ELSE 0 END) as avg_profit_loss,
        COUNT(CASE WHEN profit_loss > 0 THEN 1 END) as winning_trades,
        COUNT(CASE WHEN profit_loss < 0 THEN 1 END) as losing_trades,
        MAX(profit_loss) as best_trade,
        MIN(profit_loss) as worst_trade
      FROM orders
      WHERE user_id = $1
    `, [userId]);

    const stats = result.rows[0] || {
      total_orders: 0,
      pending_orders: 0,
      filled_orders: 0,
      cancelled_orders: 0,
      closed_orders: 0,
      total_volume: 0,
      avg_price: 0,
      total_profit_loss: 0,
      avg_profit_loss: 0,
      winning_trades: 0,
      losing_trades: 0,
      best_trade: 0,
      worst_trade: 0
    };
    
    // Calculate win rate
    const totalClosedTrades = parseInt(stats.winning_trades) + parseInt(stats.losing_trades);
    const winRate = totalClosedTrades > 0 ? (parseInt(stats.winning_trades) / totalClosedTrades) * 100 : 0;
    
    // Calculate profit factor
    const grossProfit = Math.abs(parseFloat(stats.total_profit_loss) || 0);
    const grossLoss = Math.abs(parseFloat(stats.total_profit_loss) < 0 ? parseFloat(stats.total_profit_loss) : 0);
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? grossProfit : 1);
    
    // Get recent performance by symbol
    const symbolStats = await query(`
      SELECT 
        symbol,
        COUNT(*) as trades,
        SUM(profit_loss) as total_pnl,
        AVG(profit_loss) as avg_pnl
      FROM orders
      WHERE user_id = $1 AND status = 'CLOSED' AND profit_loss IS NOT NULL
      GROUP BY symbol
      ORDER BY total_pnl DESC
      LIMIT 5
    `, [userId]);

    res.json({
      totalOrders: parseInt(stats.total_orders),
      pendingOrders: parseInt(stats.pending_orders),
      filledOrders: parseInt(stats.filled_orders),
      cancelledOrders: parseInt(stats.cancelled_orders),
      closedOrders: parseInt(stats.closed_orders),
      totalVolume: parseFloat(stats.total_volume) || 0,
      averagePrice: parseFloat(stats.avg_price) || 0,
      totalPnL: parseFloat(stats.total_profit_loss) || 0,
      averagePnL: parseFloat(stats.avg_profit_loss) || 0,
      winningTrades: parseInt(stats.winning_trades),
      losingTrades: parseInt(stats.losing_trades),
      winRate: Math.round(winRate * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
      bestTrade: parseFloat(stats.best_trade) || 0,
      worstTrade: parseFloat(stats.worst_trade) || 0,
      performanceBySymbol: symbolStats.rows.map(row => ({
        symbol: row.symbol,
        trades: parseInt(row.trades),
        totalPnL: parseFloat(row.total_pnl),
        averagePnL: parseFloat(row.avg_pnl)
      }))
    });

  } catch (error) {
    console.error('Trading stats error:', error);
    res.status(500).json({ error: 'Failed to get trading stats', details: error.message });
  }
});

export default router;