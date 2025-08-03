const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x84B346891b977E30ba4774A911cb342f1FAb1Ce4";
  const userAddress = "0x25F11abB6e6CBdb76c14fF39568C82e8799a4fEe";
  
  console.log(`Testing mint function on contract: ${contractAddress}`);
  console.log(`Minting to address: ${userAddress}`);
  
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);
  
  try {
    const MockToken = await ethers.getContractFactory("MockToken");
    const contract = MockToken.attach(contractAddress);
    
    // Check current balance
    const balanceBefore = await contract.balanceOf(userAddress);
    console.log(`Balance before: ${ethers.formatEther(balanceBefore)} INT`);
    
    // Try to mint 200 tokens (same amount that failed)
    const mintAmount = ethers.parseEther("200");
    console.log(`Attempting to mint: ${ethers.formatEther(mintAmount)} INT`);
    
    // Estimate gas first
    try {
      const gasEstimate = await contract.mint.estimateGas(userAddress, mintAmount);
      console.log(`Gas estimate: ${gasEstimate.toString()}`);
    } catch (gasError) {
      console.error(`❌ Gas estimation failed: ${gasError.message}`);
      
      // Try to get more details about the revert
      try {
        await contract.mint.staticCall(userAddress, mintAmount);
      } catch (staticError) {
        console.error(`❌ Static call failed: ${staticError.message}`);
        
        // Check if the function exists by looking at the contract ABI
        const mintFunction = contract.interface.getFunction("mint");
        console.log(`Mint function signature: ${mintFunction.format()}`);
        
        // Try to call the function with different parameters
        console.log(`\n🔍 Debugging mint function...`);
        
        // Check if recipient is zero address
        if (userAddress === ethers.ZeroAddress) {
          console.log(`❌ Recipient is zero address`);
        } else {
          console.log(`✅ Recipient is valid: ${userAddress}`);
        }
        
        // Check if amount is zero
        if (mintAmount === 0n) {
          console.log(`❌ Amount is zero`);
        } else {
          console.log(`✅ Amount is valid: ${mintAmount.toString()}`);
        }
        
        // Try to check the actual contract bytecode for the mint function
        const code = await ethers.provider.getCode(contractAddress);
        console.log(`Contract bytecode length: ${code.length}`);
        
        // Check if the mint function selector exists in the bytecode
        const mintSelector = "40c10f19"; // mint(address,uint256)
        if (code.includes(mintSelector)) {
          console.log(`✅ Mint function selector found in bytecode`);
        } else {
          console.log(`❌ Mint function selector NOT found in bytecode`);
        }
      }
      return;
    }
    
    // If gas estimation succeeded, try the actual transaction
    const tx = await contract.mint(userAddress, mintAmount);
    console.log(`Transaction hash: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
    
    // Check balance after
    const balanceAfter = await contract.balanceOf(userAddress);
    console.log(`Balance after: ${ethers.formatEther(balanceAfter)} INT`);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
