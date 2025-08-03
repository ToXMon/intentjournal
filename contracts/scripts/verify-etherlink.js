const hre = require("hardhat");

async function main() {
  const contractAddress = "0x6CE3d4bf7C7140924C6AB7579b8B86Dc9ebF7a02";
  
  console.log("🔍 Verifying DutchAuctionEscrow contract on Etherlink testnet...");
  console.log("Contract address:", contractAddress);
  
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [], // No constructor arguments
      network: "etherlinkTestnet"
    });
    
    console.log("✅ Contract verified successfully!");
    console.log(`🌐 View at: https://testnet.explorer.etherlink.com/address/${contractAddress}?tab=contract`);
    
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("✅ Contract is already verified!");
    } else {
      console.error("❌ Verification failed:", error.message);
      
      // Fallback: provide manual verification data
      console.log("\n📋 Manual Verification Data:");
      console.log("Contract Address:", contractAddress);
      console.log("Compiler Version: v0.8.24+commit.e11b9ed9");
      console.log("Optimization: Enabled (200 runs)");
      console.log("Constructor Arguments: None");
      console.log("License: MIT");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
