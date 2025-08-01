'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { WalletConnect } from '@/components/wallet-connect'
import { AppNavigation } from '@/components/app-navigation'
import { FlowBreadcrumb } from '@/components/flow-breadcrumb'
import { useParaAccount } from '@/hooks/useParaAccount'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'
import { ArrowRight, TrendingUp, Shield, Clock } from 'lucide-react'
import { OneInchProtocolSuite } from '@/components/oneinch-protocol-suite'
import { DeFiDashboard } from '@/components/defi-dashboard'

export default function RecommendationsPage() {
  const router = useRouter()
  
  // Web3 wallet state
  const { address: web3Address, isConnected: isWeb3Connected } = useAccount()
  
  // Para wallet state
  const { address: paraAddress, isConnected: paraConnected } = useParaAccount()
  
  // App store state (unified wallet state)
  const { 
    walletAddress, 
    walletType,
    currentRecommendations, 
    createFusionOrder, 
    journalEntries,
    isLoading 
  } = useAppStore()
  
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)

  // Determine connection status from multiple sources
  const isConnected = walletType === 'para' ? paraConnected : isWeb3Connected
  const connectedAddress = walletType === 'para' ? paraAddress : web3Address

  // Also check the unified store state as fallback
  const isUnifiedConnected = !!walletAddress
  const unifiedAddress = walletAddress

  // Use the most reliable connection state
  const finalIsConnected = isConnected || isUnifiedConnected
  const finalAddress = connectedAddress || unifiedAddress

  // Redirect to home if not connected
  useEffect(() => {
    if (!finalIsConnected) {
      console.log('No wallet connected, redirecting to home')
      router.push('/')
    }
  }, [finalIsConnected, router])

  const handleCreateOrder = async (recommendation: any) => {
    if (!recommendation) return
    
    setIsCreatingOrder(true)
    setSelectedRecommendation(recommendation.id)
    
    try {
      const orderHash = await createFusionOrder(recommendation)
      console.log('Order created:', orderHash)
      
      // Redirect to share page after successful order creation
      router.push('/share')
    } catch (error) {
      console.error('Error creating Fusion+ order:', error)
    } finally {
      setIsCreatingOrder(false)
      setSelectedRecommendation(null)
    }
  }

  if (!finalIsConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Redirecting...
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Please connect your wallet to view recommendations.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Component */}
        <AppNavigation />
        
        {/* Flow Breadcrumb */}
        <FlowBreadcrumb />
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                AI-Powered DeFi Recommendations
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Personalized recommendations based on your journal entries and market analysis
              </p>
            </div>
            <WalletConnect />
          </div>
        </header>

        <div className="max-w-6xl mx-auto">
          {/* Navigation */}
          <div className="flex gap-2 mb-6">
            <Button 
              variant="outline" 
              onClick={() => router.push('/journal')}
            >
              ← Back to Journal
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
            >
              DeFi Dashboard
            </Button>
          </div>

          {/* DeFi Dashboard */}
          <div className="mb-8">
            <DeFiDashboard compact={false} showHeader={true} defaultTab="overview" />
          </div>

          {/* 1inch Protocol Suite */}
          <div className="mb-8">
            <OneInchProtocolSuite />
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-300">
                    Analyzing your journal entries and generating recommendations...
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : currentRecommendations.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Recommendations Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {journalEntries.length === 0 
                      ? "Start by writing journal entries to get personalized DeFi recommendations."
                      : "We're processing your journal entries. Check back in a moment for recommendations."
                    }
                  </p>
                  <Button onClick={() => router.push('/journal')}>
                    {journalEntries.length === 0 ? 'Write First Entry' : 'Add More Entries'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {currentRecommendations.map((recommendation) => (
                <Card key={recommendation.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-lg">
                            {recommendation.tokenPair.from.symbol} → {recommendation.tokenPair.to.symbol}
                          </span>
                          <Badge variant="secondary">
                            {Math.round(recommendation.confidence * 100)}% confidence
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-2">
                          Cross-chain swap recommendation powered by 1inch Fusion+
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          ${recommendation.estimatedPrice}
                        </p>
                        <p className="text-sm text-gray-500">
                          per {recommendation.tokenPair.to.symbol}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* AI Reasoning */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        💡 AI Analysis
                      </h4>
                      <p className="text-blue-800 dark:text-blue-200 text-sm">
                        {recommendation.reasoning}
                      </p>
                    </div>

                    {/* Trade Details */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Route</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {recommendation.route.protocols.join(', ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Est. Gas</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {recommendation.route.gas} units
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                          <Shield className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Security</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            1inch Fusion+
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Token Details */}
                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <h5 className="font-medium mb-2">From Token</h5>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold">
                              {recommendation.tokenPair.from.symbol.slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{recommendation.tokenPair.from.name}</p>
                            <p className="text-xs text-gray-500">
                              Chain ID: {recommendation.tokenPair.from.chainId}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2">To Token</h5>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold">
                              {recommendation.tokenPair.to.symbol.slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{recommendation.tokenPair.to.name}</p>
                            <p className="text-xs text-gray-500">
                              Chain ID: {recommendation.tokenPair.to.chainId}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-4">
                      <Button
                        onClick={() => handleCreateOrder(recommendation)}
                        disabled={isCreatingOrder}
                        className="w-full"
                        size="lg"
                      >
                        {isCreatingOrder && selectedRecommendation === recommendation.id
                          ? 'Creating Fusion+ Order...'
                          : 'Execute with Fusion+'
                        }
                      </Button>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        This will create a cross-chain order using 1inch Fusion+ protocol
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}