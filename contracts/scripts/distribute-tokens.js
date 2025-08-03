const { ethers } = require("hardhat");

async function main() {
  // Contract addresses from deployment
  const DEMO_TOKEN = "0xD31E022A0Aa45A6B74eBb44DDaC909Ec0dfD2765";
  const MOCK_USDC = "0x064Abf44F593C198e34E55e4C129580c425b499F";
  const INTENT_TOKEN = "0xea3d7f3F9A704d970627bB404a35eA6f11C69646";
  
  // Target wallet address
  const targetWallet = "0x25F11abB6e6CBdb76c14fF39568C82e8799a4fEe";
  
  console.log("🎯 Distributing tokens to:", targetWallet);
  
  // Get the deployer account (has all the tokens)
  const [deployer] = await ethers.getSigners();
  console.log("Distributing from:", deployer.address);
  
  // Get contract instances
  const MockToken = await ethers.getContractFactory("MockToken");
  const demoToken = MockToken.attach(DEMO_TOKEN);
  const mockUSDC = MockToken.attach(MOCK_USDC);
  const intentToken = MockToken.attach(INTENT_TOKEN);
  
  console.log("\n💰 Sending tokens...");
  
  // Send DEMO tokens (10,000 DEMO)
  console.log("Sending 10,000 DEMO tokens...");
  const demoAmount = ethers.parseEther("10000"); // 18 decimals
  await demoToken.transfer(targetWallet, demoAmount);
  console.log("✅ DEMO tokens sent");
  
  // Send Mock USDC (5,000 mUSDC)
  console.log("Sending 5,000 mUSDC tokens...");
  const usdcAmount = ethers.parseUnits("5000", 6); // 6 decimals like real USDC
  await mockUSDC.transfer(targetWallet, usdcAmount);
  console.log("✅ mUSDC tokens sent");
  
  // Send Intent tokens (50,000 INT)
  console.log("Sending 50,000 INT tokens...");
  const intentAmount = ethers.parseEther("50000"); // 18 decimals
  await intentToken.transfer(targetWallet, intentAmount);
  console.log("✅ INT tokens sent");
  
  // Also mint additional tokens directly to the wallet for faucet functionality
  console.log("\n🚰 Minting additional tokens for demo...");
  
  await demoToken.mint(targetWallet, ethers.parseEther("5000"));
  console.log("✅ Minted 5,000 additional DEMO tokens");
  
  await mockUSDC.mint(targetWallet, ethers.parseUnits("2000", 6));
  console.log("✅ Minted 2,000 additional mUSDC tokens");
  
  await intentToken.mint(targetWallet, ethers.parseEther("25000"));
  console.log("✅ Minted 25,000 additional INT tokens");
  
  // Verify balances
  console.log("\n🔍 Verifying final balances for", targetWallet);
  
  const finalDemoBalance = await demoToken.balanceOf(targetWallet);
  const finalUsdcBalance = await mockUSDC.balanceOf(targetWallet);
  const finalIntentBalance = await intentToken.balanceOf(targetWallet);
  
  console.log("DEMO balance:", ethers.formatEther(finalDemoBalance));
  console.log("mUSDC balance:", ethers.formatUnits(finalUsdcBalance, 6));
  console.log("INT balance:", ethers.formatEther(finalIntentBalance));
  
  console.log("\n🎉 Token distribution complete!");
  console.log("\n📋 Summary for wallet", targetWallet + ":");
  console.log("- DEMO Token:", ethers.formatEther(finalDemoBalance), "DEMO");
  console.log("- Mock USDC:", ethers.formatUnits(finalUsdcBalance, 6), "mUSDC");
  console.log("- Intent Token:", ethers.formatEther(finalIntentBalance), "INT");
  
  console.log("\n🔗 View wallet on BuildBear Explorer:");
  console.log(`https://smooth-spiderman-faa2b8b9.ethernal.buildbear.io/address/${targetWallet}`);
  
  console.log("\n💡 You can now:");
  console.log("1. Connect this wallet to the app");
  console.log("2. Swap BBeth for these tokens");
  console.log("3. Use the 1inch Limit Order Protocol");
  console.log("4. Demonstrate cross-chain Fusion+");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
