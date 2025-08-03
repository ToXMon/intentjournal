const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Continuing Contract Deployment...");
  
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance));

    // BBeth is already deployed at 0xc44cC67485A6A5AB46978752789954a8Ae845eeA
    const bbethAddress = "0xc44cC67485A6A5AB46978752789954a8Ae845eeA";
    console.log("✅ BBeth already deployed at:", bbethAddress);

    // Deploy Mock USDC
    console.log("\n📦 Deploying Mock USDC...");
    const MockToken = await ethers.getContractFactory("MockToken");
    const mockUSDC = await MockToken.deploy("Mock USD Coin", "USDC", 6, 1000000);
    await mockUSDC.waitForDeployment();
    const mockUSDCAddress = await mockUSDC.getAddress();
    console.log("✅ Mock USDC deployed to:", mockUSDCAddress);

    // Deploy Mock DAI
    console.log("\n📦 Deploying Mock DAI...");
    const mockDAI = await MockToken.deploy("Mock Dai Stablecoin", "DAI", 18, 1000000);
    await mockDAI.waitForDeployment();
    const mockDAIAddress = await mockDAI.getAddress();
    console.log("✅ Mock DAI deployed to:", mockDAIAddress);

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
      DAI: mockDAIAddress,
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
    console.log("DAI:", mockDAIAddress);
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