/**
 * BuildBear Fork Integration
 * Provides blockchain interactions using BuildBear mainnet fork
 */

import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// BuildBear fork configuration
export const BUILDBEAR_CONFIG = {
  chainId: 27257,
  name: 'BuildBear Sandbox Network',
  rpcUrl: 'https://rpc.buildbear.io/smooth-spiderman-faa2b8b9',
  explorerUrl: 'https://smooth-spiderman-faa2b8b9.ethernal.buildbear.io/',
  // Demo mnemonic from BuildBear (safe for public use)
  mnemonic: 'relief illegal amount inflict vocal middle jelly hurdle impact remove maid total',
  // Pre-funded demo accounts
  demoAccounts: [
    '0x8ba1f109551bD432803012645Hac136c5C1e5F61', // Account 0
    '0x2546BcD3c84621e976D8185a91A922aE77ECEc30', // Account 1
    '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E', // Account 2
  ]
};

// Create viem clients for BuildBear fork
export const buildBearPublicClient = createPublicClient({
  transport: http(BUILDBEAR_CONFIG.rpcUrl),
  chain: {
    id: BUILDBEAR_CONFIG.chainId,
    name: BUILDBEAR_CONFIG.name,
    network: 'buildbear',
    nativeCurrency: {
      decimals: 18,
      name: 'ETH',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: { http: [BUILDBEAR_CONFIG.rpcUrl] },
      public: { http: [BUILDBEAR_CONFIG.rpcUrl] },
    },
    blockExplorers: {
      default: {
        name: 'BuildBear Explorer',
        url: BUILDBEAR_CONFIG.explorerUrl,
      },
    },
  },
});

/**
 * BuildBear blockchain utilities
 */
export class BuildBearClient {
  private publicClient = buildBearPublicClient;

  /**
   * Get real-time balance from BuildBear fork
   */
  async getBalance(address: string): Promise<{
    balance: string;
    balanceFormatted: string;
    balanceUSD: string;
  }> {
    try {
      console.log('🔍 Fetching balance from BuildBear fork:', address);
      
      const balance = await this.publicClient.getBalance({
        address: address as `0x${string}`,
      });

      const balanceFormatted = formatEther(balance);
      
      // Get ETH price from 1inch API for USD conversion
      const ethPriceResponse = await fetch('/api/1inch/price/8453/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
      let ethPrice = 2500; // Fallback price
      
      if (ethPriceResponse.ok) {
        const priceData = await ethPriceResponse.json();
        ethPrice = parseFloat(priceData.price || '2500');
      }

      const balanceUSD = (parseFloat(balanceFormatted) * ethPrice).toFixed(2);

      console.log('✅ BuildBear balance fetched:', {
        balance: balance.toString(),
        balanceFormatted,
        balanceUSD
      });

      return {
        balance: balance.toString(),
        balanceFormatted,
        balanceUSD,
      };
    } catch (error) {
      console.error('❌ Failed to fetch BuildBear balance:', error);
      throw error;
    }
  }

  /**
   * Get token balance from BuildBear fork
   */
  async getTokenBalance(
    walletAddress: string,
    tokenAddress: string
  ): Promise<{
    balance: string;
    balanceFormatted: string;
    symbol: string;
    decimals: number;
  }> {
    try {
      console.log('🔍 Fetching token balance from BuildBear fork:', { walletAddress, tokenAddress });

      // ERC20 ABI for balanceOf and basic info
      const erc20Abi = [
        {
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }],
        },
        {
          name: 'decimals',
          type: 'function',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ name: '', type: 'uint8' }],
        },
        {
          name: 'symbol',
          type: 'function',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ name: '', type: 'string' }],
        },
      ] as const;

      // Handle native ETH
      if (tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        const ethBalance = await this.getBalance(walletAddress);
        return {
          balance: ethBalance.balance,
          balanceFormatted: ethBalance.balanceFormatted,
          symbol: 'ETH',
          decimals: 18,
        };
      }

      // Get token info and balance
      const [balance, decimals, symbol] = await Promise.all([
        this.publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [walletAddress as `0x${string}`],
        }),
        this.publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'decimals',
        }),
        this.publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'symbol',
        }),
      ]);

      const balanceFormatted = (Number(balance) / Math.pow(10, decimals)).toString();

      console.log('✅ BuildBear token balance fetched:', {
        balance: balance.toString(),
        balanceFormatted,
        symbol,
        decimals
      });

      return {
        balance: balance.toString(),
        balanceFormatted,
        symbol: symbol as string,
        decimals: decimals as number,
      };
    } catch (error) {
      console.error('❌ Failed to fetch BuildBear token balance:', error);
      throw error;
    }
  }

  /**
   * Get block information
   */
  async getBlockInfo(): Promise<{
    blockNumber: string;
    timestamp: string;
    gasLimit: string;
    gasUsed: string;
  }> {
    try {
      const block = await this.publicClient.getBlock();
      
      return {
        blockNumber: block.number.toString(),
        timestamp: block.timestamp.toString(),
        gasLimit: block.gasLimit.toString(),
        gasUsed: block.gasUsed.toString(),
      };
    } catch (error) {
      console.error('❌ Failed to fetch BuildBear block info:', error);
      throw error;
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string) {
    try {
      const receipt = await this.publicClient.getTransactionReceipt({
        hash: txHash as `0x${string}`,
      });
      
      return receipt;
    } catch (error) {
      console.error('❌ Failed to fetch BuildBear transaction receipt:', error);
      throw error;
    }
  }

  /**
   * Simulate a transaction
   */
  async simulateTransaction(params: {
    to: string;
    data: string;
    value?: string;
    from?: string;
  }) {
    try {
      const result = await this.publicClient.call({
        to: params.to as `0x${string}`,
        data: params.data as `0x${string}`,
        value: params.value ? parseEther(params.value) : undefined,
        account: params.from as `0x${string}` || BUILDBEAR_CONFIG.demoAccounts[0] as `0x${string}`,
      });
      
      return result;
    } catch (error) {
      console.error('❌ Failed to simulate BuildBear transaction:', error);
      throw error;
    }
  }

  /**
   * Get demo account with pre-funded balance
   */
  getDemoAccount(index: number = 0): string {
    if (index >= BUILDBEAR_CONFIG.demoAccounts.length) {
      throw new Error(`Demo account index ${index} out of range`);
    }
    return BUILDBEAR_CONFIG.demoAccounts[index];
  }

  /**
   * Check if an address has sufficient balance for a transaction
   */
  async checkSufficientBalance(
    address: string,
    requiredAmount: string,
    tokenAddress?: string
  ): Promise<{
    hasSufficientBalance: boolean;
    currentBalance: string;
    requiredAmount: string;
    shortfall?: string;
  }> {
    try {
      let balance: string;
      
      if (!tokenAddress || tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        const ethBalance = await this.getBalance(address);
        balance = ethBalance.balance;
      } else {
        const tokenBalance = await this.getTokenBalance(address, tokenAddress);
        balance = tokenBalance.balance;
      }

      const currentBalanceBN = BigInt(balance);
      const requiredAmountBN = BigInt(requiredAmount);
      const hasSufficientBalance = currentBalanceBN >= requiredAmountBN;

      return {
        hasSufficientBalance,
        currentBalance: balance,
        requiredAmount,
        shortfall: hasSufficientBalance ? undefined : (requiredAmountBN - currentBalanceBN).toString(),
      };
    } catch (error) {
      console.error('❌ Failed to check BuildBear balance:', error);
      return {
        hasSufficientBalance: false,
        currentBalance: '0',
        requiredAmount,
        shortfall: requiredAmount,
      };
    }
  }
}

// Export singleton instance
export const buildBearClient = new BuildBearClient();