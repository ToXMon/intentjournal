/**
 * Unit tests for 1inch API integration
 */

import { OneInchAPI, CacheManager } from '@/utils/oneinch';

// Mock fetch for testing
global.fetch = jest.fn();

describe('OneInchAPI', () => {
  let api: OneInchAPI;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    api = new OneInchAPI('test-api-key');
    mockFetch.mockClear();
    CacheManager.clear();
  });

  describe('getTokenPrice', () => {
    it('should fetch token price successfully', async () => {
      const mockResponse = {
        symbol: 'IJT',
        price: '1.50',
        change24h: '5.2'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await api.getTokenPrice('0xe5ccdc758917ec96bd81932af3ef39837aebe01a', 8453);

      expect(result).toEqual({
        address: '0xe5ccdc758917ec96bd81932af3ef39837aebe01a',
        symbol: 'IJT',
        price: '1.50',
        priceUSD: '1.50',
        change24h: '5.2',
        lastUpdated: expect.any(Number),
      });
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Token not found' }),
      } as Response);

      const result = await api.getTokenPrice('invalid-address', 8453);
      expect(result).toBeNull();
    });

    it('should return cached result on second call', async () => {
      const mockResponse = {
        symbol: 'IJT',
        price: '1.50'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // First call
      await api.getTokenPrice('0xe5ccdc758917ec96bd81932af3ef39837aebe01a', 8453);
      
      // Second call should use cache
      const result = await api.getTokenPrice('0xe5ccdc758917ec96bd81932af3ef39837aebe01a', 8453);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result?.symbol).toBe('IJT');
    });
  });

  describe('getSwapQuote', () => {
    it('should fetch swap quote successfully', async () => {
      const mockResponse = {
        dstAmount: '1500000', // 1.5 USDC (6 decimals)
        srcAmount: '1000000000000000000', // 1 IJT (18 decimals)
        protocols: [['1inch', 100]],
        estimatedGas: '150000'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const params = {
        src: '0xe5ccdc758917ec96bd81932af3ef39837aebe01a',
        dst: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        amount: '1000000000000000000',
        from: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        slippage: 1
      };

      const result = await api.getSwapQuote(params, 8453);

      expect(result).toEqual({
        dstAmount: '1500000',
        srcAmount: '1000000000000000000',
        protocols: [['1inch', 100]],
        estimatedGas: '150000'
      });
    });

    it('should handle unsupported chain ID', async () => {
      const params = {
        src: '0xe5ccdc758917ec96bd81932af3ef39837aebe01a',
        dst: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        amount: '1000000000000000000',
        from: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        slippage: 1
      };

      const result = await api.getSwapQuote(params, 999999); // Unsupported chain
      expect(result).toBeNull();
    });
  });

  describe('healthCheck', () => {
    it('should return true for healthy API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' }),
      } as Response);

      const result = await api.healthCheck(8453);
      expect(result).toBe(true);
    });

    it('should return false for unhealthy API', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await api.healthCheck(8453);
      expect(result).toBe(false);
    });
  });
});

describe('CacheManager', () => {
  beforeEach(() => {
    CacheManager.clear();
  });

  it('should store and retrieve data', () => {
    const testData = { price: '1.50', symbol: 'IJT' };
    CacheManager.set('test-key', testData, 1000);

    const result = CacheManager.get('test-key');
    expect(result).toEqual(testData);
  });

  it('should return null for expired data', (done) => {
    const testData = { price: '1.50', symbol: 'IJT' };
    CacheManager.set('test-key', testData, 10); // 10ms TTL

    setTimeout(() => {
      const result = CacheManager.get('test-key');
      expect(result).toBeNull();
      done();
    }, 20);
  });

  it('should check if key exists', () => {
    CacheManager.set('test-key', 'test-data', 1000);
    
    expect(CacheManager.has('test-key')).toBe(true);
    expect(CacheManager.has('non-existent-key')).toBe(false);
  });

  it('should delete specific keys', () => {
    CacheManager.set('test-key', 'test-data', 1000);
    expect(CacheManager.has('test-key')).toBe(true);
    
    CacheManager.delete('test-key');
    expect(CacheManager.has('test-key')).toBe(false);
  });

  it('should clear all data', () => {
    CacheManager.set('key1', 'data1', 1000);
    CacheManager.set('key2', 'data2', 1000);
    
    expect(CacheManager.has('key1')).toBe(true);
    expect(CacheManager.has('key2')).toBe(true);
    
    CacheManager.clear();
    
    expect(CacheManager.has('key1')).toBe(false);
    expect(CacheManager.has('key2')).toBe(false);
  });
});