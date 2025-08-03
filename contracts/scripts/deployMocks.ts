const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Mock Tokens...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // Deploy BBeth Wrapper
  console.log("\n📦 Deploying BBeth Wrapper...");
  const BBethWrapper = await ethers.getContractFactory("BBethWrapper");
  const bbeth = await BBethWrapper.deploy();
  await bbeth.waitForDeployment();
  const bbethAddress = await bbeth.getAddress();
  console.log("✅ BBeth deployed to:", bbethAddress);

  // Fund the BBeth contract with some ETH for faucet
  console.log("💰 Funding BBeth faucet...");
  await deployer.sendTransaction({
    to: bbethAddress,
    value: ethers.parseEther("100") // 100 ETH for faucet
  });

  // Deploy Mock USDC
  console.log("\n📦 Deploying Mock USDC...");
  const MockToken = await ethers.getContractFactory("MockToken");
  const mockUSDC = await MockToken.deploy(
    "Mock USD Coin",
    "USDC",
    6, // 6 decimals like real USDC
    1000000 // 1M initial supply
  );
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log("✅ Mock USDC deployed to:", mockUSDCAddress);

  // Deploy Mock DAI
  console.log("\n📦 Deploying Mock DAI...");
  const mockDAI = await MockToken.deploy(
    "Mock Dai Stablecoin",
    "DAI",
    18, // 18 decimals like real DAI
    1000000 // 1M initial supply
  );
  await mockDAI.waitForDeployment();
  const mockDAIAddress = await mockDAI.getAddress();
  console.log("✅ Mock DAI deployed to:", mockDAIAddress);

  // Deploy IntentJournal Token (IJT)
  console.log("\n📦 Deploying IntentJournal Token (IJT)...");
  const ijt = await MockToken.deploy(
    "IntentJournal Token",
    "IJT",
    18,
    10000000 // 10M initial supply
  );
  await ijt.waitForDeployment();
  const ijtAddress = await ijt.getAddress();
  console.log("✅ IJT deployed to:", ijtAddress);

  // Summary
  console.log("\n🎉 Deployment Summary:");
  console.log("======================");
  console.log("BBeth Wrapper:", bbethAddress);
  console.log("Mock USDC:", mockUSDCAddress);
  console.log("Mock DAI:", mockDAIAddress);
  console.log("IntentJournal Token (IJT):", ijtAddress);
  
  // Save addresses to a file for frontend use
  const addresses = {
    BBeth: bbethAddress,
    USDC: mockUSDCAddress,
    DAI: mockDAIAddress,
    IJT: ijtAddress,
    network: "buildbearBaseFork",
    chainId: 27257,
    deployer: deployer.address,
    deployedAt: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync(
    '../src/contracts/addresses.json',
    JSON.stringify(addresses, null, 2)
  );
  
  console.log("\n💾 Contract addresses saved to src/contracts/addresses.json");
  console.log("\n🎯 Next steps:");
  console.log("1. Users can call bbeth.faucet() to get 1 BBETH");
  console.log("2. Users can call mockUSDC.faucet(address, amount) to get test USDC");
  console.log("3. Users can call mockDAI.faucet(address, amount) to get test DAI");
  console.log("4. Users can call ijt.faucet(address, amount) to get test IJT");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });