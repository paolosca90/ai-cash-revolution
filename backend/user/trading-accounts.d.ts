export interface TradingAccount {
    id: string;
    userId: string;
    accountType: "MT4" | "MT5" | "BINANCE" | "BYBIT" | "COINBASE" | "ALPACA";
    accountName: string;
    brokerName: string;
    serverUrl?: string;
    accountNumber?: string;
    password?: string;
    apiKey?: string;
    apiSecret?: string;
    accountBalance?: number;
    equity?: number;
    currency: string;
    leverage?: number;
    isActive: boolean;
    isConnected: boolean;
    autoTradingEnabled: boolean;
    maxRiskPerTrade: number;
    maxDailyLoss: number;
    createdAt: Date;
    updatedAt: Date;
    lastConnectionAt?: Date;
    allowedSymbols: string[];
    blockedSymbols: string[];
    tradingHours: {
        start: string;
        end: string;
    };
}
export interface TestConnectionResponse {
    success: boolean;
    message: string;
    accountInfo: {
        balance?: number;
        currency?: string;
    } | null;
    lastTestedAt: Date;
}
export interface TradingAccountDetails {
    account: TradingAccount;
    connectionStatus: {
        isConnected: boolean;
        lastTestResult?: string;
        lastTestedAt?: Date;
    };
    accountStats?: {
        balance: number;
        equity: number;
        margin?: number;
        freeMargin?: number;
    };
}
export interface AddTradingAccountRequest {
    userId: string;
    accountType: "MT4" | "MT5" | "BINANCE" | "BYBIT" | "COINBASE" | "ALPACA";
    accountName: string;
    brokerName: string;
    serverUrl?: string;
    accountNumber?: string;
    password?: string;
    apiKey?: string;
    apiSecret?: string;
    currency: string;
    leverage?: number;
    maxRiskPerTrade: number;
    maxDailyLoss: number;
    allowedSymbols?: string[];
    tradingHours?: {
        start: string;
        end: string;
    };
}
export interface UpdateTradingAccountRequest {
    accountId: string;
    userId: string;
    accountName?: string;
    isActive?: boolean;
    autoTradingEnabled?: boolean;
    maxRiskPerTrade?: number;
    maxDailyLoss?: number;
    allowedSymbols?: string[];
    blockedSymbols?: string[];
    tradingHours?: {
        start: string;
        end: string;
    };
}
export interface TradingAccountResponse {
    success: boolean;
    account?: Omit<TradingAccount, 'password' | 'apiSecret'>;
    accounts?: Omit<TradingAccount, 'password' | 'apiSecret'>[];
    message: string;
}
export interface TestConnectionRequest {
    accountId: string;
    userId: string;
}
export declare const addTradingAccount: (params: AddTradingAccountRequest) => Promise<TradingAccountResponse>;
export declare const getTradingAccounts: (params: {
    userId: string;
}) => Promise<TradingAccountResponse>;
export declare const updateTradingAccount: (params: UpdateTradingAccountRequest) => Promise<TradingAccountResponse>;
export declare const testConnection: (params: TestConnectionRequest) => Promise<TestConnectionResponse>;
export declare const deleteTradingAccount: (params: {
    accountId: string;
    userId: string;
}) => Promise<TradingAccountDetails>;
export declare const getAccountStatus: (params: {
    accountId: string;
    userId: string;
}) => Promise<TradingAccountDetails>;
