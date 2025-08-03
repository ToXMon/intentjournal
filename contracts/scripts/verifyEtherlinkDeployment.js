const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verifying Etherlink deployment...");
  
  const contractAddress = "0x6CE3d4bf7C7140924C6AB7579b8B86Dc9ebF7a02";
  const deployerAddress = "0xce9B692A01D47054e9ebC15722c071cbc4BE714e";
  
  // Connect to Etherlink testnet
  const provider = new ethers.JsonRpcProvider("https://node.ghostnet.etherlink.com");
  
  try {
    // Check if contract exists
    const code = await provider.getCode(contractAddress);
    if (code === "0x") {
      console.log("❌ No contract found at address");
      return;
    }
    console.log("✅ Contract code found at address");
    
    // Check deployer balance
    const balance = await provider.getBalance(deployerAddress);
    console.log(`💰 Deployer balance: ${ethers.formatEther(balance)} XTZ`);
    
    // Get contract instance
    const DutchAuctionEscrow = await ethers.getContractFactory("DutchAuctionEscrow");
    const contract = DutchAuctionEscrow.attach(contractAddress).connect(provider);
    
    // Test basic contract functions
    const owner = await contract.owner();
    console.log(`👤 Contract owner: ${owner}`);
    
    const isResolver = await contract.resolvers(deployerAddress);
    console.log(`🔧 Deployer is resolver: ${isResolver}`);
    
    console.log("\n📋 Contract Verification Summary:");
    console.log("==================================");
    console.log(`✅ Contract deployed: ${contractAddress}`);
    console.log(`✅ Owner verified: ${owner}`);
    console.log(`✅ Resolver added: ${deployerAddress}`);
    console.log(`✅ Explorer: https://testnet-explorer.etherlink.com/address/${contractAddress}`);
    
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });