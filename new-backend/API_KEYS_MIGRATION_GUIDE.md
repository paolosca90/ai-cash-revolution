# 🔑 API Keys & External Services Migration Guide

This guide explains how all API keys and external integrations have been migrated from the Encore.dev backend to the new Express backend.

## 🗄️ **Centralized Configuration**

All API keys and configurations are now managed through:

- **Configuration Class**: `src/core/config.ts` - Central configuration management
- **Environment File**: `.env.example` - Complete template with all available keys
- **External APIs Manager**: `src/core/external-apis.ts` - Service validation and management
- **Encryption Helper**: `src/core/encryption.ts` - Secure data handling
- **Auth Helper**: `src/core/auth.ts` - JWT and authentication utilities

## 🔧 **Migrated Services & API Keys**

### **Security & Authentication**
```env
# REQUIRED - JWT token generation
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# REQUIRED - Encryption for sensitive data (passwords, API secrets)
TRADING_ACCOUNT_ENCRYPTION_KEY=your-encryption-key-32-chars-minimum
ENCRYPTION_KEY=your-general-encryption-key-32-chars
```

### **Payment Processing (Stripe)**
```env
# For subscription payments
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key  
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### **Financial Data Providers**
```env
# Market data and financial information
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
FINNHUB_API_KEY=your_finnhub_api_key

# Cryptocurrency exchange integration  
BINANCE_API_KEY=your_binance_api_key
BINANCE_SECRET_KEY=your_binance_secret_key
```

### **AI/ML Services**
```env
# AI analysis and predictions
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### **Chart Generation**
```env
# For trading charts
QUICKCHART_API_KEY=your_quickchart_api_key
```

### **MT5 Trading Platform**
```env
# MetaTrader 5 connection
MT5_HOST=154.61.187.189
MT5_PORT=8080
MT5_LOGIN=6001637
MT5_SERVER=PureMGlobal-MT5
MT5_PASSWORD=your_mt5_password  # Optional
```

### **Database Configuration**
```env
# PostgreSQL database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=trading_bot
DB_USER=postgres
DB_PASSWORD=password

# Or use full connection string
DATABASE_URL=postgresql://username:password@host:port/database
```

## 🏗️ **How to Configure**

### **1. Copy Environment Template**
```bash
cd new-backend
cp .env.example .env
```

### **2. Edit Your .env File**
Open `.env` and uncomment/fill in the API keys you want to use:

```env
# Example: Enable Stripe payments
STRIPE_SECRET_KEY=sk_live_your_actual_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret

# Example: Enable OpenAI for analysis
OPENAI_API_KEY=sk-your_actual_openai_key

# Example: Enable Alpha Vantage for market data
ALPHA_VANTAGE_API_KEY=your_actual_alpha_vantage_key
```

### **3. Start the Server**
```bash
npm run dev
```

The server will automatically detect which services are configured and report them on startup.

## 🔍 **Service Detection**

When you start the server, it will show:

```
✅ Configured services: stripe, openai, alphaVantage
⚠️  No AI service configured - AI analysis features may be limited
ℹ️  Available services not configured: finnhub, binance, quickChart, gemini, anthropic
```

## 🚨 **Security Features**

### **Automatic Validation**
- Required keys are validated on startup
- Invalid configurations cause startup warnings
- Production mode enforces required security keys

### **Encryption**
- All sensitive data (passwords, API secrets) are encrypted before storage
- Uses AES-256 encryption with secure key derivation
- Supports masking of sensitive data in logs

### **JWT Authentication**
- Secure token-based authentication
- Role-based access control support
- Optional authentication for public endpoints

## 📊 **API Endpoints Created**

### **Payment Endpoints** (`/api/payments`)
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `GET /api/payments/plans` - Get subscription plans
- `POST /api/payments/webhook` - Stripe webhook handler

### **Configuration Check** (`/health`)
- Shows which services are configured
- Database connection status
- Security validation results

## 🔄 **Migration from Encore**

### **Before (Encore.dev)**
```typescript
import { secret } from "encore.dev/config";

const stripeKey = secret("StripeSecretKey");
const openaiKey = secret("OpenAIKey");
```

### **After (Express)**
```typescript
import { Config } from '../core/config';
import { ExternalAPIManager } from '../core/external-apis';

const stripeConfig = ExternalAPIManager.getStripeConfig();
const openaiKey = ExternalAPIManager.getOpenAIKey();
```

## ⚙️ **Advanced Configuration**

### **Production Deployment**
For production, set environment variables directly in your hosting platform:

**Vercel**:
```bash
vercel env add JWT_SECRET
vercel env add STRIPE_SECRET_KEY
vercel env add OPENAI_API_KEY
```

**Heroku**:
```bash
heroku config:set JWT_SECRET=your-secret-key
heroku config:set STRIPE_SECRET_KEY=sk-live-...
```

### **Development vs Production**
```typescript
// Automatically detects environment
if (Config.isProduction()) {
  // Use production keys
  // Enforce security requirements
} else {
  // Use development keys
  // Allow mock services
}
```

## 🛡️ **Best Practices**

1. **Never commit .env files** to version control
2. **Use different keys** for development and production
3. **Regularly rotate** sensitive API keys
4. **Enable webhook signature verification** for Stripe
5. **Use strong encryption keys** (minimum 32 characters)
6. **Monitor API usage** and set up alerts

## 🆘 **Troubleshooting**

### **"Stripe not configured" Error**
- Add `STRIPE_SECRET_KEY` to your `.env` file
- Restart the server

### **"Invalid encryption key" Error**
- Ensure `TRADING_ACCOUNT_ENCRYPTION_KEY` is at least 32 characters
- Use a strong, random key

### **JWT Token Errors**
- Verify `JWT_SECRET` is set
- Use a secure, random secret (not default values)

### **Database Connection Issues**
- Check database credentials in `.env`
- Ensure PostgreSQL is running
- Verify `DATABASE_URL` format

## 📋 **Complete Setup Checklist**

- [ ] Copy `.env.example` to `.env`
- [ ] Set `JWT_SECRET` (required)
- [ ] Set `TRADING_ACCOUNT_ENCRYPTION_KEY` (required)
- [ ] Configure database connection
- [ ] Add API keys for services you want to use
- [ ] Test server startup with `npm run dev`
- [ ] Verify configured services in console output
- [ ] Test endpoints with your API keys

Your trading backend is now fully configured with all API keys and external services migrated from Encore!