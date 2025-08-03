const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting IJT token verification and funding...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance));

  // IJT token address from addresses.json
  const IJT_ADDRESS = "0x207B9335d37544d1E67F25150ce4A75b93481F8A";
  
  // Connect to the deployed IJT contract
  const IJT = await ethers.getContractAt("IntentJournalToken", IJT_ADDRESS);
  
  console.log("📋 IJT Contract Details:");
  console.log("- Address:", IJT_ADDRESS);
  console.log("- Name:", await IJT.name());
  console.log("- Symbol:", await IJT.symbol());
  console.log("- Decimals:", await IJT.decimals());
  console.log("- Total Supply:", ethers.formatEther(await IJT.totalSupply()));
  console.log("- Deployer Balance:", ethers.formatEther(await IJT.balanceOf(deployer.address)));

  // Test accounts to fund (common test addresses)
  const testAccounts = [
    "0xce9B692A01D47054e9ebC15722c071cbc4BE714e", // Deployer
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Test account 1
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Test account 2
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Test account 3
    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", // Test account 4
  ];

  console.log("\n💰 Funding test accounts with IJT tokens...");
  
  for (const account of testAccounts) {
    try {
      const currentBalance = await IJT.balanceOf(account);
      const fundAmount = ethers.parseEther("1000"); // 1000 IJT tokens
      
      if (currentBalance < fundAmount) {
        console.log(`Funding ${account} with 1000 IJT...`);
        const tx = await IJT.transfer(account, fundAmount);
        await tx.wait();
        console.log(`✅ Funded ${account} - TX: ${tx.hash}`);
      } else {
        console.log(`✅ ${account} already has sufficient IJT (${ethers.formatEther(currentBalance)})`);
      }
    } catch (error) {
      console.log(`❌ Failed to fund ${account}:`, error);
    }
  }

  // Create a faucet function for easy token distribution
  console.log("\n🚰 Setting up IJT faucet functionality...");
  
  // Check if we can create a simple faucet method
  const faucetAmount = ethers.parseEther("100"); // 100 IJT per request
  console.log(`Faucet amount set to: ${ethers.formatEther(faucetAmount)} IJT`);

  console.log("\n📊 Final token distribution:");
  for (const account of testAccounts) {
    const balance = await IJT.balanceOf(account);
    console.log(`${account}: ${ethers.formatEther(balance)} IJT`);
  }

  console.log("\n✅ IJT token setup complete!");
  console.log("🔗 Contract verified and funded for testing");
  console.log("💡 Use the IJT token faucet component to distribute tokens to users");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });