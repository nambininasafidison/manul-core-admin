# ==============================================================================
# Manul Core Admin - Multi-stage Dockerfile
# ==============================================================================
#
# Build: docker build -t manulcore-admin:latest .
# Run:   docker run -p 5173:5173 manulcore-admin:latest
#
# Stages:
# 1. Dependencies - Install node modules
# 2. Builder - Build the SvelteKit app
# 3. Runtime - Production image with Node.js adapter
# ==============================================================================

# =============================================================================
# Stage 1: Dependencies
# =============================================================================
FROM oven/bun:1.1-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# =============================================================================
# Stage 2: Builder
# =============================================================================
FROM oven/bun:1.1-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build arguments for environment
ARG PUBLIC_API_URL=http://localhost:8080
ARG PUBLIC_ENV=production

ENV PUBLIC_API_URL=$PUBLIC_API_URL
ENV PUBLIC_ENV=$PUBLIC_ENV

# Build the application
RUN bun run build

# =============================================================================
# Stage 3: Runtime
# =============================================================================
FROM oven/bun:1.1-alpine AS runtime

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sveltekit -u 1001 -G nodejs

# Copy built application
COPY --from=builder --chown=sveltekit:nodejs /app/build ./build
COPY --from=builder --chown=sveltekit:nodejs /app/package.json ./

# Install only production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Environment variables
ENV NODE_ENV=production
ENV PORT=5173
ENV HOST=0.0.0.0

# Switch to non-root user
USER sveltekit

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5173/health || exit 1

# Start the application
CMD ["bun", "run", "./build/index.js"]
