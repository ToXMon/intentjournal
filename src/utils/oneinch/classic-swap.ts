/**
 * 1inch Classic Swap (Aggregation Protocol v6) Implementation
 * Simple swap execution across 163+ DEXes
 */

import { oneInchAPI } from './client';
import type { OneInchSwapParams, OneInchSwapQuote } from '@/types';

export interface ClassicSwapResult {
  quote: OneInchSwapQuote;
  txData?: {
    to: string;
    data: string;
    value: string;
    gasPrice: string;
    gas: string;
  };
  protocols: Array<{
    name: string;
    part: number;
    fromTokenAddress: string;
    toTokenAddress: string;
  }>;
}

export class ClassicSwapManager {
  /**
   * Get swap quote for Classic Swap
   */
  static async getSwapQuote(
    params: OneInchSwapParams,
    chainId: number
  ): Promise<ClassicSwapResult | null> {
    try {
      console.log('🔄 Getting Classic Swap quote...', params);
      
      const quote = await oneInchAPI.getSwapQuote(params, chainId);
      
      if (!quote) {
        throw new Error('No quote available');
      }

      // Parse protocols information
      const protocols = quote.protocols.map((protocol: any) => ({
        name: protocol[0]?.name || 'Unknown',
        part: protocol[0]?.part || 0,
        fromTokenAddress: protocol[0]?.fromTokenAddress || params.src,
        toTokenAddress: protocol[0]?.toTokenAddress || params.dst,
      }));

      const result: ClassicSwapResult = {
        quote,
        protocols,
      };

      console.log('✅ Classic Swap quote received:', result);
      return result;
    } catch (error) {
      console.error('❌ Classic Swap quote failed:', error);
      return null;
    }
  }

  /**
   * Get executable swap transaction data
   */
  static async getSwapTransaction(
    params: OneInchSwapParams,
    chainId: number
  ): Promise<ClassicSwapResult | null> {
    try {
      console.log('🔄 Getting Classic Swap transaction data...', params);
      
      const swapData = await oneInchAPI.getSwapData(params, chainId);
      
      if (!swapData || !swapData.tx) {
        throw new Error('No swap transaction data available');
      }

      // Parse protocols information
      const protocols = swapData.protocols.map((protocol: any) => ({
        name: protocol[0]?.name || 'Unknown',
        part: protocol[0]?.part || 0,
        fromTokenAddress: protocol[0]?.fromTokenAddress || params.src,
        toTokenAddress: protocol[0]?.toTokenAddress || params.dst,
      }));

      const result: ClassicSwapResult = {
        quote: swapData,
        txData: swapData.tx,
        protocols,
      };

      console.log('✅ Classic Swap transaction data received:', result);
      return result;
    } catch (error) {
      console.error('❌ Classic Swap transaction failed:', error);
      return null;
    }
  }

  /**
   * Calculate price impact for the swap
   */
  static calculatePriceImpact(
    inputAmount: string,
    outputAmount: string,
    inputDecimals: number,
    outputDecimals: number,
    marketPrice: number
  ): number {
    try {
      const inputValue = parseFloat(inputAmount) / Math.pow(10, inputDecimals);
      const outputValue = parseFloat(outputAmount) / Math.pow(10, outputDecimals);
      
      const executionPrice = outputValue / inputValue;
      const priceImpact = ((marketPrice - executionPrice) / marketPrice) * 100;
      
      return Math.abs(priceImpact);
    } catch (error) {
      console.error('Price impact calculation failed:', error);
      return 0;
    }
  }

  /**
   * Estimate gas cost in USD
   */
  static estimateGasCostUSD(
    gasEstimate: string,
    gasPriceGwei: number = 20,
    ethPriceUSD: number = 2500
  ): number {
    try {
      const gasUnits = parseInt(gasEstimate);
      const gasCostEth = (gasUnits * gasPriceGwei) / 1e9;
      const gasCostUSD = gasCostEth * ethPriceUSD;
      
      return gasCostUSD;
    } catch (error) {
      console.error('Gas cost estimation failed:', error);
      return 0;
    }
  }

  /**
   * Get supported tokens for Classic Swap
   */
  static async getSupportedTokens(chainId: number) {
    try {
      return await oneInchAPI.getSupportedTokens(chainId);
    } catch (error) {
      console.error('Failed to get supported tokens:', error);
      return {};
    }
  }

  /**
   * Validate swap parameters
   */
  static validateSwapParams(params: OneInchSwapParams): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!params.src || params.src === '0x0000000000000000000000000000000000000000') {
      errors.push('Source token address is required');
    }

    if (!params.dst || params.dst === '0x0000000000000000000000000000000000000000') {
      errors.push('Destination token address is required');
    }

    if (params.src === params.dst) {
      errors.push('Source and destination tokens cannot be the same');
    }

    if (!params.amount || params.amount === '0') {
      errors.push('Amount must be greater than 0');
    }

    if (!params.from) {
      errors.push('Wallet address is required');
    }

    if (params.slippage && (params.slippage < 0.1 || params.slippage > 50)) {
      errors.push('Slippage must be between 0.1% and 50%');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get best route information
   */
  static getBestRoute(protocols: ClassicSwapResult['protocols']): {
    primaryProtocol: string;
    routeCount: number;
    distribution: Record<string, number>;
  } {
    if (protocols.length === 0) {
      return {
        primaryProtocol: 'Unknown',
        routeCount: 0,
        distribution: {},
      };
    }

    // Find the protocol with the highest part
    const primaryProtocol = protocols.reduce((prev, current) => 
      current.part > prev.part ? current : prev
    );

    // Calculate distribution
    const distribution: Record<string, number> = {};
    protocols.forEach(protocol => {
      distribution[protocol.name] = (distribution[protocol.name] || 0) + protocol.part;
    });

    return {
      primaryProtocol: primaryProtocol.name,
      routeCount: protocols.length,
      distribution,
    };
  }
}