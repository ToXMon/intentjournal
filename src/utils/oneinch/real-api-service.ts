/**
 * Real 1inch API Service
 * Handles actual API calls to 1inch protocols with proper error handling and fallbacks
 */

import { TokenPrice, TokenMetadata, TransactionItem } from './data-apis';

export interface RealOneInchService {
  getTokenPrices(chainId: number, tokenAddresses?: string[]): Promise<Record<string, TokenPrice>>;
  getTokenBalances(chainId: number, walletAddress: string): Promise<Record<string, string>>;
  getSwapQuote(params: SwapQuoteParams): Promise<SwapQuote>;
  getTokenList(chainId: number): Promise<Record<string, TokenMetadata>>;
  checkApiHealth(chainId: number): Promise<boolean>;
}

export interface SwapQuoteParams {
  chainId: number;
  src: string;
  dst: string;
  amount: string;
  from: string;
  slippage?: number;
  disableEstimate?: boolean;
  allowPartialFill?: boolean;
}

export interface SwapQuote {
  dstAmount: string;
  srcAmount: string;
  protocols: any[];
  gas: string;
  gasPrice: string;
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

class RealOneInchApiService implements RealOneInchService {
  private readonly baseUrl = typeof window !== 'undefined' ? '/api/1inch' : 'https://api.1inch.dev';
  private readonly apiKey: string | null;
  private readonly useProxy: boolean;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_ONEINCH_API_KEY || 
                  process.env.ONEINCH_AUTH_KEY || 
                  process.env.ONEINCH_DEV_PORTAL_KEY || 
                  null;
    
    // Use proxy in browser to avoid CORS, direct API on server
    this.useProxy = typeof window !== 'undefined';
    
    console.log('🔑 Real 1inch API Service initialized, API key available:', !!this.apiKey);
    console.log('🌐 Using proxy for CORS:', this.useProxy);
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}/${endpoint}`;
    
    console.log(`🌐 Making real 1inch API request: ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 1inch API error (${response.status}):`, errorText);
      throw new Error(`1inch API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Real 1inch API response received');
    return data;
  }

  async checkApiHealth(chainId: number): Promise<boolean> {
    try {
      await this.makeRequest(`swap/v6.0/${chainId}/healthcheck`);
      return true;
    } catch (error) {
      console.error('❌ 1inch API health check failed:', error);
      return false;
    }
  }

  async getTokenPrices(chainId: number, tokenAddresses?: string[]): Promise<Record<string, TokenPrice>> {
    try {
      let endpoint = `price/v1.1/${chainId}`;
      
      if (tokenAddresses && tokenAddresses.length > 0) {
        const tokens = tokenAddresses.join(',');
        endpoint += `?tokens=${encodeURIComponent(tokens)}`;
      }

      const data = await this.makeRequest(endpoint);
      
      // Transform response to our format
      const prices: Record<string, TokenPrice> = {};
      
      Object.entries(data || {}).forEach(([address, priceValue]: [string, any]) => {
        const priceStr = typeof priceValue === 'object' ? priceValue.price : priceValue.toString();
        
        prices[address.toLowerCase()] = {
          address: address.toLowerCase(),
          symbol: 'UNKNOWN', // Price API doesn't include symbol
          price: priceStr,
          priceUSD: priceStr,
          lastUpdated: Date.now(),
        };
      });

      console.log(`✅ Retrieved ${Object.keys(prices).length} token prices for chain ${chainId}`);
      return prices;
    } catch (error) {
      console.error('❌ Failed to get token prices:', error);
      throw error;
    }
  }

  async getTokenBalances(chainId: number, walletAddress: string): Promise<Record<string, string>> {
    try {
      const endpoint = `balance/v1.2/${chainId}/balances/${walletAddress}`;
      const data = await this.makeRequest(endpoint);
      
      console.log(`✅ Retrieved balances for ${walletAddress} on chain ${chainId}`);
      return data || {};
    } catch (error) {
      console.error('❌ Failed to get token balances:', error);
      throw error;
    }
  }

  async getSwapQuote(params: SwapQuoteParams): Promise<SwapQuote> {
    try {
      const queryParams = new URLSearchParams({
        src: params.src,
        dst: params.dst,
        amount: params.amount,
        from: params.from,
        slippage: (params.slippage || 1).toString(),
        disableEstimate: (params.disableEstimate || false).toString(),
        allowPartialFill: (params.allowPartialFill || false).toString(),
      });

      const endpoint = `swap/v6.0/${params.chainId}/quote?${queryParams.toString()}`;
      const data = await this.makeRequest(endpoint);
      
      console.log(`✅ Retrieved swap quote: ${params.amount} ${params.src} → ${data.dstAmount} ${params.dst}`);
      return data;
    } catch (error) {
      console.error('❌ Failed to get swap quote:', error);
      throw error;
    }
  }

  async getTokenList(chainId: number): Promise<Record<string, TokenMetadata>> {
    try {
      const endpoint = `swap/v6.0/${chainId}/tokens`;
      const data = await this.makeRequest(endpoint);
      
      // Transform response to our format
      const tokens: Record<string, TokenMetadata> = {};
      
      Object.entries(data.tokens || {}).forEach(([address, tokenData]: [string, any]) => {
        tokens[address.toLowerCase()] = {
          address: address.toLowerCase(),
          symbol: tokenData.symbol,
          name: tokenData.name,
          decimals: tokenData.decimals,
          logoURI: tokenData.logoURI,
          tags: tokenData.tags,
        };
      });

      console.log(`✅ Retrieved ${Object.keys(tokens).length} tokens for chain ${chainId}`);
      return tokens;
    } catch (error) {
      console.error('❌ Failed to get token list:', error);
      throw error;
    }
  }

  // Get swap transaction data (for actual execution)
  async getSwapTransaction(params: SwapQuoteParams): Promise<SwapQuote> {
    try {
      const queryParams = new URLSearchParams({
        src: params.src,
        dst: params.dst,
        amount: params.amount,
        from: params.from,
        slippage: (params.slippage || 1).toString(),
        disableEstimate: (params.disableEstimate || true).toString(), // Disable estimate for tx data
      });

      const endpoint = `swap/v6.0/${params.chainId}/swap?${queryParams.toString()}`;
      const data = await this.makeRequest(endpoint);
      
      console.log(`✅ Retrieved swap transaction data for execution`);
      return data;
    } catch (error) {
      console.error('❌ Failed to get swap transaction:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const realOneInchApi = new RealOneInchApiService();

// Export common token addresses for easy testing
export const COMMON_TOKEN_ADDRESSES = {
  // Ethereum Mainnet (Chain ID: 1)
  1: {
    ETH: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    USDC: '0xa0b86a33e6441e8c3c7e0c3b3e2e0c3b3e2e0c3b',
    USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  },
  // Base Mainnet (Chain ID: 8453)
  8453: {
    ETH: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    USDC: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    WETH: '0x4200000000000000000000000000000000000006',
  },
  // BuildBear Fork (Chain ID: 27257) - Uses Base addresses
  27257: {
    ETH: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    USDC: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    WETH: '0x4200000000000000000000000000000000000006',
  },
};
