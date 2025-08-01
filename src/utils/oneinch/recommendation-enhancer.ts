/**
 * Enhances AI recommendations with real-time 1inch data
 */

import { oneInchAPI, COMMON_TOKENS, SupportedChainId } from './index';
import type { DeFiRecommendation, OneInchTokenPrice, OneInchSwapQuote } from '@/types';

export interface EnhancedRecommendation extends DeFiRecommendation {
  realTimePrice?: OneInchTokenPrice;
  realTimeQuote?: OneInchSwapQuote;
  priceImpact?: number;
  liquidityScore?: number;
  executionTime?: number;
  gasEstimateUSD?: number;
}

export class RecommendationEnhancer {
  /**
   * Enhance a recommendation with real-time 1inch data
   */
  static async enhanceRecommendation(
    recommendation: DeFiRecommendation,
    chainId: number,
    walletAddress?: string
  ): Promise<EnhancedRecommendation> {
    try {
      const enhanced: EnhancedRecommendation = { ...recommendation };

      // Get real-time price for the destination token
      const realTimePrice = await oneInchAPI.getTokenPrice(
        recommendation.tokenPair.to.address,
        chainId
      );

      if (realTimePrice) {
        enhanced.realTimePrice = realTimePrice;
        
        // Calculate price difference between AI estimate and real-time price
        const aiPrice = parseFloat(recommendation.estimatedPrice);
        const currentPrice = parseFloat(realTimePrice.priceUSD);
        
        if (aiPrice > 0 && currentPrice > 0) {
          enhanced.priceImpact = ((currentPrice - aiPrice) / aiPrice) * 100;
        }
      }

      // Get real-time swap quote if wallet address is provided
      if (walletAddress) {
        const swapParams = {
          src: recommendation.tokenPair.from.address,
          dst: recommendation.tokenPair.to.address,
          amount: '1000000000000000000', // 1 token in wei (18 decimals)
          from: walletAddress,
          slippage: 1,
        };

        const realTimeQuote = await oneInchAPI.getSwapQuote(swapParams, chainId);
        
        if (realTimeQuote) {
          enhanced.realTimeQuote = realTimeQuote;
          enhanced.executionTime = Date.now(); // Timestamp for quote freshness
          
          // Calculate liquidity score based on protocols available
          enhanced.liquidityScore = Math.min(
            (realTimeQuote.protocols.length / 5) * 100,
            100
          );

          // Estimate gas cost in USD (rough approximation)
          const gasEstimate = parseInt(realTimeQuote.estimatedGas);
          const gasPrice = 20; // 20 gwei average
          const ethPrice = 2500; // $2500 ETH approximation
          enhanced.gasEstimateUSD = (gasEstimate * gasPrice * ethPrice) / 1e18;
        }
      }

      return enhanced;
    } catch (error) {
      console.error('Failed to enhance recommendation:', error);
      return recommendation;
    }
  }

  /**
   * Enhance multiple recommendations in parallel
   */
  static async enhanceRecommendations(
    recommendations: DeFiRecommendation[],
    chainId: number,
    walletAddress?: string
  ): Promise<EnhancedRecommendation[]> {
    const enhancementPromises = recommendations.map(rec =>
      this.enhanceRecommendation(rec, chainId, walletAddress)
    );

    return Promise.all(enhancementPromises);
  }

  /**
   * Get popular token pairs for the current chain
   */
  static getPopularTokenPairs(chainId: SupportedChainId): Array<{
    from: string;
    to: string;
    symbol: string;
  }> {
    const tokens = COMMON_TOKENS[chainId];
    if (!tokens) return [];

    const pairs = [];
    
    // ETH to stablecoins
    if ((tokens as any).ETH && (tokens as any).USDC) {
      pairs.push({
        from: (tokens as any).ETH,
        to: (tokens as any).USDC,
        symbol: 'ETH/USDC'
      });
    }

    // Custom token (IJT) pairs
    if ((tokens as any).IJT) {
      if ((tokens as any).USDC) {
        pairs.push({
          from: (tokens as any).IJT,
          to: (tokens as any).USDC,
          symbol: 'IJT/USDC'
        });
      }
      if ((tokens as any).ETH) {
        pairs.push({
          from: (tokens as any).IJT,
          to: (tokens as any).ETH,
          symbol: 'IJT/ETH'
        });
      }
    }

    return pairs;
  }

  /**
   * Validate if a token pair has sufficient liquidity
   */
  static async validateTokenPairLiquidity(
    fromToken: string,
    toToken: string,
    chainId: number,
    minAmount = '1000000000000000000' // 1 token minimum
  ): Promise<{
    hasLiquidity: boolean;
    bestRate?: string;
    availableProtocols?: number;
    error?: string;
  }> {
    try {
      const quote = await oneInchAPI.getSwapQuote({
        src: fromToken,
        dst: toToken,
        amount: minAmount,
        from: '0x0000000000000000000000000000000000000000', // Dummy address for quote
        slippage: 1,
      }, chainId);

      if (!quote) {
        return {
          hasLiquidity: false,
          error: 'No quote available'
        };
      }

      return {
        hasLiquidity: true,
        bestRate: quote.dstAmount,
        availableProtocols: quote.protocols.length,
      };
    } catch (error) {
      return {
        hasLiquidity: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get market sentiment indicators from price changes
   */
  static getMarketSentiment(prices: Record<string, OneInchTokenPrice>): {
    sentiment: 'bullish' | 'bearish' | 'neutral';
    score: number;
    details: string;
  } {
    const priceChanges = Object.values(prices)
      .map(price => parseFloat(price.change24h || '0'))
      .filter(change => !isNaN(change));

    if (priceChanges.length === 0) {
      return {
        sentiment: 'neutral',
        score: 0,
        details: 'Insufficient price data'
      };
    }

    const averageChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
    const positiveCount = priceChanges.filter(change => change > 0).length;
    const negativeCount = priceChanges.filter(change => change < 0).length;

    let sentiment: 'bullish' | 'bearish' | 'neutral';
    let details: string;

    if (averageChange > 2) {
      sentiment = 'bullish';
      details = `Strong upward momentum with ${positiveCount}/${priceChanges.length} tokens positive`;
    } else if (averageChange < -2) {
      sentiment = 'bearish';
      details = `Downward pressure with ${negativeCount}/${priceChanges.length} tokens negative`;
    } else {
      sentiment = 'neutral';
      details = `Mixed signals with average change of ${averageChange.toFixed(2)}%`;
    }

    return {
      sentiment,
      score: Math.abs(averageChange),
      details
    };
  }

  /**
   * Calculate optimal swap timing based on price trends
   */
  static calculateSwapTiming(
    fromTokenPrice: OneInchTokenPrice,
    toTokenPrice: OneInchTokenPrice
  ): {
    timing: 'immediate' | 'wait' | 'monitor';
    reason: string;
    confidence: number;
  } {
    const fromChange = parseFloat(fromTokenPrice.change24h || '0');
    const toChange = parseFloat(toTokenPrice.change24h || '0');

    // If from token is falling and to token is rising, swap immediately
    if (fromChange < -2 && toChange > 2) {
      return {
        timing: 'immediate',
        reason: 'From token declining while target token rising',
        confidence: 0.8
      };
    }

    // If from token is rising significantly, might want to wait
    if (fromChange > 5) {
      return {
        timing: 'wait',
        reason: 'From token showing strong upward momentum',
        confidence: 0.7
      };
    }

    // If both tokens are stable, timing is less critical
    if (Math.abs(fromChange) < 1 && Math.abs(toChange) < 1) {
      return {
        timing: 'immediate',
        reason: 'Both tokens stable, timing not critical',
        confidence: 0.6
      };
    }

    return {
      timing: 'monitor',
      reason: 'Mixed signals, monitor price action',
      confidence: 0.5
    };
  }
}