const { ethers } = require("hardhat");

async function main() {
  console.log("🔐 Contract Verification Guide - Flattened Contract Method");
  console.log("=========================================================\n");

  // Contract addresses and their constructor parameters
  const contracts = {
    "INTENT_TOKEN": {
      address: "0xea3d7f3F9A704d970627bB404a35eA6f11C69646",
      name: "Intent Token",
      symbol: "INT",
      decimals: 18,
      initialSupply: 10000000
    },
    "OLD_INTENT_TOKEN": {
      address: "0x84B346891b977E30ba4774A911cb342f1FAb1Ce4",
      name: "Intent Token", 
      symbol: "INT",
      decimals: 18,
      initialSupply: 10000000
    },
    "DEMO_TOKEN": {
      address: "0xD31E022A0Aa45A6B74eBb44DDaC909Ec0dfD2765",
      name: "Demo Token",
      symbol: "DEMO", 
      decimals: 18,
      initialSupply: 1000000
    },
    "MOCK_USDC": {
      address: "0x064Abf44F593C198e34E55e4C129580c425b499F",
      name: "Mock USDC",
      symbol: "mUSDC",
      decimals: 6,
      initialSupply: 1000000
    }
  };

  console.log("📋 VERIFICATION FORM VALUES");
  console.log("===========================\n");

  console.log("🔧 Compiler Settings:");
  console.log("- Compiler Version: v0.8.24+commit.e11b9ed9");
  console.log("- EVM Version: default (or london)");
  console.log("- Optimization: No (false)");
  console.log("- Runs: 200 (if optimization enabled)\n");

  console.log("📄 Contract Information:");
  console.log("- Contract Name: MockToken");
  console.log("- Contract File: Upload MockTokenFlattened.sol");
  console.log("- File Location: contracts/MockTokenFlattened.sol\n");

  console.log("🏗️  Constructor Arguments for Each Contract:");
  console.log("============================================\n");

  for (const [name, config] of Object.entries(contracts)) {
    console.log(`${name} (${config.address}):`);
    console.log(`- Raw Arguments: "${config.name}","${config.symbol}",${config.decimals},${config.initialSupply}`);
    
    // Encode constructor arguments
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const encodedArgs = abiCoder.encode(
      ["string", "string", "uint8", "uint256"],
      [config.name, config.symbol, config.decimals, config.initialSupply]
    );
    
    console.log(`- ABI Encoded: ${encodedArgs}`);
    console.log(`- Verification URL: https://smooth-spiderman-faa2b8b9.ethernal.buildbear.io/address/${config.address}#code\n`);
  }

  console.log("📝 STEP-BY-STEP VERIFICATION INSTRUCTIONS");
  console.log("=========================================\n");

  console.log("1. Go to the verification URL for your contract");
  console.log("2. Fill out the form with these EXACT values:");
  console.log("   - Compiler Version: v0.8.24+commit.e11b9ed9");
  console.log("   - EVM Version: default");
  console.log("   - Optimization: No");
  console.log("   - Contract Name: MockToken");
  console.log("3. Upload the flattened contract file:");
  console.log("   📁 contracts/MockTokenFlattened.sol");
  console.log("4. Enter constructor arguments (choose based on which contract):");
  console.log("   - Use the 'Raw Arguments' format above");
  console.log("   - OR use the 'ABI Encoded' format if raw doesn't work");
  console.log("5. Submit verification\n");

  console.log("🎯 QUICK COPY-PASTE VALUES");
  console.log("=========================\n");

  console.log("Compiler Version (copy this):");
  console.log("v0.8.24+commit.e11b9ed9\n");

  console.log("Contract Name (copy this):");
  console.log("MockToken\n");

  console.log("Constructor Arguments (copy based on contract):\n");

  for (const [name, config] of Object.entries(contracts)) {
    console.log(`${name}:`);
    console.log(`"${config.name}","${config.symbol}",${config.decimals},${config.initialSupply}\n`);
  }

  console.log("✅ Flattened contract created at:");
  console.log("📁 contracts/MockTokenFlattened.sol");
  console.log("\n🔗 This file contains all dependencies in one file for easy verification!");

  console.log("\n💡 If verification still fails, try:");
  console.log("1. Check if the compiler version exactly matches");
  console.log("2. Ensure optimization setting is correct");
  console.log("3. Verify constructor arguments are in correct format");
  console.log("4. Try using ABI encoded arguments instead of raw");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification guide failed:", error);
    process.exit(1);
  });
