/**
 * Centralized token configuration for BuildBear Base Fork
 * All token addresses should be imported from here to ensure consistency
 */

export const BUILDBEAR_TOKENS = {
  // Real Base Mainnet tokens on BuildBear Fork (Chain ID: 27257)
  USDC: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // Real Base USDC
  BBETH: '0x0000000000000000000000000000000000000000', // Native ETH (BBETH)
  INTENT_TOKEN: '0xea3d7f3F9A704d970627bB404a35eA6f11C69646', // Our deployed Intent Token
  
  // Legacy mock tokens (keep for backward compatibility)
  DEMO_TOKEN: '0xD31E022A0Aa45A6B74eBb44DDaC909Ec0dfD2765',
  MOCK_USDC: '0x064Abf44F593C198e34E55e4C129580c425b499F',
  
  // Aliases for easy access
  IJT: '0xea3d7f3F9A704d970627bB404a35eA6f11C69646', // Same as INTENT_TOKEN
  ETH: '0x0000000000000000000000000000000000000000', // Same as BBETH
} as const;

export const TOKEN_METADATA = {
  [BUILDBEAR_TOKENS.USDC]: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    type: 'stablecoin',
    isNative: false,
    coingeckoId: 'usd-coin'
  },
  [BUILDBEAR_TOKENS.BBETH]: {
    symbol: 'BBETH',
    name: 'Base ETH',
    decimals: 18,
    type: 'native',
    isNative: true,
    coingeckoId: 'ethereum'
  },
  [BUILDBEAR_TOKENS.INTENT_TOKEN]: {
    symbol: 'INT',
    name: 'Intent Token',
    decimals: 18,
    type: 'utility',
    isNative: false
  },
  // Legacy tokens
  [BUILDBEAR_TOKENS.DEMO_TOKEN]: {
    symbol: 'DEMO',
    name: 'Demo Token',
    decimals: 18,
    type: 'demo',
    isNative: false
  },
  [BUILDBEAR_TOKENS.MOCK_USDC]: {
    symbol: 'mUSDC',
    name: 'Mock USDC',
    decimals: 6,
    type: 'stablecoin',
    isNative: false
  }
} as const;

// Network configuration
export const BUILDBEAR_NETWORK = {
  chainId: 27257,
  name: 'BuildBear Base Fork',
  rpcUrl: 'https://rpc.buildbear.io/smooth-spiderman-faa2b8b9',
  explorerUrl: 'https://smooth-spiderman-faa2b8b9.ethernal.buildbear.io',
  nativeCurrency: {
    name: 'BBeth',
    symbol: 'BBeth',
    decimals: 18
  }
} as const;

// Contract addresses for other services
export const CONTRACT_ADDRESSES = {
  BUILDBEAR: {
    ...BUILDBEAR_TOKENS,
    IntentManager: BUILDBEAR_TOKENS.INTENT_TOKEN, // Using Intent Token as manager for demo
  },
  ETHERLINK: {
    DutchAuctionEscrow: '0x6CE3d4bf7C7140924C6AB7579b8B86Dc9ebF7a02',
    CrossChainEvidenceManager: '0x1234567890123456789012345678901234567890', // Placeholder
  }
} as const;

// Helper functions
export function getTokenByAddress(address: string) {
  return TOKEN_METADATA[address as keyof typeof TOKEN_METADATA];
}

export function getExplorerUrl(address: string, type: 'address' | 'tx' = 'address') {
  return `${BUILDBEAR_NETWORK.explorerUrl}/${type}/${address}`;
}

export function isValidTokenAddress(address: string): boolean {
  return Object.values(BUILDBEAR_TOKENS).includes(address as any);
}
