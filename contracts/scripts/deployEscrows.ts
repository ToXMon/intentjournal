const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Escrow Contracts...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // Deploy Source Chain Escrow
  console.log("\n📦 Deploying Source Chain Escrow...");
  const SourceChainEscrow = await ethers.getContractFactory("SourceChainEscrow");
  const sourceEscrow = await SourceChainEscrow.deploy();
  await sourceEscrow.waitForDeployment();
  const sourceEscrowAddress = await sourceEscrow.getAddress();
  console.log("✅ Source Chain Escrow deployed to:", sourceEscrowAddress);

  // Deploy Intent Manager
  console.log("\n📦 Deploying Intent Manager...");
  const IntentManager = await ethers.getContractFactory("IntentManager");
  const intentManager = await IntentManager.deploy(sourceEscrowAddress);
  await intentManager.waitForDeployment();
  const intentManagerAddress = await intentManager.getAddress();
  console.log("✅ Intent Manager deployed to:", intentManagerAddress);

  // Summary
  console.log("\n🎉 Deployment Summary:");
  console.log("======================");
  console.log("Source Chain Escrow:", sourceEscrowAddress);
  console.log("Intent Manager:", intentManagerAddress);
  
  // Load existing addresses and add escrow addresses
  const fs = require('fs');
  let addresses = {};
  
  try {
    const existingAddresses = fs.readFileSync('../src/contracts/addresses.json', 'utf8');
    addresses = JSON.parse(existingAddresses);
  } catch (error) {
    console.log("No existing addresses file found, creating new one");
  }

  // Add escrow addresses
  addresses = {
    ...addresses,
    SourceChainEscrow: sourceEscrowAddress,
    IntentManager: intentManagerAddress,
    network: "buildbearBaseFork",
    chainId: 27257,
    deployer: deployer.address,
    lastUpdated: new Date().toISOString()
  };

  fs.writeFileSync(
    '../src/contracts/addresses.json',
    JSON.stringify(addresses, null, 2)
  );
  
  console.log("\n💾 Contract addresses updated in src/contracts/addresses.json");
  console.log("\n🎯 Next steps:");
  console.log("1. Users can create intents via intentManager.createIntent()");
  console.log("2. Users can lock tokens via intentManager.lockIntent()");
  console.log("3. Intents can be fulfilled via intentManager.fulfillIntent() (owner only)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });