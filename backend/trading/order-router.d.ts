export interface OrderRequest {
    userId: string;
    accountId: string;
    symbol: string;
    action: "BUY" | "SELL";
    orderType: "MARKET" | "LIMIT" | "STOP" | "STOP_LIMIT";
    volume: number;
    price?: number;
    stopLoss?: number;
    takeProfit?: number;
    comment?: string;
    expiration?: Date;
    slippage?: number;
}
export interface OrderResponse {
    success: boolean;
    orderId?: string;
    ticket?: number;
    message: string;
    executionPrice?: number;
    timestamp: Date;
    commission?: number;
    swap?: number;
}
export interface Order {
    id: string;
    userId: string;
    accountId: string;
    externalTicket?: number;
    symbol: string;
    action: "BUY" | "SELL";
    orderType: "MARKET" | "LIMIT" | "STOP" | "STOP_LIMIT";
    volume: number;
    requestedPrice?: number;
    executionPrice?: number;
    currentPrice?: number;
    stopLoss?: number;
    takeProfit?: number;
    status: "PENDING" | "FILLED" | "PARTIAL" | "CANCELLED" | "REJECTED" | "EXPIRED";
    comment?: string;
    commission?: number;
    swap?: number;
    pnl?: number;
    createdAt: Date;
    executedAt?: Date;
    closedAt?: Date;
}
export interface PositionCloseRequest {
    userId: string;
    accountId: string;
    positionId: string;
    volume?: number;
}
export interface OrderWithAccountInfo extends Order {
    accountName: string;
    brokerName: string;
}
export interface OrderHistoryResponse {
    orders: OrderWithAccountInfo[];
    totalCount: number;
    hasMore: boolean;
}
export interface OrderSummary {
    totalOrders: number;
    pendingOrders: number;
    filledOrders: number;
    cancelledOrders: number;
    totalVolume: number;
    totalPnL: number;
}
export declare const placeOrder: (params: OrderRequest) => Promise<OrderResponse>;
export declare const getOrderStatus: (params: {
    orderId: string;
    userId: string;
}) => Promise<OrderWithAccountInfo>;
export declare const listOrders: (params: {
    userId: string;
    limit?: number;
}) => Promise<OrderHistoryResponse>;
export declare const closePosition: (params: PositionCloseRequest) => Promise<OrderResponse>;
export declare const autoExecuteSignal: (params: {
    userId: string;
    signalId: string;
    accountIds?: string[];
}) => Promise<{
    success: boolean;
    message: string;
    orders?: OrderResponse[];
}>;
export declare const getTradingStats: (params: {
    userId: string;
}) => Promise<OrderSummary>;
