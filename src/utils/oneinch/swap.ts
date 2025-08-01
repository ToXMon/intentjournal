/**
 * 1inch Swap Utilities
 * Centralized swap functions for token trading interface
 */

import { ClassicSwapManager } from './classic-swap';
import { COMMON_TOKENS } from './index';
import type { OneInchSwapParams } from '@/types';

// Re-export types for convenience
export interface SwapQuote {
  srcToken: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  dstToken: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  dstAmount: string;
  estimatedGas: string;
  protocols?: any[][];
  mockData?: boolean;
  warning?: string;
}

export interface SwapTransaction {
  tx: {
    to: string;
    data: string;
    value: string;
    gas: string;
    gasPrice?: string;
  };
}

export interface SwapQuoteParams {
  srcToken: string;
  dstToken: string;
  amount: string;
  chainId: number;
}

export interface SwapTransactionParams extends SwapQuoteParams {
  fromAddress: string;
  slippage: number;
}

/**
 * Get swap quote from 1inch
 */
export async function getSwapQuote(params: SwapQuoteParams): Promise<SwapQuote> {
  try {
    const swapParams: OneInchSwapParams = {
      src: params.srcToken,
      dst: params.dstToken,
      amount: params.amount,
      from: '0x0000000000000000000000000000000000000001', // Dummy address for quote
      slippage: 1,
      disableEstimate: true,
    };

    const result = await ClassicSwapManager.getSwapQuote(swapParams, params.chainId);
    
    if (!result || !result.quote) {
      // Return mock data for development
      return createMockQuote(params);
    }

    return {
      srcToken: {
        address: params.srcToken,
        symbol: getTokenInfo(params.srcToken).symbol,
        name: getTokenInfo(params.srcToken).name,
        decimals: getTokenInfo(params.srcToken).decimals,
      },
      dstToken: {
        address: params.dstToken,
        symbol: getTokenInfo(params.dstToken).symbol,
        name: getTokenInfo(params.dstToken).name,
        decimals: getTokenInfo(params.dstToken).decimals,
      },
      dstAmount: result.quote.dstAmount,
      estimatedGas: result.quote.estimatedGas || '200000',
      protocols: result.quote.protocols,
    };
  } catch (error) {
    console.warn('Failed to get real quote, using mock data:', error);
    return createMockQuote(params);
  }
}

/**
 * Get swap transaction data
 */
export async function getSwapTransaction(params: SwapTransactionParams): Promise<SwapTransaction> {
  try {
    const swapParams: OneInchSwapParams = {
      src: params.srcToken,
      dst: params.dstToken,
      amount: params.amount,
      from: params.fromAddress,
      slippage: params.slippage,
    };

    const result = await ClassicSwapManager.getSwapTransaction(swapParams, params.chainId);
    
    if (!result || !result.txData) {
      throw new Error('No transaction data available');
    }

    return {
      tx: {
        to: result.txData.to,
        data: result.txData.data,
        value: result.txData.value,
        gas: result.txData.gas,
        gasPrice: result.txData.gasPrice,
      },
    };
  } catch (error) {
    console.error('Failed to get swap transaction:', error);
    throw error;
  }
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount: string, decimals: number, symbol: string): string {
  try {
    const value = parseFloat(amount) / Math.pow(10, decimals);
    return `${value.toFixed(6)} ${symbol}`;
  } catch (error) {
    return `0.000000 ${symbol}`;
  }
}

/**
 * Parse token amount to wei/smallest unit
 */
export function parseTokenAmount(amount: string, decimals: number): string {
  try {
    const value = parseFloat(amount) * Math.pow(10, decimals);
    return Math.floor(value).toString();
  } catch (error) {
    return '0';
  }
}

/**
 * Calculate price impact
 */
export function calculatePriceImpact(
  inputAmount: string,
  outputAmount: string,
  inputDecimals: number,
  outputDecimals: number
): number {
  try {
    const inputValue = parseFloat(inputAmount) / Math.pow(10, inputDecimals);
    const outputValue = parseFloat(outputAmount) / Math.pow(10, outputDecimals);
    
    // Simplified price impact calculation
    // In a real implementation, you'd need market prices
    const rate = outputValue / inputValue;
    const marketRate = 1; // This should be fetched from price feeds
    
    return Math.abs(((marketRate - rate) / marketRate) * 100);
  } catch (error) {
    return 0;
  }
}

/**
 * Get common tokens for a chain
 */
export function getCommonTokens(chainId: number): Record<string, string> {
  return COMMON_TOKENS[chainId as keyof typeof COMMON_TOKENS] || {};
}

/**
 * Get token information
 */
export function getTokenInfo(address: string): {
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
} {
  // Native ETH
  if (isNativeETH(address)) {
    return {
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logoURI: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png',
    };
  }

  // USDC Base
  if (address.toLowerCase() === '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913') {
    return {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoURI: 'https://tokens.1inch.io/0xa0b86a33e6441e6c7d3e4c5b4b6b8b8b8b8b8b8b.png',
    };
  }

  // WETH Base
  if (address.toLowerCase() === '0x4200000000000000000000000000000000000006') {
    return {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      logoURI: 'https://tokens.1inch.io/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png',
    };
  }

  // IntentJournal Token
  if (address.toLowerCase() === '0xe5ccdc758917ec96bd81932af3ef39837aebe01a') {
    return {
      symbol: 'IJT',
      name: 'IntentJournal Token',
      decimals: 18,
      logoURI: '/icons/ijt-token.png',
    };
  }

  // Default fallback
  return {
    symbol: 'UNKNOWN',
    name: 'Unknown Token',
    decimals: 18,
  };
}

/**
 * Check if address is native ETH
 */
export function isNativeETH(address: string): boolean {
  return address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
}

/**
 * Create mock quote for development/testing
 */
function createMockQuote(params: SwapQuoteParams): SwapQuote {
  const srcInfo = getTokenInfo(params.srcToken);
  const dstInfo = getTokenInfo(params.dstToken);
  
  // Mock conversion rate (1 ETH = 3000 USDC, etc.)
  let mockRate = 1;
  if (srcInfo.symbol === 'ETH' && dstInfo.symbol === 'USDC') {
    mockRate = 3000;
  } else if (srcInfo.symbol === 'USDC' && dstInfo.symbol === 'ETH') {
    mockRate = 1 / 3000;
  }

  const inputAmount = parseFloat(params.amount) / Math.pow(10, srcInfo.decimals);
  const outputAmount = inputAmount * mockRate;
  const dstAmount = Math.floor(outputAmount * Math.pow(10, dstInfo.decimals)).toString();

  return {
    srcToken: {
      address: params.srcToken,
      symbol: srcInfo.symbol,
      name: srcInfo.name,
      decimals: srcInfo.decimals,
    },
    dstToken: {
      address: params.dstToken,
      symbol: dstInfo.symbol,
      name: dstInfo.name,
      decimals: dstInfo.decimals,
    },
    dstAmount,
    estimatedGas: '200000',
    mockData: true,
    warning: 'This is mock data for development. Connect to a supported network for real quotes.',
  };
}
