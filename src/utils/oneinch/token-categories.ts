/**
 * Token Categories Configuration
 * Curated lists of tokens by category for price feeds
 */

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  logoURI?: string;
  category: string;
  description?: string;
}

// Base mainnet token addresses (Chain ID: 8453)
export const TOKEN_CATEGORIES = {
  major: [
    {
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      symbol: 'ETH',
      name: 'Ethereum',
      logoURI: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png',
      category: 'major',
      description: 'Native Ethereum token'
    },
    {
      address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      symbol: 'USDC',
      name: 'USD Coin',
      logoURI: 'https://tokens.1inch.io/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.png',
      category: 'major',
      description: 'USD-pegged stablecoin'
    },
    {
      address: '0x4200000000000000000000000000000000000006',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      logoURI: 'https://tokens.1inch.io/0x4200000000000000000000000000000000000006.png',
      category: 'major',
      description: 'Wrapped Ethereum on Base'
    },
    {
      address: '0x50c5725949a6f0c72e6c4a641f24049a917db0cb',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      logoURI: 'https://tokens.1inch.io/0x50c5725949a6f0c72e6c4a641f24049a917db0cb.png',
      category: 'major',
      description: 'Decentralized stablecoin'
    },
    {
      address: '0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22',
      symbol: 'cbETH',
      name: 'Coinbase Wrapped Staked ETH',
      logoURI: 'https://tokens.1inch.io/0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22.png',
      category: 'major',
      description: 'Coinbase staked ETH'
    }
  ],
  memecoins: [
    {
      address: '0x532f27101965dd16442e59d40670faf5ebb142e4',
      symbol: 'BRETT',
      name: 'Brett',
      logoURI: 'https://tokens.1inch.io/0x532f27101965dd16442e59d40670faf5ebb142e4.png',
      category: 'memecoin',
      description: 'Base chain memecoin'
    },
    {
      address: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
      symbol: 'DEGEN',
      name: 'Degen',
      logoURI: 'https://tokens.1inch.io/0x4ed4e862860bed51a9570b96d89af5e1b0efefed.png',
      category: 'memecoin',
      description: 'Farcaster community token'
    },
    {
      address: '0x0578d8a44db98b23bf096a382e016e29a5ce0ffe',
      symbol: 'HIGHER',
      name: 'Higher',
      logoURI: 'https://tokens.1inch.io/0x0578d8a44db98b23bf096a382e016e29a5ce0ffe.png',
      category: 'memecoin',
      description: 'Base memecoin'
    },
    {
      address: '0x6921b130d297cc43754afba22e5eac0fbf8db75b',
      symbol: 'DOGINME',
      name: 'DOG IN ME',
      logoURI: 'https://tokens.1inch.io/0x6921b130d297cc43754afba22e5eac0fbf8db75b.png',
      category: 'memecoin',
      description: 'Dog-themed memecoin'
    }
  ],
  defi: [
    {
      address: '0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452',
      symbol: 'wstETH',
      name: 'Wrapped liquid staked Ether 2.0',
      logoURI: 'https://tokens.1inch.io/0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452.png',
      category: 'defi',
      description: 'Lido staked ETH'
    },
    {
      address: '0x940181a94a35a4569e4529a3cdfb74e38fd98631',
      symbol: 'AERO',
      name: 'Aerodrome Finance',
      logoURI: 'https://tokens.1inch.io/0x940181a94a35a4569e4529a3cdfb74e38fd98631.png',
      category: 'defi',
      description: 'Base DEX token'
    },
    {
      address: '0x78a087d713be963bf307b18f2ff8122ef9a63ae9',
      symbol: 'BSWAP',
      name: 'BaseSwap Token',
      logoURI: 'https://tokens.1inch.io/0x78a087d713be963bf307b18f2ff8122ef9a63ae9.png',
      category: 'defi',
      description: 'BaseSwap DEX token'
    }
  ],
  refi: [
    {
      address: '0x2416092f143378750bb29b79ed961ab195cceea5',
      symbol: 'ezETH',
      name: 'Renzo Restaked ETH',
      logoURI: 'https://tokens.1inch.io/0x2416092f143378750bb29b79ed961ab195cceea5.png',
      category: 'refi',
      description: 'Renzo liquid restaking token'
    },
    {
      address: '0x04c0599ae5a44757c0af6f9ec3b93da8976c150a',
      symbol: 'weETH',
      name: 'Wrapped eETH',
      logoURI: 'https://tokens.1inch.io/0x04c0599ae5a44757c0af6f9ec3b93da8976c150a.png',
      category: 'refi',
      description: 'EtherFi wrapped staked ETH'
    }
  ],
  gaming: [
    {
      address: '0x1c7999deb4fcf5ac8a6a92aa669c4d8d96ce1b5f',
      symbol: 'PRIME',
      name: 'Echelon Prime',
      logoURI: 'https://tokens.1inch.io/0x1c7999deb4fcf5ac8a6a92aa669c4d8d96ce1b5f.png',
      category: 'gaming',
      description: 'Gaming ecosystem token'
    }
  ]
};

// Get all tokens as a flat array
export const ALL_TOKENS: TokenInfo[] = [
  ...TOKEN_CATEGORIES.major,
  ...TOKEN_CATEGORIES.memecoins,
  ...TOKEN_CATEGORIES.defi,
  ...TOKEN_CATEGORIES.refi,
  ...TOKEN_CATEGORIES.gaming,
];

// Get token addresses by category
export const getTokenAddressesByCategory = (category: keyof typeof TOKEN_CATEGORIES): string[] => {
  return TOKEN_CATEGORIES[category].map(token => token.address);
};

// Get all token addresses
export const getAllTokenAddresses = (): string[] => {
  return ALL_TOKENS.map(token => token.address);
};

// Find token info by address
export const getTokenInfo = (address: string): TokenInfo | undefined => {
  return ALL_TOKENS.find(token => token.address.toLowerCase() === address.toLowerCase());
};

// Category display configuration
export const CATEGORY_CONFIG = {
  major: {
    name: 'Major Tokens',
    description: 'Blue-chip cryptocurrencies and stablecoins',
    icon: '💎',
    color: 'blue'
  },
  memecoins: {
    name: 'Memecoins',
    description: 'Community-driven and viral tokens',
    icon: '🐸',
    color: 'green'
  },
  defi: {
    name: 'DeFi',
    description: 'Decentralized finance protocol tokens',
    icon: '🏦',
    color: 'purple'
  },
  refi: {
    name: 'ReFi',
    description: 'Regenerative finance and liquid staking',
    icon: '🌱',
    color: 'emerald'
  },
  gaming: {
    name: 'Gaming',
    description: 'Gaming and metaverse tokens',
    icon: '🎮',
    color: 'orange'
  }
} as const;