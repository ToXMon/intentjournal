/**
 * React hook for 1inch API integration
 * Provides easy access to token prices, quotes, and swap data
 */

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { 
  oneInchAPI, 
  TokenPrice, 
  SwapQuote, 
  SwapQuoteParams, 
  TokenInfo,
  COMMON_TOKENS,
  SupportedChainId 
} from '@/utils/oneinch';

export interface UseTokenPriceResult {
  price: TokenPrice | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseSwapQuoteResult {
  quote: SwapQuote | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseTokensResult {
  tokens: Record<string, TokenInfo>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch token price
 */
export function useTokenPrice(tokenAddress?: string): UseTokenPriceResult {
  const chainId = useChainId();
  const [price, setPrice] = useState<TokenPrice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = useCallback(async () => {
    if (!tokenAddress) {
      setPrice(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await oneInchAPI.getTokenPrice(tokenAddress, chainId);
      setPrice(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch token price');
      setPrice(null);
    } finally {
      setLoading(false);
    }
  }, [tokenAddress, chainId]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  return {
    price,
    loading,
    error,
    refetch: fetchPrice,
  };
}

/**
 * Hook to fetch multiple token prices
 */
export function useTokenPrices(tokenAddresses: string[]): {
  prices: Record<string, TokenPrice>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const chainId = useChainId();
  const [prices, setPrices] = useState<Record<string, TokenPrice>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    if (tokenAddresses.length === 0) {
      setPrices({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await oneInchAPI.getTokenPrices(tokenAddresses, chainId);
      setPrices(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch token prices');
      setPrices({});
    } finally {
      setLoading(false);
    }
  }, [tokenAddresses, chainId]);

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
 * Hook to get swap quote
 */
export function useSwapQuote(params?: SwapQuoteParams): UseSwapQuoteResult {
  const chainId = useChainId();
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    if (!params) {
      setQuote(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await oneInchAPI.getSwapQuote(params, chainId);
      setQuote(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch swap quote');
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [params, chainId]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  return {
    quote,
    loading,
    error,
    refetch: fetchQuote,
  };
}

/**
 * Hook to get supported tokens for current chain
 */
export function useSupportedTokens(): UseTokensResult {
  const chainId = useChainId();
  const [tokens, setTokens] = useState<Record<string, TokenInfo>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await oneInchAPI.getSupportedTokens(chainId);
      setTokens(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch supported tokens');
      setTokens({});
    } finally {
      setLoading(false);
    }
  }, [chainId]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  return {
    tokens,
    loading,
    error,
    refetch: fetchTokens,
  };
}

/**
 * Hook to get common tokens for current chain
 */
export function useCommonTokens(): TokenInfo[] {
  const chainId = useChainId();
  const { tokens } = useSupportedTokens();

  const commonTokenAddresses = COMMON_TOKENS[chainId as keyof typeof COMMON_TOKENS] || {};
  
  return Object.entries(commonTokenAddresses).map(([symbol, address]) => {
    const tokenInfo = tokens[address.toLowerCase()];
    return tokenInfo || {
      address: address.toLowerCase(),
      symbol,
      name: symbol,
      decimals: 18,
    };
  });
}

/**
 * Hook for 1inch API health check
 */
export function useOneInchHealth(): {
  isHealthy: boolean;
  loading: boolean;
  lastCheck: Date | null;
  checkHealth: () => Promise<void>;
} {
  const chainId = useChainId();
  const [isHealthy, setIsHealthy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    
    try {
      const healthy = await oneInchAPI.healthCheck(chainId);
      setIsHealthy(healthy);
      setLastCheck(new Date());
    } catch (err) {
      setIsHealthy(false);
      setLastCheck(new Date());
    } finally {
      setLoading(false);
    }
  }, [chainId]);

  useEffect(() => {
    checkHealth();
    
    // Check health every 5 minutes
    const interval = setInterval(checkHealth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return {
    isHealthy,
    loading,
    lastCheck,
    checkHealth,
  };
}

/**
 * Hook to create swap quote parameters from user input
 */
export function useSwapQuoteBuilder(): {
  buildQuoteParams: (
    fromToken: string,
    toToken: string,
    amount: string,
    slippage?: number
  ) => SwapQuoteParams | null;
} {
  const { address } = useAccount();

  const buildQuoteParams = useCallback((
    fromToken: string,
    toToken: string,
    amount: string,
    slippage = 1
  ): SwapQuoteParams | null => {
    if (!address || !fromToken || !toToken || !amount) {
      return null;
    }

    return {
      src: fromToken,
      dst: toToken,
      amount,
      from: address,
      slippage,
      disableEstimate: false,
      allowPartialFill: false,
    };
  }, [address]);

  return { buildQuoteParams };
}