import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
// Database connection for order routing
const db = new SQLDatabase("orders", {
    migrations: "./order_migrations",
});
// Helper functions
const validateOrderRequest = (req) => {
    if (!req.userId || !req.accountId || !req.symbol) {
        throw APIError.invalidArgument("userId, accountId, and symbol are required");
    }
    if (!["BUY", "SELL"].includes(req.action)) {
        throw APIError.invalidArgument("action must be BUY or SELL");
    }
    if (!["MARKET", "LIMIT", "STOP", "STOP_LIMIT"].includes(req.orderType)) {
        throw APIError.invalidArgument("Invalid order type");
    }
    if (req.volume <= 0) {
        throw APIError.invalidArgument("Volume must be positive");
    }
    if ((req.orderType === "LIMIT" || req.orderType === "STOP" || req.orderType === "STOP_LIMIT") && !req.price) {
        throw APIError.invalidArgument("Price is required for limit and stop orders");
    }
};
const getTradingAccountDetails = async (userId, accountId) => {
    const accounts = await db.query `
    SELECT ta.*, u.subscription_tier, u.subscription_status
    FROM trading_accounts ta
    JOIN users u ON ta.user_id = u.id
    WHERE ta.id = ${accountId} AND ta.user_id = ${userId} AND ta.is_active = true
  `;
    if (accounts.length === 0) {
        throw APIError.notFound("Trading account not found or inactive");
    }
    return accounts[0];
};
const calculatePositionSize = (account, riskPercent, entryPrice, stopLoss) => {
    if (!account.account_balance || !stopLoss) {
        return 0.01; // Minimum lot size
    }
    const accountBalance = account.account_balance;
    const riskAmount = accountBalance * (riskPercent / 100);
    const pipValue = Math.abs(entryPrice - stopLoss) * 10; // Simplified pip calculation
    if (pipValue === 0)
        return 0.01;
    const lotSize = riskAmount / (pipValue * 10); // Simplified position sizing
    return Math.max(0.01, Math.min(lotSize, accountBalance * 0.1 / entryPrice)); // Max 10% of balance
};
// Route order to appropriate broker
const routeOrderToBroker = async (account, orderReq) => {
    const accountType = account.account_type;
    try {
        switch (accountType) {
            case "MT4":
            case "MT5":
                return await routeToMT5(account, orderReq);
            case "BINANCE":
                return await routeToBinance(account, orderReq);
            case "BYBIT":
                return await routeToBybit(account, orderReq);
            case "COINBASE":
                return await routeToCoinbase(account, orderReq);
            case "ALPACA":
                return await routeToAlpaca(account, orderReq);
            default:
                throw APIError.invalidArgument(`Unsupported account type: ${accountType}`);
        }
    }
    catch (error) {
        console.error(`Order routing error for ${accountType}:`, error);
        return {
            success: false,
            message: `Failed to route order to ${accountType}: ${error.message}`,
            timestamp: new Date()
        };
    }
};
// MT4/MT5 order routing
const routeToMT5 = async (account, orderReq) => {
    try {
        // Prepare MT5 order data
        const mt5OrderData = {
            login: account.account_number,
            server: account.server_url,
            symbol: orderReq.symbol,
            cmd: orderReq.action === "BUY" ? 0 : 1,
            volume: orderReq.volume,
            price: orderReq.price || 0,
            slippage: orderReq.slippage || 3,
            stoploss: orderReq.stopLoss || 0,
            takeprofit: orderReq.takeProfit || 0,
            comment: orderReq.comment || "AI Trading Boost",
            magic: 123456,
            expiration: orderReq.expiration ? Math.floor(orderReq.expiration.getTime() / 1000) : 0
        };
        // Send order to MT5 service
        const response = await fetch("http://localhost:8001/place_order", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(mt5OrderData)
        });
        if (!response.ok) {
            throw new Error(`MT5 service error: ${response.status}`);
        }
        const result = await response.json();
        return {
            success: result.success,
            orderId: result.ticket?.toString(),
            ticket: result.ticket,
            message: result.message || (result.success ? "Order placed successfully" : "Order failed"),
            executionPrice: result.price,
            timestamp: new Date(),
            commission: result.commission,
            swap: result.swap
        };
    }
    catch (error) {
        return {
            success: false,
            message: `MT5 connection failed: ${error.message}`,
            timestamp: new Date()
        };
    }
};
// Binance order routing
const routeToBinance = async (account, orderReq) => {
    // Simulate Binance API call
    // In production, implement actual Binance API integration
    const simulatedResponse = {
        success: Math.random() > 0.1, // 90% success rate simulation
        orderId: `binance_${Date.now()}`,
        message: "Binance order simulation",
        executionPrice: orderReq.price || 50000, // Simulated price
        timestamp: new Date(),
        commission: orderReq.volume * 0.001 // 0.1% commission
    };
    return simulatedResponse;
};
// Bybit order routing
const routeToBybit = async (account, orderReq) => {
    // Simulate Bybit API call
    const simulatedResponse = {
        success: Math.random() > 0.1,
        orderId: `bybit_${Date.now()}`,
        message: "Bybit order simulation",
        executionPrice: orderReq.price || 50000,
        timestamp: new Date(),
        commission: orderReq.volume * 0.00075 // 0.075% commission
    };
    return simulatedResponse;
};
// Coinbase order routing
const routeToCoinbase = async (account, orderReq) => {
    // Simulate Coinbase API call
    const simulatedResponse = {
        success: Math.random() > 0.05,
        orderId: `coinbase_${Date.now()}`,
        message: "Coinbase order simulation",
        executionPrice: orderReq.price || 50000,
        timestamp: new Date(),
        commission: orderReq.volume * 0.005 // 0.5% commission
    };
    return simulatedResponse;
};
// Alpaca order routing
const routeToAlpaca = async (account, orderReq) => {
    // Simulate Alpaca API call for stocks
    const simulatedResponse = {
        success: Math.random() > 0.05,
        orderId: `alpaca_${Date.now()}`,
        message: "Alpaca order simulation",
        executionPrice: orderReq.price || 150, // Stock price simulation
        timestamp: new Date(),
        commission: 0 // Alpaca commission-free
    };
    return simulatedResponse;
};
// Place new order
export const placeOrder = api({ method: "POST", path: "/trading/orders", expose: true }, async (req) => {
    try {
        // Validate request
        validateOrderRequest(req);
        // Get and validate trading account
        const account = await getTradingAccountDetails(req.userId, req.accountId);
        // Check if auto-trading is enabled
        if (!account.auto_trading_enabled) {
            throw APIError.failedPrecondition("Auto-trading is disabled for this account");
        }
        // Apply risk management
        const maxRisk = account.max_risk_per_trade;
        if (req.stopLoss) {
            const suggestedVolume = calculatePositionSize(account, maxRisk, req.price || 1, req.stopLoss);
            req.volume = Math.min(req.volume, suggestedVolume);
        }
        // Create order record
        const orderId = crypto.randomUUID();
        const now = new Date();
        await db.exec `
        INSERT INTO orders (
          id, user_id, account_id, symbol, action, order_type, volume,
          requested_price, stop_loss, take_profit, status, comment,
          created_at
        ) VALUES (
          ${orderId}, ${req.userId}, ${req.accountId}, ${req.symbol},
          ${req.action}, ${req.orderType}, ${req.volume}, ${req.price || 0},
          ${req.stopLoss || 0}, ${req.takeProfit || 0}, 'PENDING',
          ${req.comment || ''}, ${now}
        )
      `;
        // Route order to broker
        const brokerResponse = await routeOrderToBroker(account, req);
        // Update order with broker response
        const updateData = {
            status: brokerResponse.success ? 'FILLED' : 'REJECTED',
            external_ticket: brokerResponse.ticket || null,
            execution_price: brokerResponse.executionPrice || 0,
            commission: brokerResponse.commission || 0,
            swap: brokerResponse.swap || 0,
            executed_at: brokerResponse.success ? now : null
        };
        await db.exec `
        UPDATE orders SET
          status = ${updateData.status},
          external_ticket = ${updateData.external_ticket},
          execution_price = ${updateData.execution_price},
          commission = ${updateData.commission},
          swap = ${updateData.swap},
          executed_at = ${updateData.executed_at}
        WHERE id = ${orderId}
      `;
        return {
            ...brokerResponse,
            orderId
        };
    }
    catch (error) {
        console.error("Place order error:", error);
        if (error.code) {
            throw error;
        }
        throw APIError.internal(`Failed to place order: ${error.message}`);
    }
});
// Get order status
export const getOrderStatus = api({ method: "GET", path: "/trading/orders/:orderId", expose: true }, async ({ orderId, userId }) => {
    try {
        const orders = await db.query `
        SELECT o.*, ta.account_name, ta.broker_name
        FROM orders o
        JOIN trading_accounts ta ON o.account_id = ta.id
        WHERE o.id = ${orderId} AND o.user_id = ${userId}
      `;
        if (orders.length === 0) {
            throw APIError.notFound("Order not found");
        }
        return {
            success: true,
            order: orders[0]
        };
    }
    catch (error) {
        console.error("Get order status error:", error);
        if (error.code) {
            throw error;
        }
        throw APIError.internal(`Failed to get order status: ${error.message}`);
    }
});
// List user orders
export const listOrders = api({ method: "GET", path: "/trading/orders", expose: true }, async ({ userId, limit = 50 }) => {
    try {
        const orders = await db.query `
        SELECT o.*, ta.account_name, ta.broker_name
        FROM orders o
        JOIN trading_accounts ta ON o.account_id = ta.id
        WHERE o.user_id = ${userId}
        ORDER BY o.created_at DESC
        LIMIT ${limit}
      `;
        return {
            success: true,
            orders
        };
    }
    catch (error) {
        console.error("List orders error:", error);
        throw APIError.internal(`Failed to list orders: ${error.message}`);
    }
});
// Close position
export const closePosition = api({ method: "POST", path: "/trading/positions/:positionId/close", expose: true }, async (req) => {
    try {
        const account = await getTradingAccountDetails(req.userId, req.accountId);
        // Get position details
        const positions = await db.query `
        SELECT * FROM orders 
        WHERE id = ${req.positionId} AND user_id = ${req.userId} 
        AND status = 'FILLED'
      `;
        if (positions.length === 0) {
            throw APIError.notFound("Position not found or not open");
        }
        const position = positions[0];
        // Create opposite order to close position
        const closeOrderReq = {
            userId: req.userId,
            accountId: req.accountId,
            symbol: position.symbol,
            action: position.action === "BUY" ? "SELL" : "BUY",
            orderType: "MARKET",
            volume: req.volume || position.volume,
            comment: `Close position ${req.positionId}`
        };
        return await placeOrder(closeOrderReq);
    }
    catch (error) {
        console.error("Close position error:", error);
        if (error.code) {
            throw error;
        }
        throw APIError.internal(`Failed to close position: ${error.message}`);
    }
});
// Auto-execute signal (for automated trading)
export const autoExecuteSignal = api({ method: "POST", path: "/trading/auto-execute", expose: true }, async (req) => {
    try {
        // Get signal details
        const signals = await db.query `
        SELECT * FROM trading_signals 
        WHERE id = ${req.signalId}
      `;
        if (signals.length === 0) {
            throw APIError.notFound("Signal not found");
        }
        const signal = signals[0];
        // Get user's active trading accounts
        const accountQuery = req.accountIds
            ? db.query `
          SELECT * FROM trading_accounts 
          WHERE user_id = ${req.userId} AND id = ANY(${req.accountIds}) 
          AND is_active = true AND auto_trading_enabled = true
        `
            : db.query `
          SELECT * FROM trading_accounts 
          WHERE user_id = ${req.userId} AND is_active = true 
          AND auto_trading_enabled = true
        `;
        const accounts = await accountQuery;
        if (accounts.length === 0) {
            throw APIError.failedPrecondition("No auto-trading accounts found");
        }
        const results = [];
        // Execute on each account
        for (const account of accounts) {
            try {
                // Calculate position size based on account settings
                const volume = calculatePositionSize(account, account.max_risk_per_trade, signal.entry_price, signal.stop_loss);
                const orderReq = {
                    userId: req.userId,
                    accountId: account.id,
                    symbol: signal.symbol,
                    action: signal.direction === "LONG" ? "BUY" : "SELL",
                    orderType: "MARKET",
                    volume,
                    stopLoss: signal.stop_loss,
                    takeProfit: signal.take_profit,
                    comment: `Auto-execute signal ${req.signalId}`
                };
                const result = await placeOrder(orderReq);
                results.push({
                    accountId: account.id,
                    accountName: account.account_name,
                    ...result
                });
            }
            catch (error) {
                results.push({
                    accountId: account.id,
                    accountName: account.account_name,
                    success: false,
                    message: error.message,
                    timestamp: new Date()
                });
            }
        }
        return {
            success: true,
            message: `Signal executed on ${results.filter(r => r.success).length}/${accounts.length} accounts`,
            results
        };
    }
    catch (error) {
        console.error("Auto execute signal error:", error);
        if (error.code) {
            throw error;
        }
        throw APIError.internal(`Failed to auto-execute signal: ${error.message}`);
    }
});
// Get trading statistics
export const getTradingStats = api({ method: "GET", path: "/trading/stats/:userId", expose: true }, async ({ userId }) => {
    try {
        const stats = await db.query `
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'FILLED' THEN 1 END) as filled_orders,
          COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_orders,
          AVG(CASE WHEN status = 'FILLED' THEN execution_price - requested_price END) as avg_slippage,
          SUM(CASE WHEN status = 'FILLED' THEN volume ELSE 0 END) as total_volume,
          SUM(CASE WHEN status = 'FILLED' THEN commission ELSE 0 END) as total_commission
        FROM orders
        WHERE user_id = ${userId}
        AND created_at >= NOW() - INTERVAL '30 days'
      `;
        return {
            success: true,
            stats: stats[0]
        };
    }
    catch (error) {
        console.error("Get trading stats error:", error);
        throw APIError.internal(`Failed to get trading stats: ${error.message}`);
    }
});
//# sourceMappingURL=order-router.js.map