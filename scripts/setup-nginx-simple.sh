#!/bin/bash

# Simple nginx setup for 1inch API proxy (Homebrew version)
# This script sets up nginx without requiring sudo

set -e

echo "🔧 Setting up nginx proxy for 1inch API (Homebrew version)..."

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "❌ nginx is not installed. Please install with: brew install nginx"
    exit 1
fi

# Get nginx configuration directory for Homebrew
NGINX_CONF_DIR="/opt/homebrew/etc/nginx"
NGINX_LOG_DIR="/opt/homebrew/var/log/nginx"

# Fallback for Intel Macs
if [ ! -d "$NGINX_CONF_DIR" ]; then
    NGINX_CONF_DIR="/usr/local/etc/nginx"
    NGINX_LOG_DIR="/usr/local/var/log/nginx"
fi

echo "📁 Using nginx configuration directory: $NGINX_CONF_DIR"

# Check if directory exists
if [ ! -d "$NGINX_CONF_DIR" ]; then
    echo "❌ nginx configuration directory not found. Please check your nginx installation."
    exit 1
fi

# Create backup of existing nginx.conf
if [ -f "$NGINX_CONF_DIR/nginx.conf" ]; then
    echo "💾 Backing up existing nginx.conf..."
    cp "$NGINX_CONF_DIR/nginx.conf" "$NGINX_CONF_DIR/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Copy our nginx configuration
echo "📋 Installing nginx configuration..."
cp nginx.conf "$NGINX_CONF_DIR/nginx.conf"

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ nginx configuration is valid"
else
    echo "❌ nginx configuration is invalid. Restoring backup..."
    if [ -f "$NGINX_CONF_DIR/nginx.conf.backup."* ]; then
        cp "$NGINX_CONF_DIR/nginx.conf.backup."* "$NGINX_CONF_DIR/nginx.conf"
    fi
    exit 1
fi

# Stop nginx if it's running
if pgrep nginx > /dev/null; then
    echo "🛑 Stopping existing nginx..."
    nginx -s stop
    sleep 2
fi

# Start nginx
echo "🚀 Starting nginx..."
nginx

# Wait a moment for nginx to start
sleep 2

# Test if nginx is running
if pgrep nginx > /dev/null; then
    echo "✅ nginx is running successfully"
    echo ""
    echo "🌐 nginx proxy is now available at:"
    echo "   - Main app: http://localhost:80"
    echo "   - 1inch API proxy: http://localhost:80/api/1inch/"
    echo "   - Health check: http://localhost:80/nginx-health"
    echo ""
    echo "📝 To test the proxy:"
    echo "   curl http://localhost:80/nginx-health"
    echo ""
    echo "🛑 To stop nginx: nginx -s stop"
    echo "🔄 To reload nginx: nginx -s reload"
    echo "📊 To view logs: tail -f $NGINX_LOG_DIR/access.log"
else
    echo "❌ Failed to start nginx. Please check the logs:"
    echo "   tail -f $NGINX_LOG_DIR/error.log"
    exit 1
fi

echo ""
echo "🎉 nginx proxy setup complete!"
echo ""
echo "⚠️  Note: Make sure your Next.js app is running on port 3000 for the proxy to work correctly."
echo "   Start your app with: npm run dev"