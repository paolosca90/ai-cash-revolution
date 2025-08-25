// Vercel API endpoint per subscription
import { VercelRequest, VercelResponse } from '@vercel/node';
import subscriptionRouter from '../../backend/subscription/subscription-manager';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return subscriptionRouter(req, res);
}