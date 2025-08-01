# Multi-stage build optimized for Akash deployment with linux/amd64 platform
FROM --platform=linux/amd64 node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with production optimizations
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build optimizations for production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV GENERATE_SOURCEMAP=false

# Build arguments for required environment variables
ARG NEXT_PUBLIC_PARA_API_KEY
ARG NEXT_PUBLIC_VENICE_API_KEY
ARG NEXT_PUBLIC_ONEINCH_API_KEY
ARG NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
ARG NEXT_PUBLIC_BASE_SEPOLIA_RPC
ARG NEXT_PUBLIC_ETHERLINK_RPC

# Set environment variables for build time
ENV NEXT_PUBLIC_PARA_API_KEY=$NEXT_PUBLIC_PARA_API_KEY
ENV NEXT_PUBLIC_VENICE_API_KEY=$NEXT_PUBLIC_VENICE_API_KEY
ENV NEXT_PUBLIC_ONEINCH_API_KEY=$NEXT_PUBLIC_ONEINCH_API_KEY
ENV NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=$NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
ENV NEXT_PUBLIC_BASE_SEPOLIA_RPC=$NEXT_PUBLIC_BASE_SEPOLIA_RPC
ENV NEXT_PUBLIC_ETHERLINK_RPC=$NEXT_PUBLIC_ETHERLINK_RPC

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
RUN apk add --no-cache curl
WORKDIR /app

# Production environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Create .next directory with proper permissions
RUN mkdir .next && chown nextjs:nodejs .next

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Health check for Akash deployment
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]