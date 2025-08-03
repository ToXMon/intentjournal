const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x84B346891b977E30ba4774A911cb342f1FAb1Ce4";
  
  console.log(`Checking contract at: ${contractAddress}`);
  
  // Check if contract exists
  const code = await ethers.provider.getCode(contractAddress);
  console.log(`Contract code length: ${code.length}`);
  console.log(`Has contract code: ${code !== '0x'}`);
  
  if (code === '0x') {
    console.log("❌ No contract found at this address!");
    return;
  }
  
  // Try to interact with the contract
  try {
    const MockToken = await ethers.getContractFactory("MockToken");
    const contract = MockToken.attach(contractAddress);
    
    const name = await contract.name();
    const symbol = await contract.symbol();
    const decimals = await contract.decimals();
    const totalSupply = await contract.totalSupply();
    
    console.log(`✅ Contract found:`);
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Decimals: ${decimals}`);
    console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`);
    
    // Test mint function existence
    console.log(`\n🔍 Testing mint function...`);
    
    // Get the function selector for mint
    const mintSelector = contract.interface.getFunction("mint").selector;
    console.log(`   Mint function selector: ${mintSelector}`);
    
  } catch (error) {
    console.error("❌ Error interacting with contract:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
