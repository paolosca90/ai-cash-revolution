# Project Context for Qwen Code

This document provides an overview of the 'newcode-main' project to guide Qwen Code in future interactions.

## Project Type

This is a **code project**. It is a full-stack trading signal generation and execution application built with TypeScript and leveraging the Encore.dev framework for backend services.

## Project Overview

The project is a sophisticated trading application named "leap-app" (version 1.0.0) that uses AI and machine learning to generate trading signals for various financial instruments (forex, indices, commodities, crypto). It integrates with MetaTrader 5 (MT5) for data fetching and potentially for trade execution.

The application is structured as a monorepo with `backend` and `frontend` workspaces.

### Core Technologies

- **Backend:**
  - **Framework:** Encore.dev (TypeScript)
  - **Language:** TypeScript
  - **Package Manager:** Bun
  - **Database:** PostgreSQL (via Encore's database primitives)
  - **Key Libraries/Services:** Node-fetch, Cron jobs
- **Frontend:**
  - **Framework:** React (v19), Vite
  - **Language:** TypeScript
  - **Package Manager:** Bun
  - **UI Library:** Tailwind CSS (v4)
  - **Key Libraries:** React Router, React Query, React Hook Form, Zod, Recharts, Radix UI, Lucide React

### Architecture

The backend is organized into several Encore services:

1.  **`analysis`**: The core service for generating trading signals. It includes modules for market data fetching (with MT5 integration and fallback logic), AI analysis, technical analysis, sentiment analysis, chart generation, signal generation, trading strategies, and analytics tracking.
2.  **`ml`**: The machine learning service responsible for adaptive learning, model training, and pattern detection based on trade outcomes.
3.  **`scheduler`**: Handles automated tasks like periodic signal generation and trade execution simulation.
4.  **`user`**: Manages user-related data and configurations (like MT5 connection details).

The frontend is a React application that likely consumes the backend APIs to display signals, dashboards, and manage user settings.

## Running and Building

### Prerequisites

1.  **Encore CLI:** Install the Encore CLI for running the local development environment.
    -   **Windows:** `iwr https://encore.dev/install.ps1 | iex`
2.  **Bun:** Install Bun for package management.
    -   `npm install -g bun`

### Running the Application

#### Backend Setup

1.  Navigate to the `backend` directory.
2.  Start the Encore development server: `encore run`
    -   The backend API will typically be available at `http://localhost:4000`.

#### Frontend Setup

1.  Navigate to the `frontend` directory.
2.  Install dependencies: `npm install` (Note: The project uses Bun, but `npm install` is specified in DEVELOPMENT.md for the frontend).
3.  Start the Vite development server: `npx vite dev`
    -   The frontend will be available at `http://localhost:5173`.

### Building

-   **Frontend Build (via Backend):** The backend's `package.json` defines a `build` script that navigates to the frontend directory, installs dependencies with `bun`, and builds the frontend using `vite` to `../backend/frontend/dist`.

### Deployment

Deployment is primarily handled via Encore, either to Encore Cloud or self-hosted using Docker. This involves authentication, setting up git remotes, and pushing code. GitHub integration is recommended for production deployments.

## Development Conventions

-   **Monorepo:** The project uses a monorepo structure managed by Bun workspaces, separating `backend` and `frontend`.
-   **Backend Services:** Backend logic is modularized into distinct Encore services (`analysis`, `ml`, `scheduler`, `user`), promoting separation of concerns.
-   **TypeScript:** Both frontend and backend are written in TypeScript, implying a strong emphasis on type safety.
-   **Configuration:** MT5 connection details and other sensitive information are handled via Encore's secret management (`secret` from `encore.dev/config`).
-   **Testing/Development Flow:** The `DEVELOPMENT.md` provides detailed instructions for local setup, running, and deployment.