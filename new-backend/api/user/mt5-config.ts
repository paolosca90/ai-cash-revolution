import { VercelRequest, VercelResponse } from '@vercel/node';

interface Mt5Config {
  userId: number;
  host: string;
  port: number;
  login: string;
  server: string;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Return your actual VPS MT5 config (migrated from original logic)
      const config: Mt5Config = {
        userId: 1,
        host: process.env.MT5_HOST || "154.61.187.189",
        port: parseInt(process.env.MT5_PORT || "8080"),
        login: process.env.MT5_LOGIN || "6001637",
        server: process.env.MT5_SERVER || "PureMGlobal-MT5",
      };

      res.status(200).json({ config });
    } else if (req.method === 'POST') {
      const params = req.body;
      
      // For demo purposes, just return success (migrated from original logic)
      console.log("Demo: Updated MT5 config", params);
      
      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in MT5 config handler:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to handle MT5 configuration'
    });
  }
}