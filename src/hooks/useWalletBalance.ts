/**
 * React hooks for wallet balance management
 * Works with both Para and Web3 wallets
 */

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useParaAccount } from './useParaAccount';
import { useAppStore } from '@/lib/store';
import { balanceAPI, type WalletBalances, type TokenBalance } from '@/utils/oneinch/balance';

export interface UseWalletBalanceResult {
  balances: WalletBalances | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseTokenBalanceResult {
  balance: TokenBalance | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseBalanceCheckResult {
  hasSufficientBalance: boolean;
  currentBalance: string;
  requiredAmount: string;
  shortfall?: string;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to get wallet balances for the currently connected wallet
 * Automatically detects wallet type (Para or Web3) and chain
 */
export function useWalletBalance(): UseWalletBalanceResult {
  const { address: web3Address } = useAccount();
  const { address: paraAddress } = useParaAccount();
  const chainId = useChainId();
  const { walletType } = useAppStore();
  
  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine which wallet address to use
  const walletAddress = walletType === 'para' ? paraAddress : web3Address;
  const currentWalletType = walletType || 'wagmi';

  const fetchBalances = useCallback(async () => {
    if (!walletAddress || !chainId) {
      setBalances(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 Fetching balances for ${currentWalletType} wallet:`, walletAddress);
      const result = await balanceAPI.getWalletBalances(walletAddress, chainId, currentWalletType);
      setBalances(result);
      
      if (result) {
        console.log(`✅ Loaded ${result.tokens.length} token balances (${currentWalletType})`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch wallet balances';
      setError(errorMessage);
      setBalances(null);
      console.error('Balance fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, chainId, currentWalletType]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    balances,
    loading,
    error,
    refetch: fetchBalances,
  };
}

/**
 * Hook to get balance for a specific token
 */
export function useTokenBalance(tokenAddress?: string): UseTokenBalanceResult {
  const { address: web3Address } = useAccount();
  const { address: paraAddress } = useParaAccount();
  const chainId = useChainId();
  const { walletType } = useAppStore();
  
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine which wallet address to use
  const walletAddress = walletType === 'para' ? paraAddress : web3Address;
  const currentWalletType = walletType || 'wagmi';

  const fetchBalance = useCallback(async () => {
    if (!walletAddress || !chainId || !tokenAddress) {
      setBalance(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await balanceAPI.getTokenBalance(walletAddress, tokenAddress, chainId, currentWalletType);
      setBalance(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch token balance';
      setError(errorMessage);
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, chainId, tokenAddress, currentWalletType]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    loading,
    error,
    refetch: fetchBalance,
  };
}

/**
 * Hook to check if wallet has sufficient balance for a transaction
 */
export function useBalanceCheck(
  tokenAddress?: string,
  requiredAmount?: string
): UseBalanceCheckResult {
  const { address: web3Address } = useAccount();
  const { address: paraAddress } = useParaAccount();
  const chainId = useChainId();
  const { walletType } = useAppStore();
  
  const [result, setResult] = useState<{
    hasSufficientBalance: boolean;
    currentBalance: string;
    requiredAmount: string;
    shortfall?: string;
  }>({
    hasSufficientBalance: false,
    currentBalance: '0',
    requiredAmount: '0',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine which wallet address to use
  const walletAddress = walletType === 'para' ? paraAddress : web3Address;
  const currentWalletType = walletType || 'wagmi';

  const checkBalance = useCallback(async () => {
    if (!walletAddress || !chainId || !tokenAddress || !requiredAmount) {
      setResult({
        hasSufficientBalance: false,
        currentBalance: '0',
        requiredAmount: requiredAmount || '0',
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const balanceCheck = await balanceAPI.checkSufficientBalance(
        walletAddress,
        tokenAddress,
        requiredAmount,
        chainId,
        currentWalletType
      );
      setResult(balanceCheck);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check balance';
      setError(errorMessage);
      setResult({
        hasSufficientBalance: false,
        currentBalance: '0',
        requiredAmount: requiredAmount || '0',
        shortfall: requiredAmount || '0',
      });
    } finally {
      setLoading(false);
    }
  }, [walletAddress, chainId, tokenAddress, requiredAmount, currentWalletType]);

  useEffect(() => {
    checkBalance();
  }, [checkBalance]);

  return {
    ...result,
    loading,
    error,
    refetch: checkBalance,
  };
}

/**
 * Hook to get native token balance (ETH, MATIC, etc.)
 */
export function useNativeTokenBalance(): UseTokenBalanceResult {
  const { address: web3Address } = useAccount();
  const { address: paraAddress } = useParaAccount();
  const chainId = useChainId();
  const { walletType } = useAppStore();
  
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine which wallet address to use
  const walletAddress = walletType === 'para' ? paraAddress : web3Address;
  const currentWalletType = walletType || 'wagmi';

  const fetchNativeBalance = useCallback(async () => {
    if (!walletAddress || !chainId) {
      setBalance(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await balanceAPI.getNativeTokenBalance(walletAddress, chainId, currentWalletType);
      setBalance(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch native token balance';
      setError(errorMessage);
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, chainId, currentWalletType]);

  useEffect(() => {
    fetchNativeBalance();
  }, [fetchNativeBalance]);

  return {
    balance,
    loading,
    error,
    refetch: fetchNativeBalance,
  };
}

/**
 * Hook to compare balances between Para and Web3 wallets
 */
export function useMultiWalletBalance(): {
  balances: Record<string, WalletBalances | null>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const { address: web3Address } = useAccount();
  const { address: paraAddress } = useParaAccount();
  const chainId = useChainId();
  
  const [balances, setBalances] = useState<Record<string, WalletBalances | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMultiWalletBalances = useCallback(async () => {
    const wallets = [];
    
    if (web3Address) {
      wallets.push({ address: web3Address, type: 'wagmi' as const });
    }
    
    if (paraAddress) {
      wallets.push({ address: paraAddress, type: 'para' as const });
    }

    if (wallets.length === 0 || !chainId) {
      setBalances({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await balanceAPI.getMultiWalletBalances(wallets, chainId);
      setBalances(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch multi-wallet balances';
      setError(errorMessage);
      setBalances({});
    } finally {
      setLoading(false);
    }
  }, [web3Address, paraAddress, chainId]);

  useEffect(() => {
    fetchMultiWalletBalances();
  }, [fetchMultiWalletBalances]);

  return {
    balances,
    loading,
    error,
    refetch: fetchMultiWalletBalances,
  };
}