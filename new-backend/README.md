# Trading Backend - Node.js/Express Migration

This is the migrated backend from Encore.dev to a standard Node.js/Express application for the FinTech trading platform.

## 🏗️ Project Structure

```
new-backend/
├── src/
│   ├── api/             # Express router files for each service
│   │   ├── user.ts      # User management APIs (preferences, MT5 config, subscription)
│   │   ├── analysis.ts  # Trading analysis APIs (signals, market data)
│   │   ├── ml.ts        # Machine learning analytics APIs
│   │   └── trading.ts   # Trading execution APIs (orders, positions)
│   │
│   ├── core/            # Business logic and utilities (to be expanded)
│   │   └── (future files for DB connections, helpers, etc.)
│   │
│   ├── types/           # TypeScript interfaces and types
│   │   └── index.ts     # All shared type definitions
│   │
│   └── server.ts        # Main Express server entry point
│
├── dist/                # Compiled TypeScript output (created after build)
├── package.json         # Project dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── .env.example         # Environment variables template
└── README.md           # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ (recommended: Node.js 18+)
- npm or yarn
- PostgreSQL database (if using database features)

### Installation

1. **Navigate to the new backend directory:**
   ```bash
   cd new-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration values. See the complete [API Keys Migration Guide](./API_KEYS_MIGRATION_GUIDE.md) for detailed configuration instructions.

4. **Start development server:**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:3001`

### Available Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server (requires build first)

## 📊 API Endpoints

### User Management (`/api/user`)

- `GET /api/user/preferences` - Get trading preferences
- `POST /api/user/preferences` - Update trading preferences  
- `GET /api/user/mt5-config` - Get MT5 configuration
- `POST /api/user/mt5-config` - Update MT5 configuration
- `GET /api/user/subscription` - Get subscription status
- `GET /api/user/mt5-config/:userId` - Get MT5 config for specific user (internal)

### Analysis (`/api/analysis`)

- `GET /api/analysis/top-signals` - Get top trading signals

### Machine Learning (`/api/ml`)

- `GET /api/ml/analytics` - Get ML analytics dashboard data
- `POST /api/ml/record-metrics` - Record model metrics (internal)
- `POST /api/ml/record-prediction` - Record prediction accuracy (internal)

### Trading (`/api/trading`)

- `POST /api/trading/place-order` - Place a trading order
- `GET /api/trading/positions` - Get current positions
- `GET /api/trading/orders` - Get order history
- `POST /api/trading/close-position/:positionId` - Close a position

### Payments (`/api/payments`)

- `POST /api/payments/create-intent` - Create Stripe payment intent for subscriptions
- `GET /api/payments/plans` - Get available subscription plans
- `POST /api/payments/webhook` - Handle Stripe webhook events (internal)

### System

- `GET /health` - Health check endpoint

## 🔧 Configuration

### Environment Variables

The application uses the following environment variables (see `.env.example`):

```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database Configuration (if needed)
DATABASE_URL=postgresql://user:password@localhost:5432/trading_db

# MT5 Configuration
MT5_HOST=154.61.187.189
MT5_PORT=8080
MT5_LOGIN=6001637
MT5_SERVER=PureMGlobal-MT5

# Trading Configuration
IS_PRODUCTION=false
DEFAULT_ACCOUNT_BALANCE=9518.40
DEFAULT_RISK_PERCENTAGE=2.0
```

## 🏭 Deployment

### Development
```bash
npm run dev
```

### Production
1. Build the application:
   ```bash
   npm run build
   ```

2. Start production server:
   ```bash
   npm start
   ```

### Deploy to Vercel
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

## 📋 Migration Status

### ✅ Completed
- [x] Basic Express server setup
- [x] TypeScript configuration
- [x] User management APIs
- [x] Trading analysis APIs (basic)
- [x] ML analytics APIs (mock data)
- [x] Trading execution APIs (mock data)
- [x] Error handling middleware
- [x] CORS configuration
- [x] Health check endpoint

### 🚧 To Do (Future Phases)
- [ ] Database integration (PostgreSQL)
- [ ] Real MT5 bridge connection
- [ ] Authentication middleware
- [ ] Input validation middleware
- [ ] Rate limiting
- [ ] Logging system
- [ ] Testing setup (Jest)
- [ ] Docker configuration
- [ ] Complete migration of all Encore services
- [ ] Real-time WebSocket connections

## 🏦 Architecture Notes

This migrated backend maintains the same API structure as the original Encore.dev version but uses standard Express.js patterns:

1. **Service-based routing**: Each original Encore service became an Express router
2. **Type safety**: All TypeScript interfaces preserved from original
3. **Mock data**: Currently returns demo/mock data for development
4. **Modular structure**: Clean separation of concerns with dedicated folders

## 🔒 Security Considerations

- CORS configured for frontend origin
- Request body size limits (10mb)
- Error handling prevents information leakage
- Environment variables for sensitive configuration

## 🤝 Contributing

When adding new features:

1. Add types to `src/types/index.ts`
2. Create router in `src/api/[service].ts`
3. Import and register router in `src/server.ts`
4. Follow existing patterns for error handling and response structure

## 📞 Support

For questions about this migration or the trading platform, check the original project documentation or create an issue.