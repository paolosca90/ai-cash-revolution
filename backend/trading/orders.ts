import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = new SQLDatabase("trading_orders", {
  migrations: "./migrations",
});

interface Order {
  id: number;
  userId: number;
  symbol: string;
  orderType: "MARKET" | "LIMIT" | "STOP";
  side: "BUY" | "SELL";
  quantity: number;
  price?: number;
  status: "PENDING" | "FILLED" | "CANCELLED" | "REJECTED";
  filledQuantity: number;
  averagePrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateOrderRequest {
  userId: number;
  symbol: string;
  orderType: "MARKET" | "LIMIT" | "STOP";
  side: "BUY" | "SELL";
  quantity: number;
  price?: number;
}

interface CreateOrderResponse {
  order: Order;
}

interface GetOrderRequest {
  orderId: number;
  userId: number;
}

interface GetOrderResponse {
  order: Order;
}

interface ListOrdersRequest {
  userId: number;
  limit?: number;
}

interface ListOrdersResponse {
  orders: Order[];
}

// Creates a new trading order
export const createOrder = api<CreateOrderRequest, CreateOrderResponse>(
  { expose: true, method: "POST", path: "/orders" },
  async (req) => {
    const { userId, symbol, orderType, side, quantity, price } = req;
    
    const result = await db.queryRow<{
      id: number;
      user_id: number;
      symbol: string;
      order_type: "MARKET" | "LIMIT" | "STOP";
      side: "BUY" | "SELL";
      quantity: number;
      price: number | null;
      status: "PENDING" | "FILLED" | "CANCELLED" | "REJECTED";
      filled_quantity: number;
      average_price: number | null;
      created_at: Date;
      updated_at: Date;
    }>`
      INSERT INTO orders (user_id, symbol, order_type, side, quantity, price)
      VALUES (${userId}, ${symbol}, ${orderType}, ${side}, ${quantity}, ${price || null})
      RETURNING id, user_id, symbol, order_type, side, quantity, price, status, filled_quantity, average_price, created_at, updated_at
    `;
    
    if (!result) {
      throw new Error("Failed to create order");
    }
    
    const order: Order = {
      id: result.id,
      userId: result.user_id,
      symbol: result.symbol,
      orderType: result.order_type,
      side: result.side,
      quantity: result.quantity,
      price: result.price || undefined,
      status: result.status,
      filledQuantity: result.filled_quantity,
      averagePrice: result.average_price || undefined,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };
    
    return { order };
  }
);

// Retrieves a specific order
export const getOrder = api<GetOrderRequest, GetOrderResponse>(
  { expose: true, method: "GET", path: "/orders/:orderId" },
  async (req) => {
    const { orderId, userId } = req;
    
    const result = await db.queryRow<{
      id: number;
      user_id: number;
      symbol: string;
      order_type: "MARKET" | "LIMIT" | "STOP";
      side: "BUY" | "SELL";
      quantity: number;
      price: number | null;
      status: "PENDING" | "FILLED" | "CANCELLED" | "REJECTED";
      filled_quantity: number;
      average_price: number | null;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT id, user_id, symbol, order_type, side, quantity, price, status, filled_quantity, average_price, created_at, updated_at
      FROM orders
      WHERE id = ${orderId} AND user_id = ${userId}
    `;
    
    if (!result) {
      throw new Error("Order not found");
    }
    
    const order: Order = {
      id: result.id,
      userId: result.user_id,
      symbol: result.symbol,
      orderType: result.order_type,
      side: result.side,
      quantity: result.quantity,
      price: result.price || undefined,
      status: result.status,
      filledQuantity: result.filled_quantity,
      averagePrice: result.average_price || undefined,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };
    
    return { order };
  }
);

// Lists orders for a user
export const listOrders = api<ListOrdersRequest, ListOrdersResponse>(
  { expose: true, method: "GET", path: "/orders" },
  async (req) => {
    const { userId, limit = 50 } = req;
    
    const rows = await db.queryAll<{
      id: number;
      user_id: number;
      symbol: string;
      order_type: "MARKET" | "LIMIT" | "STOP";
      side: "BUY" | "SELL";
      quantity: number;
      price: number | null;
      status: "PENDING" | "FILLED" | "CANCELLED" | "REJECTED";
      filled_quantity: number;
      average_price: number | null;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT id, user_id, symbol, order_type, side, quantity, price, status, filled_quantity, average_price, created_at, updated_at
      FROM orders
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    
    const orders: Order[] = rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      symbol: row.symbol,
      orderType: row.order_type,
      side: row.side,
      quantity: row.quantity,
      price: row.price || undefined,
      status: row.status,
      filledQuantity: row.filled_quantity,
      averagePrice: row.average_price || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    return { orders };
  }
);
