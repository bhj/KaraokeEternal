# Karaoke Eternal with Authentik Header Auth
# Multi-stage build for smaller final image

# Build stage
FROM node:24-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for building)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:24-slim

WORKDIR /app

# Install runtime dependencies for bcrypt and sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built files from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/assets ./assets

# Environment variables
ENV NODE_ENV=production
ENV KES_PORT=3000
ENV KES_PATH_DATA=/data

# Expose port
EXPOSE 3000

# Volume for persistent data
VOLUME ["/data", "/media"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Run the server
CMD ["node", "build/server/main.js"]
