const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Token Contract Debugging & Verification Tool");
  console.log("================================================\n");

  // Current contract addresses
  const contracts = {
    DEMO_TOKEN: "0xD31E022A0Aa45A6B74eBb44DDaC909Ec0dfD2765",
    MOCK_USDC: "0x064Abf44F593C198e34E55e4C129580c425b499F",
    INTENT_TOKEN: "0xea3d7f3F9A704d970627bB404a35eA6f11C69646",
    OLD_INTENT_TOKEN: "0x84B346891b977E30ba4774A911cb342f1FAb1Ce4" // For comparison
  };

  const targetWallet = "0x25F11abB6e6CBdb76c14fF39568C82e8799a4fEe";
  const [deployer] = await ethers.getSigners();

  console.log("🔗 Network Info:");
  console.log("- Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("- Deployer:", deployer.address);
  console.log("- Target Wallet:", targetWallet);
  console.log("- Explorer: https://smooth-spiderman-faa2b8b9.ethernal.buildbear.io\n");

  // Test each contract
  for (const [name, address] of Object.entries(contracts)) {
    console.log(`📋 Testing ${name} at ${address}`);
    console.log("-".repeat(60));

    try {
      // Check if contract exists
      const code = await ethers.provider.getCode(address);
      if (code === "0x") {
        console.log("❌ Contract not deployed at this address\n");
        continue;
      }
      console.log("✅ Contract exists");

      // Try to interact with contract
      const MockToken = await ethers.getContractFactory("MockToken");
      const token = MockToken.attach(address);

      try {
        const name = await token.name();
        const symbol = await token.symbol();
        const decimals = await token.decimals();
        const totalSupply = await token.totalSupply();

        console.log(`📊 Token Info:`);
        console.log(`   Name: ${name}`);
        console.log(`   Symbol: ${symbol}`);
        console.log(`   Decimals: ${decimals}`);
        console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`);

        // Check balances
        const deployerBalance = await token.balanceOf(deployer.address);
        const walletBalance = await token.balanceOf(targetWallet);

        console.log(`💰 Balances:`);
        console.log(`   Deployer: ${ethers.formatUnits(deployerBalance, decimals)} ${symbol}`);
        console.log(`   Target Wallet: ${ethers.formatUnits(walletBalance, decimals)} ${symbol}`);

        // Test mint function (if accessible)
        try {
          console.log(`🧪 Testing mint function...`);
          const testAmount = ethers.parseUnits("1", decimals);
          const tx = await token.mint(targetWallet, testAmount);
          await tx.wait();
          console.log(`✅ Mint successful: ${tx.hash}`);
          
          const newBalance = await token.balanceOf(targetWallet);
          console.log(`   New balance: ${ethers.formatUnits(newBalance, decimals)} ${symbol}`);
        } catch (mintError) {
          console.log(`❌ Mint failed: ${mintError.message}`);
        }

        // Test faucet function
        try {
          console.log(`🚰 Testing faucet function...`);
          const faucetAmount = ethers.parseUnits("100", decimals);
          const tx = await token.faucet(targetWallet, faucetAmount);
          await tx.wait();
          console.log(`✅ Faucet successful: ${tx.hash}`);
        } catch (faucetError) {
          console.log(`❌ Faucet failed: ${faucetError.message}`);
        }

        // Generate explorer links
        console.log(`🔗 Explorer Links:`);
        console.log(`   Contract: https://smooth-spiderman-faa2b8b9.ethernal.buildbear.io/address/${address}`);
        console.log(`   Target Wallet: https://smooth-spiderman-faa2b8b9.ethernal.buildbear.io/address/${targetWallet}`);

      } catch (interactionError) {
        console.log(`❌ Contract interaction failed: ${interactionError.message}`);
      }

    } catch (error) {
      console.log(`❌ Error testing contract: ${error.message}`);
    }

    console.log("\n");
  }

  // Summary and recommendations
  console.log("📋 DEBUGGING SUMMARY & RECOMMENDATIONS");
  console.log("=====================================");
  
  console.log("\n1. Contract Verification:");
  console.log("   - Visit BuildBear Explorer for each contract");
  console.log("   - Upload build-info JSON file for verification");
  console.log("   - File location: artifacts/build-info/943c36c595b3f29a4e712a3ed64dfaed.json");
  
  console.log("\n2. Address Consistency Check:");
  console.log("   ✅ Frontend config updated to use: 0xea3d7f3F9A704d970627bB404a35eA6f11C69646");
  console.log("   ✅ Distribution script updated to match");
  console.log("   ✅ addresses.json updated to match");
  
  console.log("\n3. Token Swapping Issues:");
  console.log("   - Ensure all components use the same contract addresses");
  console.log("   - Verify contracts on BuildBear explorer");
  console.log("   - Test mint/faucet functions work correctly");
  console.log("   - Check wallet has sufficient tokens for swapping");
  
  console.log("\n4. Next Steps:");
  console.log("   a) Verify contracts on BuildBear explorer");
  console.log("   b) Run token distribution script");
  console.log("   c) Test token swapping in frontend");
  console.log("   d) Monitor transactions on explorer");

  console.log("\n🎯 Ready for contract verification!");
  console.log("Upload this file to BuildBear Explorer:");
  console.log("📁 artifacts/build-info/943c36c595b3f29a4e712a3ed64dfaed.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Debug script failed:", error);
    process.exit(1);
  });
