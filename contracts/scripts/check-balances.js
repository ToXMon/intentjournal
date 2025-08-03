const { ethers } = require("hardhat");

async function main() {
  // Contract addresses from deployment
  const contracts = {
    DEMO: '0xD31E022A0Aa45A6B74eBb44DDaC909Ec0dfD2765',
    USDC: '0x064Abf44F593C198e34E55e4C129580c425b499F',
    INT: '0x84B346891b977E30ba4774A911cb342f1FAb1Ce4'
  };

  // User wallet address
  const userAddress = '0x25F11abB6e6CBdb76c14fF39568C82e8799a4fEe';

  console.log(`🔍 Checking balances for: ${userAddress}\n`);

  // Simple ERC20 ABI for balance checking
  const erc20ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)"
  ];

  try {
    for (const [name, address] of Object.entries(contracts)) {
      console.log(`📊 Checking ${name} token (${address}):`);
      
      const contract = await ethers.getContractAt(erc20ABI, address);
      
      const balance = await contract.balanceOf(userAddress);
      const symbol = await contract.symbol();
      const decimals = await contract.decimals();
      
      const formattedBalance = ethers.formatUnits(balance, decimals);
      
      console.log(`   Balance: ${formattedBalance} ${symbol}`);
      console.log(`   Raw balance: ${balance.toString()}`);
      console.log(`   Decimals: ${decimals}`);
      console.log('');
    }

    // Also check ETH balance
    const provider = ethers.provider;
    const ethBalance = await provider.getBalance(userAddress);
    console.log(`💰 ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);

  } catch (error) {
    console.error("❌ Error checking balances:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
