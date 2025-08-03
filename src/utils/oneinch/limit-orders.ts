/**
 * 1inch Limit Order Protocol Implementation
 * Gasless orderbook trading with conditional execution
 * Enhanced for IntentJournal+ with AI-powered intent processing
 */

export interface LimitOrderParams {
  makerAsset: string;
  takerAsset: string;
  makingAmount: string;
  takingAmount: string;
  maker: string;
  expiration?: number;
  nonce?: string;
  // Enhanced for intent-based orders
  intentId?: string;
  intentText?: string;
  aiConfidence?: number;
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
}

export interface LimitOrderResult {
  orderId: string;
  orderHash: string;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  makerAsset: string;
  takerAsset: string;
  makingAmount: string;
  takingAmount: string;
  filledAmount: string;
  remainingAmount: string;
  price: string;
  expiration: number;
  createdAt: number;
  signature?: string;
  // Enhanced for intent tracking
  intentId?: string;
  intentText?: string;
  aiConfidence?: number;
  fulfillmentProbability?: number;
  estimatedFillTime?: string;
  marketConditions?: {
    currentPrice: number;
    priceImpact: number;
    liquidity: 'high' | 'medium' | 'low';
  };
}

export class LimitOrderManager {
  /**
   * Create a new limit order from user intent
   * Enhanced with AI-powered intent analysis and market condition assessment
   */
  static async createLimitOrder(
    params: LimitOrderParams,
    chainId: number
  ): Promise<LimitOrderResult | null> {
    try {
      console.log('📝 Creating Intent-Based Limit Order...', params);

      // Validate parameters
      const validation = this.validateOrderParams(params);
      if (!validation.isValid) {
        throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
      }

      // Calculate price and market conditions
      const price = this.calculateOrderPrice(params.takingAmount, params.makingAmount);
      const marketConditions = await this.assessMarketConditions(
        params.makerAsset,
        params.takerAsset,
        price,
        chainId
      );

      // Generate order ID and hash (simulation)
      const orderId = `limit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const orderHash = `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;

      // Set expiration based on intent and market conditions
      const expiration = this.calculateOptimalExpiration(
        params.expiration,
        params.riskTolerance,
        marketConditions
      );

      // Calculate fulfillment probability based on AI confidence and market conditions
      const fulfillmentProbability = this.calculateFulfillmentProbability(
        params.aiConfidence || 0.5,
        marketConditions,
        params.riskTolerance || 'moderate'
      );

      // Estimate fill time based on market conditions
      const estimatedFillTime = this.estimateTimeToFill(
        price.toString(),
        marketConditions.currentPrice,
        1000000 // Mock volume
      );

      const order: LimitOrderResult = {
        orderId,
        orderHash,
        status: 'pending',
        makerAsset: params.makerAsset,
        takerAsset: params.takerAsset,
        makingAmount: params.makingAmount,
        takingAmount: params.takingAmount,
        filledAmount: '0',
        remainingAmount: params.makingAmount,
        price: price.toString(),
        expiration,
        createdAt: Date.now(),
        // Enhanced intent tracking
        intentId: params.intentId,
        intentText: params.intentText,
        aiConfidence: params.aiConfidence,
        fulfillmentProbability,
        estimatedFillTime,
        marketConditions,
      };

      console.log('✅ Intent-Based Limit Order created:', order);
      
      // Start fulfillment simulation for demo
      this.simulateOrderFulfillment(order);
      
      return order;
    } catch (error) {
      console.error('❌ Limit Order creation failed:', error);
      return null;
    }
  }

  /**
   * Get active limit orders for a wallet
   */
  static async getActiveOrders(
    walletAddress: string,
    chainId: number
  ): Promise<LimitOrderResult[]> {
    try {
      console.log('📋 Getting active limit orders for:', walletAddress);

      // This would normally call the 1inch Limit Order API
      // For now, return mock data
      const mockOrders: LimitOrderResult[] = [
        {
          orderId: 'limit_1234567890_abc123',
          orderHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          status: 'pending',
          makerAsset: '0xe5ccdc758917ec96bd81932af3ef39837aebe01a', // IJT
          takerAsset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
          makingAmount: '1000000000000000000000', // 1000 IJT
          takingAmount: '1500000000', // 1500 USDC
          filledAmount: '0',
          remainingAmount: '1000000000000000000000',
          price: '1.50',
          expiration: Date.now() + 12 * 60 * 60 * 1000, // 12 hours from now
          createdAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
        },
      ];

      console.log('✅ Active orders retrieved:', mockOrders);
      return mockOrders;
    } catch (error) {
      console.error('❌ Failed to get active orders:', error);
      return [];
    }
  }

  /**
   * Cancel a limit order
   */
  static async cancelOrder(
    orderHash: string,
    walletAddress: string,
    chainId: number
  ): Promise<boolean> {
    try {
      console.log('❌ Cancelling limit order:', orderHash);

      // This would normally call the 1inch API to cancel the order
      // For simulation, we'll just return success
      
      console.log('✅ Limit order cancelled successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to cancel order:', error);
      return false;
    }
  }

  /**
   * Get order status and fill information
   */
  static async getOrderStatus(
    orderHash: string,
    chainId: number
  ): Promise<LimitOrderResult | null> {
    try {
      console.log('🔍 Getting order status:', orderHash);

      // This would normally query the 1inch API
      // For simulation, return mock status
      const mockStatus: LimitOrderResult = {
        orderId: 'limit_1234567890_abc123',
        orderHash,
        status: 'pending',
        makerAsset: '0xe5ccdc758917ec96bd81932af3ef39837aebe01a',
        takerAsset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        makingAmount: '1000000000000000000000',
        takingAmount: '1500000000',
        filledAmount: '250000000000000000000', // 25% filled
        remainingAmount: '750000000000000000000',
        price: '1.50',
        expiration: Date.now() + 12 * 60 * 60 * 1000,
        createdAt: Date.now() - 2 * 60 * 60 * 1000,
      };

      console.log('✅ Order status retrieved:', mockStatus);
      return mockStatus;
    } catch (error) {
      console.error('❌ Failed to get order status:', error);
      return null;
    }
  }

  /**
   * Calculate order price
   */
  static calculateOrderPrice(takingAmount: string, makingAmount: string): number {
    try {
      const taking = parseFloat(takingAmount);
      const making = parseFloat(makingAmount);
      
      if (making === 0) return 0;
      
      return taking / making;
    } catch (error) {
      console.error('Price calculation failed:', error);
      return 0;
    }
  }

  /**
   * Validate order parameters
   */
  static validateOrderParams(params: LimitOrderParams): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!params.makerAsset) {
      errors.push('Maker asset address is required');
    }

    if (!params.takerAsset) {
      errors.push('Taker asset address is required');
    }

    if (params.makerAsset === params.takerAsset) {
      errors.push('Maker and taker assets cannot be the same');
    }

    if (!params.makingAmount || params.makingAmount === '0') {
      errors.push('Making amount must be greater than 0');
    }

    if (!params.takingAmount || params.takingAmount === '0') {
      errors.push('Taking amount must be greater than 0');
    }

    if (!params.maker) {
      errors.push('Maker address is required');
    }

    if (params.expiration && params.expiration <= Date.now()) {
      errors.push('Expiration must be in the future');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate order fill percentage
   */
  static calculateFillPercentage(filledAmount: string, makingAmount: string): number {
    try {
      const filled = parseFloat(filledAmount);
      const total = parseFloat(makingAmount);
      
      if (total === 0) return 0;
      
      return (filled / total) * 100;
    } catch (error) {
      console.error('Fill percentage calculation failed:', error);
      return 0;
    }
  }

  /**
   * Get order type description
   */
  static getOrderTypeDescription(order: LimitOrderResult): string {
    const fillPercentage = this.calculateFillPercentage(order.filledAmount, order.makingAmount);
    
    if (order.status === 'filled') {
      return 'Completely Filled';
    } else if (fillPercentage > 0) {
      return `Partially Filled (${fillPercentage.toFixed(1)}%)`;
    } else if (order.expiration < Date.now()) {
      return 'Expired';
    } else {
      return 'Active';
    }
  }

  /**
   * Estimate time to fill based on market conditions
   */
  static estimateTimeToFill(
    price: string,
    marketPrice: number,
    volume24h: number
  ): string {
    try {
      const orderPrice = parseFloat(price);
      const priceDiff = Math.abs(orderPrice - marketPrice) / marketPrice;
      
      if (priceDiff < 0.01) { // Within 1% of market price
        return 'Minutes';
      } else if (priceDiff < 0.05) { // Within 5% of market price
        return 'Hours';
      } else if (priceDiff < 0.1) { // Within 10% of market price
        return 'Days';
      } else {
        return 'Unlikely';
      }
    } catch (error) {
      console.error('Time to fill estimation failed:', error);
      return 'Unknown';
    }
  }

  /**
   * Get recommended order parameters
   */
  static getRecommendedOrderParams(
    marketPrice: number,
    orderType: 'buy' | 'sell',
    riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  ): {
    suggestedPrice: number;
    priceImpact: number;
    estimatedFillTime: string;
  } {
    const priceAdjustments = {
      conservative: { buy: 0.98, sell: 1.02 }, // 2% better than market
      moderate: { buy: 0.95, sell: 1.05 },     // 5% better than market
      aggressive: { buy: 0.90, sell: 1.10 },   // 10% better than market
    };

    const adjustment = priceAdjustments[riskTolerance][orderType];
    const suggestedPrice = marketPrice * adjustment;
    const priceImpact = Math.abs(suggestedPrice - marketPrice) / marketPrice * 100;

    let estimatedFillTime: string;
    if (priceImpact < 2) {
      estimatedFillTime = 'Minutes to Hours';
    } else if (priceImpact < 5) {
      estimatedFillTime = 'Hours to Days';
    } else {
      estimatedFillTime = 'Days to Weeks';
    }

    return {
      suggestedPrice,
      priceImpact,
      estimatedFillTime,
    };
  }

  /**
   * Assess market conditions for better order placement
   */
  static async assessMarketConditions(
    makerAsset: string,
    takerAsset: string,
    orderPrice: number,
    chainId: number
  ): Promise<{
    currentPrice: number;
    priceImpact: number;
    liquidity: 'high' | 'medium' | 'low';
  }> {
    try {
      // Mock market price (in real implementation, would fetch from 1inch API)
      const currentPrice = orderPrice * (0.95 + Math.random() * 0.1); // ±5% variation
      const priceImpact = Math.abs(orderPrice - currentPrice) / currentPrice * 100;
      
      // Determine liquidity based on price impact
      let liquidity: 'high' | 'medium' | 'low';
      if (priceImpact < 1) {
        liquidity = 'high';
      } else if (priceImpact < 5) {
        liquidity = 'medium';
      } else {
        liquidity = 'low';
      }

      return {
        currentPrice,
        priceImpact,
        liquidity,
      };
    } catch (error) {
      console.error('Failed to assess market conditions:', error);
      return {
        currentPrice: orderPrice,
        priceImpact: 0,
        liquidity: 'medium',
      };
    }
  }

  /**
   * Calculate optimal expiration based on intent and market conditions
   */
  static calculateOptimalExpiration(
    requestedExpiration?: number,
    riskTolerance?: 'conservative' | 'moderate' | 'aggressive',
    marketConditions?: { liquidity: 'high' | 'medium' | 'low' }
  ): number {
    if (requestedExpiration) {
      return requestedExpiration;
    }

    // Base expiration times (in milliseconds)
    const baseExpirations = {
      conservative: 7 * 24 * 60 * 60 * 1000,  // 7 days
      moderate: 3 * 24 * 60 * 60 * 1000,      // 3 days
      aggressive: 24 * 60 * 60 * 1000,        // 1 day
    };

    const tolerance = riskTolerance || 'moderate';
    let expiration = baseExpirations[tolerance];

    // Adjust based on market liquidity
    if (marketConditions?.liquidity === 'low') {
      expiration *= 2; // Double time for low liquidity
    } else if (marketConditions?.liquidity === 'high') {
      expiration *= 0.5; // Half time for high liquidity
    }

    return Date.now() + expiration;
  }

  /**
   * Calculate fulfillment probability based on AI confidence and market conditions
   */
  static calculateFulfillmentProbability(
    aiConfidence: number,
    marketConditions: { priceImpact: number; liquidity: 'high' | 'medium' | 'low' },
    riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  ): number {
    let baseProbability = aiConfidence;

    // Adjust for market conditions
    if (marketConditions.liquidity === 'high') {
      baseProbability += 0.1;
    } else if (marketConditions.liquidity === 'low') {
      baseProbability -= 0.1;
    }

    // Adjust for price impact
    if (marketConditions.priceImpact < 1) {
      baseProbability += 0.15;
    } else if (marketConditions.priceImpact > 5) {
      baseProbability -= 0.15;
    }

    // Adjust for risk tolerance
    const riskAdjustments = {
      conservative: 0.05,  // Slightly higher probability for conservative orders
      moderate: 0,         // No adjustment
      aggressive: -0.05,   // Slightly lower probability for aggressive orders
    };

    baseProbability += riskAdjustments[riskTolerance];

    // Ensure probability is between 0 and 1
    return Math.max(0, Math.min(1, baseProbability));
  }

  /**
   * Simulate order fulfillment for demo purposes
   */
  static simulateOrderFulfillment(order: LimitOrderResult): void {
    if (!order.fulfillmentProbability) return;

    const fulfillmentDelay = Math.random() * 30000 + 10000; // 10-40 seconds
    const shouldFulfill = Math.random() < order.fulfillmentProbability;

    setTimeout(() => {
      if (shouldFulfill) {
        // Simulate partial or full fill
        const fillPercentage = 0.3 + Math.random() * 0.7; // 30-100% fill
        const filledAmount = (parseFloat(order.makingAmount) * fillPercentage).toString();
        const remainingAmount = (parseFloat(order.makingAmount) * (1 - fillPercentage)).toString();

        console.log(`🎯 Limit Order ${order.orderId} filled ${(fillPercentage * 100).toFixed(1)}%`);
        
        // In a real implementation, this would update the order in the store
        order.filledAmount = filledAmount;
        order.remainingAmount = remainingAmount;
        order.status = fillPercentage >= 0.99 ? 'filled' : 'pending';
      } else {
        console.log(`⏰ Limit Order ${order.orderId} still pending...`);
      }
    }, fulfillmentDelay);
  }

  /**
   * Create limit order from AI recommendation
   */
  static async createOrderFromIntent(
    intentId: string,
    intentText: string,
    recommendation: {
      fromToken: { address: string; symbol: string };
      toToken: { address: string; symbol: string };
      fromAmount: string;
      toAmount: string;
      confidence: number;
    },
    walletAddress: string,
    chainId: number,
    riskTolerance: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
  ): Promise<LimitOrderResult | null> {
    const params: LimitOrderParams = {
      makerAsset: recommendation.fromToken.address,
      takerAsset: recommendation.toToken.address,
      makingAmount: recommendation.fromAmount,
      takingAmount: recommendation.toAmount,
      maker: walletAddress,
      intentId,
      intentText,
      aiConfidence: recommendation.confidence,
      riskTolerance,
    };

    return this.createLimitOrder(params, chainId);
  }
}