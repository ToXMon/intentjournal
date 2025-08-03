const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying All Contracts...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // Deploy all contracts in sequence
  console.log("\n=== DEPLOYING MOCK TOKENS ===");
  
  // Deploy BBeth Wrapper
  const BBethWrapper = await ethers.getContractFactory("BBethWrapper");
  const bbeth = await BBethWrapper.deploy();
  await bbeth.waitForDeployment();
  const bbethAddress = await bbeth.getAddress();
  console.log("✅ BBeth deployed to:", bbethAddress);

  // Fund BBeth faucet
  await deployer.sendTransaction({
    to: bbethAddress,
    value: ethers.parseEther("100")
  });

  // Deploy Mock Tokens
  const MockToken = await ethers.getContractFactory("MockToken");
  
  const mockUSDC = await MockToken.deploy("Mock USD Coin", "USDC", 6, 1000000);
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log("✅ Mock USDC deployed to:", mockUSDCAddress);

  const mockDAI = await MockToken.deploy("Mock Dai Stablecoin", "DAI", 18, 1000000);
  await mockDAI.waitForDeployment();
  const mockDAIAddress = await mockDAI.getAddress();
  console.log("✅ Mock DAI deployed to:", mockDAIAddress);

  const ijt = await MockToken.deploy("IntentJournal Token", "IJT", 18, 10000000);
  await ijt.waitForDeployment();
  const ijtAddress = await ijt.getAddress();
  console.log("✅ IJT deployed to:", ijtAddress);

  console.log("\n=== DEPLOYING ESCROW SYSTEM ===");
  
  // Deploy Source Chain Escrow
  const SourceChainEscrow = await ethers.getContractFactory("SourceChainEscrow");
  const sourceEscrow = await SourceChainEscrow.deploy();
  await sourceEscrow.waitForDeployment();
  const sourceEscrowAddress = await sourceEscrow.getAddress();
  console.log("✅ Source Chain Escrow deployed to:", sourceEscrowAddress);

  // Deploy Intent Manager
  const IntentManager = await ethers.getContractFactory("IntentManager");
  const intentManager = await IntentManager.deploy(sourceEscrowAddress);
  await intentManager.waitForDeployment();
  const intentManagerAddress = await intentManager.getAddress();
  console.log("✅ Intent Manager deployed to:", intentManagerAddress);

  // Final Summary
  console.log("\n🎉 DEPLOYMENT COMPLETE!");
  console.log("========================");
  console.log("BBeth Wrapper:", bbethAddress);
  console.log("Mock USDC:", mockUSDCAddress);
  console.log("Mock DAI:", mockDAIAddress);
  console.log("IntentJournal Token (IJT):", ijtAddress);
  console.log("Source Chain Escrow:", sourceEscrowAddress);
  console.log("Intent Manager:", intentManagerAddress);
  
  // Save all addresses
  const addresses = {
    BBeth: bbethAddress,
    USDC: mockUSDCAddress,
    DAI: mockDAIAddress,
    IJT: ijtAddress,
    SourceChainEscrow: sourceEscrowAddress,
    IntentManager: intentManagerAddress,
    network: await ethers.provider.getNetwork().then(n => n.name),
    chainId: await ethers.provider.getNetwork().then(n => Number(n.chainId)),
    deployer: deployer.address,
    deployedAt: new Date().toISOString()
  };

  const fs = require('fs');
  const path = require('path');
  
  // Ensure directory exists
  const contractsDir = '../src/contracts';
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(contractsDir, 'addresses.json'),
    JSON.stringify(addresses, null, 2)
  );
  
  console.log("\n💾 Contract addresses saved to src/contracts/addresses.json");
  console.log("\n🎯 Ready for IntentJournal+ demo!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });