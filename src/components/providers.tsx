'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { useState, useEffect } from 'react'
import { ThemeProvider } from 'next-themes'
import { config } from '@/lib/wagmi'
import { useParaSession } from '@/hooks/useParaSession'
import { useWeb3WalletSync } from '@/hooks/useWeb3WalletSync'
import { useWalletDataPersistence } from '@/hooks/useWalletDataPersistence'
import { useAppStore } from '@/lib/store'
import { ErrorBoundary } from './error-boundary'

import '@rainbow-me/rainbowkit/styles.css'

// Hydration-safe wrapper
function HydrationProvider({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function WalletSyncProvider({ children }: { children: React.ReactNode }) {
  // Initialize wallet sync hooks
  useWeb3WalletSync();
  useWalletDataPersistence();
  
  // Initialize wallet data on mount
  const { initializeWalletData } = useAppStore();
  
  useEffect(() => {
    // Small delay to ensure wallet state is restored from persistence
    const timer = setTimeout(() => {
      initializeWalletData();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [initializeWalletData]);
  
  return <>{children}</>;
}

function ParaSessionProvider({ children }: { children: React.ReactNode }) {
  const { isInitialized } = useParaSession();
  const [showFallback, setShowFallback] = useState(false);
  
  // Add a fallback timer in case Para session hangs
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isInitialized) {
        console.warn("Para session initialization timeout, showing app anyway");
        setShowFallback(true);
      }
    }, 10000); // 10 second fallback
    
    return () => clearTimeout(timer);
  }, [isInitialized]);
  
  // Show loading state while Para session is initializing (with fallback)
  if (!isInitialized && !showFallback) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Initializing wallet session...</p>
          <p className="text-xs text-gray-500 mt-2">This should only take a few seconds</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Disable automatic refetching during hydration
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  }))

  return (
    <ErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <HydrationProvider>
          <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
              <RainbowKitProvider
                modalSize="compact"
                initialChain={config.chains[0]}
              >
                <WalletSyncProvider>
                  <ParaSessionProvider>
                    {children}
                  </ParaSessionProvider>
                </WalletSyncProvider>
              </RainbowKitProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </HydrationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}