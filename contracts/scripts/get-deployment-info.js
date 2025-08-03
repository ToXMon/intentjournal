const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Getting Exact Deployment Information");
  console.log("======================================\n");

  const contractAddress = "0xea3d7f3F9A704d970627bB404a35eA6f11C69646";
  console.log("Contract Address:", contractAddress);
  
  try {
    // Get the contract instance
    const MockToken = await ethers.getContractFactory("contracts/MockToken.sol:MockToken");
    const token = MockToken.attach(contractAddress);

    // Get actual contract data
    const name = await token.name();
    const symbol = await token.symbol();
    const decimals = await token.decimals();
    const totalSupply = await token.totalSupply();
    const owner = await token.owner();

    console.log("\n📊 Actual Contract Data:");
    console.log("- Name:", name);
    console.log("- Symbol:", symbol);
    console.log("- Decimals:", decimals);
    console.log("- Total Supply:", ethers.formatUnits(totalSupply, decimals));
    console.log("- Owner:", owner);

    // Calculate what the initial supply would have been
    const actualInitialSupply = totalSupply / (10n ** BigInt(decimals));
    console.log("- Calculated Initial Supply:", actualInitialSupply.toString());

    console.log("\n🏗️  Constructor Arguments (EXACT):");
    console.log("Raw format:");
    console.log(`"${name}","${symbol}",${decimals},${actualInitialSupply}`);

    // Generate ABI encoded constructor arguments
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const encodedArgs = abiCoder.encode(
      ["string", "string", "uint8", "uint256"],
      [name, symbol, decimals, actualInitialSupply]
    );
    
    console.log("\nABI Encoded format:");
    console.log(encodedArgs);

    // Get transaction that created the contract
    console.log("\n🔍 Trying to get creation transaction...");
    
    // Check recent blocks for contract creation
    const currentBlock = await ethers.provider.getBlockNumber();
    console.log("Current block:", currentBlock);
    
    // Search recent blocks for the contract creation
    for (let i = 0; i < 100; i++) {
      const blockNumber = currentBlock - i;
      try {
        const block = await ethers.provider.getBlock(blockNumber, true);
        if (block && block.transactions) {
          for (const tx of block.transactions) {
            if (tx.to === null && tx.creates && tx.creates.toLowerCase() === contractAddress.toLowerCase()) {
              console.log("\n🎯 Found creation transaction!");
              console.log("- Transaction Hash:", tx.hash);
              console.log("- Block Number:", blockNumber);
              console.log("- Input Data Length:", tx.data.length);
              
              // Try to decode constructor args from transaction data
              if (tx.data.length > 2) {
                console.log("- Transaction Data:", tx.data.substring(0, 100) + "...");
              }
              return;
            }
          }
        }
      } catch (error) {
        // Skip this block if error
      }
    }

    console.log("\n⚠️  Could not find creation transaction in recent blocks");
    
  } catch (error) {
    console.error("❌ Error getting contract info:", error.message);
  }

  console.log("\n📋 VERIFICATION ATTEMPT #2");
  console.log("=========================");
  console.log("Try these settings:");
  console.log("1. Compiler: v0.8.24+commit.e11b9ed9");
  console.log("2. EVM Version: default");
  console.log("3. Optimization: No");
  console.log("4. Contract Name: MockToken");
  console.log("5. Upload: MockTokenFlattened.sol");
  console.log("6. Constructor Args: Use the EXACT values printed above");

  console.log("\n💡 Alternative approaches:");
  console.log("1. Try with optimization: Yes, runs: 200");
  console.log("2. Try EVM version: london");
  console.log("3. Try different constructor argument formats");
  console.log("4. Check if BuildBear has auto-detection feature");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
