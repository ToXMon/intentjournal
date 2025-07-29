/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@getpara/react-sdk'],
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    // Disable caching to save disk space
    config.cache = false;
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