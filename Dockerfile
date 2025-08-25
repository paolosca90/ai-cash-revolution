# Use official Node.js 18 runtime
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/

# Install dependencies (including dev dependencies for tsx)
RUN npm ci --prefix backend

# Copy backend source code
COPY backend/ ./backend/

# Expose port
EXPOSE $PORT

# Set environment
ENV NODE_ENV=production

# Start the application (migrations will run at startup)
CMD ["sh", "-c", "npm run db:migrate --prefix backend && npm start --prefix backend"]