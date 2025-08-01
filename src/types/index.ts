export interface JournalEntry {
  id: string
  content: string
  timestamp: Date
  embedding?: number[]
  processed: boolean
}

export interface StoredEmbedding {
  id: string
  vector: number[]
  metadata: {
    content: string
    timestamp: Date
    keywords: string[]
    sentiment: 'positive' | 'negative' | 'neutral'
    entryId: string
  }
}

export interface DeFiRecommendation {
  id: string
  reasoning: string
  marketInsights?: string
  riskAssessment?: string
  webSearchCitations?: Array<{
    title: string
    url: string
    snippet: string
  }>
  tokenPair: {
    from: Token
    to: Token
  }
  estimatedPrice: string
  route: SwapRoute
  confidence: number
}

export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
  chainId: number
}

export interface SwapRoute {
  fromToken: Token
  toToken: Token
  fromAmount: string
  toAmount: string
  protocols: string[]
  gas: string
}

export interface SwapQuoteParams {
  fromTokenAddress: string
  toTokenAddress: string
  amount: string
  fromChainId: number
  toChainId: number
  walletAddress: string
}

export interface OrderParams {
  srcChainId: number
  dstChainId: number
  srcTokenAddress: string
  dstTokenAddress: string
  amount: string
  walletAddress: string
  preset: 'fast' | 'medium' | 'slow'
}

export interface CompletedTrade {
  orderHash: string
  fromToken: Token
  toToken: Token
  fromAmount: string
  toAmount: string
  executionTime: Date
  gasUsed: string
  status: 'completed' | 'failed' | 'pending'
}

export interface SocialPost {
  text: string
  imageUrl?: string
  hashtags: string[]
}

// 1inch API Types
export interface OneInchTokenPrice {
  address: string
  symbol: string
  price: string
  priceUSD: string
  change24h?: string
  lastUpdated: number
}

export interface OneInchSwapQuote {
  dstAmount: string
  srcAmount: string
  protocols: any[]
  estimatedGas: string
  tx?: {
    from: string
    to: string
    data: string
    value: string
    gasPrice: string
    gas: string
  }
}

export interface OneInchSwapParams {
  src: string
  dst: string
  amount: string
  from: string
  slippage?: number
  disableEstimate?: boolean
  allowPartialFill?: boolean
}

export interface TokenPriceCache {
  [tokenAddress: string]: OneInchTokenPrice
}

export interface SwapQuoteCache {
  [quoteKey: string]: OneInchSwapQuote
}

export interface ParaWalletState {
  isConnected: boolean
  address: string | null
  authMethod: string | null
  walletIds: string[] | null
  isLoading: boolean
  error: string | null
}

export interface UserState {
  walletAddress: string | null
  connectedChain: number | null
  walletType: 'wagmi' | 'para' | null
  paraWallet: ParaWalletState
  journalEntries: JournalEntry[]
  embeddings: StoredEmbedding[]
  tradeHistory: CompletedTrade[]
  preferences: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  defaultSlippage: number
  autoGeneratePosts: boolean
}

export interface AppState extends UserState {
  // Actions
  setWalletConnection: (address: string, chainId: number, type?: 'wagmi' | 'para') => void
  setParaWalletState: (state: Partial<ParaWalletState>) => void
  disconnectWallet: () => void
  disconnectParaWallet: () => void
  syncParaWalletState: () => void
  loadWalletData: (walletAddress: string) => void
  saveWalletData: (walletAddress: string) => void
  initializeWalletData: () => void
  addJournalEntry: (entry: string) => Promise<void>
  processEntryWithAI: (entryId: string) => Promise<void>
  generateRecommendations: () => Promise<DeFiRecommendation[]>
  createFusionOrder: (recommendation: DeFiRecommendation) => Promise<string>
  generateSocialPost: (tradeData: CompletedTrade) => Promise<SocialPost>
  generateSocialImage: (tradeData: CompletedTrade, postText?: string) => Promise<{
    imageData: string | null
    format: string
    description: string
  }>
  
  // 1inch API Actions
  fetchTokenPrice: (tokenAddress: string, chainId?: number) => Promise<OneInchTokenPrice | null>
  fetchTokenPrices: (tokenAddresses: string[], chainId?: number) => Promise<TokenPriceCache>
  fetchSwapQuote: (params: OneInchSwapParams, chainId?: number) => Promise<OneInchSwapQuote | null>
  fetchSwapData: (params: OneInchSwapParams, chainId?: number) => Promise<OneInchSwapQuote | null>
  
  // Current state
  currentRecommendations: DeFiRecommendation[]
  activeOrders: any[]
  tokenPrices: TokenPriceCache
  swapQuotes: SwapQuoteCache
  oneInchHealthy: boolean
  isLoading: boolean
  error: string | null
}