/**
 * Environment variables validation and configuration
 */

// Required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID',
] as const

// Optional environment variables with defaults
const optionalEnvVars = {
  NEXT_PUBLIC_VENICE_API_KEY: '',
  NEXT_PUBLIC_ONEINCH_API_KEY: '',
  NEXT_PUBLIC_PARA_API_KEY: '2d0a70fd7a593dfe5f027763590ac8ac',
  NEXT_PUBLIC_BASE_SEPOLIA_RPC: 'https://sepolia.base.org',
  NEXT_PUBLIC_ETHERLINK_RPC: 'https://node.ghostnet.etherlink.com',
} as const

export interface EnvConfig {
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: string
  NEXT_PUBLIC_VENICE_API_KEY: string
  NEXT_PUBLIC_ONEINCH_API_KEY: string
  NEXT_PUBLIC_PARA_API_KEY: string
  NEXT_PUBLIC_BASE_SEPOLIA_RPC: string
  NEXT_PUBLIC_ETHERLINK_RPC: string
}

/**
 * Validates and returns environment configuration
 */
export function getEnvConfig(): EnvConfig {
  const config: Partial<EnvConfig> = {}

  // Check required variables
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar]
    if (!value) {
      throw new Error(`Missing required environment variable: ${envVar}`)
    }
    config[envVar] = value
  }

  // Set optional variables with defaults
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