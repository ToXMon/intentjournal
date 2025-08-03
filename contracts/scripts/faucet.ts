const { ethers } = require("hardhat");

async function main() {
  console.log("🚰 Running Faucet Script...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Faucet operator:", deployer.address);

  // Load contract addresses
  const fs = require('fs');
  let addresses;
  
  try {
    const addressesFile = fs.readFileSync('../src/contracts/addresses.json', 'utf8');
    addresses = JSON.parse(addressesFile);
  } catch (error) {
    console.error("❌ Could not load contract addresses. Run deployMocks first.");
    process.exit(1);
  }

  // Get target address from command line or use deployer
  const targetAddress = process.argv[2] || deployer.address;
  console.log("Target address:", targetAddress);

  // Connect to contracts
  const BBethWrapper = await ethers.getContractFactory("BBethWrapper");
  const bbeth = BBethWrapper.attach(addresses.BBeth);

  const MockToken = await ethers.getContractFactory("MockToken");
  const mockUSDC = MockToken.attach(addresses.USDC);
  const mockDAI = MockToken.attach(addresses.DAI);
  const ijt = MockToken.attach(addresses.IJT);

  console.log("\n💰 Distributing faucet tokens...");

  try {
    // Give BBeth (1 ETH worth)
    console.log("🔄 Getting BBeth...");
    const bbethTx = await bbeth.faucet();
    await bbethTx.wait();
    console.log("✅ Received 1 BBETH");

    // Give Mock USDC (1000 USDC)
    console.log("🔄 Getting Mock USDC...");
    const usdcAmount = ethers.parseUnits("1000", 6); // 1000 USDC with 6 decimals
    const usdcTx = await mockUSDC.faucet(targetAddress, usdcAmount);
    await usdcTx.wait();
    console.log("✅ Received 1000 Mock USDC");

    // Give Mock DAI (1000 DAI)
    console.log("🔄 Getting Mock DAI...");
    const daiAmount = ethers.parseUnits("1000", 18); // 1000 DAI with 18 decimals
    const daiTx = await mockDAI.faucet(targetAddress, daiAmount);
    await daiTx.wait();
    console.log("✅ Received 1000 Mock DAI");

    // Give IJT (10000 IJT)
    console.log("🔄 Getting IntentJournal Tokens...");
    const ijtAmount = ethers.parseUnits("10000", 18); // 10000 IJT with 18 decimals
    const ijtTx = await ijt.faucet(targetAddress, ijtAmount);
    await ijtTx.wait();
    console.log("✅ Received 10000 IJT");

    console.log("\n🎉 Faucet complete! Token balances:");
    console.log("=====================================");
    
    // Check balances
    const bbethBalance = await bbeth.balanceOf(targetAddress);
    const usdcBalance = await mockUSDC.balanceOf(targetAddress);
    const daiBalance = await mockDAI.balanceOf(targetAddress);
    const ijtBalance = await ijt.balanceOf(targetAddress);

    console.log(`BBETH: ${ethers.formatEther(bbethBalance)}`);
    console.log(`USDC: ${ethers.formatUnits(usdcBalance, 6)}`);
    console.log(`DAI: ${ethers.formatEther(daiBalance)}`);
    console.log(`IJT: ${ethers.formatEther(ijtBalance)}`);

  } catch (error) {
    console.error("❌ Faucet failed:", error.message);
    
    if (error.message.includes("Already have enough tokens")) {
      console.log("💡 Note: You already have enough tokens. Try with a different address.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });