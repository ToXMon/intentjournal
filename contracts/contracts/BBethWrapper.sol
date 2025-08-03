// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BBethWrapper
 * @dev Wrapped ETH for BuildBear Base fork - allows users to wrap/unwrap ETH
 */
contract BBethWrapper is ERC20, Ownable, ReentrancyGuard {
    
    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event Faucet(address indexed user, uint256 amount);
    
    constructor() ERC20("BuildBear Wrapped ETH", "BBETH") Ownable(msg.sender) {}
    
    /**
     * @dev Wrap ETH to BBETH
     */
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "BBeth: Must send ETH");
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }
    
    /**
     * @dev Unwrap BBETH to ETH
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(balanceOf(msg.sender) >= amount, "BBeth: Insufficient balance");
        _burn(msg.sender, amount);
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "BBeth: ETH transfer failed");
        
        emit Withdrawal(msg.sender, amount);
    }
    
    /**
     * @dev Faucet function - gives users free BBETH for testing
     */
    function faucet() external nonReentrant {
        uint256 faucetAmount = 1 ether; // 1 BBETH
        require(balanceOf(msg.sender) < 10 ether, "BBeth: Already have enough tokens");
        
        _mint(msg.sender, faucetAmount);
        emit Faucet(msg.sender, faucetAmount);
    }
    
    /**
     * @dev Owner can fund the contract with ETH for faucet
     */
    function fundFaucet() external payable onlyOwner {
        // ETH is stored in contract for withdrawals
    }
    
    /**
     * @dev Allow contract to receive ETH
     */
    receive() external payable {
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }
    
    fallback() external payable {
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }
}