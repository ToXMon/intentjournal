/**
 * Hybrid Data Provider for BuildBear Fork
 * Combines real-world market data with fork-specific token data
 */

import type { TokenPrice, TokenInfo } from './client';

// Free price APIs that don't require CORS proxying
const PRICE_APIS = {
  coingecko: 'https://api.coingecko.com/api/v3/simple/price',
  coinbase: 'https://api.coinbase.com/v2/exchange-rates',
};

// Real-world token mappings to price APIs
const TOKEN_PRICE_MAPPINGS = {
  // Ethereum
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 'ethereum',
  '0x4200000000000000000000000000000000000006': 'ethereum', // WETH
  // USDC
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 'usd-coin',
  '0xa0b86a33e6441e6c7d3e4c5b4b6b8b8b8b8b8b8b': 'usd-coin',
  // Add more as needed
};

// Your custom token configuration
const CUSTOM_TOKENS = {
  '0xe5ccdc758917ec96bd81932af3ef39837aebe01a': {
    symbol: 'IJT',
    name: 'IntentJournal Token',
    decimals: 18,
    // Price estimation based on your tokenomics
    estimatedPrice: calculateIJTPrice,
    // You could also set a fixed price: fixedPrice: '1.50'
  },
};

/**
 * Calculate IJT token price based on various factors
 */
function calculateIJTPrice(): string {
  // Method 1: Fixed price for demo
  const DEMO_PRICE = '1.50';
  
  // Method 2: Price relative to ETH (uncomment to use)
  // const ethPrice = await getRealTokenPrice('ethereum');
  // const ijtPrice = (ethPrice * 0.0006).toFixed(6); // 0.0006 ETH per IJT
  
  // Method 3: Price based on your tokenomics
  // Total supply: 1,000,000 IJT
  // If you want market cap of $1.5M, price = $1.50
  
  return DEMO_PRICE;
}

/**
 * Fetch real-world token prices from free APIs
 */
export async function getRealTokenPrice(coinId: string): Promise<number> {
  try {
    // Try CoinGecko first (no API key required)
    const response = await fetch(
      `${PRICE_APIS.coingecko}?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const price = data[coinId]?.usd || 0;
      console.log(`🌐 Real price for ${coinId}:`, price);
      return price;
    }

    throw new Error('CoinGecko API failed');
  } catch (error) {
    console.warn(`Failed to fetch real price for ${coinId}:`, error);
    
    // Fallback to reasonable estimates
    const fallbackPrices: Record<string, number> = {
      ethereum: 3500,
      'usd-coin': 1.0,
      bitcoin: 65000,
    };
    
    const fallbackPrice = fallbackPrices[coinId] || 0;
    console.log(`🔧 Using fallback price for ${coinId}:`, fallbackPrice);
    return fallbackPrice;
  }
}

/**
 * Get hybrid token price (real-world + custom)
 */
export async function getHybridTokenPrice(tokenAddress: string): Promise<TokenPrice | null> {
  const lowerAddress = tokenAddress.toLowerCase();
  
  // Check if it's a custom token (your IJT)
  if (CUSTOM_TOKENS[lowerAddress as keyof typeof CUSTOM_TOKENS]) {
    const customToken = CUSTOM_TOKENS[lowerAddress as keyof typeof CUSTOM_TOKENS];
    const price = typeof customToken.estimatedPrice === 'function' 
      ? customToken.estimatedPrice() 
      : customToken.estimatedPrice;
    
    return {
      address: lowerAddress,
      symbol: customToken.symbol,
      price,
      priceUSD: price,
      change24h: generateRealistic24hChange(),
      lastUpdated: Date.now(),
    };
  }
  
  // Check if it's a known token with real-world pricing
  const coinId = TOKEN_PRICE_MAPPINGS[lowerAddress as keyof typeof TOKEN_PRICE_MAPPINGS];
  if (coinId) {
    try {
      const realPrice = await getRealTokenPrice(coinId);
      const symbol = getTokenSymbol(lowerAddress);
      
      return {
        address: lowerAddress,
        symbol,
        price: realPrice.toFixed(6), // Ensure no scientific notation
        priceUSD: realPrice.toFixed(6),
        change24h: generateRealistic24hChange(),
        lastUpdated: Date.now(),
      };
    } catch (error) {
      console.error('Failed to get real price:', error);
    }
  }
  
  return null;
}

/**
 * Generate realistic 24h price changes
 */
function generateRealistic24hChange(): string {
  // Generate realistic crypto volatility (-10% to +10%)
  const change = (Math.random() - 0.5) * 20;
  return change.toFixed(2);
}

/**
 * Get token symbol from address
 */
function getTokenSymbol(address: string): string {
  const symbolMap: Record<string, string> = {
    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 'ETH',
    '0x4200000000000000000000000000000000000006': 'WETH',
    '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 'USDC',
  };
  
  return symbolMap[address.toLowerCase()] || 'UNKNOWN';
}

/**
 * Fetch multiple hybrid prices
 */
export async function getHybridTokenPrices(tokenAddresses: string[]): Promise<Record<string, TokenPrice>> {
  const prices: Record<string, TokenPrice> = {};
  
  // Fetch prices in parallel
  const pricePromises = tokenAddresses.map(async (address) => {
    const price = await getHybridTokenPrice(address);
    if (price) {
      prices[address.toLowerCase()] = price;
    }
  });
  
  await Promise.all(pricePromises);
  return prices;
}

/**
 * Get BuildBear fork-specific data
 */
export async function getBuildBearForkData(tokenAddress: string, rpcUrl: string) {
  try {
    // You could fetch actual token data from your BuildBear fork
    // This would require viem/ethers to query the blockchain
    
    // Example: Get token balance, total supply, etc.
    // const provider = new JsonRpcProvider(rpcUrl);
    // const contract = new Contract(tokenAddress, ERC20_ABI, provider);
    // const totalSupply = await contract.totalSupply();
    
    console.log('🔧 Could fetch real fork data for:', tokenAddress);
    
    return {
      totalSupply: '1000000000000000000000000', // 1M tokens with 18 decimals
      deployedAt: 1704067200000, // Your deployment timestamp
      contractCreator: '0xa7ac80593e257d5a07a749a311a26f71132bab94',
    };
  } catch (error) {
    console.error('Failed to fetch BuildBear fork data:', error);
    return null;
  }
}

/**
 * Enhanced IJT price calculation with multiple methods
 */
export function calculateEnhancedIJTPrice(): {
  price: string;
  method: string;
  reasoning: string;
} {
  // Method 1: Demo/Fixed Price
  const demoPrice = {
    price: '1.50',
    method: 'Fixed Demo Price',
    reasoning: 'Set to $1.50 for demonstration purposes. In production, this could be based on tokenomics, market cap targets, or trading activity.',
  };
  
  // Method 2: Market Cap Based (if you have a target market cap)
  const totalSupply = 1_000_000; // 1M IJT tokens
  const targetMarketCap = 1_500_000; // $1.5M target market cap
  const marketCapPrice = {
    price: (targetMarketCap / totalSupply).toFixed(6),
    method: 'Market Cap Target',
    reasoning: `Based on target market cap of $${targetMarketCap.toLocaleString()} with ${totalSupply.toLocaleString()} total supply.`,
  };
  
  // Method 3: Relative to ETH (if you want IJT pegged to ETH)
  // const ethRelativePrice = {
  //   price: (ethPrice * 0.0006).toFixed(6), // 0.0006 ETH per IJT
  //   method: 'ETH Relative',
  //   reasoning: 'Priced at 0.0006 ETH per IJT token, maintaining relative value to Ethereum.',
  // };
  
  // Return the method you prefer
  return demoPrice; // Change this to marketCapPrice or ethRelativePrice as needed
}

/**
 * Check if we should use hybrid data
 */
export function shouldUseHybridData(chainId: number): boolean {
  return chainId === 27257; // BuildBear fork
}

/**
 * Main hybrid data provider
 */
export class HybridDataProvider {
  static async getTokenPrice(tokenAddress: string, chainId: number): Promise<TokenPrice | null> {
    if (!shouldUseHybridData(chainId)) {
      return null; // Use regular API
    }
    
    console.log('🌐 Using hybrid data for token price:', tokenAddress);
    return await getHybridTokenPrice(tokenAddress);
  }
  
  static async getTokenPrices(tokenAddresses: string[], chainId: number): Promise<Record<string, TokenPrice>> {
    if (!shouldUseHybridData(chainId)) {
      return {}; // Use regular API
    }
    
    console.log('🌐 Using hybrid data for token prices:', tokenAddresses);
    return await getHybridTokenPrices(tokenAddresses);
  }
}