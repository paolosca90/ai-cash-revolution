// Vercel API endpoint per payments
import { VercelRequest, VercelResponse } from '@vercel/node';
import paymentsRouter from '../../backend/payments/stripe-integration';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return paymentsRouter(req, res);
}