import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pg;
// Database configuration
const dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // For development, you can use individual connection params:
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'trading_bot',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
};
// Create connection pool
export const pool = new Pool(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL, ssl: dbConfig.ssl } : dbConfig);
// Test database connection
export const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ Database connected successfully');
        client.release();
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
};
// Query helper function
export const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Query executed', { text: text.substring(0, 100), duration, rows: res.rowCount });
        return res;
    }
    catch (error) {
        console.error('Query error', { text, error });
        throw error;
    }
};
export default pool;
//# sourceMappingURL=connection.js.map