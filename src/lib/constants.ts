// Network configurations
export const SUPPORTED_CHAINS = {
  BASE_SEPOLIA: {
    id: 84532,
    name: 'Base Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia-explorer.base.org',
  },
  ETHERLINK_TESTNET: {
    id: 128123,
    name: 'Etherlink Testnet',
    rpcUrl: process.env.NEXT_PUBLIC_ETHERLINK_RPC || 'https://node.ghostnet.etherlink.com',
    blockExplorer: 'https://testnet.explorer.etherlink.com',
  },
} as const

// API endpoints
export const API_ENDPOINTS = {
  ONEINCH_BASE: 'https://api.1inch.dev',
  VENICE_AI: 'https://api.venice.ai/api/v1',
  FUSION_PLUS: 'https://api.1inch.dev/fusion-plus',
} as const

// Common token addresses for Base Sepolia
export const BASE_SEPOLIA_TOKENS = {
  ETH: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  USDT: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
} as const

// Common token addresses for Etherlink Testnet
export const ETHERLINK_TOKENS = {
  ETH: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  USDC: '0x0000000000000000000000000000000000000000', // Placeholder
  USDT: '0x0000000000000000000000000000000000000000', // Placeholder
} as const

// Venice AI models
export const VENICE_MODELS = {
  EMBEDDING: 'text-embedding-3-large',
  CHAT: 'venice-uncensored',
  IMAGE: 'hidream',
} as const

// Storage keys
export const STORAGE_KEYS = {
  JOURNAL_ENTRIES: 'intentjournal_entries',
  EMBEDDINGS: 'intentjournal_embeddings',
  TRADE_HISTORY: 'intentjournal_trades',
  USER_PREFERENCES: 'intentjournal_preferences',
} as const

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  NETWORK_NOT_SUPPORTED: 'Please switch to a supported network',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction',
  API_RATE_LIMIT: 'Too many requests. Please wait a moment.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
} as const

// UI constants
export const UI_CONSTANTS = {
  MAX_JOURNAL_LENGTH: 2000,
  DEBOUNCE_DELAY: 500,
  TOAST_DURATION: 5000,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
} as const