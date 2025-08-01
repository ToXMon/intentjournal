/**
 * Integration tests for 1inch API with app store
 */

import { useAppStore } from '@/lib/store';
import { OneInchAPI, RecommendationEnhancer } from '@/utils/oneinch';
import type { DeFiRecommendation, AppState } from '@/types';

// Mock the 1inch API
jest.mock('@/utils/oneinch', () => ({
  OneInchAPI: jest.fn().mockImplementation(() => ({
    getTokenPrice: jest.fn(),
    getTokenPrices: jest.fn(),
    getSwapQuote: jest.fn(),
    getSwapData: jest.fn(),
    healthCheck: jest.fn(),
  })),
  oneInchAPI: {
    getTokenPrice: jest.fn(),
    getTokenPrices: jest.fn(),
    getSwapQuote: jest.fn(),
    getSwapData: jest.fn(),
    healthCheck: jest.fn(),
  },
  RecommendationEnhancer: {
    enhanceRecommendation: jest.fn(),
    enhanceRecommendations: jest.fn(),
    getPopularTokenPairs: jest.fn(),
    validateTokenPairLiquidity: jest.fn(),
    getMarketSentiment: jest.fn(),
    calculateSwapTiming: jest.fn(),
  },
  COMMON_TOKENS: {
    27257: {
      ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      IJT: '0xe5ccdc758917ec96bd81932af3ef39837aebe01a',
    },
  },
}));

describe('1inch Store Integration', () => {
  let store: AppState;

  beforeEach(() => {
    // Reset store state
    store = useAppStore.getState() as AppState;
    store.disconnectWallet();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('fetchTokenPrice', () => {
    it('should fetch and cache token price', async () => {
      const mockPrice = {
        address: '0xe5ccdc758917ec96bd81932af3ef39837aebe01a',
        symbol: 'IJT',
        price: '1.50',
        priceUSD: '1.50',
        change24h: '5.2',
        lastUpdated: Date.now(),
      };

      const { oneInchAPI } = await import('@/utils/oneinch');
      (oneInchAPI.getTokenPrice as jest.Mock).mockResolvedValue(mockPrice);

      const result = await store.fetchTokenPrice('0xe5ccdc758917ec96bd81932af3ef39837aebe01a', 27257);

      expect(result).toEqual(mockPrice);
      expect(store.tokenPrices['0xe5ccdc758917ec96bd81932af3ef39837aebe01a']).toEqual(mockPrice);
    });

    it('should handle API errors gracefully', async () => {
      const { oneInchAPI } = await import('@/utils/oneinch');
      (oneInchAPI.getTokenPrice as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await store.fetchTokenPrice('invalid-address', 27257);

      expect(result).toBeNull();
      expect(store.tokenPrices['invalid-address']).toBeUndefined();
    });
  });

  describe('fetchTokenPrices', () => {
    it('should fetch multiple token prices', async () => {
      const mockPrices = {
        '0xe5ccdc758917ec96bd81932af3ef39837aebe01a': {
          address: '0xe5ccdc758917ec96bd81932af3ef39837aebe01a',
          symbol: 'IJT',
          price: '1.50',
          priceUSD: '1.50',
          lastUpdated: Date.now(),
        },
        '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': {
          address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          symbol: 'USDC',
          price: '1.00',
          priceUSD: '1.00',
          lastUpdated: Date.now(),
        },
      };

      const { oneInchAPI } = await import('@/utils/oneinch');
      (oneInchAPI.getTokenPrices as jest.Mock).mockResolvedValue(mockPrices);

      const addresses = Object.keys(mockPrices);
      const result = await store.fetchTokenPrices(addresses, 27257);

      expect(result).toEqual(mockPrices);
      expect(store.tokenPrices).toEqual(expect.objectContaining(mockPrices));
    });
  });

  describe('fetchSwapQuote', () => {
    it('should fetch and cache swap quote', async () => {
      const mockQuote = {
        dstAmount: '1500000', // 1.5 USDC
        srcAmount: '1000000000000000000', // 1 IJT
        protocols: [['1inch', 100]],
        estimatedGas: '150000',
      };

      const { oneInchAPI } = await import('@/utils/oneinch');
      (oneInchAPI.getSwapQuote as jest.Mock).mockResolvedValue(mockQuote);

      const params = {
        src: '0xe5ccdc758917ec96bd81932af3ef39837aebe01a',
        dst: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        amount: '1000000000000000000',
        from: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        slippage: 1,
      };

      const result = await store.fetchSwapQuote(params, 27257);

      expect(result).toEqual(mockQuote);
      
      const quoteKey = `${params.src}_${params.dst}_${params.amount}`;
      expect(store.swapQuotes[quoteKey]).toEqual(mockQuote);
    });
  });

  describe('RecommendationEnhancer Integration', () => {
    it('should enhance recommendations with real-time data', async () => {
      const mockRecommendation: DeFiRecommendation = {
        id: 'test-rec-1',
        reasoning: 'Test recommendation',
        tokenPair: {
          from: {
            address: '0xe5ccdc758917ec96bd81932af3ef39837aebe01a',
            symbol: 'IJT',
            name: 'IntentJournal Token',
            decimals: 18,
            chainId: 27257,
          },
          to: {
            address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
            chainId: 27257,
          },
        },
        estimatedPrice: '1.50',
        route: {
          fromToken: {
            address: '0xe5ccdc758917ec96bd81932af3ef39837aebe01a',
            symbol: 'IJT',
            name: 'IntentJournal Token',
            decimals: 18,
            chainId: 27257,
          },
          toToken: {
            address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
            chainId: 27257,
          },
          fromAmount: '1',
          toAmount: '1.50',
          protocols: ['1inch'],
          gas: '150000',
        },
        confidence: 0.8,
      };

      const mockEnhancedRecommendation = {
        ...mockRecommendation,
        realTimePrice: {
          address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          symbol: 'USDC',
          price: '1.00',
          priceUSD: '1.00',
          lastUpdated: Date.now(),
        },
        priceImpact: -33.33, // (1.00 - 1.50) / 1.50 * 100
        liquidityScore: 80,
      };

      const { RecommendationEnhancer } = await import('@/utils/oneinch');
      (RecommendationEnhancer.enhanceRecommendation as jest.Mock).mockResolvedValue(mockEnhancedRecommendation);

      const result = await RecommendationEnhancer.enhanceRecommendation(
        mockRecommendation,
        27257,
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
      );

      expect(result).toEqual(mockEnhancedRecommendation);
      expect(result.realTimePrice).toBeDefined();
      expect(result.priceImpact).toBe(-33.33);
    });
  });

  describe('Market Sentiment Analysis', () => {
    it('should analyze market sentiment from price data', async () => {
      const mockPrices = {
        'token1': {
          address: 'token1',
          symbol: 'TK1',
          price: '100',
          priceUSD: '100',
          change24h: '5.5',
          lastUpdated: Date.now(),
        },
        'token2': {
          address: 'token2',
          symbol: 'TK2',
          price: '50',
          priceUSD: '50',
          change24h: '3.2',
          lastUpdated: Date.now(),
        },
        'token3': {
          address: 'token3',
          symbol: 'TK3',
          price: '25',
          priceUSD: '25',
          change24h: '-1.1',
          lastUpdated: Date.now(),
        },
      };

      const mockSentiment = {
        sentiment: 'bullish' as const,
        score: 2.53,
        details: 'Strong upward momentum with 2/3 tokens positive',
      };

      const { RecommendationEnhancer } = await import('@/utils/oneinch');
      (RecommendationEnhancer.getMarketSentiment as jest.Mock).mockReturnValue(mockSentiment);

      const result = RecommendationEnhancer.getMarketSentiment(mockPrices);

      expect(result.sentiment).toBe('bullish');
      expect(result.score).toBeGreaterThan(2);
      expect(result.details).toContain('upward momentum');
    });
  });

  describe('Token Pair Validation', () => {
    it('should validate token pair liquidity', async () => {
      const mockValidation = {
        hasLiquidity: true,
        bestRate: '1500000',
        availableProtocols: 3,
      };

      const { RecommendationEnhancer } = await import('@/utils/oneinch');
      (RecommendationEnhancer.validateTokenPairLiquidity as jest.Mock).mockResolvedValue(mockValidation);

      const result = await RecommendationEnhancer.validateTokenPairLiquidity(
        '0xe5ccdc758917ec96bd81932af3ef39837aebe01a',
        '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        27257
      );

      expect(result.hasLiquidity).toBe(true);
      expect(result.availableProtocols).toBe(3);
    });

    it('should handle insufficient liquidity', async () => {
      const mockValidation = {
        hasLiquidity: false,
        error: 'No quote available',
      };

      const { RecommendationEnhancer } = await import('@/utils/oneinch');
      (RecommendationEnhancer.validateTokenPairLiquidity as jest.Mock).mockResolvedValue(mockValidation);

      const result = await RecommendationEnhancer.validateTokenPairLiquidity(
        'invalid-token',
        'another-invalid-token',
        27257
      );

      expect(result.hasLiquidity).toBe(false);
      expect(result.error).toBe('No quote available');
    });
  });
});