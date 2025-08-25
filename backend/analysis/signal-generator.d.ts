interface GenerateSignalRequest {
    symbol: string;
    timeframe: string;
    strategy?: string;
}
export interface TradingSignal {
    symbol: string;
    action: "BUY" | "SELL" | "HOLD";
    confidence: number;
    price: number;
    timestamp: Date;
    strategy: string;
    indicators: Record<string, number>;
}
interface GenerateSignalResponse {
    signal: TradingSignal;
}
export declare const generateSignal: (params: GenerateSignalRequest) => Promise<GenerateSignalResponse>;
export declare function generateSignalForSymbol(symbol: string, mt5Config: any, tradeParams: any, strategy?: string): Promise<TradingSignal>;
export {};
