// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/MockToken.sol";

contract DeployMockToken is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy DEMO token (18 decimals, 1M initial supply)
        MockToken demoToken = new MockToken(
            "Demo Token",
            "DEMO", 
            18,
            1000000 // 1M initial supply
        );
        
        // Deploy MOCK token (6 decimals like USDC, 1M initial supply)
        MockToken mockUSDC = new MockToken(
            "Mock USDC",
            "mUSDC",
            6,
            1000000 // 1M initial supply
        );
        
        // Deploy INTENT token (18 decimals, 10M initial supply)
        MockToken intentToken = new MockToken(
            "Intent Token",
            "INT",
            18,
            10000000 // 10M initial supply
        );
        
        vm.stopBroadcast();
        
        console.log("DEMO Token deployed to:", address(demoToken));
        console.log("Mock USDC deployed to:", address(mockUSDC));
        console.log("Intent Token deployed to:", address(intentToken));
        
        // Save addresses to file for frontend
        string memory addresses = string(abi.encodePacked(
            "DEMO_TOKEN=", vm.toString(address(demoToken)), "\n",
            "MOCK_USDC=", vm.toString(address(mockUSDC)), "\n", 
            "INTENT_TOKEN=", vm.toString(address(intentToken)), "\n"
        ));
        
        vm.writeFile("./deployed-contracts.env", addresses);
    }
}
