/**
 * 1inch API Client for IntentJournal+
 * Handles token prices, quotes, and swap data with proper error handling and caching
 */

import { CacheManager } from './cache';
import { 
  shouldUseMockData, 
  MOCK_TOKEN_PRICES, 
  MOCK_SUPPORTED_TOKENS,
  MOCK_HEALTH_RESPONSE,
  generateMockSwapQuote,
  generateMockTokenPrices,
  simulateNetworkDelay
} from './mock-data';
import { HybridDataProvider, shouldUseHybridData } from './hybrid-data';

// Use proxy for browser requests to avoid CORS issues
const USE_PROXY = typeof window !== 'undefined';

// 1inch API base URLs for different networks
const API_BASE_URLS = {
  1: USE_PROXY ? '/api/1inch/swap/v6.0/1' : 'https://api.1inch.dev/swap/v6.0/1', // Ethereum
  137: USE_PROXY ? '/api/1inch/swap/v6.0/137' : 'https://api.1inch.dev/swap/v6.0/137', // Polygon
  8453: USE_PROXY ? '/api/1inch/swap/v6.0/8453' : 'https://api.1inch.dev/swap/v6.0/8453', // Base
  42161: USE_PROXY ? '/api/1inch/swap/v6.0/42161' : 'https://api.1inch.dev/swap/v6.0/42161', // Arbitrum
  27257: USE_PROXY ? '/api/1inch/swap/v6.0/8453' : 'https://api.1inch.dev/swap/v6.0/8453', // BuildBear fork uses Base API
} as const;

// Price API base URLs
const PRICE_API_BASE_URLS = {
  1: USE_PROXY ? '/api/1inch/price/v1.1/1' : 'https://api.1inch.dev/price/v1.1/1',
  137: USE_PROXY ? '/api/1inch/price/v1.1/137' : 'https://api.1inch.dev/price/v1.1/137',
  8453: USE_PROXY ? '/api/1inch/price/v1.1/8453' : 'https://api.1inch.dev/price/v1.1/8453',
  42161: USE_PROXY ? '/api/1inch/price/v1.1/42161' : 'https://api.1inch.dev/price/v1.1/42161',
  27257: USE_PROXY ? '/api/1inch/price/v1.1/8453' : 'https://api.1inch.dev/price/v1.1/8453', // BuildBear fork uses Base API
} as const;

export interface TokenPrice {
  address: string;
  symbol: string;
  price: string;
  priceUSD: string;
  change24h?: string;
  lastUpdated: number;
}

export interface SwapQuoteParams {
  src: string; // Source token address
  dst: string; // Destination token address
  amount: string; // Amount in wei
  from: string; // Wallet address
  slippage?: number; // Slippage tolerance (1-50)
  disableEstimate?: boolean;
  allowPartialFill?: boolean;
}

export interface SwapQuote {
  dstAmount: string;
  srcAmount: string;
  protocols: any[];
  estimatedGas: string;
  tx?: {
    from: string;
    to: string;
    data: string;
    value: string;
    gasPrice: string;
    gas: string;
  };
}

export interface SwapRoute {
  name: string;
  part: number;
  fromTokenAddress: string;
  toTokenAddress: string;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export class OneInchAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'OneInchAPIError';
  }
}

export class OneInchAPI {
  private apiKey: string;
  private rateLimitDelay = 1000; // 1 second between requests
  private lastRequestTime = 0;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ONEINCH_AUTH_KEY || '';
    if (!this.apiKey) {
      console.warn('1inch API key not provided. Some features may be limited.');
    }
  }

  private async makeRequest(url: string, options: RequestInit = {}): Promise<any> {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      // Don't send auth header when using proxy (it's handled server-side)
      ...(!USE_PROXY && this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new OneInchAPIError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof OneInchAPIError) {
        throw error;
      }
      throw new OneInchAPIError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get current token price in USD
   */
  async getTokenPrice(tokenAddress: string, chainId: number): Promise<TokenPrice | null> {
    const cacheKey = `price_${chainId}_${tokenAddress.toLowerCase()}`;
    const cached = CacheManager.get<TokenPrice>(cacheKey);
    if (cached) {
      return cached;
    }

    // Use hybrid data for BuildBear fork (real prices + custom tokens)
    if (shouldUseHybridData(chainId)) {
      console.log('🌐 Using hybrid data for token price:', tokenAddress);
      await simulateNetworkDelay(200);
      
      const hybridPrice = await HybridDataProvider.getTokenPrice(tokenAddress, chainId);
      if (hybridPrice) {
        // Cache for 30 seconds
        CacheManager.set(cacheKey, hybridPrice, 30 * 1000);
        return hybridPrice;
      }
    }

    // Fallback to mock data for development
    if (shouldUseMockData(chainId)) {
      console.log('🔧 Using fallback mock data for token price:', tokenAddress);
      await simulateNetworkDelay(200);
      
      const mockPrice = MOCK_TOKEN_PRICES[tokenAddress.toLowerCase()];
      if (mockPrice) {
        // Cache for 30 seconds
        CacheManager.set(cacheKey, mockPrice, 30 * 1000);
        return mockPrice;
      }
      
      console.warn('Mock price not found for token:', tokenAddress);
      return null;
    }

    try {
      const baseUrl = PRICE_API_BASE_URLS[chainId as keyof typeof PRICE_API_BASE_URLS];
      if (!baseUrl) {
        throw new OneInchAPIError(`Unsupported chain ID: ${chainId}`);
      }

      const url = `${baseUrl}/${tokenAddress}`;
      const data = await this.makeRequest(url);

      const tokenPrice: TokenPrice = {
        address: tokenAddress.toLowerCase(),
        symbol: data.symbol || 'UNKNOWN',
        price: data.price || '0',
        priceUSD: data.price || '0',
        change24h: data.change24h,
        lastUpdated: Date.now(),
      };

      // Cache for 30 seconds
      CacheManager.set(cacheKey, tokenPrice, 30 * 1000);
      return tokenPrice;
    } catch (error) {
      console.error('Failed to fetch token price:', error);
      return null;
    }
  }

  /**
   * Get multiple token prices in a single request
   */
  async getTokenPrices(tokenAddresses: string[], chainId: number): Promise<Record<string, TokenPrice>> {
    const cacheKey = `prices_${chainId}_${tokenAddresses.sort().join(',')}`;
    const cached = CacheManager.get<Record<string, TokenPrice>>(cacheKey);
    if (cached) {
      return cached;
    }

    // Use hybrid data for BuildBear fork (real prices + custom tokens)
    if (shouldUseHybridData(chainId)) {
      console.log('🌐 Using hybrid data for token prices:', tokenAddresses);
      await simulateNetworkDelay(300);
      
      const prices = await HybridDataProvider.getTokenPrices(tokenAddresses, chainId);
      
      // Cache for 30 seconds
      CacheManager.set(cacheKey, prices, 30 * 1000);
      return prices;
    }

    // Fallback to mock data for development
    if (shouldUseMockData(chainId)) {
      console.log('🔧 Using fallback mock data for token prices:', tokenAddresses);
      await simulateNetworkDelay(300);
      
      const prices = generateMockTokenPrices(tokenAddresses);
      
      // Cache for 30 seconds
      CacheManager.set(cacheKey, prices, 30 * 1000);
      return prices;
    }

    try {
      const baseUrl = PRICE_API_BASE_URLS[chainId as keyof typeof PRICE_API_BASE_URLS];
      if (!baseUrl) {
        throw new OneInchAPIError(`Unsupported chain ID: ${chainId}`);
      }

      const addresses = tokenAddresses.join(',');
      const url = `${baseUrl}?tokens=${addresses}`;
      const data = await this.makeRequest(url);

      const prices: Record<string, TokenPrice> = {};
      for (const [address, priceData] of Object.entries(data)) {
        const price = priceData as any;
        prices[address.toLowerCase()] = {
          address: address.toLowerCase(),
          symbol: price.symbol || 'UNKNOWN',
          price: price.price || '0',
          priceUSD: price.price || '0',
          change24h: price.change24h,
          lastUpdated: Date.now(),
        };
      }

      // Cache for 30 seconds
      CacheManager.set(cacheKey, prices, 30 * 1000);
      return prices;
    } catch (error) {
      console.error('Failed to fetch token prices:', error);
      return {};
    }
  }

  /**
   * Get swap quote without executing the transaction
   */
  async getSwapQuote(params: SwapQuoteParams, chainId: number): Promise<SwapQuote | null> {
    const cacheKey = `quote_${chainId}_${params.src}_${params.dst}_${params.amount}`;
    const cached = CacheManager.get<SwapQuote>(cacheKey);
    if (cached) {
      return cached;
    }

    // Use mock data for BuildBear fork or development
    if (shouldUseMockData(chainId)) {
      console.log('🔧 Using mock data for swap quote:', params);
      await simulateNetworkDelay(400);
      
      const quote = generateMockSwapQuote(params.src, params.dst, params.amount);
      
      // Cache for 10 seconds
      CacheManager.set(cacheKey, quote, 10 * 1000);
      return quote;
    }

    try {
      const baseUrl = API_BASE_URLS[chainId as keyof typeof API_BASE_URLS];
      if (!baseUrl) {
        throw new OneInchAPIError(`Unsupported chain ID: ${chainId}`);
      }

      const queryParams = new URLSearchParams({
        src: params.src,
        dst: params.dst,
        amount: params.amount,
        from: params.from,
        slippage: (params.slippage || 1).toString(),
        disableEstimate: (params.disableEstimate || false).toString(),
        allowPartialFill: (params.allowPartialFill || false).toString(),
      });

      const url = `${baseUrl}/quote?${queryParams}`;
      const data = await this.makeRequest(url);

      const quote: SwapQuote = {
        dstAmount: data.dstAmount,
        srcAmount: data.srcAmount,
        protocols: data.protocols || [],
        estimatedGas: data.estimatedGas || '0',
      };

      // Cache for 10 seconds
      CacheManager.set(cacheKey, quote, 10 * 1000);
      return quote;
    } catch (error) {
      console.error('Failed to fetch swap quote:', error);
      return null;
    }
  }

  /**
   * Get swap transaction data for execution
   */
  async getSwapData(params: SwapQuoteParams, chainId: number): Promise<SwapQuote | null> {
    try {
      const baseUrl = API_BASE_URLS[chainId as keyof typeof API_BASE_URLS];
      if (!baseUrl) {
        throw new OneInchAPIError(`Unsupported chain ID: ${chainId}`);
      }

      const queryParams = new URLSearchParams({
        src: params.src,
        dst: params.dst,
        amount: params.amount,
        from: params.from,
        slippage: (params.slippage || 1).toString(),
        disableEstimate: (params.disableEstimate || false).toString(),
        allowPartialFill: (params.allowPartialFill || false).toString(),
      });

      const url = `${baseUrl}/swap?${queryParams}`;
      const data = await this.makeRequest(url);

      return {
        dstAmount: data.dstAmount,
        srcAmount: data.srcAmount,
        protocols: data.protocols || [],
        estimatedGas: data.estimatedGas || '0',
        tx: data.tx,
      };
    } catch (error) {
      console.error('Failed to fetch swap data:', error);
      return null;
    }
  }

  /**
   * Get supported tokens for a specific chain
   */
  async getSupportedTokens(chainId: number): Promise<Record<string, TokenInfo>> {
    const cacheKey = `tokens_${chainId}`;
    const cached = CacheManager.get<Record<string, TokenInfo>>(cacheKey);
    if (cached) {
      return cached;
    }

    // Use mock data for BuildBear fork or development
    if (shouldUseMockData(chainId)) {
      console.log('🔧 Using mock data for supported tokens');
      await simulateNetworkDelay(300);
      
      // Cache for 1 hour
      CacheManager.set(cacheKey, MOCK_SUPPORTED_TOKENS, 60 * 60 * 1000);
      return MOCK_SUPPORTED_TOKENS;
    }

    try {
      const baseUrl = API_BASE_URLS[chainId as keyof typeof API_BASE_URLS];
      if (!baseUrl) {
        throw new OneInchAPIError(`Unsupported chain ID: ${chainId}`);
      }

      const url = `${baseUrl}/tokens`;
      const data = await this.makeRequest(url);

      const tokens: Record<string, TokenInfo> = {};
      for (const [address, tokenData] of Object.entries(data.tokens || {})) {
        const token = tokenData as any;
        tokens[address.toLowerCase()] = {
          address: address.toLowerCase(),
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          logoURI: token.logoURI,
        };
      }

      // Cache for 1 hour
      CacheManager.set(cacheKey, tokens, 60 * 60 * 1000);
      return tokens;
    } catch (error) {
      console.error('Failed to fetch supported tokens:', error);
      return {};
    }
  }

  /**
   * Check if API is healthy
   */
  async healthCheck(chainId: number): Promise<boolean> {
    // Use mock data for BuildBear fork or development
    if (shouldUseMockData(chainId)) {
      console.log('🔧 Using mock data for health check - returning healthy');
      await simulateNetworkDelay(100);
      return true;
    }

    try {
      const baseUrl = API_BASE_URLS[chainId as keyof typeof API_BASE_URLS];
      if (!baseUrl) {
        return false;
      }

      const url = `${baseUrl}/healthcheck`;
      await this.makeRequest(url);
      return true;
    } catch (error) {
      console.error('1inch API health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const oneInchAPI = new OneInchAPI();