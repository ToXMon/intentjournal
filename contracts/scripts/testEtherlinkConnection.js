const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Testing Etherlink Testnet Connection...");
  
  try {
    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log("✅ Connected to network:", network.name, "Chain ID:", network.chainId.toString());
    
    // Get accounts
    const accounts = await ethers.getSigners();
    if (accounts.length === 0) {
      console.log("❌ No accounts found. Please set PRIVATE_KEY in .env file");
      return;
    }
    
    const deployer = accounts[0];
    console.log("📝 Deployer account:", deployer.address);
    
    // Check balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("💰 Balance:", ethers.formatEther(balance), "XTZ");
    
    if (balance === 0n) {
      console.log("⚠️ Account has 0 balance!");
      console.log("🚰 Get testnet XTZ from: https://faucet.etherlink.com/");
      console.log("📋 Your address:", deployer.address);
    } else {
      console.log("✅ Account has sufficient balance for deployment");
    }
    
    // Test a simple transaction (get latest block)
    const blockNumber = await deployer.provider.getBlockNumber();
    console.log("📦 Latest block:", blockNumber);
    
    console.log("\n🎉 Connection test successful!");
    
  } catch (error) {
    console.error("❌ Connection test failed:", error.message);
    
    if (error.message.includes("could not detect network")) {
      console.log("💡 Check your network configuration in hardhat.config.ts");
    } else if (error.message.includes("private key")) {
      console.log("💡 Set PRIVATE_KEY in your .env file");
    }
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Test failed:", error);
      process.exit(1);
    });
}

module.exports = main;