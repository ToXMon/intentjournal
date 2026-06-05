# Multi-stage build optimized for Akash deployment with linux/amd64 platform
FROM --platform=linux/amd64 node:18.20.5-alpine3.20 AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV COREPACK_INTEGRITY_KEYS=0
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies for a repeatable Next.js build
RUN pnpm install --frozen-lockfile --ignore-scripts

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build optimizations for production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV GENERATE_SOURCEMAP=false

# Build arguments for public build-time environment variables
ARG NEXT_PUBLIC_PARA_API_KEY
ARG NEXT_PUBLIC_PARA_SECRET_KEY
ARG NEXT_PUBLIC_VENICE_API_KEY
ARG NEXT_PUBLIC_ALCHEMY_KEY
ARG NEXT_PUBLIC_ALCHEMY_API_KEY_BASE
ARG NEXT_PUBLIC_PRIVY_APP_ID
ARG NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
ARG NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
ARG NEXT_PUBLIC_ETHERLINK_RPC=https://node.ghostnet.etherlink.com
ARG NEXT_PUBLIC_ETHERLINK_ESCROW_ADDRESS

# Set environment variables for build time
ENV NEXT_PUBLIC_PARA_API_KEY=$NEXT_PUBLIC_PARA_API_KEY
ENV NEXT_PUBLIC_PARA_SECRET_KEY=$NEXT_PUBLIC_PARA_SECRET_KEY
ENV NEXT_PUBLIC_VENICE_API_KEY=$NEXT_PUBLIC_VENICE_API_KEY
ENV NEXT_PUBLIC_ALCHEMY_KEY=$NEXT_PUBLIC_ALCHEMY_KEY
ENV NEXT_PUBLIC_ALCHEMY_API_KEY_BASE=$NEXT_PUBLIC_ALCHEMY_API_KEY_BASE
ENV NEXT_PUBLIC_PRIVY_APP_ID=$NEXT_PUBLIC_PRIVY_APP_ID
ENV NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=$NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
ENV NEXT_PUBLIC_BASE_SEPOLIA_RPC=$NEXT_PUBLIC_BASE_SEPOLIA_RPC
ENV NEXT_PUBLIC_ETHERLINK_RPC=$NEXT_PUBLIC_ETHERLINK_RPC
ENV NEXT_PUBLIC_ETHERLINK_ESCROW_ADDRESS=$NEXT_PUBLIC_ETHERLINK_ESCROW_ADDRESS

# Build the application
RUN pnpm run build

# Production image, copy all the files and run Next standalone server
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

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Health check for Akash deployment
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
