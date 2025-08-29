# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a FinTech trading application built with **Encore.dev** (backend) and **React + Vite** (frontend). The project follows a monorepo structure with separate workspaces for backend and frontend components.

### Backend Structure
- **Encore.dev Services**: Microservices architecture with dedicated services:
  - `analysis`: Core trading analysis, ML models, and signal generation
  - `ml`: Machine learning training and analytics  
  - `scheduler`: Automated trading execution and job scheduling
  - `user`: User management and authentication
- **Database**: PostgreSQL with migrations for structured data storage
- **MT5 Integration**: MetaTrader 5 bridge for live trading execution via Python server

### Frontend Structure
- **React + TypeScript**: Modern React application with TypeScript
- **Routing**: React Router DOM for SPA navigation
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS with custom design system
- **Charts**: Recharts for data visualization

### Key Application Pages
- **Dashboard**: Main trading overview with signals and positions
- **MLDashboard**: Machine learning analytics and model performance
- **Trade**: Manual trade execution interface
- **History**: Trading history and performance tracking
- **News**: Market news and sentiment analysis

## Development Commands

### Backend Development
```bash
cd backend
encore run                    # Start Encore development server (typically http://localhost:4000)
encore gen client --target leap  # Generate frontend client after API changes
```

### Frontend Development  
```bash
cd frontend
npm install                   # Install dependencies (uses bun via packageManager)
npx vite dev                  # Start Vite dev server (typically http://localhost:5173)
```

### Production Build
```bash
cd backend
bun run build               # Builds frontend and outputs to backend/frontend/dist
```

## Package Management
- **Package Manager**: Bun (specified in package.json)
- **Workspace Setup**: Root package.json defines workspaces for backend and frontend
- **Dependency Installation**: Use `bun install` for optimal performance

## Trading System Components

### Core Analysis Engine (`backend/analysis/`)
- **Signal Generation**: `signal-generator.ts` - Creates trading signals
- **Trading Strategies**: `trading-strategies.ts` - Implements various trading algorithms  
- **Technical Analysis**: `enhanced-technical-analysis.ts` - Advanced TA indicators
- **ML Integration**: `ai-engine.ts` - AI-powered prediction models
- **MT5 Bridge**: `mt5-bridge.ts` + `mt5-python-server.py` - Live trading execution

### Machine Learning System (`backend/ml/`)
- **Learning Engine**: `learning-engine.ts` - Model training and optimization
- **Analytics**: `analytics.ts` - ML performance metrics and analysis
- **Training Pipeline**: `training.ts` - Automated model retraining

### Frontend Components (`frontend/components/`)
- **Cards**: Trading-specific UI cards (SignalCard, MLMetricCard, etc.)
- **Charts**: Financial data visualization components
- **Tables**: Trading history and position tables
- **UI**: Reusable design system components

## Deployment

### Encore Cloud Platform
```bash
encore auth login
git remote add encore encore://telegram-trading-bot-d6u2
git push encore              # Deploy to Encore Cloud
```

### Self-Hosting
```bash
encore build docker         # Create Docker image for self-hosting
```

### GitHub Integration
Configure GitHub integration in Encore Cloud dashboard for automated deployments on push.

## MetaTrader 5 Setup

The application integrates with MT5 for live trading. Key requirements:
- Windows environment (or Windows VM/VPS) 
- Python 3.7+ with `MetaTrader5`, `flask`, `flask-cors` packages
- MT5 terminal with automated trading enabled
- Python server (`mt5-python-server.py`) running on port 8080

## Security Considerations

- **No API Keys**: Direct MT5 integration without storing broker credentials
- **Local Network**: MT5 Python server runs on localhost by default  
- **Demo Testing**: Always test with demo accounts before live trading
- **VPS Hosting**: Use Windows VPS for production 24/7 operation