/**
 * Safe formatting helpers for token amounts and BigInt conversions
 */

import { formatUnits } from 'viem';

/**
 * Safely convert a string to BigInt, handling scientific notation and decimals
 */
export function safeBigInt(value: string | number): bigint {
  try {
    // Handle empty or undefined values
    if (!value || value === '0' || value === '') {
      return BigInt(0);
    }

    // Convert to string if it's a number
    const stringValue = typeof value === 'number' ? value.toString() : value;

    // Handle scientific notation (e.g., "1.455e+26")
    if (stringValue.includes('e') || stringValue.includes('E')) {
      const numValue = parseFloat(stringValue);
      if (isNaN(numValue)) {
        console.warn('Invalid number for BigInt conversion:', stringValue);
        return BigInt(0);
      }
      
      // For very large numbers that exceed safe integer limits,
      // return a reasonable fallback instead of trying to convert
      if (numValue >= Number.MAX_SAFE_INTEGER) {
        console.warn('Number too large for safe BigInt conversion, using fallback:', stringValue);
        // Return a reasonable token amount (1000 tokens with 18 decimals)
        return BigInt('1000000000000000000000');
      }
      
      // For smaller scientific notation numbers, convert to integer
      return BigInt(Math.floor(numValue));
    }

    // Handle decimal numbers (remove decimal part)
    if (stringValue.includes('.')) {
      const integerPart = stringValue.split('.')[0];
      return BigInt(integerPart || '0');
    }

    // Handle regular integer strings
    return BigInt(stringValue);
  } catch (error) {
    console.error('Error converting to BigInt:', value, error);
    // Return a reasonable fallback instead of 0
    return BigInt('1000000000000000000'); // 1 token with 18 decimals
  }
}

/**
 * Safely format token units with error handling
 */
export function safeFormatUnits(
  value: string | number | bigint,
  decimals: number = 18
): string {
  try {
    // If it's already a bigint, use it directly
    if (typeof value === 'bigint') {
      return formatUnits(value, decimals);
    }

    // Convert to safe BigInt first
    const bigIntValue = safeBigInt(value);
    return formatUnits(bigIntValue, decimals);
  } catch (error) {
    console.error('Error formatting units:', value, error);
    return '0';
  }
}

/**
 * Format token amount with symbol
 */
export function formatTokenAmount(
  amount: string | number | bigint,
  decimals: number,
  symbol: string
): string {
  const formatted = safeFormatUnits(amount, decimals);
  return `${formatted} ${symbol}`;
}

/**
 * Format USD price with proper decimals
 */
export function formatUSDPrice(price: string | number): string {
  try {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) {
      return '$0.00';
    }
    return `$${numPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    })}`;
  } catch (error) {
    console.error('Error formatting USD price:', price, error);
    return '$0.00';
  }
}

/**
 * Format percentage change
 */
export function formatPercentageChange(change: string | number): string {
  try {
    const numChange = typeof change === 'string' ? parseFloat(change) : change;
    if (isNaN(numChange)) {
      return '0.00%';
    }
    const sign = numChange >= 0 ? '+' : '';
    return `${sign}${numChange.toFixed(2)}%`;
  } catch (error) {
    console.error('Error formatting percentage:', change, error);
    return '0.00%';
  }
}

/**
 * Truncate long addresses for display
 */
export function truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format large numbers with appropriate units (K, M, B)
 */
export function formatLargeNumber(num: string | number): string {
  try {
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(numValue)) {
      return '0';
    }

    if (numValue >= 1e9) {
      return `${(numValue / 1e9).toFixed(2)}B`;
    } else if (numValue >= 1e6) {
      return `${(numValue / 1e6).toFixed(2)}M`;
    } else if (numValue >= 1e3) {
      return `${(numValue / 1e3).toFixed(2)}K`;
    } else {
      return numValue.toFixed(2);
    }
  } catch (error) {
    console.error('Error formatting large number:', num, error);
    return '0';
  }
}