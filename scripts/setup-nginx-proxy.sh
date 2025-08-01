#!/bin/bash

# Setup script for nginx proxy for 1inch API
# This script sets up nginx as a local proxy to handle CORS issues

set -e

echo "🔧 Setting up nginx proxy for 1inch API..."

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "❌ nginx is not installed. Please install nginx first:"
    echo "   macOS: brew install nginx"
    echo "   Ubuntu: sudo apt-get install nginx"
    echo "   CentOS: sudo yum install nginx"
    exit 1
fi

# Check if we're on macOS or Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    NGINX_CONF_DIR="/usr/local/etc/nginx"
    NGINX_LOG_DIR="/usr/local/var/log/nginx"
    NGINX_CACHE_DIR="/usr/local/var/cache/nginx"
else
    NGINX_CONF_DIR="/etc/nginx"
    NGINX_LOG_DIR="/var/log/nginx"
    NGINX_CACHE_DIR="/var/cache/nginx"
fi

echo "📁 Using nginx configuration directory: $NGINX_CONF_DIR"

# Create backup of existing nginx.conf
if [ -f "$NGINX_CONF_DIR/nginx.conf" ]; then
    echo "💾 Backing up existing nginx.conf..."
    sudo cp "$NGINX_CONF_DIR/nginx.conf" "$NGINX_CONF_DIR/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Copy our nginx configuration
echo "📋 Installing nginx configuration..."
sudo cp nginx.conf "$NGINX_CONF_DIR/nginx.conf"

# Create necessary directories
echo "📁 Creating necessary directories..."
sudo mkdir -p "$NGINX_CACHE_DIR"
sudo mkdir -p "$NGINX_LOG_DIR"

# Set proper permissions
sudo chown -R $(whoami):staff "$NGINX_CACHE_DIR" 2>/dev/null || sudo chown -R $(whoami):$(whoami) "$NGINX_CACHE_DIR"

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ nginx configuration is valid"
else
    echo "❌ nginx configuration is invalid. Please check the configuration."
    exit 1
fi

# Check if nginx is running and restart/start it
if pgrep nginx > /dev/null; then
    echo "🔄 Restarting nginx..."
    sudo nginx -s reload
else
    echo "🚀 Starting nginx..."
    sudo nginx
fi

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
    echo "📝 To use the nginx proxy in your app:"
    echo "   1. Update your API calls to use http://localhost:80/api/1inch/ instead of https://api.1inch.dev/"
    echo "   2. Set the X-Oneinch-Api-Key header with your 1inch API key"
    echo "   3. Make sure your Next.js app is running on port 3000"
    echo ""
    echo "🛑 To stop nginx: sudo nginx -s stop"
    echo "🔄 To reload nginx: sudo nginx -s reload"
    echo "📊 To view logs: tail -f $NGINX_LOG_DIR/access.log"
else
    echo "❌ Failed to start nginx. Please check the logs:"
    echo "   sudo tail -f $NGINX_LOG_DIR/error.log"
    exit 1
fi

echo ""
echo "🎉 nginx proxy setup complete!"