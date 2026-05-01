FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy dependency manifests first (better layer caching)
COPY package*.json ./

# Install production deps only
RUN npm ci --omit=dev

# Copy source files
COPY server.js ./

# Expose Cloud Run port
EXPOSE 8080

# Non-root user for security
RUN addgroup -S voteflow && adduser -S voteflow -G voteflow
USER voteflow

CMD ["node", "server.js"]
