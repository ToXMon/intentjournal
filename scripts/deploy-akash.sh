#!/bin/bash

# IntentJournal+ Akash Deployment Script
# This script helps deploy the application to Akash Network

set -e

echo "🚀 IntentJournal+ Akash Deployment Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_requirements() {
    echo -e "${BLUE}Checking requirements...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        exit 1
    fi
    
    if ! command -v akash &> /dev/null; then
        echo -e "${RED}❌ Akash CLI is not installed${NC}"
        echo -e "${YELLOW}Install from: https://docs.akash.network/guides/cli${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All requirements met${NC}"
}

# Build Docker image
build_image() {
    echo -e "${BLUE}Building Docker image...${NC}"
    
    # Build the image
    docker build -t intentjournal-plus:latest .
    
    # Tag for registry (if needed)
    if [ ! -z "$DOCKER_REGISTRY" ]; then
        docker tag intentjournal-plus:latest $DOCKER_REGISTRY/intentjournal-plus:latest
        echo -e "${GREEN}✅ Image tagged for registry: $DOCKER_REGISTRY${NC}"
    fi
    
    echo -e "${GREEN}✅ Docker image built successfully${NC}"
}

# Test locally with Docker Compose
test_local() {
    echo -e "${BLUE}Testing locally with Docker Compose...${NC}"
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please edit .env file with your API keys before deploying${NC}"
    fi
    
    # Start the application
    docker-compose up -d
    
    # Wait for health check
    echo -e "${BLUE}Waiting for application to be healthy...${NC}"
    sleep 30
    
    # Check health
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Application is healthy and running at http://localhost:3000${NC}"
        echo -e "${BLUE}Test the application, then run 'docker-compose down' to stop${NC}"
    else
        echo -e "${RED}❌ Application health check failed${NC}"
        docker-compose logs
        exit 1
    fi
}

# Deploy to Akash
deploy_akash() {
    echo -e "${BLUE}Deploying to Akash Network...${NC}"
    
    # Check if wallet is configured
    if ! akash keys list | grep -q .; then
        echo -e "${RED}❌ No Akash wallet configured${NC}"
        echo -e "${YELLOW}Run 'akash keys add <name>' to create a wallet${NC}"
        exit 1
    fi
    
    # Check if SDL file exists
    if [ ! -f akash-deploy.yml ]; then
        echo -e "${RED}❌ akash-deploy.yml not found${NC}"
        exit 1
    fi
    
    # Validate SDL
    echo -e "${BLUE}Validating SDL...${NC}"
    akash deployment validate akash-deploy.yml
    
    # Create deployment
    echo -e "${BLUE}Creating deployment...${NC}"
    akash tx deployment create akash-deploy.yml --from <your-key-name> --node https://rpc.akash.forbole.com:443 --chain-id akashnet-2 --gas-prices 0.025uakt --gas auto --gas-adjustment 1.15
    
    echo -e "${GREEN}✅ Deployment created! Check Akash Console for status${NC}"
    echo -e "${BLUE}Monitor your deployment at: https://console.akash.network${NC}"
}

# Push image to registry (if needed)
push_image() {
    if [ ! -z "$DOCKER_REGISTRY" ]; then
        echo -e "${BLUE}Pushing image to registry...${NC}"
        docker push $DOCKER_REGISTRY/intentjournal-plus:latest
        echo -e "${GREEN}✅ Image pushed to registry${NC}"
    else
        echo -e "${YELLOW}⚠️  No registry configured, skipping push${NC}"
    fi
}

# Main deployment flow
main() {
    echo -e "${BLUE}Select deployment option:${NC}"
    echo "1. Build and test locally"
    echo "2. Build and deploy to Akash"
    echo "3. Full pipeline (build, test, deploy)"
    read -p "Enter choice (1-3): " choice
    
    case $choice in
        1)
            check_requirements
            build_image
            test_local
            ;;
        2)
            check_requirements
            build_image
            push_image
            deploy_akash
            ;;
        3)
            check_requirements
            build_image
            test_local
            echo -e "${YELLOW}Local test complete. Press Enter to continue with Akash deployment...${NC}"
            read
            docker-compose down
            push_image
            deploy_akash
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            exit 1
            ;;
    esac
}

# Environment variables help
show_env_help() {
    echo -e "${BLUE}Required Environment Variables:${NC}"
    echo "NEXT_PUBLIC_VENICE_API_KEY=your_venice_api_key"
    echo "NEXT_PUBLIC_ONEINCH_API_KEY=your_1inch_api_key"
    echo "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id"
    echo ""
    echo -e "${BLUE}Optional:${NC}"
    echo "DOCKER_REGISTRY=your.registry.com (for pushing to custom registry)"
}

# Handle command line arguments
case "${1:-}" in
    "help"|"-h"|"--help")
        show_env_help
        exit 0
        ;;
    "build")
        check_requirements
        build_image
        ;;
    "test")
        check_requirements
        build_image
        test_local
        ;;
    "deploy")
        check_requirements
        build_image
        push_image
        deploy_akash
        ;;
    *)
        main
        ;;
esac