'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, JournalEntry, DeFiRecommendation, CompletedTrade, SocialPost } from '@/types'
import { STORAGE_KEYS } from './constants'
import { generateId } from './utils'

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      walletAddress: null,
      connectedChain: null,
      walletType: null,
      paraWallet: {
        isConnected: false,
        address: null,
        authMethod: null,
        walletIds: null,
        isLoading: false,
        error: null,
      },
      journalEntries: [],
      embeddings: [],
      tradeHistory: [],
      preferences: {
        theme: 'system',
        defaultSlippage: 0.5,
        autoGeneratePosts: true,
      },
      currentRecommendations: [],
      activeOrders: [],
      isLoading: false,
      error: null,

      // Actions
      setWalletConnection: (address: string, chainId: number, type: 'wagmi' | 'para' = 'wagmi') => {
        set((state) => ({
          walletAddress: address,
          connectedChain: chainId,
          walletType: type,
          error: null,
          // If connecting Para wallet, also update Para state
          ...(type === 'para' && {
            paraWallet: {
              ...state.paraWallet,
              isConnected: true,
              address: address,
              error: null,
            }
          })
        }))
      },

      setParaWalletState: (paraState: Partial<import('@/types').ParaWalletState>) => {
        set((state) => {
          const newParaState = { ...state.paraWallet, ...paraState }
          
          // Only sync to main wallet state if:
          // 1. Para wallet is connected and has an address
          // 2. AND there's no active main wallet connection (walletAddress is null)
          // 3. OR the current main wallet is already Para wallet
          const shouldSyncToMain = newParaState.isConnected && newParaState.address && 
                                   (state.walletAddress === null || state.walletType === 'para')
          
          return {
            paraWallet: newParaState,
            ...(shouldSyncToMain && {
              walletAddress: newParaState.address,
              walletType: 'para' as const,
              connectedChain: 84532, // Default to Base Sepolia for Para wallets
            })
          }
        })
      },

      disconnectWallet: () => {
        set((state) => {
          const updates: any = {
            walletAddress: null,
            connectedChain: null,
            walletType: null,
            currentRecommendations: [],
            activeOrders: [],
            error: null,
          }
          
          // Only clear Para state if it was the active wallet
          if (state.walletType === 'para') {
            updates.paraWallet = {
              ...state.paraWallet,
              isConnected: false,
              address: null,
              error: null,
            }
          }
          // If wagmi wallet was active, Para wallet state should remain unchanged
          
          return updates
        })
      },

      disconnectParaWallet: () => {
        set((state) => {
          const newParaState = {
            isConnected: false,
            address: null,
            authMethod: null,
            walletIds: null,
            isLoading: false,
            error: null,
          }
          
          // If Para was the active wallet, clear main wallet state too
          const shouldClearMain = state.walletType === 'para'
          
          return {
            paraWallet: newParaState,
            ...(shouldClearMain && {
              walletAddress: null,
              connectedChain: null,
              walletType: null,
              currentRecommendations: [],
              activeOrders: [],
            })
          }
        })
      },

      syncParaWalletState: () => {
        // This will be called by components to sync Para hook state with store
        // Implementation will be handled by the components using Para hooks
      },

      addJournalEntry: async (content: string) => {
        const entry: JournalEntry = {
          id: generateId(),
          content,
          timestamp: new Date(),
          processed: false,
        }

        set((state) => ({
          journalEntries: [entry, ...state.journalEntries],
          isLoading: true,
          error: null,
        }))

        try {
          // Process with AI (will be implemented in Venice AI integration)
          await get().processEntryWithAI(entry.id)
        } catch (error) {
          set({ error: 'Failed to process journal entry', isLoading: false })
        }
      },

      processEntryWithAI: async (entryId: string) => {
        // Placeholder - will be implemented with Venice AI integration
        set({ isLoading: true })
        
        // Simulate AI processing
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        set((state) => ({
          journalEntries: state.journalEntries.map(entry =>
            entry.id === entryId ? { ...entry, processed: true } : entry
          ),
          isLoading: false,
        }))
      },

      generateRecommendations: async () => {
        set({ isLoading: true, error: null })
        
        try {
          // Placeholder - will be implemented with 1inch API integration
          const mockRecommendations: DeFiRecommendation[] = [
            {
              id: generateId(),
              reasoning: 'Based on your recent entries about wanting to diversify, consider swapping ETH for USDC',
              tokenPair: {
                from: {
                  address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                  symbol: 'ETH',
                  name: 'Ethereum',
                  decimals: 18,
                  chainId: 84532,
                },
                to: {
                  address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
                  symbol: 'USDC',
                  name: 'USD Coin',
                  decimals: 6,
                  chainId: 84532,
                },
              },
              estimatedPrice: '2500.00',
              route: {
                fromToken: {
                  address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                  symbol: 'ETH',
                  name: 'Ethereum',
                  decimals: 18,
                  chainId: 84532,
                },
                toToken: {
                  address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
                  symbol: 'USDC',
                  name: 'USD Coin',
                  decimals: 6,
                  chainId: 84532,
                },
                fromAmount: '1',
                toAmount: '2500',
                protocols: ['1inch'],
                gas: '150000',
              },
              confidence: 0.85,
            },
          ]

          set({
            currentRecommendations: mockRecommendations,
            isLoading: false,
          })

          return mockRecommendations
        } catch (error) {
          set({ error: 'Failed to generate recommendations', isLoading: false })
          return []
        }
      },

      createFusionOrder: async (recommendation: DeFiRecommendation) => {
        set({ isLoading: true, error: null })
        
        try {
          // Placeholder - will be implemented with Fusion+ SDK
          const orderHash = `0x${Math.random().toString(16).substring(2, 66)}`
          
          set((state) => ({
            activeOrders: [...state.activeOrders, { 
              hash: orderHash, 
              recommendation,
              status: 'pending',
              timestamp: new Date(),
            }],
            isLoading: false,
          }))

          return orderHash
        } catch (error) {
          set({ error: 'Failed to create Fusion+ order', isLoading: false })
          throw error
        }
      },

      generateSocialPost: async (tradeData: CompletedTrade) => {
        set({ isLoading: true, error: null })
        
        try {
          // Placeholder - will be implemented with Venice AI
          const post: SocialPost = {
            text: `Just completed a successful cross-chain swap! 🚀\n\n${tradeData.fromAmount} ${tradeData.fromToken.symbol} → ${tradeData.toAmount} ${tradeData.toToken.symbol}\n\nPowered by @1inch Fusion+ and IntentJournal+ 💫\n\n#DeFi #CrossChain #1inch #IntentJournal`,
            hashtags: ['DeFi', 'CrossChain', '1inch', 'IntentJournal'],
          }

          set({ isLoading: false })
          return post
        } catch (error) {
          set({ error: 'Failed to generate social post', isLoading: false })
          throw error
        }
      },
    }),
    {
      name: STORAGE_KEYS.USER_PREFERENCES,
      partialize: (state) => ({
        journalEntries: state.journalEntries,
        embeddings: state.embeddings,
        tradeHistory: state.tradeHistory,
        preferences: state.preferences,
        // Persist Para wallet connection state
        paraWallet: {
          isConnected: state.paraWallet.isConnected,
          address: state.paraWallet.address,
          authMethod: state.paraWallet.authMethod,
          walletIds: state.paraWallet.walletIds,
          // Don't persist loading/error states
        },
        // Persist main wallet state for restoration
        walletAddress: state.walletAddress,
        connectedChain: state.connectedChain,
        walletType: state.walletType,
      }),
    }
  )
)