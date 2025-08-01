/**
 * 1inch API Integration for IntentJournal+
 * Exports all 1inch-related utilities and types
 */

export { OneInchAPI, oneInchAPI, OneInchAPIError } from './client';
export { CacheManager } from './cache';
export { RecommendationEnhancer } from './recommendation-enhancer';
export { ClassicSwapManager } from './classic-swap';
export { LimitOrderManager } from './limit-orders';
export { FusionManager } from './fusion';
export { FusionPlusManager } from './fusion-plus';
export { shouldUseMockData, MOCK_TOKEN_PRICES, MOCK_SUPPORTED_TOKENS } from './mock-data';

export type {
  TokenPrice,
  SwapQuoteParams,
  SwapQuote,
  SwapRoute,
  TokenInfo,
} from './client';

export type { ClassicSwapResult } from './classic-swap';
export type { LimitOrderParams, LimitOrderResult } from './limit-orders';
export type { FusionOrderParams, FusionOrderResult, FusionResolver } from './fusion';
export type { FusionPlusOrderParams, FusionPlusOrderResult, CrossChainQuote } from './fusion-plus';

// Common token addresses for different networks
export const COMMON_TOKENS = {
  // Ethereum Mainnet
  1: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    USDC: '0xA0b86a33E6441E6C7D3E4C5B4B6B8B8B8B8B8B8B',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  },
  // Polygon
  137: {
    ETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // WETH on Polygon
    MATIC: '0x0000000000000000000000000000000000001010',
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
  },
  // Base
  8453: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    WETH: '0x4200000000000000000000000000000000000006',
  },
  // Arbitrum
  42161: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  },
  // BuildBear Fork (Base tokens)
  27257: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    WETH: '0x4200000000000000000000000000000000000006',
    // Your custom IntentJournal Token
    IJT: '0xe5ccdc758917ec96bd81932af3ef39837aebe01a',
  },
} as const;

// Network configurations for 1inch API
export const SUPPORTED_NETWORKS = {
  1: { name: 'Ethereum', symbol: 'ETH' },
  137: { name: 'Polygon', symbol: 'MATIC' },
  8453: { name: 'Base', symbol: 'ETH' },
  42161: { name: 'Arbitrum', symbol: 'ETH' },
  27257: { name: 'BuildBear Fork', symbol: 'BBETH' },
} as const;

export type SupportedChainId = keyof typeof SUPPORTED_NETWORKS;