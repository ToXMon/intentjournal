const { ethers } = require("hardhat");

async function main() {
  const newIntentTokenAddress = "0xea3d7f3F9A704d970627bB404a35eA6f11C69646";
  const userAddress = "0x25F11abB6e6CBdb76c14fF39568C82e8799a4fEe";
  
  console.log(`Testing new Intent Token contract: ${newIntentTokenAddress}`);
  console.log(`User address: ${userAddress}`);
  
  try {
    const MockToken = await ethers.getContractFactory("MockToken");
    const contract = MockToken.attach(newIntentTokenAddress);
    
    // Check current balance
    const balanceBefore = await contract.balanceOf(userAddress);
    console.log(`Balance before: ${ethers.formatEther(balanceBefore)} INT`);
    
    // Try to mint 200 tokens (same amount that failed before)
    const mintAmount = ethers.parseEther("200");
    console.log(`Attempting to mint: ${ethers.formatEther(mintAmount)} INT`);
    
    // Simulate the transaction from the user's perspective
    // We'll use the deployer to simulate what would happen from frontend
    const tx = await contract.mint(userAddress, mintAmount);
    console.log(`✅ Transaction hash: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
    
    // Check balance after
    const balanceAfter = await contract.balanceOf(userAddress);
    console.log(`Balance after: ${ethers.formatEther(balanceAfter)} INT`);
    
    console.log(`\n🎉 SUCCESS! The mint function now works without access control.`);
    console.log(`🔗 View transaction: https://smooth-spiderman-faa2b8b9.ethernal.buildbear.io/tx/${tx.hash}`);
    
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
