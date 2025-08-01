/**
 * Tests for safe formatting helpers
 */

import { 
  safeBigInt, 
  safeFormatUnits, 
  formatTokenAmount,
  formatUSDPrice 
} from '@/utils/format-helpers';

describe('Format Helpers', () => {
  describe('safeBigInt', () => {
    it('should handle regular integer strings', () => {
      expect(safeBigInt('1000')).toBe(BigInt(1000));
      expect(safeBigInt('0')).toBe(BigInt(0));
    });

    it('should handle scientific notation', () => {
      expect(safeBigInt('1.455e+26')).toBe(BigInt('145500000000000000000000000'));
      expect(safeBigInt('1e18')).toBe(BigInt('1000000000000000000'));
      expect(safeBigInt('2.5e6')).toBe(BigInt(2500000));
    });

    it('should handle decimal numbers', () => {
      expect(safeBigInt('123.456')).toBe(BigInt(123));
      expect(safeBigInt('0.999')).toBe(BigInt(0));
    });

    it('should handle edge cases', () => {
      expect(safeBigInt('')).toBe(BigInt(0));
      expect(safeBigInt('0')).toBe(BigInt(0));
      expect(safeBigInt('invalid')).toBe(BigInt(0));
    });

    it('should handle numbers', () => {
      expect(safeBigInt(1000)).toBe(BigInt(1000));
      expect(safeBigInt(1.455e26)).toBe(BigInt('145500000000000000000000000'));
    });
  });

  describe('safeFormatUnits', () => {
    it('should format regular amounts', () => {
      expect(safeFormatUnits('1000000000000000000', 18)).toBe('1.0');
      expect(safeFormatUnits('1500000', 6)).toBe('1.5');
    });

    it('should handle scientific notation', () => {
      const result = safeFormatUnits('1.455e+26', 18);
      expect(result).not.toBe('0');
      expect(parseFloat(result)).toBeGreaterThan(0);
    });

    it('should handle BigInt input', () => {
      expect(safeFormatUnits(BigInt('1000000000000000000'), 18)).toBe('1.0');
    });

    it('should handle invalid input gracefully', () => {
      expect(safeFormatUnits('invalid', 18)).toBe('0');
      expect(safeFormatUnits('', 18)).toBe('0');
    });
  });

  describe('formatTokenAmount', () => {
    it('should format with symbol', () => {
      expect(formatTokenAmount('1000000000000000000', 18, 'IJT')).toBe('1.0 IJT');
      expect(formatTokenAmount('1500000', 6, 'USDC')).toBe('1.5 USDC');
    });

    it('should handle scientific notation with symbol', () => {
      const result = formatTokenAmount('1.455e+26', 18, 'IJT');
      expect(result).toContain('IJT');
      expect(result).not.toBe('0 IJT');
    });
  });

  describe('formatUSDPrice', () => {
    it('should format USD prices', () => {
      expect(formatUSDPrice('1.50')).toBe('$1.50');
      expect(formatUSDPrice('3500.123456')).toBe('$3,500.123456');
      expect(formatUSDPrice(1.5)).toBe('$1.50');
    });

    it('should handle invalid prices', () => {
      expect(formatUSDPrice('invalid')).toBe('$0.00');
      expect(formatUSDPrice('')).toBe('$0.00');
    });
  });
});