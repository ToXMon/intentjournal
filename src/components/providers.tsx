'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { useState } from 'react'
import { ThemeProvider } from 'next-themes'
import { config } from '@/lib/wagmi'
import { useParaSession } from '@/hooks/useParaSession'

function ParaSessionProvider({ children }: { children: React.ReactNode }) {
  const { isInitialized } = useParaSession();
  
  // Show loading state while Para session is initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Initializing wallet session...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
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
          <ParaSessionProvider>
            {children}
          </ParaSessionProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  )
}