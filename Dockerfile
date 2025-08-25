# Use official Node.js 18 runtime
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/

# Install dependencies
RUN cd backend && npm ci --only=production

# Copy backend source code
COPY backend/ ./backend/

# Expose port
EXPOSE $PORT

# Set environment
ENV NODE_ENV=production

# Start the application
CMD ["sh", "-c", "cd backend && npm start"]