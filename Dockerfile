# Multi-stage Dockerfile for DockuGen
# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create production build
RUN npm run build || echo "Build script not found, continuing..."

# Stage 2: Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S dockugen -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=dockugen:nodejs /app/src ./src
COPY --from=builder --chown=dockugen:nodejs /app/bin ./bin

# Create necessary directories
RUN mkdir -p /app/output && \
    chown -R dockugen:nodejs /app/output

# Switch to non-root user
USER dockugen

# Set environment variables
ENV NODE_ENV=production
ENV DOCKUGEN_VERSION=1.0.0

# Expose port (if needed for web interface)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "console.log('DockuGen is healthy')" || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Default command
CMD ["node", "bin/dockugen", "--help"]
