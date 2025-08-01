/**
 * 1inch Balance API integration for both Para and Web3 wallets
 * Provides unified balance checking across wallet types
 */

import { oneInchAPI } from './client';
import { CacheManager } from './cache';

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceUSD: string;
  price?: string;
  logoURI?: string;
}

export interface WalletBalances {
  address: string;
  chainId: number;
  totalBalanceUSD: string;
  tokens: TokenBalance[];
  lastUpdated: number;
}

export class BalanceAPI {
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
      console.error('Balance API request failed:', error);
      throw error;
    }
  }

  /**
   * Get wallet balances for any wallet address (Para or Web3)
   */
  async getWalletBalances(
    address: string, 
    chainId: number,
    walletType: 'para' | 'wagmi' = 'wagmi'
  ): Promise<WalletBalances | null> {
    const cacheKey = `balances_${chainId}_${address.toLowerCase()}`;
    const cached = CacheManager.get<WalletBalances>(cacheKey);
    if (cached) {
      console.log(`📊 Using cached balances for ${walletType} wallet:`, address);
      return cached;
    }

    try {
      console.log(`📊 Fetching balances for ${walletType} wallet:`, address, 'on chain:', chainId);
      
      // Use proxy endpoint for balance API
      const url = `/api/1inch/balance/${chainId}/${address}`;
      const data = await this.makeRequest(url);

      // Parse the balance response
      const balances: WalletBalances = {
        address: address.toLowerCase(),
        chainId,
        totalBalanceUSD: data.totalBalanceUSD || '0',
        tokens: Object.entries(data.tokens || {}).map(([tokenAddress, tokenData]: [string, any]) => ({
          address: tokenAddress.toLowerCase(),
          symbol: tokenData.symbol || 'UNKNOWN',
          name: tokenData.name || 'Unknown Token',
          decimals: tokenData.decimals || 18,
          balance: tokenData.balance || '0',
          balanceUSD: tokenData.balanceUSD || '0',
          price: tokenData.price,
          logoURI: tokenData.logoURI,
        })),
        lastUpdated: Date.now(),
      };

      // Cache for 30 seconds
      CacheManager.set(cacheKey, balances, 30 * 1000);
      
      console.log(`✅ Successfully fetched ${balances.tokens.length} token balances for ${walletType} wallet`);
      return balances;
    } catch (error) {
      console.error(`Failed to fetch balances for ${walletType} wallet:`, error);
      return null;
    }
  }

  /**
   * Get balance for a specific token
   */
  async getTokenBalance(
    address: string,
    tokenAddress: string,
    chainId: number,
    walletType: 'para' | 'wagmi' = 'wagmi'
  ): Promise<TokenBalance | null> {
    try {
      const balances = await this.getWalletBalances(address, chainId, walletType);
      if (!balances) return null;

      const tokenBalance = balances.tokens.find(
        token => token.address.toLowerCase() === tokenAddress.toLowerCase()
      );

      return tokenBalance || null;
    } catch (error) {
      console.error(`Failed to get token balance for ${walletType} wallet:`, error);
      return null;
    }
  }

  /**
   * Check if wallet has sufficient balance for a transaction
   */
  async checkSufficientBalance(
    address: string,
    tokenAddress: string,
    requiredAmount: string,
    chainId: number,
    walletType: 'para' | 'wagmi' = 'wagmi'
  ): Promise<{
    hasSufficientBalance: boolean;
    currentBalance: string;
    requiredAmount: string;
    shortfall?: string;
  }> {
    try {
      const tokenBalance = await this.getTokenBalance(address, tokenAddress, chainId, walletType);
      
      if (!tokenBalance) {
        return {
          hasSufficientBalance: false,
          currentBalance: '0',
          requiredAmount,
          shortfall: requiredAmount,
        };
      }

      const currentBalanceBN = BigInt(tokenBalance.balance);
      const requiredAmountBN = BigInt(requiredAmount);
      const hasSufficientBalance = currentBalanceBN >= requiredAmountBN;

      return {
        hasSufficientBalance,
        currentBalance: tokenBalance.balance,
        requiredAmount,
        shortfall: hasSufficientBalance ? undefined : (requiredAmountBN - currentBalanceBN).toString(),
      };
    } catch (error) {
      console.error(`Failed to check sufficient balance for ${walletType} wallet:`, error);
      return {
        hasSufficientBalance: false,
        currentBalance: '0',
        requiredAmount,
        shortfall: requiredAmount,
      };
    }
  }

  /**
   * Get native token balance (ETH, MATIC, etc.)
   */
  async getNativeTokenBalance(
    address: string,
    chainId: number,
    walletType: 'para' | 'wagmi' = 'wagmi'
  ): Promise<TokenBalance | null> {
    // Native token addresses for different chains
    const nativeTokenAddresses: Record<number, string> = {
      1: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ETH on Ethereum
      137: '0x0000000000000000000000000000000000001010', // MATIC on Polygon
      8453: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ETH on Base
      42161: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ETH on Arbitrum
      84532: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ETH on Base Sepolia
      128123: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ETH on Etherlink
      27257: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ETH on BuildBear fork
    };

    const nativeTokenAddress = nativeTokenAddresses[chainId];
    if (!nativeTokenAddress) {
      console.warn(`Native token address not configured for chain ${chainId}`);
      return null;
    }

    return this.getTokenBalance(address, nativeTokenAddress, chainId, walletType);
  }

  /**
   * Get balances for multiple wallets (useful for comparing Para vs Web3 wallet balances)
   */
  async getMultiWalletBalances(
    wallets: Array<{ address: string; type: 'para' | 'wagmi' }>,
    chainId: number
  ): Promise<Record<string, WalletBalances | null>> {
    const results: Record<string, WalletBalances | null> = {};

    // Fetch balances for all wallets in parallel
    const balancePromises = wallets.map(async (wallet) => {
      const balances = await this.getWalletBalances(wallet.address, chainId, wallet.type);
      return { address: wallet.address, balances };
    });

    const balanceResults = await Promise.all(balancePromises);
    
    balanceResults.forEach(({ address, balances }) => {
      results[address.toLowerCase()] = balances;
    });

    return results;
  }
}

// Export singleton instance
export const balanceAPI = new BalanceAPI();

// Export utility functions for easy use in components
export const getWalletBalances = (address: string, chainId: number, walletType: 'para' | 'wagmi' = 'wagmi') =>
  balanceAPI.getWalletBalances(address, chainId, walletType);

export const getTokenBalance = (address: string, tokenAddress: string, chainId: number, walletType: 'para' | 'wagmi' = 'wagmi') =>
  balanceAPI.getTokenBalance(address, tokenAddress, chainId, walletType);

export const checkSufficientBalance = (address: string, tokenAddress: string, requiredAmount: string, chainId: number, walletType: 'para' | 'wagmi' = 'wagmi') =>
  balanceAPI.checkSufficientBalance(address, tokenAddress, requiredAmount, chainId, walletType);

export const getNativeTokenBalance = (address: string, chainId: number, walletType: 'para' | 'wagmi' = 'wagmi') =>
  balanceAPI.getNativeTokenBalance(address, chainId, walletType);