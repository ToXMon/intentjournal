const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Funding IJT tokens using BuildBear features...");

  // IJT token address from addresses.json
  const IJT_ADDRESS = "0x207B9335d37544d1E67F25150ce4A75b93481F8A";
  
  // Test accounts to fund
  const testAccounts = [
    "0xce9B692A01D47054e9ebC15722c071cbc4BE714e", // Deployer
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Test account 1
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Test account 2
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Test account 3
    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", // Test account 4
  ];

  console.log("💰 Using BuildBear API to set IJT token balances...");
  
  const rpcUrl = "https://rpc.buildbear.io/smooth-spiderman-faa2b8b9";
  const tokenAmount = "0x56BC75E2D630E0000"; // 100 tokens in hex (100 * 10^18)
  
  for (const account of testAccounts) {
    try {
      console.log(`Setting IJT balance for ${account}...`);
      
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'buildbear_setERC20Balance',
          params: [
            account,
            IJT_ADDRESS,
            tokenAmount
          ],
          id: 1
        })
      });
      
      const data = await response.json();
      
      if (data.result) {
        console.log(`✅ Set IJT balance for ${account}`);
      } else {
        console.log(`❌ Failed to set balance for ${account}:`, data.error);
      }
    } catch (error) {
      console.log(`❌ Error setting balance for ${account}:`, error.message);
    }
  }

  // Verify balances
  console.log("\n🔍 Verifying IJT token balances...");
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const IJT = new ethers.Contract(IJT_ADDRESS, [
    "function balanceOf(address owner) view returns (uint256)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)"
  ], provider);

  try {
    const symbol = await IJT.symbol();
    const decimals = await IJT.decimals();
    
    console.log(`\n📊 ${symbol} Token Balances:`);
    for (const account of testAccounts) {
      try {
        const balance = await IJT.balanceOf(account);
        const formattedBalance = ethers.formatUnits(balance, decimals);
        console.log(`${account}: ${formattedBalance} ${symbol}`);
      } catch (error) {
        console.log(`${account}: Error reading balance`);
      }
    }
  } catch (error) {
    console.log("❌ Error verifying balances:", error.message);
  }

  console.log("\n✅ IJT token funding complete!");
  console.log("🔗 Tokens are now available for Fusion+ testing");
  console.log("💡 Use the IJT token faucet component in the app to distribute more tokens");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });