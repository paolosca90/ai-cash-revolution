export declare const pool: import("pg").Pool;
export declare const testConnection: () => Promise<void>;
export declare const query: (text: string, params?: any[]) => Promise<import("pg").QueryResult<any>>;
export default pool;
