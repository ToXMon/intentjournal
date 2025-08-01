/**
 * Tests for 1inch mock data functionality
 */

import { 
  shouldUseMockData, 
  MOCK_TOKEN_PRICES, 
  generateMockSwapQuote,
  generateMockTokenPrices 
} from '@/utils/oneinch/mock-data';

describe('1inch Mock Data', () => {
  describe('shouldUseMockData', () => {
    it('should return true for BuildBear fork chain ID', () => {
      expect(shouldUseMockData(27257)).toBe(true);
    });

    it('should return true in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true
      });
      
      expect(shouldUseMockData(1)).toBe(true);
      
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true
      });
    });

    it('should return false for production mainnet', () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true
      });
      
      expect(shouldUseMockData(1)).toBe(false);
      
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true
      });
    });
  });

  describe('MOCK_TOKEN_PRICES', () => {
    it('should contain IJT token price', () => {
      const ijtAddress = '0xe5ccdc758917ec96bd81932af3ef39837aebe01a';
      expect(MOCK_TOKEN_PRICES[ijtAddress]).toBeDefined();
      expect(MOCK_TOKEN_PRICES[ijtAddress].symbol).toBe('IJT');
      expect(MOCK_TOKEN_PRICES[ijtAddress].priceUSD).toBe('1.50');
    });

    it('should contain USDC token price', () => {
      const usdcAddress = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
      expect(MOCK_TOKEN_PRICES[usdcAddress]).toBeDefined();
      expect(MOCK_TOKEN_PRICES[usdcAddress].symbol).toBe('USDC');
      expect(MOCK_TOKEN_PRICES[usdcAddress].priceUSD).toBe('1.00');
    });
  });

  describe('generateMockSwapQuote', () => {
    it('should generate valid swap quote for IJT to USDC', () => {
      const ijtAddress = '0xe5ccdc758917ec96bd81932af3ef39837aebe01a';
      const usdcAddress = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
      const amount = '1000000000000000000000'; // 1000 IJT

      const quote = generateMockSwapQuote(ijtAddress, usdcAddress, amount);

      expect(quote).toBeDefined();
      expect(quote.srcAmount).toBe(amount);
      expect(parseFloat(quote.dstAmount)).toBeGreaterThan(0);
      expect(quote.protocols).toHaveLength(1);
      expect(quote.estimatedGas).toBe('150000');
    });

    it('should apply slippage to swap quotes', () => {
      const ijtAddress = '0xe5ccdc758917ec96bd81932af3ef39837aebe01a';
      const usdcAddress = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
      const amount = '1000000000000000000000'; // 1000 IJT

      const quote = generateMockSwapQuote(ijtAddress, usdcAddress, amount);
      
      // Expected: 1000 IJT * 1.50 USD/IJT * 0.97 slippage = ~1455 USDC
      // With 6 decimals: 1455000000
      const expectedMin = 1400000000; // Allow some variance
      const expectedMax = 1500000000;
      const actualAmount = parseInt(quote.dstAmount);

      expect(actualAmount).toBeGreaterThan(expectedMin);
      expect(actualAmount).toBeLessThan(expectedMax);
    });
  });

  describe('generateMockTokenPrices', () => {
    it('should generate prices for multiple tokens', () => {
      const addresses = [
        '0xe5ccdc758917ec96bd81932af3ef39837aebe01a', // IJT
        '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC
      ];

      const prices = generateMockTokenPrices(addresses);

      expect(Object.keys(prices)).toHaveLength(2);
      expect(prices[addresses[0]]).toBeDefined();
      expect(prices[addresses[1]]).toBeDefined();
      expect(prices[addresses[0]].symbol).toBe('IJT');
      expect(prices[addresses[1]].symbol).toBe('USDC');
    });

    it('should add realistic price variations', () => {
      const addresses = ['0xe5ccdc758917ec96bd81932af3ef39837aebe01a'];
      
      const prices1 = generateMockTokenPrices(addresses);
      const prices2 = generateMockTokenPrices(addresses);

      // Prices should vary slightly due to random variation
      const price1 = parseFloat(prices1[addresses[0]].priceUSD);
      const price2 = parseFloat(prices2[addresses[0]].priceUSD);

      // Should be within reasonable range of base price (1.50)
      expect(price1).toBeGreaterThan(1.35);
      expect(price1).toBeLessThan(1.65);
      expect(price2).toBeGreaterThan(1.35);
      expect(price2).toBeLessThan(1.65);
    });
  });
});