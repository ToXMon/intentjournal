import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { useParaAccount } from './useParaAccount'

/**
 * Hook to synchronize Para wallet state with the app store
 * This ensures the app store stays in sync with Para SDK state changes
 */
export function useParaWalletSync() {
  const { account, isConnected, address, wallets, isLoading, error } = useParaAccount()
  const { setParaWalletState, paraWallet } = useAppStore()

  useEffect(() => {
    // Sync Para account state with app store
    const newParaState = {
      isConnected,
      address: address || null,
      authMethod: (account as any)?.authMethod || null,
      walletIds: Array.isArray(wallets) ? wallets.map(w => w.id || w.walletId || w.address) : null,
      isLoading,
      error: error?.message || null,
    }

    // Only update if state has actually changed to avoid unnecessary re-renders
    const hasChanged = 
      paraWallet.isConnected !== newParaState.isConnected ||
      paraWallet.address !== newParaState.address ||
      paraWallet.authMethod !== newParaState.authMethod ||
      JSON.stringify(paraWallet.walletIds) !== JSON.stringify(newParaState.walletIds) ||
      paraWallet.isLoading !== newParaState.isLoading ||
      paraWallet.error !== newParaState.error

    if (hasChanged) {
      setParaWalletState(newParaState)
    }
  }, [
    account,
    isConnected,
    address,
    wallets,
    isLoading,
    error,
    setParaWalletState,
    paraWallet
  ])

  return {
    // Return current Para wallet state from store for consistency
    paraWallet,
    // Also return raw Para account data for components that need it
    paraAccount: account,
  }
}