const { ethers } = require("hardhat");

async function main() {
  console.log("Redeploying Intent Token with public mint function...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Deploy Intent Token (18 decimals, 10M initial supply)
  const MockToken = await ethers.getContractFactory("MockToken");
  const intentToken = await MockToken.deploy(
    "Intent Token",
    "INT",
    18,
    10000000 // 10M initial supply
  );
  await intentToken.waitForDeployment();
  
  const intentTokenAddress = await intentToken.getAddress();
  console.log("✅ Intent Token deployed to:", intentTokenAddress);
  
  // Test the mint function
  const userAddress = "0x25F11abB6e6CBdb76c14fF39568C82e8799a4fEe";
  const mintAmount = ethers.parseEther("200");
  
  console.log(`\n🔍 Testing mint function...`);
  console.log(`Minting ${ethers.formatEther(mintAmount)} INT to ${userAddress}`);
  
  try {
    const tx = await intentToken.mint(userAddress, mintAmount);
    console.log(`Transaction hash: ${tx.hash}`);
    await tx.wait();
    console.log("✅ Mint successful!");
    
    // Check balance
    const balance = await intentToken.balanceOf(userAddress);
    console.log(`New balance: ${ethers.formatEther(balance)} INT`);
    
  } catch (error) {
    console.error("❌ Mint failed:", error.message);
  }
  
  // Test faucet function
  console.log(`\n🔍 Testing faucet function...`);
  try {
    const tx = await intentToken.faucet();
    console.log(`Faucet transaction hash: ${tx.hash}`);
    await tx.wait();
    console.log("✅ Faucet successful!");
    
    // Check deployer balance
    const deployerBalance = await intentToken.balanceOf(deployer.address);
    console.log(`Deployer balance: ${ethers.formatEther(deployerBalance)} INT`);
    
  } catch (error) {
    console.error("❌ Faucet failed:", error.message);
  }
  
  console.log(`\n📋 Contract Summary:`);
  console.log(`   Address: ${intentTokenAddress}`);
  console.log(`   Name: ${await intentToken.name()}`);
  console.log(`   Symbol: ${await intentToken.symbol()}`);
  console.log(`   Decimals: ${await intentToken.decimals()}`);
  console.log(`   Total Supply: ${ethers.formatEther(await intentToken.totalSupply())} INT`);
  
  console.log(`\n🔗 Explorer: https://smooth-spiderman-faa2b8b9.ethernal.buildbear.io/address/${intentTokenAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
