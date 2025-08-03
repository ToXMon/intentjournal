const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Simple Contract Deployment...");
  
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance));

    // Deploy BBeth Wrapper
    console.log("\n📦 Deploying BBeth Wrapper...");
    const BBethWrapper = await ethers.getContractFactory("BBethWrapper");
    const bbeth = await BBethWrapper.deploy();
    await bbeth.waitForDeployment();
    const bbethAddress = await bbeth.getAddress();
    console.log("✅ BBeth deployed to:", bbethAddress);

    // Deploy Mock USDC
    console.log("\n📦 Deploying Mock USDC...");
    const MockToken = await ethers.getContractFactory("MockToken");
    const mockUSDC = await MockToken.deploy("Mock USD Coin", "USDC", 6, 1000000);
    await mockUSDC.waitForDeployment();
    const mockUSDCAddress = await mockUSDC.getAddress();
    console.log("✅ Mock USDC deployed to:", mockUSDCAddress);

    // Deploy IJT
    console.log("\n📦 Deploying IntentJournal Token...");
    const ijt = await MockToken.deploy("IntentJournal Token", "IJT", 18, 10000000);
    await ijt.waitForDeployment();
    const ijtAddress = await ijt.getAddress();
    console.log("✅ IJT deployed to:", ijtAddress);

    // Save addresses
    const addresses = {
      BBeth: bbethAddress,
      USDC: mockUSDCAddress,
      DAI: "0x0000000000000000000000000000000000000000", // Skip DAI for now
      IJT: ijtAddress,
      SourceChainEscrow: "0x0000000000000000000000000000000000000000", // Skip for now
      IntentManager: "0x0000000000000000000000000000000000000000", // Skip for now
      network: "buildbearBaseFork",
      chainId: 27257,
      deployer: deployer.address,
      deployedAt: new Date().toISOString()
    };

    // Save to file
    const contractsDir = '../src/contracts';
    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(contractsDir, 'addresses.json'),
      JSON.stringify(addresses, null, 2)
    );
    
    console.log("\n🎉 Deployment Summary:");
    console.log("BBeth:", bbethAddress);
    console.log("USDC:", mockUSDCAddress);
    console.log("IJT:", ijtAddress);
    console.log("\n💾 Addresses saved to src/contracts/addresses.json");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });