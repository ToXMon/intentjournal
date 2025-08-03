const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Deploying Mock Tokens to BuildBear...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy DEMO token (18 decimals, 1M initial supply)
  console.log("\nDeploying DEMO Token...");
  const MockToken = await ethers.getContractFactory("MockToken");
  
  const demoToken = await MockToken.deploy(
    "Demo Token",
    "DEMO", 
    18,
    1000000 // 1M initial supply
  );
  await demoToken.waitForDeployment();
  console.log("DEMO Token deployed to:", await demoToken.getAddress());

  // Deploy Mock USDC (6 decimals like real USDC, 1M initial supply)
  console.log("\nDeploying Mock USDC...");
  const mockUSDC = await MockToken.deploy(
    "Mock USDC",
    "mUSDC",
    6,
    1000000 // 1M initial supply
  );
  await mockUSDC.waitForDeployment();
  console.log("Mock USDC deployed to:", await mockUSDC.getAddress());

  // Deploy Intent Token (18 decimals, 10M initial supply)
  console.log("\nDeploying Intent Token...");
  const intentToken = await MockToken.deploy(
    "Intent Token",
    "INT",
    18,
    10000000 // 10M initial supply
  );
  await intentToken.waitForDeployment();
  console.log("Intent Token deployed to:", await intentToken.getAddress());

  // Save contract addresses for frontend
  const contractAddresses = {
    DEMO_TOKEN: await demoToken.getAddress(),
    MOCK_USDC: await mockUSDC.getAddress(),
    INTENT_TOKEN: await intentToken.getAddress(),
    DEPLOYER: deployer.address,
    NETWORK: "BuildBear Base Fork",
    CHAIN_ID: 27257
  };

  // Write to JSON file
  fs.writeFileSync(
    "../deployed-contracts.json", 
    JSON.stringify(contractAddresses, null, 2)
  );

  // Write to .env format
  const envContent = `# BuildBear Deployed Contracts
DEMO_TOKEN=${contractAddresses.DEMO_TOKEN}
MOCK_USDC=${contractAddresses.MOCK_USDC}
INTENT_TOKEN=${contractAddresses.INTENT_TOKEN}
DEPLOYER_ADDRESS=${contractAddresses.DEPLOYER}
`;

  fs.writeFileSync("../deployed-contracts.env", envContent);

  console.log("\n✅ Deployment Summary:");
  console.log("DEMO Token:", contractAddresses.DEMO_TOKEN);
  console.log("Mock USDC:", contractAddresses.MOCK_USDC);
  console.log("Intent Token:", contractAddresses.INTENT_TOKEN);
  console.log("\n📁 Contract addresses saved to:");
  console.log("- deployed-contracts.json");
  console.log("- deployed-contracts.env");

  // Verify tokens are working by checking balances
  console.log("\n🔍 Verifying deployments...");
  
  const demoBalance = await demoToken.balanceOf(deployer.address);
  const usdcBalance = await mockUSDC.balanceOf(deployer.address);
  const intentBalance = await intentToken.balanceOf(deployer.address);
  
  console.log("DEMO balance:", ethers.formatEther(demoBalance));
  console.log("mUSDC balance:", ethers.formatUnits(usdcBalance, 6));
  console.log("INT balance:", ethers.formatEther(intentBalance));

  console.log("\n🎉 All tokens deployed successfully!");
  console.log("\n🔗 View on BuildBear Explorer:");
  console.log(`https://smooth-spiderman-faa2b8b9.ethernal.buildbear.io/address/${contractAddresses.DEMO_TOKEN}`);
  console.log(`https://smooth-spiderman-faa2b8b9.ethernal.buildbear.io/address/${contractAddresses.MOCK_USDC}`);
  console.log(`https://smooth-spiderman-faa2b8b9.ethernal.buildbear.io/address/${contractAddresses.INTENT_TOKEN}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
