/**
 * 1inch Data APIs Integration
 * Comprehensive data fetching for Balances, Prices, Metadata, and Transaction History
 */

import { CacheManager } from './cache';

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
  address: string;
  chainId: number;
  transactions: TransactionItem[];
  totalCount: number;
  hasMore: boolean;
  lastUpdated: number;
}

export interface PriceChartData {
  timestamp: number;
  price: number;
  volume?: number;
}

export class OneInchDataAPI {
  private rateLimitDelay = 1000; // 1 second between requests
  private lastRequestTime = 0;

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
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
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
   * Get token prices for multiple tokens
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
      console.log('📊 Fetching token prices for chain:', chainId);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (tokenAddresses && tokenAddresses.length > 0) {
        params.append('tokens', tokenAddresses.join(','));
      }
      params.append('currency', currency);
      
      const url = `/api/1inch/prices/${chainId}?${params.toString()}`;
      const data = await this.makeRequest(url);

      // Transform the response into our format
      const prices: Record<string, TokenPrice> = {};
      
      // Debug logging
      console.log('🔍 Raw API response data:', {
        dataKeys: Object.keys(data),
        pricesKeys: data.prices ? Object.keys(data.prices).slice(0, 5) : 'no prices',
        samplePrice: data.prices ? Object.values(data.prices)[0] : 'no sample'
      });
      
      Object.entries(data.prices || {}).forEach(([address, priceValue]: [string, any]) => {
        // Handle both string prices (real API) and object prices (mock data)
        let processedPrice: TokenPrice;
        
        if (typeof priceValue === 'string' || typeof priceValue === 'number') {
          // Real 1inch API returns just price values as strings/numbers
          const priceStr = priceValue.toString();
          processedPrice = {
            address: address.toLowerCase(),
            symbol: 'UNKNOWN', // We'll need to get this from token metadata
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
            symbol: priceValue.symbol || 'UNKNOWN',
            price: priceValue.price || '0',
            priceUSD: priceValue.priceUSD || priceValue.price || '0',
            change24h: priceValue.change24h,
            volume24h: priceValue.volume24h,
            marketCap: priceValue.marketCap,
            lastUpdated: Date.now(),
          };
        }
        
        prices[address.toLowerCase()] = processedPrice;
        
        // Debug log for ETH specifically
        if (address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
          console.log('🔍 Processing ETH price:', {
            originalAddress: address,
            lowercaseAddress: address.toLowerCase(),
            originalPriceValue: priceValue,
            processedPrice
          });
        }
      });

      // Cache for 1 minute
      CacheManager.set(cacheKey, prices, 60 * 1000);
      
      console.log(`✅ Successfully fetched ${Object.keys(prices).length} token prices`);
      return prices;
    } catch (error) {
      console.error('Failed to fetch token prices:', error);
      return {};
    }
  }

  /**
   * Get token metadata
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
      console.log('📊 Fetching token metadata for chain:', chainId);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (tokenAddresses && tokenAddresses.length > 0) {
        params.append('addresses', tokenAddresses.join(','));
      }
      
      const url = `/api/1inch/tokens/${chainId}?${params.toString()}`;
      const data = await this.makeRequest(url);

      // Transform the response into our format
      const metadata: Record<string, TokenMetadata> = {};
      
      // Ensure data.tokens is an array before calling forEach
      const tokens = Array.isArray(data.tokens) ? data.tokens : [];
      
      tokens.forEach((token: any) => {
        if (token && token.address) {
          metadata[token.address.toLowerCase()] = {
            address: token.address.toLowerCase(),
            symbol: token.symbol || 'UNKNOWN',
            name: token.name || 'Unknown Token',
            decimals: token.decimals || 18,
            logoURI: token.logoURI,
            tags: Array.isArray(token.tags) ? token.tags : [],
            description: token.description,
            website: token.website,
            twitter: token.twitter,
            coingeckoId: token.coingeckoId,
            isFoT: token.isFoT || false,
            synth: token.synth || false,
          };
        }
      });

      // Cache for 5 minutes
      CacheManager.set(cacheKey, metadata, 5 * 60 * 1000);
      
      console.log(`✅ Successfully fetched ${Object.keys(metadata).length} token metadata entries`);
      return metadata;
    } catch (error) {
      console.error('Failed to fetch token metadata:', error);
      return {};
    }
  }

  /**
   * Get transaction history for an address
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
    const cacheKey = `history_${chainId}_${address.toLowerCase()}_${limit}_${offset}_${timeframe}`;
    const cached = CacheManager.get<TransactionHistory>(cacheKey);
    if (cached) {
      console.log('📊 Using cached transaction history for:', address);
      return cached;
    }

    try {
      console.log('📊 Fetching transaction history for:', address, 'on chain:', chainId);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      params.append('timeframe', timeframe);
      
      const url = `/api/1inch/history/${chainId}/${address}?${params.toString()}`;
      const data = await this.makeRequest(url);

      // Transform the response into our format
      const history: TransactionHistory = {
        address: address.toLowerCase(),
        chainId,
        transactions: Array.isArray(data.transactions) ? data.transactions.map((tx: any) => ({
          txHash: tx.txHash || tx.hash,
          blockNumber: tx.blockNumber || 0,
          timestamp: tx.timestamp || Date.now() / 1000,
          from: tx.from?.toLowerCase() || '',
          to: tx.to?.toLowerCase() || '',
          value: tx.value || '0',
          gasUsed: tx.gasUsed || '0',
          gasPrice: tx.gasPrice || '0',
          status: tx.status === 1 || tx.status === 'success' ? 'success' : 'failed',
          tokenIn: tx.tokenIn ? {
            address: tx.tokenIn.address?.toLowerCase() || '',
            symbol: tx.tokenIn.symbol || 'UNKNOWN',
            amount: tx.tokenIn.amount || '0',
          } : undefined,
          tokenOut: tx.tokenOut ? {
            address: tx.tokenOut.address?.toLowerCase() || '',
            symbol: tx.tokenOut.symbol || 'UNKNOWN',
            amount: tx.tokenOut.amount || '0',
          } : undefined,
          protocol: tx.protocol || '1inch',
          type: this.determineTransactionType(tx),
        })) : [],
        totalCount: data.totalCount || 0,
        hasMore: data.hasMore || false,
        lastUpdated: Date.now(),
      };

      // Cache for 2 minutes
      CacheManager.set(cacheKey, history, 2 * 60 * 1000);
      
      console.log(`✅ Successfully fetched ${history.transactions.length} transactions`);
      return history;
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      return null;
    }
  }

  /**
   * Get comprehensive wallet data (balances + prices + metadata)
   */
  async getWalletData(
    address: string,
    chainId: number
  ): Promise<{
    balances: any;
    prices: Record<string, TokenPrice>;
    metadata: Record<string, TokenMetadata>;
    history: TransactionHistory | null;
  }> {
    try {
      console.log('📊 Fetching comprehensive wallet data for:', address);

      // Fetch balances first to get token addresses
      const balancesResponse = await fetch(`/api/1inch/balance/${chainId}/${address}`);
      const balances = balancesResponse.ok ? await balancesResponse.json() : null;

      // Extract token addresses from balances
      const tokenAddresses = balances?.tokens ? Object.keys(balances.tokens) : [];

      // Fetch prices, metadata, and history in parallel with individual error handling
      const [pricesResult, metadataResult, historyResult] = await Promise.allSettled([
        this.getTokenPrices(chainId, tokenAddresses),
        this.getTokenMetadata(chainId, tokenAddresses),
        this.getTransactionHistory(address, chainId, { limit: 20 }),
      ]);

      const prices: Record<string, TokenPrice> = pricesResult.status === 'fulfilled' ? pricesResult.value : {};
      const metadata: Record<string, TokenMetadata> = metadataResult.status === 'fulfilled' ? metadataResult.value : {};
      const history: TransactionHistory | null = historyResult.status === 'fulfilled' ? historyResult.value : null;

      console.log('✅ Successfully fetched comprehensive wallet data');

      return {
        balances,
        prices,
        metadata,
        history,
      };
    } catch (error) {
      console.error('Failed to fetch comprehensive wallet data:', error);
      return {
        balances: null,
        prices: {},
        metadata: {},
        history: null,
      };
    }
  }

  /**
   * Generate mock price chart data for demonstration
   */
  generateMockPriceChart(
    basePrice: number,
    days: number = 7
  ): PriceChartData[] {
    const data: PriceChartData[] = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let i = days; i >= 0; i--) {
      const timestamp = now - (i * dayMs);
      const volatility = 0.1; // 10% volatility
      const randomChange = (Math.random() - 0.5) * 2 * volatility;
      const price = basePrice * (1 + randomChange);
      const volume = Math.random() * 1000000; // Random volume

      data.push({
        timestamp,
        price: Math.max(0, price),
        volume,
      });
    }

    return data;
  }

  private determineTransactionType(tx: any): 'swap' | 'transfer' | 'approval' | 'other' {
    if (tx.tokenIn && tx.tokenOut) return 'swap';
    if (tx.method === 'approve' || tx.functionName === 'approve') return 'approval';
    if (tx.method === 'transfer' || tx.functionName === 'transfer') return 'transfer';
    return 'other';
  }
}

// Export singleton instance
export const oneInchDataAPI = new OneInchDataAPI();

// Export utility functions for easy use in components
export const getTokenPrices = (chainId: number, tokenAddresses?: string[], currency?: string) =>
  oneInchDataAPI.getTokenPrices(chainId, tokenAddresses, currency);

export const getTokenMetadata = (chainId: number, tokenAddresses?: string[]) =>
  oneInchDataAPI.getTokenMetadata(chainId, tokenAddresses);

export const getTransactionHistory = (address: string, chainId: number, options?: any) =>
  oneInchDataAPI.getTransactionHistory(address, chainId, options);

export const getWalletData = (address: string, chainId: number) =>
  oneInchDataAPI.getWalletData(address, chainId);