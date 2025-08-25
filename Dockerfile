# Use official Node.js 18 runtime
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/

# Install dependencies (including dev dependencies for tsx)
RUN cd backend && npm ci

# Copy backend source code
COPY backend/ ./backend/

# Expose port
EXPOSE $PORT

# Set environment
ENV NODE_ENV=production

# Start the application (migrations will run at startup)
CMD ["sh", "-c", "cd backend && npm run db:migrate && npm start"]