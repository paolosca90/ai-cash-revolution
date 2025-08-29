import { VercelRequest, VercelResponse } from '@vercel/node';

interface UserPreferences {
  userId: number;
  riskPercentage: number;
  accountBalance: number;
  updatedAt: Date;
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
      // Return demo preferences (migrated from original logic)
      const preferences: UserPreferences = {
        userId: 1,
        riskPercentage: 2.0,
        accountBalance: 9518.40, // Updated to match your actual MT5 balance
        updatedAt: new Date(),
      };

      res.status(200).json({ preferences });
    } else if (req.method === 'POST') {
      const { riskPercentage, accountBalance } = req.body;
      
      // For demo purposes, just return success (migrated from original logic)
      console.log("Demo: Updated preferences", { riskPercentage, accountBalance });
      
      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in preferences handler:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to handle user preferences'
    });
  }
}