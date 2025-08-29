import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `API endpoint ${req.url} not found`,
    availableEndpoints: [
      '/health',
      '/api/user/preferences',
      '/api/user/mt5-config',
      '/api/analysis/top-signals'
    ]
  });
}