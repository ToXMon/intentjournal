/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@getpara/react-sdk', '@getpara/web-sdk'],
  experimental: {
    esmExternals: 'loose'
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false
    };
    
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    // Ignore node-specific modules in client bundle
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'utf-8-validate': false,
        'bufferutil': false,
      };
    }
    
    return config;
  },
  images: {
    domains: ['api.venice.ai'],
  },
  env: {
    NEXT_PUBLIC_VENICE_API_KEY: process.env.NEXT_PUBLIC_VENICE_API_KEY,
    NEXT_PUBLIC_ONEINCH_API_KEY: process.env.NEXT_PUBLIC_ONEINCH_API_KEY,
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    NEXT_PUBLIC_BASE_SEPOLIA_RPC: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC,
    NEXT_PUBLIC_ETHERLINK_RPC: process.env.NEXT_PUBLIC_ETHERLINK_RPC,
  },
};

module.exports = nextConfig;