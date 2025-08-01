'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { useState } from 'react'
import { ThemeProvider } from 'next-themes'
import { config } from '@/lib/wagmi'
import { useWeb3WalletSync } from '@/hooks/useWeb3WalletSync'

import '@rainbow-me/rainbowkit/styles.css'

function WalletSyncProvider({ children }: { children: React.ReactNode }) {
  // Initialize Web3 wallet sync hook
  useWeb3WalletSync();
  
  return <>{children}</>;
}

export function SimpleProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <WalletSyncProvider>
              {children}
            </WalletSyncProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  )
}