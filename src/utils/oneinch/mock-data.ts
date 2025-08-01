/**
 * Mock 1inch API data for development and BuildBear fork testing
 * This simulates real 1inch API responses for your IJT token and common tokens
 */

import type { TokenPrice, SwapQuote, TokenInfo } from './client';

// Mock token prices for BuildBear fork
export const MOCK_TOKEN_PRICES: Record<string, TokenPrice> = {
  // Your IJT token
  '0xe5ccdc758917ec96bd81932af3ef39837aebe01a': {
    address: '0xe5ccdc758917ec96bd81932af3ef39837aebe01a',
    symbol: 'IJT',
    price: '1.50',
    priceUSD: '1.50',
    change24h: '5.2',
    lastUpdated: Date.now(),
  },
  // USDC on Base
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': {
    address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    symbol: 'USDC',
    price: '1.00',
    priceUSD: '1.00',
    change24h: '0.1',
    lastUpdated: Date.now(),
  },
  // ETH
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': {
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    symbol: 'ETH',
    price: '2500.00',
    priceUSD: '2500.00',
    change24h: '3.5',
    lastUpdated: Date.now(),
  },
  // WETH on Base
  '0x4200000000000000000000000000000000000006': {
    address: '0x4200000000000000000000000000000000000006',
    symbol: 'WETH',
    price: '2500.00',
    priceUSD: '2500.00',
    change24h: '3.5',
    lastUpdated: Date.now(),
  },
};

// Mock supported tokens for BuildBear fork (Base-like)
export const MOCK_SUPPORTED_TOKENS: Record<string, TokenInfo> = {
  '0xe5ccdc758917ec96bd81932af3ef39837aebe01a': {
    address: '0xe5ccdc758917ec96bd81932af3ef39837aebe01a',
    symbol: 'IJT',
    name: 'IntentJournal Token',
    decimals: 18,
    logoURI: 'https://via.placeholder.com/32x32/3b82f6/ffffff?text=IJT',
  },
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': {
    address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI: 'https://via.placeholder.com/32x32/2563eb/ffffff?text=USDC',
  },
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': {
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    logoURI: 'https://via.placeholder.com/32x32/627eea/ffffff?text=ETH',
  },
  '0x4200000000000000000000000000000000000006': {
    address: '0x4200000000000000000000000000000000000006',
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    decimals: 18,
    logoURI: 'https://via.placeholder.com/32x32/627eea/ffffff?text=WETH',
  },
};

// Mock swap quote generator
export function generateMockSwapQuote(
  srcToken: string,
  dstToken: string,
  amount: string
): SwapQuote {
  const srcPrice = MOCK_TOKEN_PRICES[srcToken.toLowerCase()]?.priceUSD || '1';
  const dstPrice = MOCK_TOKEN_PRICES[dstToken.toLowerCase()]?.priceUSD || '1';
  
  // Calculate approximate output amount
  const srcAmount = amount;
  const exchangeRate = parseFloat(srcPrice) / parseFloat(dstPrice);
  
  // Apply some slippage (2-5%)
  const slippage = 0.97; // 3% slippage
  const srcTokenDecimals = MOCK_SUPPORTED_TOKENS[srcToken.toLowerCase()]?.decimals || 18;
  const dstTokenDecimals = MOCK_SUPPORTED_TOKENS[dstToken.toLowerCase()]?.decimals || 18;
  
  // Safely convert srcAmount from wei to decimal
  let srcAmountDecimal: number;
  try {
    // Handle very large numbers by using BigInt division
    const srcAmountBigInt = BigInt(srcAmount);
    const divisor = BigInt(Math.pow(10, srcTokenDecimals));
    srcAmountDecimal = Number(srcAmountBigInt) / Number(divisor);
    
    // If the number is too large, use a reasonable fallback
    if (!isFinite(srcAmountDecimal) || srcAmountDecimal > 1e12) {
      srcAmountDecimal = 1000; // 1000 tokens as fallback
    }
  } catch (error) {
    console.warn('Error parsing srcAmount:', srcAmount, error);
    srcAmountDecimal = 1000; // Fallback to 1000 tokens
  }
  
  // Calculate output in decimal terms
  const dstAmountDecimal = srcAmountDecimal * exchangeRate * slippage;
  
  // Convert back to wei with safe integer conversion
  const multiplier = Math.pow(10, dstTokenDecimals);
  const dstAmountWei = Math.floor(dstAmountDecimal * multiplier);
  
  // Ensure we don't get scientific notation by using string conversion
  const dstAmount = dstAmountWei.toString();

  console.log('🔧 Mock swap quote generated:', {
    srcToken: srcToken.slice(0, 10) + '...',
    dstToken: dstToken.slice(0, 10) + '...',
    srcAmount: srcAmount.length > 20 ? srcAmount.slice(0, 20) + '...' : srcAmount,
    dstAmount: dstAmount.length > 20 ? dstAmount.slice(0, 20) + '...' : dstAmount,
    srcAmountDecimal,
    dstAmountDecimal,
    exchangeRate,
    srcTokenDecimals,
    dstTokenDecimals,
  });

  return {
    dstAmount,
    srcAmount,
    protocols: [
      [
        {
          name: '1inch',
          part: 60,
          fromTokenAddress: srcToken,
          toTokenAddress: dstToken,
        },
        {
          name: 'Uniswap V3',
          part: 40,
          fromTokenAddress: srcToken,
          toTokenAddress: dstToken,
        },
      ],
    ],
    estimatedGas: '150000',
  };
}

// Check if we should use mock data (for BuildBear fork or development)
export function shouldUseMockData(chainId: number): boolean {
  // Use mock data for BuildBear fork (27257) or in development
  return chainId === 27257 || process.env.NODE_ENV === 'development';
}

// Mock health check response
export const MOCK_HEALTH_RESPONSE = {
  status: 'ok',
  timestamp: Date.now(),
};

// Generate realistic mock data with some randomness
export function generateRealtimeMockPrice(basePrice: string, symbol: string): TokenPrice {
  const base = parseFloat(basePrice);
  const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
  const newPrice = (base * (1 + variation)).toFixed(6);
  const change24h = (variation * 100).toFixed(2);

  const foundAddress = Object.keys(MOCK_TOKEN_PRICES).find(addr => 
    MOCK_TOKEN_PRICES[addr].symbol === symbol
  ) || '';

  return {
    address: foundAddress,
    symbol,
    price: newPrice,
    priceUSD: newPrice,
    change24h,
    lastUpdated: Date.now(),
  };
}

// Mock multiple token prices
export function generateMockTokenPrices(tokenAddresses: string[]): Record<string, TokenPrice> {
  const prices: Record<string, TokenPrice> = {};
  
  tokenAddresses.forEach(address => {
    const lowerAddress = address.toLowerCase();
    const mockPrice = MOCK_TOKEN_PRICES[lowerAddress];
    
    if (mockPrice) {
      // Add some realistic variation
      prices[lowerAddress] = generateRealtimeMockPrice(mockPrice.priceUSD, mockPrice.symbol);
    }
  });
  
  return prices;
}

// Mock error responses for testing
export const MOCK_ERRORS = {
  RATE_LIMIT: {
    message: 'Rate limit exceeded',
    statusCode: 429,
  },
  TOKEN_NOT_FOUND: {
    message: 'Token not found',
    statusCode: 404,
  },
  INSUFFICIENT_LIQUIDITY: {
    message: 'Insufficient liquidity',
    statusCode: 400,
  },
};

// Simulate network delay for realistic testing
export function simulateNetworkDelay(ms: number = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}