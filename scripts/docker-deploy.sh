#!/bin/bash

# Docker Deployment Script for Intent Journal MVP
# This script builds and pushes the Docker image to Docker Hub

set -e  # Exit on any error

# Configuration
IMAGE_NAME="intentjournal-plus"
DOCKER_HUB_USERNAME="${DOCKER_HUB_USERNAME:-your-username}"  # Set this environment variable
VERSION_TAG="${VERSION_TAG:-latest}"
REGISTRY="${REGISTRY:-docker.io}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if username is set
if [ "$DOCKER_HUB_USERNAME" = "your-username" ]; then
    print_error "Please set DOCKER_HUB_USERNAME environment variable or update the script"
    print_warning "Example: export DOCKER_HUB_USERNAME=yourusername"
    exit 1
fi

# Build the image
print_status "Building Docker image for linux/amd64 platform..."
FULL_IMAGE_NAME="${REGISTRY}/${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${VERSION_TAG}"

docker build \
    --platform linux/amd64 \
    --tag "${FULL_IMAGE_NAME}" \
    --tag "${REGISTRY}/${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:$(date +%Y%m%d)" \
    .

if [ $? -eq 0 ]; then
    print_success "Docker image built successfully!"
    print_status "Image: ${FULL_IMAGE_NAME}"
else
    print_error "Docker build failed!"
    exit 1
fi

# Test the image locally (optional)
print_status "Testing image locally..."
CONTAINER_ID=$(docker run -d -p 3001:3000 "${FULL_IMAGE_NAME}")

if [ $? -eq 0 ]; then
    print_status "Container started with ID: ${CONTAINER_ID}"
    print_status "Waiting for application to start..."
    sleep 10
    
    # Test health endpoint
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        print_success "Health check passed!"
    else
        print_warning "Health check failed - but continuing with deployment"
    fi
    
    # Stop test container
    docker stop "${CONTAINER_ID}" > /dev/null
    docker rm "${CONTAINER_ID}" > /dev/null
    print_status "Test container cleaned up"
else
    print_error "Failed to start test container"
fi

# Push to registry
print_status "Pushing image to Docker Hub..."
docker push "${FULL_IMAGE_NAME}"

if [ $? -eq 0 ]; then
    print_success "Image pushed successfully!"
    print_success "Docker image: ${FULL_IMAGE_NAME}"
    print_success ""
    print_success "Next steps:"
    print_success "1. Update akash-deploy.yml with the new image name"
    print_success "2. Deploy to Akash using the SDL file"
    print_success ""
    print_status "Image details:"
    docker images "${FULL_IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
else
    print_error "Failed to push image to Docker Hub!"
    print_error "Make sure you're logged in: docker login"
    exit 1
fi
