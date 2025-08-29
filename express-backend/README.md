# AI Cash Revolution Backend

Simple Express.js backend for the AI Cash Revolution trading platform.

## 🚀 Quick Deploy to Vercel

1. **Clone and navigate:**
   ```bash
   cd express-backend
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

3. **Test endpoints:**
   - Health: `https://your-app.vercel.app/api/health`
   - User preferences: `https://your-app.vercel.app/api/user/preferences`
   - Trading signals: `https://your-app.vercel.app/api/analysis/top-signals`
   - ML analytics: `https://your-app.vercel.app/api/ml/analytics`

## 📊 Available Endpoints

- `GET /` - Welcome message
- `GET /api/health` - Health check
- `GET /api/user/preferences` - Get user preferences
- `POST /api/user/preferences` - Update user preferences  
- `GET /api/user/mt5-config` - Get MT5 configuration
- `GET /api/analysis/top-signals` - Get trading signals
- `GET /api/trading/positions` - Get trading positions
- `GET /api/ml/analytics` - Get ML analytics

## 🔧 Environment Variables

Optional environment variables for Vercel:

```env
MT5_HOST=154.61.187.189
MT5_PORT=8080
MT5_LOGIN=6001637
MT5_SERVER=PureMGlobal-MT5
```

## 🏃‍♂️ Local Development

```bash
npm install
npm run dev
```

Server will run on http://localhost:3000