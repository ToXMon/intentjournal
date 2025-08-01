import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

// BuildBear forked network definition
export const buildBearFork = {
  id: 27257,
  name: 'BuildBear Sandbox Network',
  network: 'bbtestnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BBETH',
    symbol: 'BBETH',
  },
  rpcUrls: {
    public: { http: ['https://rpc.buildbear.io/smooth-spiderman-faa2b8b9'] },
    default: { http: ['https://rpc.buildbear.io/smooth-spiderman-faa2b8b9'] },
  },
  blockExplorers: {
    default: {
      name: 'BuildBear Explorer',
      url: 'https://smooth-spiderman-faa2b8b9.ethernal.buildbear.io/',
    },
  },
} as const;

// Etherlink testnet definition
export const etherlinkTestnet = {
  id: 128123,
  name: 'Etherlink Testnet',
  network: 'etherlink-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'XTZ',
    symbol: 'XTZ',
  },
  rpcUrls: {
    public: { http: ['https://node.ghostnet.etherlink.com'] },
    default: { http: ['https://node.ghostnet.etherlink.com'] },
  },
  blockExplorers: {
    default: {
      name: 'Etherlink Explorer',
      url: 'https://testnet-explorer.etherlink.com/',
    },
  },
} as const;

export const config = getDefaultConfig({
  appName: 'IntentJournal+',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '0000000000000000000000000000000000000000',
  chains: [base, baseSepolia, buildBearFork, etherlinkTestnet],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [buildBearFork.id]: http('https://rpc.buildbear.io/smooth-spiderman-faa2b8b9'),
    [etherlinkTestnet.id]: http('https://node.ghostnet.etherlink.com'),
  },
  ssr: true, // Enable server-side rendering support
});

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}