// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SourceChainEscrow
 * @dev Escrow contract for locking assets on source chain during intent processing
 */
contract SourceChainEscrow is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    
    struct EscrowData {
        address user;
        address token;
        uint256 amount;
        uint256 timestamp;
        bool released;
        bytes32 intentHash;
    }
    
    mapping(bytes32 => EscrowData) public escrows;
    mapping(address => bytes32[]) public userEscrows;
    
    uint256 public constant TIMEOUT_DURATION = 24 hours;
    
    event Locked(
        bytes32 indexed intentId,
        address indexed user,
        address indexed token,
        uint256 amount,
        bytes32 intentHash
    );
    
    event Released(
        bytes32 indexed intentId,
        address indexed user,
        address indexed token,
        uint256 amount
    );
    
    event Refunded(
        bytes32 indexed intentId,
        address indexed user,
        address indexed token,
        uint256 amount
    );
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Lock tokens in escrow for an intent
     */
    function lock(
        address token,
        uint256 amount,
        bytes32 intentId,
        bytes32 intentHash
    ) external nonReentrant whenNotPaused {
        require(amount > 0, "Escrow: Amount must be greater than 0");
        require(escrows[intentId].user == address(0), "Escrow: Intent already exists");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        escrows[intentId] = EscrowData({
            user: msg.sender,
            token: token,
            amount: amount,
            timestamp: block.timestamp,
            released: false,
            intentHash: intentHash
        });
        
        userEscrows[msg.sender].push(intentId);
        
        emit Locked(intentId, msg.sender, token, amount, intentHash);
    }
    
    /**
     * @dev Release tokens from escrow (for demo - in production would require proof)
     */
    function release(bytes32 intentId) external nonReentrant {
        EscrowData storage escrow = escrows[intentId];
        require(escrow.user != address(0), "Escrow: Intent not found");
        require(!escrow.released, "Escrow: Already released");
        
        // For demo purposes, allow owner or user to release
        require(
            msg.sender == owner() || msg.sender == escrow.user,
            "Escrow: Not authorized"
        );
        
        escrow.released = true;
        
        IERC20(escrow.token).safeTransfer(escrow.user, escrow.amount);
        
        emit Released(intentId, escrow.user, escrow.token, escrow.amount);
    }
    
    /**
     * @dev Refund tokens if timeout exceeded
     */
    function refund(bytes32 intentId) external nonReentrant {
        EscrowData storage escrow = escrows[intentId];
        require(escrow.user == msg.sender, "Escrow: Not your intent");
        require(!escrow.released, "Escrow: Already released");
        require(
            block.timestamp >= escrow.timestamp + TIMEOUT_DURATION,
            "Escrow: Timeout not reached"
        );
        
        escrow.released = true;
        
        IERC20(escrow.token).safeTransfer(escrow.user, escrow.amount);
        
        emit Refunded(intentId, escrow.user, escrow.token, escrow.amount);
    }
    
    /**
     * @dev Get user's escrow intents
     */
    function getUserEscrows(address user) external view returns (bytes32[] memory) {
        return userEscrows[user];
    }
    
    /**
     * @dev Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}