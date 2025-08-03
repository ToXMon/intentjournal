const { ethers } = require("hardhat");

async function main() {
  // Get the contract factory to access the ABI
  const MockToken = await ethers.getContractFactory("MockToken");
  
  console.log("MockToken ABI:");
  console.log(JSON.stringify(MockToken.interface.fragments.map(f => f.format('json')), null, 2));
  
  // Specifically check the mint function
  const mintFunction = MockToken.interface.getFunction("mint");
  console.log("\nMint function details:");
  console.log("Selector:", mintFunction.selector);
  console.log("Signature:", mintFunction.format());
  console.log("Inputs:", mintFunction.inputs.map(input => `${input.type} ${input.name}`));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
