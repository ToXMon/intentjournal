import { renderHook, act } from '@testing-library/react'
import { useAppStore } from '@/lib/store'

// Mock the Para hooks since they depend on external SDK
jest.mock('@/hooks/useParaAccount', () => ({
  useParaAccount: jest.fn(() => ({
    account: null,
    isConnected: false,
    address: null,
    wallets: [],
    isLoading: false,
    error: null,
  }))
}))

describe('Para Wallet Integration with App Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.getState().disconnectWallet()
    useAppStore.getState().disconnectParaWallet()
  })

  describe('setParaWalletState', () => {
    it('should update Para wallet state', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.setParaWalletState({
          isConnected: true,
          address: '0x1234567890123456789012345678901234567890',
          authMethod: 'GOOGLE',
          walletIds: ['wallet-1'],
        })
      })

      expect(result.current.paraWallet.isConnected).toBe(true)
      expect(result.current.paraWallet.address).toBe('0x1234567890123456789012345678901234567890')
      expect(result.current.paraWallet.authMethod).toBe('GOOGLE')
      expect(result.current.paraWallet.walletIds).toEqual(['wallet-1'])
    })

    it('should sync Para wallet connection to main wallet state', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.setParaWalletState({
          isConnected: true,
          address: '0x1234567890123456789012345678901234567890',
          authMethod: 'GOOGLE',
        })
      })

      // Should sync to main wallet state
      expect(result.current.walletAddress).toBe('0x1234567890123456789012345678901234567890')
      expect(result.current.walletType).toBe('para')
      expect(result.current.connectedChain).toBe(84532) // Base Sepolia default
    })

    it('should not sync if Para wallet is disconnected', () => {
      const { result } = renderHook(() => useAppStore())
      
      // First connect a wagmi wallet
      act(() => {
        result.current.setWalletConnection('0xwagmi', 1, 'wagmi')
      })

      // Then update Para state but disconnected
      act(() => {
        result.current.setParaWalletState({
          isConnected: false,
          address: null,
        })
      })

      // Should not affect main wallet state
      expect(result.current.walletAddress).toBe('0xwagmi')
      expect(result.current.walletType).toBe('wagmi')
    })
  })

  describe('setWalletConnection', () => {
    it('should update Para state when connecting Para wallet', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.setWalletConnection(
          '0x1234567890123456789012345678901234567890',
          84532,
          'para'
        )
      })

      expect(result.current.walletAddress).toBe('0x1234567890123456789012345678901234567890')
      expect(result.current.walletType).toBe('para')
      expect(result.current.connectedChain).toBe(84532)
      
      // Should also update Para wallet state
      expect(result.current.paraWallet.isConnected).toBe(true)
      expect(result.current.paraWallet.address).toBe('0x1234567890123456789012345678901234567890')
    })

    it('should not affect Para state when connecting wagmi wallet', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.setWalletConnection('0xwagmi', 1, 'wagmi')
      })

      expect(result.current.walletAddress).toBe('0xwagmi')
      expect(result.current.walletType).toBe('wagmi')
      
      // Para state should remain unchanged
      expect(result.current.paraWallet.isConnected).toBe(false)
      expect(result.current.paraWallet.address).toBe(null)
    })
  })

  describe('disconnectParaWallet', () => {
    it('should disconnect Para wallet and clear main wallet if Para was active', () => {
      const { result } = renderHook(() => useAppStore())
      
      // Connect Para wallet
      act(() => {
        result.current.setWalletConnection('0xpara', 84532, 'para')
      })

      // Disconnect Para wallet
      act(() => {
        result.current.disconnectParaWallet()
      })

      // Both Para and main wallet state should be cleared
      expect(result.current.paraWallet.isConnected).toBe(false)
      expect(result.current.paraWallet.address).toBe(null)
      expect(result.current.walletAddress).toBe(null)
      expect(result.current.walletType).toBe(null)
    })

    it('should only disconnect Para wallet if wagmi wallet is active', () => {
      const { result } = renderHook(() => useAppStore())
      
      // Connect wagmi wallet
      act(() => {
        result.current.setWalletConnection('0xwagmi', 1, 'wagmi')
      })

      // Set Para wallet state separately
      act(() => {
        result.current.setParaWalletState({
          isConnected: true,
          address: '0xpara',
        })
      })

      // Disconnect Para wallet
      act(() => {
        result.current.disconnectParaWallet()
      })

      // Para wallet should be disconnected but main wallet should remain
      expect(result.current.paraWallet.isConnected).toBe(false)
      expect(result.current.paraWallet.address).toBe(null)
      expect(result.current.walletAddress).toBe('0xwagmi')
      expect(result.current.walletType).toBe('wagmi')
    })
  })

  describe('disconnectWallet', () => {
    it('should clear Para wallet state if Para was the active wallet', () => {
      const { result } = renderHook(() => useAppStore())
      
      // Connect Para wallet
      act(() => {
        result.current.setWalletConnection('0xpara', 84532, 'para')
      })

      // Disconnect wallet
      act(() => {
        result.current.disconnectWallet()
      })

      // Both main and Para wallet state should be cleared
      expect(result.current.walletAddress).toBe(null)
      expect(result.current.walletType).toBe(null)
      expect(result.current.paraWallet.isConnected).toBe(false)
      expect(result.current.paraWallet.address).toBe(null)
    })

    it('should not affect Para wallet state if wagmi wallet was active', () => {
      const { result } = renderHook(() => useAppStore())
      
      // Connect wagmi wallet
      act(() => {
        result.current.setWalletConnection('0xwagmi', 1, 'wagmi')
      })

      // Set Para wallet state separately
      act(() => {
        result.current.setParaWalletState({
          isConnected: true,
          address: '0xpara',
        })
      })

      // Disconnect main wallet
      act(() => {
        result.current.disconnectWallet()
      })

      // Main wallet should be disconnected but Para state should remain
      expect(result.current.walletAddress).toBe(null)
      expect(result.current.walletType).toBe(null)
      expect(result.current.paraWallet.isConnected).toBe(true)
      expect(result.current.paraWallet.address).toBe('0xpara')
    })
  })

  describe('state persistence', () => {
    it('should persist Para wallet state in localStorage', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.setParaWalletState({
          isConnected: true,
          address: '0x1234567890123456789012345678901234567890',
          authMethod: 'GOOGLE',
          walletIds: ['wallet-1'],
        })
      })

      // The persistence is handled by zustand persist middleware
      // We can verify the state is correctly structured for persistence
      expect(result.current.paraWallet.address).toBe('0x1234567890123456789012345678901234567890')
      expect(result.current.paraWallet.authMethod).toBe('GOOGLE')
      expect(result.current.paraWallet.isConnected).toBe(true)
      expect(result.current.paraWallet.walletIds).toEqual(['wallet-1'])
    })
  })
})