// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./SourceChainEscrow.sol";

/**
 * @title IntentManager
 * @dev Manages intents and coordinates with escrow for the IntentJournal+ system
 */
contract IntentManager is Ownable, ReentrancyGuard {
    
    struct Intent {
        bytes32 id;
        address user;
        string description;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 minAmountOut;
        uint256 timestamp;
        IntentStatus status;
        bytes32 escrowId;
    }
    
    enum IntentStatus {
        Created,
        Locked,
        Processing,
        Fulfilled,
        Failed,
        Refunded
    }
    
    mapping(bytes32 => Intent) public intents;
    mapping(address => bytes32[]) public userIntents;
    
    SourceChainEscrow public immutable escrow;
    
    event IntentCreated(
        bytes32 indexed intentId,
        address indexed user,
        string description,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    );
    
    event IntentLocked(bytes32 indexed intentId, bytes32 escrowId);
    event IntentFulfilled(bytes32 indexed intentId, uint256 amountOut);
    event IntentFailed(bytes32 indexed intentId, string reason);
    
    constructor(address _escrow) Ownable(msg.sender) {
        escrow = SourceChainEscrow(_escrow);
    }
    
    /**
     * @dev Create a new intent
     */
    function createIntent(
        string calldata description,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (bytes32 intentId) {
        intentId = keccak256(
            abi.encodePacked(
                msg.sender,
                description,
                tokenIn,
                tokenOut,
                amountIn,
                block.timestamp,
                block.number
            )
        );
        
        require(intents[intentId].user == address(0), "Intent: Already exists");
        
        intents[intentId] = Intent({
            id: intentId,
            user: msg.sender,
            description: description,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            minAmountOut: minAmountOut,
            timestamp: block.timestamp,
            status: IntentStatus.Created,
            escrowId: bytes32(0)
        });
        
        userIntents[msg.sender].push(intentId);
        
        emit IntentCreated(
            intentId,
            msg.sender,
            description,
            tokenIn,
            tokenOut,
            amountIn
        );
        
        return intentId;
    }
    
    /**
     * @dev Lock tokens for an intent
     */
    function lockIntent(bytes32 intentId) external nonReentrant {
        Intent storage intent = intents[intentId];
        require(intent.user == msg.sender, "Intent: Not your intent");
        require(intent.status == IntentStatus.Created, "Intent: Invalid status");
        
        // Create escrow ID
        bytes32 escrowId = keccak256(abi.encodePacked(intentId, "escrow"));
        
        // Lock tokens in escrow
        // Note: User must approve this contract to spend their tokens first
        IERC20(intent.tokenIn).transferFrom(msg.sender, address(escrow), intent.amountIn);
        
        intent.status = IntentStatus.Locked;
        intent.escrowId = escrowId;
        
        emit IntentLocked(intentId, escrowId);
    }
    
    /**
     * @dev Simulate intent fulfillment (for demo)
     */
    function fulfillIntent(bytes32 intentId, uint256 amountOut) external onlyOwner {
        Intent storage intent = intents[intentId];
        require(intent.status == IntentStatus.Locked, "Intent: Not locked");
        require(amountOut >= intent.minAmountOut, "Intent: Insufficient output");
        
        intent.status = IntentStatus.Fulfilled;
        
        // Release escrow (in production, this would be done after cross-chain verification)
        escrow.release(intent.escrowId);
        
        emit IntentFulfilled(intentId, amountOut);
    }
    
    /**
     * @dev Mark intent as failed
     */
    function failIntent(bytes32 intentId, string calldata reason) external onlyOwner {
        Intent storage intent = intents[intentId];
        require(intent.status == IntentStatus.Locked, "Intent: Not locked");
        
        intent.status = IntentStatus.Failed;
        
        emit IntentFailed(intentId, reason);
    }
    
    /**
     * @dev Get user's intents
     */
    function getUserIntents(address user) external view returns (bytes32[] memory) {
        return userIntents[user];
    }
    
    /**
     * @dev Get intent details
     */
    function getIntent(bytes32 intentId) external view returns (Intent memory) {
        return intents[intentId];
    }
}