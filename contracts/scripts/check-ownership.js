const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x84B346891b977E30ba4774A911cb342f1FAb1Ce4";
  const userAddress = "0x25F11abB6e6CBdb76c14fF39568C82e8799a4fEe";
  
  console.log(`Checking ownership and access control for: ${contractAddress}`);
  
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);
  console.log(`User address: ${userAddress}`);
  
  try {
    const MockToken = await ethers.getContractFactory("MockToken");
    const contract = MockToken.attach(contractAddress);
    
    // Check if the contract has an owner function
    try {
      const owner = await contract.owner();
      console.log(`✅ Contract owner: ${owner}`);
      console.log(`Is deployer the owner? ${owner.toLowerCase() === deployer.address.toLowerCase()}`);
      console.log(`Is user the owner? ${owner.toLowerCase() === userAddress.toLowerCase()}`);
    } catch (error) {
      console.log(`❌ No owner function or error: ${error.message}`);
    }
    
    // Try to call mint from deployer (should work)
    console.log(`\n🔍 Testing mint from deployer...`);
    try {
      const mintAmount = ethers.parseEther("100");
      const tx = await contract.mint(userAddress, mintAmount);
      console.log(`✅ Mint from deployer successful: ${tx.hash}`);
      await tx.wait();
    } catch (error) {
      console.log(`❌ Mint from deployer failed: ${error.message}`);
    }
    
    // Try to simulate mint from user (should fail if there's access control)
    console.log(`\n🔍 Simulating mint from user...`);
    try {
      const mintAmount = ethers.parseEther("100");
      // Use staticCall to simulate without actually sending transaction
      await contract.mint.staticCall(userAddress, mintAmount, { from: userAddress });
      console.log(`✅ Mint from user would succeed`);
    } catch (error) {
      console.log(`❌ Mint from user would fail: ${error.message}`);
      
      // Check if it's an access control error
      if (error.message.includes("Ownable") || error.message.includes("owner")) {
        console.log(`🔒 This appears to be an access control issue - only owner can mint`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
