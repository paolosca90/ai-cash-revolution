# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered trading system built with Encore.dev that generates automated trading signals using machine learning and technical analysis. The system consists of:

1. A backend API built with Encore.dev services (TypeScript)
2. A React frontend with Vite
3. Machine learning components for pattern detection and model training
4. Automated trading signal generation with risk management

## Architecture

The application is organized into several Encore services:
- `analysis`: Core trading signal generation and market analysis
- `ml`: Machine learning components for training and pattern detection
- `scheduler`: Automated trading execution
- `user`: User management and configuration

The frontend is a React application that connects to the backend services.

## Common Development Commands

### Backend Development
```bash
# Navigate to backend directory
cd backend

# Start the Encore development server
encore run

# Generate frontend client
encore gen client --target leap
```

### Frontend Development
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npx vite dev
```

### Building
```bash
# Build frontend and integrate with backend
cd backend
bun run build
```

## Deployment

### Encore Cloud Platform
1. Login: `encore auth login`
2. Set git remote: `git remote add encore encore://telegram-trading-bot-d6u2`
3. Deploy: `git push encore`

### Self-hosting
See Encore documentation for Docker deployment options.

## Key Components

### Signal Generation (backend/analysis/)
- `signal-generator.ts`: Main trading signal generation logic
- `ai-engine.ts`: AI-based market analysis
- `trading-strategies.ts`: Different trading strategy implementations
- `market-data.ts`: Market data fetching and processing

### Machine Learning (backend/ml/)
- `learning-engine.ts`: Core ML training and pattern detection
- `training.ts`: Model training endpoints
- `analytics.ts`: ML performance analytics

### Frontend (frontend/)
- `App.tsx`: Main application routing
- `pages/Dashboard.tsx`: Main dashboard with trading signals and performance
- `components/cards/AutoSignalCard.tsx`: Trading signal display components

## Database Structure
The application uses PostgreSQL with migrations located in:
- `backend/analysis/migrations/`
- `backend/ml/migrations/`

## Important Notes
- The system automatically generates trading signals every 2 minutes
- ML models are trained based on historical trade performance
- Risk management is built into the signal generation process
- The frontend uses React Query for data fetching and caching