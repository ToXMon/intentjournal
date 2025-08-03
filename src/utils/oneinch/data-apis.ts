/**
 * 1inch Data APIs Integration - REAL API VERSION
 * Comprehensive data fetching for Balances, Prices, Metadata, and Transaction History
 * Now with real API integration!
 */

import { CacheManager } from './cache';
import { realOneInchApi, COMMON_TOKEN_ADDRESSES } from './real-api-service';

export interface TokenPrice {
  address: string;
  symbol: string;
  price: string;
  priceUSD: string;
  change24h?: string;
  volume24h?: string;
  marketCap?: string;
  lastUpdated: number;
}

export interface TokenMetadata {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
  description?: string;
  website?: string;
  twitter?: string;
  coingeckoId?: string;
  isFoT?: boolean; // Fee on Transfer
  synth?: boolean;
}

export interface TransactionItem {
  txHash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  status: 'success' | 'failed';
  tokenIn?: {
    address: string;
    symbol: string;
    amount: string;
  };
  tokenOut?: {
    address: string;
    symbol: string;
    amount: string;
  };
  protocol?: string;
  type: 'swap' | 'transfer' | 'approval' | 'other';
}

export interface TransactionHistory {
  transactions: TransactionItem[];
  totalCount: number;
  hasMore: boolean;
}

export interface WalletData {
  balances: Record<string, string>;
  prices: Record<string, TokenPrice>;
  metadata: Record<string, TokenMetadata>;
  history: TransactionHistory | null;
}

export interface PriceChartData {
  timestamp: number;
  price: number;
  volume?: number;
}

export class OneInchDataAPI {
  private baseUrl = '/api/1inch';

  constructor() {
    console.log('🚀 OneInchDataAPI initialized with REAL API integration');
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('1inch Data API request failed:', error);
      throw error;
    }
  }

  /**
   * Get token prices for multiple tokens - Now with REAL API integration!
   */
  async getTokenPrices(
    chainId: number,
    tokenAddresses?: string[],
    currency: string = 'USD'
  ): Promise<Record<string, TokenPrice>> {
    const cacheKey = `prices_${chainId}_${tokenAddresses?.join(',') || 'all'}_${currency}`;
    const cached = CacheManager.get<Record<string, TokenPrice>>(cacheKey);
    if (cached) {
      console.log('📊 Using cached token prices for chain:', chainId);
      return cached;
    }

    try {
      console.log('🚀 Attempting REAL 1inch API for token prices on chain:', chainId);
      
      // Try real API first
      try {
        const realPrices = await realOneInchApi.getTokenPrices(chainId, tokenAddresses);
        
        // Enhance with token metadata if we have it
        const enhancedPrices: Record<string, TokenPrice> = {};
        for (const [address, price] of Object.entries(realPrices)) {
          enhancedPrices[address] = {
            ...price,
            symbol: this.getTokenSymbol(address, chainId) || price.symbol,
          };
        }
        
        console.log(`✅ REAL API SUCCESS: Retrieved ${Object.keys(enhancedPrices).length} token prices`);
        
        // Cache for 1 minute
        CacheManager.set(cacheKey, enhancedPrices, 60 * 1000);
        return enhancedPrices;
      } catch (realApiError) {
        console.warn('⚠️ Real API failed, falling back to proxy:', realApiError);
        
        // Fallback to proxy/mock
        const params = new URLSearchParams();
        if (tokenAddresses && tokenAddresses.length > 0) {
          params.append('tokens', tokenAddresses.join(','));
        }
        params.append('currency', currency);
        
        const url = `/prices/${chainId}?${params.toString()}`;
        const data = await this.makeRequest(url);

        // Transform the response into our format
        const prices: Record<string, TokenPrice> = {};
        
        Object.entries(data.prices || data || {}).forEach(([address, priceValue]: [string, any]) => {
          // Handle both string prices (real API) and object prices (mock data)
          let processedPrice: TokenPrice;
          
          if (typeof priceValue === 'string' || typeof priceValue === 'number') {
            // Real 1inch API returns just price values as strings/numbers
            const priceStr = priceValue.toString();
            processedPrice = {
              address: address.toLowerCase(),
              symbol: this.getTokenSymbol(address, chainId) || 'UNKNOWN',
              price: priceStr,
              priceUSD: priceStr,
              change24h: undefined,
              volume24h: undefined,
              marketCap: undefined,
              lastUpdated: Date.now(),
            };
          } else {
            // Mock data format with full objects
            processedPrice = {
              address: address.toLowerCase(),
              symbol: priceValue.symbol || this.getTokenSymbol(address, chainId) || 'UNKNOWN',
              price: priceValue.price || '0',
              priceUSD: priceValue.priceUSD || priceValue.price || '0',
              change24h: priceValue.change24h,
              volume24h: priceValue.volume24h,
              marketCap: priceValue.marketCap,
              lastUpdated: Date.now(),
            };
          }
          
          prices[address.toLowerCase()] = processedPrice;
        });

        // Cache for 1 minute
        CacheManager.set(cacheKey, prices, 60 * 1000);
        
        console.log(`✅ Retrieved ${Object.keys(prices).length} token prices via fallback`);
        return prices;
      }
    } catch (error) {
      console.error('Failed to fetch token prices:', error);
      return {};
    }
  }

  /**
   * Get token metadata - Now with REAL API integration!
   */
  async getTokenMetadata(
    chainId: number,
    tokenAddresses?: string[]
  ): Promise<Record<string, TokenMetadata>> {
    const cacheKey = `metadata_${chainId}_${tokenAddresses?.join(',') || 'all'}`;
    const cached = CacheManager.get<Record<string, TokenMetadata>>(cacheKey);
    if (cached) {
      console.log('📊 Using cached token metadata for chain:', chainId);
      return cached;
    }

    try {
      console.log('🚀 Attempting REAL 1inch API for token metadata on chain:', chainId);
      
      // Try real API first
      try {
        const realMetadata = await realOneInchApi.getTokenList(chainId);
        
        // Filter by requested addresses if provided
        let filteredMetadata = realMetadata;
        if (tokenAddresses && tokenAddresses.length > 0) {
          filteredMetadata = {};
          for (const address of tokenAddresses) {
            const lowerAddress = address.toLowerCase();
            if (realMetadata[lowerAddress]) {
              filteredMetadata[lowerAddress] = realMetadata[lowerAddress];
            }
          }
        }
        
        console.log(`✅ REAL API SUCCESS: Retrieved ${Object.keys(filteredMetadata).length} token metadata`);
        
        // Cache for 5 minutes
        CacheManager.set(cacheKey, filteredMetadata, 5 * 60 * 1000);
        return filteredMetadata;
      } catch (realApiError) {
        console.warn('⚠️ Real API failed, falling back to proxy:', realApiError);
        
        // Fallback to proxy/mock
        const params = new URLSearchParams();
        if (tokenAddresses && tokenAddresses.length > 0) {
          params.append('addresses', tokenAddresses.join(','));
        }
        
        const url = `/tokens/${chainId}?${params.toString()}`;
        const data = await this.makeRequest(url);

        // Transform the response into our format
        const metadata: Record<string, TokenMetadata> = {};
        
        Object.entries(data.tokens || data || {}).forEach(([address, tokenData]: [string, any]) => {
          metadata[address.toLowerCase()] = {
            address: address.toLowerCase(),
            symbol: tokenData.symbol,
            name: tokenData.name,
            decimals: tokenData.decimals,
            logoURI: tokenData.logoURI,
            tags: tokenData.tags,
            description: tokenData.description,
            website: tokenData.website,
            twitter: tokenData.twitter,
            coingeckoId: tokenData.coingeckoId,
            isFoT: tokenData.isFoT,
            synth: tokenData.synth,
          };
        });

        // Cache for 5 minutes
        CacheManager.set(cacheKey, metadata, 5 * 60 * 1000);
        
        console.log(`✅ Retrieved ${Object.keys(metadata).length} token metadata via fallback`);
        return metadata;
      }
    } catch (error) {
      console.error('Failed to fetch token metadata:', error);
      return {};
    }
  }

  /**
   * Get wallet balances - Now with REAL API integration!
   */
  async getWalletBalances(
    chainId: number,
    walletAddress: string
  ): Promise<Record<string, string>> {
    try {
      console.log('🚀 Attempting REAL 1inch API for wallet balances:', walletAddress);
      
      // Try real API first
      try {
        const realBalances = await realOneInchApi.getTokenBalances(chainId, walletAddress);
        
        console.log(`✅ REAL API SUCCESS: Retrieved balances for ${Object.keys(realBalances).length} tokens`);
        return realBalances;
      } catch (realApiError) {
        console.warn('⚠️ Real API failed, falling back to proxy:', realApiError);
        
        // Fallback to proxy
        const url = `/balance/${chainId}/${walletAddress}`;
        const data = await this.makeRequest(url);
        
        console.log(`✅ Retrieved balances via fallback`);
        return data || {};
      }
    } catch (error) {
      console.error('Failed to fetch wallet balances:', error);
      return {};
    }
  }

  /**
   * Get swap quote - Now with REAL API integration!
   */
  async getSwapQuote(params: {
    chainId: number;
    src: string;
    dst: string;
    amount: string;
    from: string;
    slippage?: number;
  }): Promise<any> {
    try {
      console.log('🚀 Attempting REAL 1inch API for swap quote');
      
      // Try real API first
      try {
        const realQuote = await realOneInchApi.getSwapQuote(params);
        
        console.log(`✅ REAL API SUCCESS: Retrieved swap quote`);
        return realQuote;
      } catch (realApiError) {
        console.warn('⚠️ Real API failed, falling back to proxy:', realApiError);
        
        // Fallback to proxy
        const queryParams = new URLSearchParams({
          src: params.src,
          dst: params.dst,
          amount: params.amount,
          from: params.from,
          slippage: (params.slippage || 1).toString(),
        });
        
        const url = `/swap/${params.chainId}/quote?${queryParams.toString()}`;
        const data = await this.makeRequest(url);
        
        console.log(`✅ Retrieved swap quote via fallback`);
        return data;
      }
    } catch (error) {
      console.error('Failed to get swap quote:', error);
      throw error;
    }
  }

  /**
   * Helper method to get token symbol from known addresses
   */
  private getTokenSymbol(address: string, chainId: number): string | undefined {
    const lowerAddress = address.toLowerCase();
    const chainTokens = COMMON_TOKEN_ADDRESSES[chainId as keyof typeof COMMON_TOKEN_ADDRESSES];
    
    if (!chainTokens) return undefined;
    
    // Find symbol by address
    for (const [symbol, tokenAddress] of Object.entries(chainTokens)) {
      if (tokenAddress.toLowerCase() === lowerAddress) {
        return symbol;
      }
    }
    
    return undefined;
  }

  /**
   * Get transaction history for a wallet address
   */
  async getTransactionHistory(
    address: string,
    chainId: number,
    options: {
      limit?: number;
      offset?: number;
      timeframe?: string;
    } = {}
  ): Promise<TransactionHistory | null> {
    const { limit = 50, offset = 0, timeframe = '7d' } = options;
    const cacheKey = `history_${chainId}_${address}_${limit}_${offset}_${timeframe}`;
    const cached = CacheManager.get<TransactionHistory>(cacheKey);
    if (cached) {
      console.log('📊 Using cached transaction history for:', address);
      return cached;
    }

    try {
      console.log('📊 Fetching transaction history for:', address);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      params.append('timeframe', timeframe);
      
      const url = `/history/${chainId}/${address}?${params.toString()}`;
      const data = await this.makeRequest(url);

      // Transform the response into our format
      const transactions: TransactionItem[] = (data.transactions || []).map((tx: any) => ({
        txHash: tx.txHash || tx.hash,
        blockNumber: tx.blockNumber,
        timestamp: tx.timestamp,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        status: tx.status === 'success' ? 'success' : 'failed',
        tokenIn: tx.tokenIn,
        tokenOut: tx.tokenOut,
        protocol: tx.protocol || '1inch',
        type: this.determineTransactionType(tx),
      }));

      const history: TransactionHistory = {
        transactions,
        totalCount: data.totalCount || transactions.length,
        hasMore: data.hasMore || transactions.length === limit,
      };

      // Cache for 2 minutes
      CacheManager.set(cacheKey, history, 2 * 60 * 1000);
      
      console.log(`✅ Retrieved ${transactions.length} transactions`);
      return history;
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      return null;
    }
  }

  /**
   * Get comprehensive wallet data (balances, prices, metadata, history)
   */
  async getWalletData(
    address: string,
    chainId: number
  ): Promise<WalletData> {
    try {
      console.log('🚀 Fetching comprehensive wallet data for:', address);
      
      // Fetch all data in parallel
      const [balancesResult, pricesResult, metadataResult, historyResult] = await Promise.allSettled([
        this.getWalletBalances(chainId, address),
        this.getTokenPrices(chainId),
        this.getTokenMetadata(chainId),
        this.getTransactionHistory(address, chainId, { limit: 10 })
      ]);

      const balances = balancesResult.status === 'fulfilled' ? balancesResult.value : {};
      const prices = pricesResult.status === 'fulfilled' ? pricesResult.value : {};
      const metadata = metadataResult.status === 'fulfilled' ? metadataResult.value : {};
      const history = historyResult.status === 'fulfilled' ? historyResult.value : null;

      console.log('✅ Successfully fetched comprehensive wallet data');
      
      return {
        balances,
        prices,
        metadata,
        history,
      };
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
      return {
        balances: {},
        prices: {},
        metadata: {},
        history: null,
      };
    }
  }

  /**
   * Generate mock price chart data for testing
   */
  generateMockPriceChart(
    basePrice: number,
    days: number = 7
  ): PriceChartData[] {
    const data: PriceChartData[] = [];
    const now = Date.now();
    const interval = (days * 24 * 60 * 60 * 1000) / 100; // 100 data points

    for (let i = 0; i < 100; i++) {
      const timestamp = now - (days * 24 * 60 * 60 * 1000) + (i * interval);
      const volatility = 0.1; // 10% volatility
      const change = (Math.random() - 0.5) * volatility;
      const price = basePrice * (1 + change);
      
      data.push({
        timestamp,
        price,
        volume: Math.random() * 1000000, // Random volume
      });
    }

    return data;
  }

  /**
   * Helper method to determine transaction type
   */
  private determineTransactionType(tx: any): 'swap' | 'transfer' | 'approval' | 'other' {
    if (tx.tokenIn && tx.tokenOut) return 'swap';
    if (tx.method === 'approve') return 'approval';
    if (tx.value && tx.value !== '0') return 'transfer';
    return 'other';
  }

  /**
   * Check if real API is available
   */
  async checkApiHealth(chainId: number): Promise<boolean> {
    try {
      return await realOneInchApi.checkApiHealth(chainId);
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const oneInchDataAPI = new OneInchDataAPI();
