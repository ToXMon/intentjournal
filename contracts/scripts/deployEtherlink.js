const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying DutchAuctionEscrow to Etherlink Testnet...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  try {
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "XTZ");
    
    if (balance === 0n) {
      console.log("⚠️ Warning: Account has 0 balance. You may need testnet XTZ.");
      console.log("Get testnet XTZ from: https://faucet.etherlink.com/");
    }
  } catch (error) {
    console.log("Could not fetch balance:", error.message);
  }

  // Deploy DutchAuctionEscrow
  console.log("📦 Deploying DutchAuctionEscrow contract...");
  
  try {
    const DutchAuctionEscrowFactory = await ethers.getContractFactory("DutchAuctionEscrow");
    
    console.log("⏳ Sending deployment transaction...");
    const escrow = await DutchAuctionEscrowFactory.deploy();
    
    console.log("⏳ Waiting for deployment confirmation...");
    await escrow.waitForDeployment();
    
    const escrowAddress = await escrow.getAddress();
    console.log("✅ DutchAuctionEscrow deployed to:", escrowAddress);

    // Verify deployment by calling a view function
    try {
      const owner = await escrow.owner();
      console.log("✅ Contract owner verified:", owner);
    } catch (error) {
      console.log("⚠️ Could not verify owner:", error.message);
    }
    
    // Add deployer as initial resolver
    try {
      console.log("🔧 Adding deployer as initial resolver...");
      const tx = await escrow.addResolver(deployer.address);
      await tx.wait();
      console.log(`✅ Added resolver: ${deployer.address}`);
    } catch (error) {
      console.log(`⚠️ Failed to add resolver:`, error.message);
    }

    // Save deployment info
    const deploymentInfo = {
      network: "etherlink-testnet",
      chainId: 128123,
      contractAddress: escrowAddress,
      deployerAddress: deployer.address,
      timestamp: new Date().toISOString(),
      rpcUrl: "https://node.ghostnet.etherlink.com",
      explorerUrl: "https://testnet-explorer.etherlink.com",
    };

    console.log("\n📋 Deployment Summary:");
    console.log("=".repeat(50));
    console.log(`Network: ${deploymentInfo.network}`);
    console.log(`Chain ID: ${deploymentInfo.chainId}`);
    console.log(`Contract Address: ${deploymentInfo.contractAddress}`);
    console.log(`Deployer: ${deploymentInfo.deployerAddress}`);
    console.log(`Explorer: ${deploymentInfo.explorerUrl}/address/${deploymentInfo.contractAddress}`);
    console.log("=".repeat(50));

    // Create deployments directory
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Write deployment info
    const deploymentPath = path.join(deploymentsDir, 'etherlink-testnet.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`💾 Deployment info saved to: ${deploymentPath}`);
    
    // Also save for frontend
    const frontendDir = path.join(__dirname, '../../src/contracts');
    if (!fs.existsSync(frontendDir)) {
      fs.mkdirSync(frontendDir, { recursive: true });
    }
    
    const frontendPath = path.join(frontendDir, 'etherlink-deployment.json');
    fs.writeFileSync(frontendPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`💾 Frontend deployment info saved to: ${frontendPath}`);
    
    console.log("\n🎉 Deployment completed successfully!");
    console.log(`\n📝 Next steps:`);
    console.log(`1. Verify contract: npx hardhat verify --network etherlinkTestnet ${escrowAddress}`);
    console.log(`2. Update frontend with contract address: ${escrowAddress}`);
    console.log(`3. Test contract functions on Etherlink testnet`);
    
    return deploymentInfo;
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Solution: Get testnet XTZ from https://faucet.etherlink.com/");
    } else if (error.message.includes("network")) {
      console.log("\n💡 Solution: Check network configuration in hardhat.config.ts");
    } else if (error.message.includes("private key")) {
      console.log("\n💡 Solution: Set PRIVATE_KEY in your .env file");
    }
    
    throw error;
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

module.exports = main;