# Stage 1: Build the Vite Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup the Express Backend
FROM node:18-alpine
WORKDIR /app

# Copy backend dependencies and install
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy backend source
COPY backend/server.js ./backend/

# Copy the built frontend from Stage 1 into the correct directory
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose Cloud Run port
EXPOSE 8080

# Non-root user for security
RUN addgroup -S voteflow && adduser -S voteflow -G voteflow
USER voteflow

# Start the unified server
CMD ["node", "backend/server.js"]
