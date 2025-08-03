import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("deploy-etherlink", "Deploy DutchAuctionEscrow to Etherlink testnet")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log("🚀 Deploying to Etherlink testnet...");
    
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();
    
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));
    
    // Deploy DutchAuctionEscrow
    const DutchAuctionEscrow = await ethers.getContractFactory("DutchAuctionEscrow");
    const escrow = await DutchAuctionEscrow.deploy();
    
    await escrow.waitForDeployment();
    const escrowAddress = await escrow.getAddress();
    
    console.log("✅ DutchAuctionEscrow deployed to:", escrowAddress);
    
    // Verify deployment
    const owner = await escrow.owner();
    console.log("Contract owner:", owner);
    
    // Save deployment info
    const deploymentInfo = {
      network: "etherlink-testnet",
      chainId: 128123,
      contractAddress: escrowAddress,
      deployerAddress: deployer.address,
      blockNumber: await deployer.provider.getBlockNumber(),
      timestamp: new Date().toISOString(),
    };
    
    console.log("\n📋 Deployment Summary:");
    console.log(JSON.stringify(deploymentInfo, null, 2));
    
    // Write deployment info to file
    const fs = require('fs');
    const path = require('path');
    
    const deploymentPath = path.join(__dirname, '../deployments/etherlink-testnet.json');
    fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`\n💾 Deployment info saved to: ${deploymentPath}`);
    
    return deploymentInfo;
  });