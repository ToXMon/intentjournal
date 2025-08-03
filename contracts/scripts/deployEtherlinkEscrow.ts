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
  } catch (error) {
    console.log("Could not fetch balance:", error.message);
  }

  // Deploy DutchAuctionEscrow
  console.log("📦 Deploying DutchAuctionEscrow contract...");
  const DutchAuctionEscrowFactory = await ethers.getContractFactory("DutchAuctionEscrow");
  
  const escrow = await DutchAuctionEscrowFactory.deploy();
  console.log("⏳ Waiting for deployment...");
  
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  
  console.log("✅ DutchAuctionEscrow deployed to:", escrowAddress);

  // Verify deployment
  try {
    const owner = await escrow.owner();
    console.log("Contract owner:", owner);
  } catch (error) {
    console.log("Could not verify owner:", error.message);
  }
  
  // Add some initial resolvers for demo
  const resolverAddresses = [
    deployer.address, // Use deployer as first resolver
    "0x1234567890123456789012345678901234567890", // Demo resolver
  ];

  console.log("🔧 Adding initial resolvers...");
  for (const resolver of resolverAddresses) {
    try {
      const tx = await escrow.addResolver(resolver);
      await tx.wait();
      console.log(`✅ Added resolver: ${resolver}`);
    } catch (error) {
      console.log(`⚠️ Failed to add resolver ${resolver}:`, error.message);
    }
  }

  // Save deployment info
  const deploymentInfo = {
    network: "etherlink-testnet",
    chainId: 128123,
    contractAddress: escrowAddress,
    deployerAddress: deployer.address,
    timestamp: new Date().toISOString(),
    abi: "DutchAuctionEscrow",
  };

  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Write to file for frontend integration
  const deploymentPath = path.join(__dirname, '../deployments/etherlink-testnet.json');
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`\n💾 Deployment info saved to: ${deploymentPath}`);
  
  // Also write to parent directory for frontend access
  const frontendPath = path.join(__dirname, '../../src/contracts/etherlink-deployment.json');
  fs.mkdirSync(path.dirname(frontendPath), { recursive: true });
  fs.writeFileSync(frontendPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`💾 Frontend deployment info saved to: ${frontendPath}`);
  
  return {
    escrow: escrowAddress,
    deployer: deployer.address,
    chainId: 128123
  };
}

// Handle both direct execution and module import
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = { deployEtherlinkEscrow: main };