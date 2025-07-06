# Enhanced Multi-stage build for AsphaltTracker Enterprise Logistics Platform
FROM node:18-alpine AS base

# Install system dependencies for AI processing and video handling
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    py3-pip \
    ffmpeg \
    curl \
    bash \
    git \
    dumb-init

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files and npm config
COPY package.json package-lock.json* .npmrc ./

# Clean install production dependencies only
RUN if [ -f package-lock.json ]; then \
        npm ci --only=production --ignore-scripts && npm cache clean --force; \
    else \
        npm install --only=production --ignore-scripts && npm cache clean --force; \
    fi

# Build stage
FROM base AS builder
WORKDIR /app

# Copy package files and npm config
COPY package.json package-lock.json* .npmrc ./

# Install all dependencies for building
RUN if [ -f package-lock.json ]; then \
        npm ci --ignore-scripts; \
    else \
        npm install --ignore-scripts; \
    fi

# Copy source code
COPY . .

# Build the application and services
RUN npm run build:all

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV WS_PORT=5001
ENV RESTACK_PORT=5233
ENV HOST=0.0.0.0

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 asphalt

# Copy production dependencies only
COPY --from=deps --chown=asphalt:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=asphalt:nodejs /app/dist ./dist
COPY --from=builder --chown=asphalt:nodejs /app/package.json ./package.json

# Copy necessary runtime files
COPY --from=builder --chown=asphalt:nodejs /app/src ./src
COPY --from=builder --chown=asphalt:nodejs /app/server ./server
COPY --from=builder --chown=asphalt:nodejs /app/database ./database
COPY --from=builder --chown=asphalt:nodejs /app/scripts ./scripts

# Copy configuration files
COPY --from=builder --chown=asphalt:nodejs /app/*.config.* ./
COPY --from=builder --chown=asphalt:nodejs /app/restack.config.ts ./
COPY --from=builder --chown=asphalt:nodejs /app/docker-compose.infrastructure.yml ./

# Create necessary directories for enterprise logistics platform
RUN mkdir -p \
    uploads/videos \
    data/processed/frames \
    data/processed/embeddings \
    data/chroma \
    backups/database \
    backups/redis \
    logs \
    && chown -R asphalt:nodejs uploads data backups logs

USER asphalt

# Expose ports for main app, WebSocket, and Restack
EXPOSE 5000 5001 5233

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the enterprise logistics platform
CMD ["sh", "-c", "NODE_ENV=production node dist/index.js"]