# Multi-stage build for AsphaltTracker - Restack.io compatible
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Build the frontend
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the client
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 asphalt

# Copy built application
COPY --from=builder --chown=asphalt:nodejs /app/dist ./dist
COPY --from=builder --chown=asphalt:nodejs /app/shared ./shared
COPY --from=builder --chown=asphalt:nodejs /app/server ./server
COPY --from=builder --chown=asphalt:nodejs /app/package.json ./package.json
COPY --from=deps --chown=asphalt:nodejs /app/node_modules ./node_modules

# Create necessary directories
RUN mkdir -p uploads data/videos/temp data/videos/processed && \
    chown -R asphalt:nodejs uploads data

USER asphalt

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["npm", "run", "start"]