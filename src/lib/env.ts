/**
 * Environment variables validation and configuration
 */

// Optional environment variables with defaults
const optionalEnvVars = {
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: '0000000000000000000000000000000000000000',
  NEXT_PUBLIC_VENICE_API_KEY: '',
  NEXT_PUBLIC_ONEINCH_API_KEY: '',
  NEXT_PUBLIC_PARA_API_KEY: '2d0a70fd7a593dfe5f027763590ac8ac',
  NEXT_PUBLIC_BASE_SEPOLIA_RPC: 'https://sepolia.base.org',
  NEXT_PUBLIC_ETHERLINK_RPC: 'https://node.ghostnet.etherlink.com',
  NEXT_PUBLIC_ETHERLINK_ESCROW_ADDRESS: '',
} as const

export interface EnvConfig {
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: string
  NEXT_PUBLIC_VENICE_API_KEY: string
  NEXT_PUBLIC_ONEINCH_API_KEY: string
  NEXT_PUBLIC_PARA_API_KEY: string
  NEXT_PUBLIC_BASE_SEPOLIA_RPC: string
  NEXT_PUBLIC_ETHERLINK_RPC: string
  NEXT_PUBLIC_ETHERLINK_ESCROW_ADDRESS: string
}

/**
 * Returns environment configuration with defaults for missing values
 */
export function getEnvConfig(): EnvConfig {
  const config: Partial<EnvConfig> = {}

  for (const [envVar, defaultValue] of Object.entries(optionalEnvVars)) {
    config[envVar as keyof EnvConfig] = process.env[envVar] || defaultValue
  }

  return config as EnvConfig
}

/**
 * Check if API keys are configured
 */
export function checkApiKeys() {
  const config = getEnvConfig()
  
  return {
    veniceAI: !!config.NEXT_PUBLIC_VENICE_API_KEY,
    oneInch: !!config.NEXT_PUBLIC_ONEINCH_API_KEY,
    para: !!config.NEXT_PUBLIC_PARA_API_KEY,
    walletConnect: !!config.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  }
}

// Export the validated config
export const env = getEnvConfig()
