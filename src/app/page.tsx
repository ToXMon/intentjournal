'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { WalletConnect } from '@/components/wallet-connect'
import { AppNavigation } from '@/components/app-navigation'
import { FlowBreadcrumb } from '@/components/flow-breadcrumb'
import { useParaAccount } from '@/hooks/useParaAccount'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, BookOpen } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  
  // Web3 wallet state
  const { address: web3Address, isConnected: isWeb3Connected } = useAccount()
  
  // Para wallet state
  const { address: paraAddress, isConnected: paraConnected } = useParaAccount()
  
  // App store state (unified wallet state)
  const { walletAddress, walletType } = useAppStore()

  // Determine connection status from multiple sources
  const isConnected = walletType === 'para' ? paraConnected : isWeb3Connected
  const connectedAddress = walletType === 'para' ? paraAddress : web3Address

  // Also check the unified store state as fallback
  const isUnifiedConnected = !!walletAddress
  const unifiedAddress = walletAddress

  // Use the most reliable connection state
  const finalIsConnected = isConnected || isUnifiedConnected
  const finalAddress = connectedAddress || unifiedAddress

  const handleGoToJournal = () => {
    router.push('/journal')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Navigation Component - Hidden on mobile */}
        <div className="hidden md:block">
          <AppNavigation />
        </div>
        
        {/* Flow Breadcrumb - Simplified on mobile */}
        <div className="mb-4 md:mb-0">
          <FlowBreadcrumb />
        </div>
        
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
            IntentJournal<span className="text-blue-600">+</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 md:mb-8">
            AI-Powered DeFi Journaling with 1inch Integration
          </p>
          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 mb-8 md:mb-12 max-w-2xl mx-auto px-4">
            Journal your financial thoughts, get AI-powered DeFi recommendations, 
            execute cross-chain swaps with Fusion+, and share your trading journey.
          </p>
          
          {/* Golden Path Flow Visualization */}
          <div className="mb-8 md:mb-12">
            {/* Mobile: Vertical Flow */}
            <div className="md:hidden space-y-3">
              {[
                { num: 1, text: 'Connect Wallet', color: 'bg-blue-500' },
                { num: 2, text: 'Journal Entry', color: 'bg-green-500' },
                { num: 3, text: 'AI Recommendations', color: 'bg-purple-500' },
                { num: 4, text: 'Execute & Share', color: 'bg-orange-500' }
              ].map((step, index) => (
                <div key={step.num} className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${step.color} text-white rounded-full flex items-center justify-center font-bold text-sm`}>
                    {step.num}
                  </div>
                  <span className="text-sm font-medium">{step.text}</span>
                  {index < 3 && <div className="ml-auto text-gray-400">↓</div>}
                </div>
              ))}
            </div>
            
            {/* Desktop: Horizontal Flow */}
            <div className="hidden md:flex flex-row items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                <span>Connect Wallet</span>
              </div>
              <div className="text-gray-400">→</div>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                <span>Journal Entry</span>
              </div>
              <div className="text-gray-400">→</div>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                <span>AI Recommendations</span>
              </div>
              <div className="text-gray-400">→</div>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
                <span>Execute & Share</span>
              </div>
            </div>
          </div>

          <WalletConnect />
          
          {/* Connected State - Show journal button */}
          {finalIsConnected && (
            <div className="mt-6 md:mt-8">
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <h3 className="text-base md:text-lg font-semibold text-green-800 dark:text-green-200">
                      Wallet Connected Successfully!
                    </h3>
                  </div>
                  
                  <div className="space-y-4 text-center">
                    <p className="text-sm md:text-base text-green-700 dark:text-green-300">
                      Ready to start journaling your financial thoughts and get AI-powered DeFi recommendations!
                    </p>
                    <Button 
                      onClick={handleGoToJournal}
                      size="lg"
                      className="flex items-center gap-2 mx-auto mobile-touch-target w-full md:w-auto"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span className="text-sm md:text-base">Start Journaling for AI Recommendations</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <p className="text-xs text-green-600 dark:text-green-400 px-2">
                      Write your financial thoughts → Get Venice AI analysis → Execute with 1inch
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* App Navigation for Testing - Hidden on mobile when connected */}
          <div className={`mt-8 md:mt-12 ${finalIsConnected ? 'hidden md:block' : ''}`}>
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg">
                <h3 className="text-base md:text-lg font-semibold mb-4 text-center">🧪 Test the Full Flow</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-center">
                  <div className="p-3 md:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-2 text-xs md:text-sm">1</div>
                    <p className="text-xs md:text-sm font-medium">Connect Wallet</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 hidden md:block">Para or Web3</p>
                  </div>
                  <div className="p-3 md:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-2 text-xs md:text-sm">2</div>
                    <p className="text-xs md:text-sm font-medium">Write Journal</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 hidden md:block">Financial thoughts</p>
                  </div>
                  <div className="p-3 md:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-2 text-xs md:text-sm">3</div>
                    <p className="text-xs md:text-sm font-medium">Get AI Recs</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 hidden md:block">Venice AI analysis</p>
                  </div>
                  <div className="p-3 md:p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-2 text-xs md:text-sm">4</div>
                    <p className="text-xs md:text-sm font-medium">Execute & Share</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 hidden md:block">1inch Fusion+</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-12 md:mt-16 text-left">
            <Card className="mobile-touch-target">
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">🤖 AI-Powered Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Venice AI analyzes your journal entries to understand your financial intentions and market sentiment.
                </p>
              </CardContent>
            </Card>
            <Card className="mobile-touch-target">
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">🔄 Cross-Chain DeFi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Execute trades across multiple chains using 1inch Fusion+ for optimal pricing and security.
                </p>
              </CardContent>
            </Card>
            <Card className="mobile-touch-target">
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">📱 Social Sharing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Generate AI-powered social posts with images to share your trading journey and insights.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}