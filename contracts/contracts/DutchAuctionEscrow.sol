// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title DutchAuctionEscrow
 * @dev Escrow contract implementing Dutch auction with exponential decay for cross-chain intents
 * Based on 1inch Limit Order Protocol with st1inch exponential decay
 */
contract DutchAuctionEscrow is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    
    struct IntentOrder {
        address maker;
        address sourceToken;
        address destinationToken;
        uint256 sourceAmount;
        uint256 startPrice;      // Initial price (high)
        uint256 endPrice;        // Final price (low)
        uint256 startTime;       // Auction start timestamp
        uint256 duration;        // Auction duration in seconds
        uint256 decayFactor;     // Exponential decay factor (basis points)
        bytes32 intentHash;      // Hash of original intent
        bool executed;
        bool refunded;
        uint32 sourceChainId;    // BuildBear Base fork
        uint32 destChainId;      // Etherlink testnet
    }
    
    struct ResolverFill {
        address resolver;
        uint256 fillAmount;
        uint256 fillPrice;
        uint256 timestamp;
        bytes32 proofHash;       // Cross-chain execution proof
    }
    
    mapping(bytes32 => IntentOrder) public orders;
    mapping(bytes32 => ResolverFill[]) public fills;
    mapping(address => bytes32[]) public userOrders;
    mapping(address => bool) public authorizedResolvers;
    
    // Constants for Dutch auction
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_DURATION = 60;      // 1 minute minimum
    uint256 public constant MAX_DURATION = 86400;   // 24 hours maximum
    uint256 public constant DEFAULT_DECAY_FACTOR = 200; // 2% exponential decay
    
    event IntentCreated(
        bytes32 indexed orderId,
        address indexed maker,
        address sourceToken,
        address destinationToken,
        uint256 sourceAmount,
        uint256 startPrice,
        uint256 endPrice,
        uint256 duration,
        bytes32 intentHash
    );
    
    event OrderFilled(
        bytes32 indexed orderId,
        address indexed resolver,
        uint256 fillAmount,
        uint256 fillPrice,
        bytes32 proofHash
    );
    
    event OrderRefunded(
        bytes32 indexed orderId,
        address indexed maker,
        uint256 amount
    );
    
    constructor() Ownable(msg.sender) {
        // Initialize with some default resolvers for demo
        authorizedResolvers[msg.sender] = true;
    }
    
    /**
     * @dev Create a Dutch auction intent order
     * @param sourceToken Token to sell on source chain
     * @param destinationToken Token to receive on destination chain
     * @param sourceAmount Amount of source token
     * @param startPrice Initial high price
     * @param endPrice Final low price
     * @param duration Auction duration in seconds
     * @param intentHash Hash of the original user intent
     * @param destChainId Destination chain ID (Etherlink testnet)
     */
    function createIntentOrder(
        address sourceToken,
        address destinationToken,
        uint256 sourceAmount,
        uint256 startPrice,
        uint256 endPrice,
        uint256 duration,
        bytes32 intentHash,
        uint32 destChainId
    ) external nonReentrant whenNotPaused returns (bytes32 orderId) {
        require(sourceAmount > 0, "Invalid source amount");
        require(startPrice > endPrice, "Start price must be higher than end price");
        require(duration >= MIN_DURATION && duration <= MAX_DURATION, "Invalid duration");
        
        // Generate unique order ID
        orderId = keccak256(abi.encodePacked(
            msg.sender,
            sourceToken,
            destinationToken,
            sourceAmount,
            block.timestamp,
            intentHash
        ));
        
        require(orders[orderId].maker == address(0), "Order already exists");
        
        // Lock source tokens in escrow
        IERC20(sourceToken).safeTransferFrom(msg.sender, address(this), sourceAmount);
        
        // Create order with exponential decay
        orders[orderId] = IntentOrder({
            maker: msg.sender,
            sourceToken: sourceToken,
            destinationToken: destinationToken,
            sourceAmount: sourceAmount,
            startPrice: startPrice,
            endPrice: endPrice,
            startTime: block.timestamp,
            duration: duration,
            decayFactor: DEFAULT_DECAY_FACTOR,
            intentHash: intentHash,
            executed: false,
            refunded: false,
            sourceChainId: uint32(block.chainid),
            destChainId: destChainId
        });
        
        userOrders[msg.sender].push(orderId);
        
        emit IntentCreated(
            orderId,
            msg.sender,
            sourceToken,
            destinationToken,
            sourceAmount,
            startPrice,
            endPrice,
            duration,
            intentHash
        );
        
        return orderId;
    }
    
    /**
     * @dev Calculate current price using exponential decay (st1inch method)
     * @param orderId The order ID
     * @return currentPrice The current auction price
     */
    function getCurrentPrice(bytes32 orderId) public view returns (uint256 currentPrice) {
        IntentOrder memory order = orders[orderId];
        require(order.maker != address(0), "Order not found");
        
        if (order.executed || order.refunded) {
            return 0;
        }
        
        uint256 elapsed = block.timestamp - order.startTime;
        
        if (elapsed >= order.duration) {
            return order.endPrice;
        }
        
        // Exponential decay formula: price = startPrice * (1 - decayFactor)^(elapsed/duration)
        // Simplified for gas efficiency using linear approximation with exponential steps
        uint256 progress = (elapsed * BASIS_POINTS) / order.duration;
        uint256 priceRange = order.startPrice - order.endPrice;
        
        // Apply exponential decay using st1inch method
        uint256 decayMultiplier = BASIS_POINTS - ((progress * order.decayFactor) / BASIS_POINTS);
        uint256 exponentialDecay = (priceRange * decayMultiplier) / BASIS_POINTS;
        
        currentPrice = order.startPrice - (priceRange - exponentialDecay);
        
        // Ensure price doesn't go below end price
        if (currentPrice < order.endPrice) {
            currentPrice = order.endPrice;
        }
        
        return currentPrice;
    }
    
    /**
     * @dev Fill an order (called by authorized resolvers)
     * @param orderId The order to fill
     * @param fillAmount Amount to fill
     * @param proofHash Cross-chain execution proof hash
     */
    function fillOrder(
        bytes32 orderId,
        uint256 fillAmount,
        bytes32 proofHash
    ) external nonReentrant {
        require(authorizedResolvers[msg.sender], "Not authorized resolver");
        
        IntentOrder storage order = orders[orderId];
        require(order.maker != address(0), "Order not found");
        require(!order.executed && !order.refunded, "Order not active");
        require(fillAmount <= order.sourceAmount, "Fill amount too large");
        
        uint256 currentPrice = getCurrentPrice(orderId);
        require(currentPrice > 0, "Auction ended");
        
        // Mark as executed
        order.executed = true;
        
        // Record the fill
        fills[orderId].push(ResolverFill({
            resolver: msg.sender,
            fillAmount: fillAmount,
            fillPrice: currentPrice,
            timestamp: block.timestamp,
            proofHash: proofHash
        }));
        
        // Transfer tokens to resolver
        IERC20(order.sourceToken).safeTransfer(msg.sender, fillAmount);
        
        emit OrderFilled(orderId, msg.sender, fillAmount, currentPrice, proofHash);
    }
    
    /**
     * @dev Refund order if auction expired without fill
     * @param orderId The order to refund
     */
    function refundOrder(bytes32 orderId) external nonReentrant {
        IntentOrder storage order = orders[orderId];
        require(order.maker == msg.sender, "Not order maker");
        require(!order.executed && !order.refunded, "Order not refundable");
        require(block.timestamp >= order.startTime + order.duration, "Auction still active");
        
        order.refunded = true;
        
        IERC20(order.sourceToken).safeTransfer(order.maker, order.sourceAmount);
        
        emit OrderRefunded(orderId, order.maker, order.sourceAmount);
    }
    
    /**
     * @dev Get order details
     */
    function getOrder(bytes32 orderId) external view returns (IntentOrder memory) {
        return orders[orderId];
    }
    
    /**
     * @dev Get order fills
     */
    function getOrderFills(bytes32 orderId) external view returns (ResolverFill[] memory) {
        return fills[orderId];
    }
    
    /**
     * @dev Get user's orders
     */
    function getUserOrders(address user) external view returns (bytes32[] memory) {
        return userOrders[user];
    }
    
    /**
     * @dev Check if order has on-chain evidence (executed or filled)
     */
    function hasOnChainEvidence(bytes32 orderId) external view returns (bool) {
        IntentOrder memory order = orders[orderId];
        return order.maker != address(0) && (order.executed || fills[orderId].length > 0);
    }
    
    /**
     * @dev Add authorized resolver
     */
    function addResolver(address resolver) external onlyOwner {
        authorizedResolvers[resolver] = true;
    }
    
    /**
     * @dev Remove authorized resolver
     */
    function removeResolver(address resolver) external onlyOwner {
        authorizedResolvers[resolver] = false;
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