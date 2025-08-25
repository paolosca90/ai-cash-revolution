import express from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚀 Starting simple server...');
console.log('📊 Environment variables:');
console.log('- PORT:', process.env.PORT || 'undefined (using 3001)');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'MISSING');

app.use(express.json());

app.get('/', (req, res) => {
  console.log('📥 Received request to /');
  res.json({ 
    message: 'Simple server is working!',
    port: PORT,
    env: process.env.NODE_ENV || 'undefined'
  });
});

app.get('/health', (req, res) => {
  console.log('📥 Received request to /health');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

try {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Simple server running on 0.0.0.0:${PORT}`);
    console.log(`🔗 Try: http://0.0.0.0:${PORT}/`);
  });

  server.on('error', (error) => {
    console.error('❌ Server error:', error);
  });

} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});