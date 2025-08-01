/**
 * React hooks for 1inch Data APIs
 * Comprehensive data fetching for Balances, Prices, Metadata, and Charts
 */

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useParaAccount } from './useParaAccount';
import { useAppStore } from '@/lib/store';
import {
  oneInchDataAPI,
  type TokenPrice,
  type TokenMetadata,
  type TransactionHistory,
  type PriceChartData,
} from '@/utils/oneinch/data-apis';

export interface UseTokenPricesResult {
  prices: Record<string, TokenPrice>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseTokenMetadataResult {
  metadata: Record<string, TokenMetadata>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseTransactionHistoryResult {
  history: TransactionHistory | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export interface UseWalletDataResult {
  balances: any;
  prices: Record<string, TokenPrice>;
  metadata: Record<string, TokenMetadata>;
  history: TransactionHistory | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UsePriceChartResult {
  chartData: PriceChartData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to get token prices for the current chain
 */
export function useTokenPrices(
  tokenAddresses?: string[],
  currency: string = 'USD'
): UseTokenPricesResult {
  const chainId = useChainId();
  const [prices, setPrices] = useState<Record<string, TokenPrice>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    if (!chainId) {
      setPrices({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching token prices for chain:', chainId);
      const result = await oneInchDataAPI.getTokenPrices(chainId, tokenAddresses, currency);
      setPrices(result);
      
      console.log(`✅ Loaded ${Object.keys(result).length} token prices`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch token prices';
      setError(errorMessage);
      setPrices({});
      console.error('Token prices fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [chainId, tokenAddresses?.join(','), currency]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  return {
    prices,
    loading,
    error,
    refetch: fetchPrices,
  };
}

/**
 * Hook to get token metadata for the current chain
 */
export function useTokenMetadata(tokenAddresses?: string[]): UseTokenMetadataResult {
  const chainId = useChainId();
  const [metadata, setMetadata] = useState<Record<string, TokenMetadata>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = useCallback(async () => {
    if (!chainId) {
      setMetadata({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching token metadata for chain:', chainId);
      const result = await oneInchDataAPI.getTokenMetadata(chainId, tokenAddresses);
      setMetadata(result);
      
      console.log(`✅ Loaded ${Object.keys(result).length} token metadata entries`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch token metadata';
      setError(errorMessage);
      setMetadata({});
      console.error('Token metadata fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [chainId, tokenAddresses?.join(',')]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  return {
    metadata,
    loading,
    error,
    refetch: fetchMetadata,
  };
}

/**
 * Hook to get transaction history for the connected wallet
 */
export function useTransactionHistory(
  options: {
    limit?: number;
    timeframe?: string;
  } = {}
): UseTransactionHistoryResult {
  const { address: web3Address } = useAccount();
  const { address: paraAddress } = useParaAccount();
  const chainId = useChainId();
  const { walletType } = useAppStore();
  
  const [history, setHistory] = useState<TransactionHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  // Determine which wallet address to use
  const walletAddress = walletType === 'para' ? paraAddress : web3Address;
  const { limit = 50, timeframe = '7d' } = options;

  const fetchHistory = useCallback(async (resetOffset: boolean = true) => {
    if (!walletAddress || !chainId) {
      setHistory(null);
      return;
    }

    setLoading(true);
    setError(null);

    const currentOffset = resetOffset ? 0 : offset;

    try {
      console.log('🔍 Fetching transaction history for:', walletAddress);
      const result = await oneInchDataAPI.getTransactionHistory(walletAddress, chainId, {
        limit,
        offset: currentOffset,
        timeframe,
      });

      if (resetOffset) {
        setHistory(result);
        setOffset(limit);
      } else {
        // Append to existing history for pagination
        setHistory(prev => prev ? {
          ...result!,
          transactions: [...prev.transactions, ...result!.transactions],
        } : result);
        setOffset(prev => prev + limit);
      }
      
      console.log(`✅ Loaded ${result?.transactions.length || 0} transactions`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transaction history';
      setError(errorMessage);
      if (resetOffset) setHistory(null);
      console.error('Transaction history fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, chainId, limit, timeframe, offset]);

  const loadMore = useCallback(async () => {
    await fetchHistory(false);
  }, [fetchHistory]);

  useEffect(() => {
    setOffset(0);
    fetchHistory(true);
  }, [walletAddress, chainId, limit, timeframe]);

  return {
    history,
    loading,
    error,
    refetch: () => fetchHistory(true),
    loadMore,
    hasMore: history?.hasMore || false,
  };
}

/**
 * Hook to get comprehensive wallet data (balances + prices + metadata + history)
 */
export function useWalletData(): UseWalletDataResult {
  const { address: web3Address } = useAccount();
  const { address: paraAddress } = useParaAccount();
  const chainId = useChainId();
  const { walletType } = useAppStore();
  
  const [data, setData] = useState<{
    balances: any;
    prices: Record<string, TokenPrice>;
    metadata: Record<string, TokenMetadata>;
    history: TransactionHistory | null;
  }>({
    balances: null,
    prices: {},
    metadata: {},
    history: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine which wallet address to use
  const walletAddress = walletType === 'para' ? paraAddress : web3Address;

  const fetchWalletData = useCallback(async () => {
    if (!walletAddress || !chainId) {
      setData({
        balances: null,
        prices: {},
        metadata: {},
        history: null,
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching comprehensive wallet data for:', walletAddress);
      const result = await oneInchDataAPI.getWalletData(walletAddress, chainId);
      setData(result);
      
      console.log('✅ Loaded comprehensive wallet data');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch wallet data';
      setError(errorMessage);
      setData({
        balances: null,
        prices: {},
        metadata: {},
        history: null,
      });
      console.error('Wallet data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, chainId]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  return {
    ...data,
    loading,
    error,
    refetch: fetchWalletData,
  };
}

/**
 * Hook to get price chart data for a specific token
 */
export function usePriceChart(
  tokenAddress?: string,
  days: number = 7
): UsePriceChartResult {
  const chainId = useChainId();
  const [chartData, setChartData] = useState<PriceChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChartData = useCallback(async () => {
    if (!chainId || !tokenAddress) {
      setChartData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching price chart data for token:', tokenAddress);
      
      // First get current price
      const prices = await oneInchDataAPI.getTokenPrices(chainId, [tokenAddress]);
      const currentPrice = prices[tokenAddress.toLowerCase()]?.price;
      
      if (currentPrice) {
        // Generate mock chart data based on current price
        const mockData = oneInchDataAPI.generateMockPriceChart(
          parseFloat(currentPrice),
          days
        );
        setChartData(mockData);
        console.log(`✅ Generated ${mockData.length} price chart data points`);
      } else {
        // Generate default chart data
        const mockData = oneInchDataAPI.generateMockPriceChart(100, days);
        setChartData(mockData);
        console.log(`✅ Generated default price chart data`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch price chart data';
      setError(errorMessage);
      setChartData([]);
      console.error('Price chart fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [chainId, tokenAddress, days]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  return {
    chartData,
    loading,
    error,
    refetch: fetchChartData,
  };
}

/**
 * Hook to get BuildBear fork specific data
 */
export function useBuildBearData() {
  const chainId = useChainId();
  const { address: web3Address } = useAccount();
  const { address: paraAddress } = useParaAccount();
  const { walletType } = useAppStore();
  
  const walletAddress = walletType === 'para' ? paraAddress : web3Address;
  const isBuildBearFork = chainId === 27257;

  const [buildBearData, setBuildBearData] = useState<{
    isConnected: boolean;
    blockNumber: string;
    gasPrice: string;
    balance: string;
  }>({
    isConnected: false,
    blockNumber: '0',
    gasPrice: '0',
    balance: '0',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBuildBearData = useCallback(async () => {
    if (!isBuildBearFork || !walletAddress) {
      setBuildBearData({
        isConnected: false,
        blockNumber: '0',
        gasPrice: '0',
        balance: '0',
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching BuildBear fork data');
      
      // Import BuildBear client dynamically to avoid SSR issues
      const { buildBearClient } = await import('@/utils/buildbear/client');
      
      const [blockInfo, balance] = await Promise.all([
        buildBearClient.getBlockInfo(),
        buildBearClient.getBalance(walletAddress),
      ]);

      setBuildBearData({
        isConnected: true,
        blockNumber: blockInfo.blockNumber,
        gasPrice: '20', // Gwei
        balance: balance.balanceFormatted,
      });
      
      console.log('✅ Loaded BuildBear fork data');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch BuildBear data';
      setError(errorMessage);
      setBuildBearData({
        isConnected: false,
        blockNumber: '0',
        gasPrice: '0',
        balance: '0',
      });
      console.error('BuildBear data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [isBuildBearFork, walletAddress]);

  useEffect(() => {
    fetchBuildBearData();
    
    // Refresh BuildBear data every 10 seconds
    const interval = setInterval(fetchBuildBearData, 10000);
    return () => clearInterval(interval);
  }, [fetchBuildBearData]);

  return {
    ...buildBearData,
    isBuildBearFork,
    loading,
    error,
    refetch: fetchBuildBearData,
  };
}