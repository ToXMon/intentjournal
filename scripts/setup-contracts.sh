#!/bin/bash

echo "🚀 Setting up Hardhat contracts environment..."

# Navigate to contracts directory
cd contracts

# Install dependencies
echo "📦 Installing Hardhat dependencies..."
npm install

# Compile contracts
echo "🔨 Compiling contracts..."
npm run compile

echo "✅ Hardhat setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Set up your .env file with BUILD_BEAR_RPC and PRIVATE_KEY"
echo "2. Run: cd contracts && npm run deploy:buildbear"
echo "3. Run: cd contracts && npm run faucet"
echo ""
echo "📝 Available commands:"
echo "  npm run deploy:buildbear  - Deploy all contracts to BuildBear fork"
echo "  npm run deploy:etherlink  - Deploy to Etherlink testnet"
echo "  npm run faucet           - Get test tokens"
echo "  npm run compile          - Compile contracts"
echo "  npm run test             - Run tests"