'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { WalletConnect } from '@/components/wallet-connect'
import { AppNavigation } from '@/components/app-navigation'
import { FlowBreadcrumb } from '@/components/flow-breadcrumb'
import { WalletDataDebug } from '@/components/wallet-data-debug'
import { IntentLimitOrder } from '@/components/intent-limit-order'
import { IntentStatusTracker } from '@/components/intent-status-tracker'
import { BiasEdgeAnalyzer } from '@/components/bias-edge-analyzer'
import { EtherlinkCrossChainDemo } from '@/components/etherlink-cross-chain-demo'
import { OnChainIntentExecutor } from '@/components/onchain-intent-executor'
import { CleanJournalInterface } from '@/components/clean-journal-interface'
import { useParaAccount } from '@/hooks/useParaAccount'
import type { OnChainEvidence, IntentExecutionResult } from '@/utils/intent-execution'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/lib/store'
import { DeFiDashboard } from '@/components/defi-dashboard'
import { TokenPriceFeed } from '@/components/token-price-feed'
import type { LimitOrderResult } from '@/utils/oneinch/limit-orders'

export default function JournalPage() {
  const router = useRouter()
  
  // Web3 wallet state
  const { address: web3Address, isConnected: isWeb3Connected } = useAccount()
  
  // Para wallet state
  const { address: paraAddress, isConnected: paraConnected } = useParaAccount()
  
  // App store state (unified wallet state)
  const { walletAddress, walletType, addJournalEntry, journalEntries, generateRecommendations, currentRecommendations } = useAppStore()
  
  const [journalEntry, setJournalEntry] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmittedIntent, setHasSubmittedIntent] = useState(false)
  const [showLimitOrderFlow, setShowLimitOrderFlow] = useState(false)
  const [currentIntentId, setCurrentIntentId] = useState<string | null>(null)
  const [createdOrders, setCreatedOrders] = useState<LimitOrderResult[]>([])
  const [biasEdgeAnalysis, setBiasEdgeAnalysis] = useState<{
    marketBias: 'bullish' | 'bearish' | 'neutral';
    edgeScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    reasoning: string;
  } | null>(null)
  const [onChainEvidence, setOnChainEvidence] = useState<OnChainEvidence[]>([])
  const [hasVerifiedIntent, setHasVerifiedIntent] = useState(false)

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

  const handleSubmitEntry = async (entry: string) => {
    if (!entry.trim()) return
    
    setIsSubmitting(true)
    try {
      await addJournalEntry(entry)
      
      // Store the current intent ID for limit order creation
      const latestEntry = journalEntries[0]
      if (latestEntry) {
        setCurrentIntentId(latestEntry.id)
      }
      
      // Generate AI recommendations after adding entry
      await generateRecommendations()
      
      // Transition from clean interface to complex interface
      setHasSubmittedIntent(true)
      setShowLimitOrderFlow(true)
    } catch (error) {
      console.error('Error submitting journal entry:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOrderCreated = (order: LimitOrderResult) => {
    setCreatedOrders(prev => [order, ...prev])
    console.log('✅ New limit order created from intent:', order)
  }

  const handleIntentExecuted = (result: IntentExecutionResult) => {
    console.log('✅ Intent executed on-chain:', result)
    // Intent execution successful, but need to wait for evidence verification
  }

  const handleEvidenceVerified = (evidence: OnChainEvidence[]) => {
    console.log('✅ On-chain evidence verified:', evidence)
    setOnChainEvidence(evidence)
    setHasVerifiedIntent(true)
    // Now Bias & Edge analysis is available
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
              Please connect your wallet to access the journal.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show clean interface initially, complex interface after submission
  if (!hasSubmittedIntent) {
    return (
      <CleanJournalInterface
        onSubmit={handleSubmitEntry}
        isSubmitting={isSubmitting}
        placeholder="Share your DeFi thoughts and intentions... 

Example: I'm thinking about diversifying my portfolio. I have some ETH and I'm considering swapping part of it to USDC for stability, but I'm also interested in yield farming opportunities on Base..."
        helpText="Your entry will be processed with Venice AI to generate personalized DeFi recommendations and create gasless limit orders."
      />
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
                Financial Intent Journal
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Share your financial thoughts and get AI-powered DeFi recommendations
              </p>
            </div>
            <WalletConnect />
          </div>
          
          {/* Navigation */}
          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/recommendations')}
            >
              View Recommendations
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
            >
              DeFi Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setHasSubmittedIntent(false)}
            >
              New Entry
            </Button>
          </div>
        </header>

        <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-3">
          {/* Main Recommendations and Actions Section */}
          <div className="md:col-span-2 space-y-6">

            {/* Intent-Based Limit Order Flow - Now shown after intent submission */}
            {hasSubmittedIntent && currentIntentId && (
              <Tabs defaultValue="recommendation" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="recommendation">AI Recommendation</TabsTrigger>
                  <TabsTrigger value="execute">Execute On-Chain</TabsTrigger>
                  <TabsTrigger value="biasedge" disabled={!hasVerifiedIntent}>
                    Bias & Edge {!hasVerifiedIntent && '🔒'}
                  </TabsTrigger>
                  <TabsTrigger value="crosschain">Cross-Chain</TabsTrigger>
                  <TabsTrigger value="limitorder">Create Order</TabsTrigger>
                </TabsList>
                
                <TabsContent value="recommendation" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">🤖 AI-Powered Recommendation</CardTitle>
                      <CardDescription>
                        Based on your intent analysis and current market conditions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {currentRecommendations.length > 0 && currentRecommendations[0] ? (
                        <div className="space-y-4">
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              {currentRecommendations[0].reasoning}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="text-center">
                              <p className="font-medium">{currentRecommendations[0].tokenPair.from.symbol}</p>
                              <p className="text-sm text-gray-500">{currentRecommendations[0].route.fromAmount}</p>
                            </div>
                            <div className="text-blue-600 dark:text-blue-400">→</div>
                            <div className="text-center">
                              <p className="font-medium">{currentRecommendations[0].tokenPair.to.symbol}</p>
                              <p className="text-sm text-gray-500">{currentRecommendations[0].route.toAmount}</p>
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-sm text-gray-500">AI Confidence</p>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                              {(currentRecommendations[0].confidence * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Generating AI recommendations...
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="execute" className="space-y-4">
                  {currentRecommendations.length > 0 && currentRecommendations[0] ? (
                    <OnChainIntentExecutor
                      intentText={journalEntries.find(e => e.id === currentIntentId)?.content || ''}
                      recommendation={currentRecommendations[0]}
                      onExecutionComplete={handleIntentExecuted}
                      onEvidenceVerified={handleEvidenceVerified}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">
                        Waiting for AI recommendations to load...
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="biasedge" className="space-y-4">
                  {hasVerifiedIntent ? (
                    <BiasEdgeAnalyzer
                      intentText={journalEntries.find(e => e.id === currentIntentId)?.content || ''}
                      tokenAddress={currentRecommendations[0]?.tokenPair.from.address}
                      onAnalysisComplete={setBiasEdgeAnalysis}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <div className="mb-4">
                        <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                          <span className="text-2xl">🔒</span>
                        </div>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        On-Chain Evidence Required
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Execute your intent on-chain first to unlock advanced Bias & Edge analysis with technical indicators and AI vision.
                      </p>
                      <p className="text-xs text-gray-500">
                        Go to "Execute On-Chain" tab to create a real Dutch auction order
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="crosschain" className="space-y-4">
                  <EtherlinkCrossChainDemo
                    intentText={journalEntries.find(e => e.id === currentIntentId)?.content || ''}
                    recommendation={currentRecommendations.length > 0 && currentRecommendations[0] ? {
                      fromToken: currentRecommendations[0].tokenPair.from,
                      toToken: currentRecommendations[0].tokenPair.to,
                      fromAmount: currentRecommendations[0].route.fromAmount,
                      toAmount: currentRecommendations[0].route.toAmount,
                    } : undefined}
                  />
                </TabsContent>
                
                <TabsContent value="limitorder" className="space-y-4">
                  {currentRecommendations.length > 0 && currentRecommendations[0] ? (
                    <IntentLimitOrder
                      recommendation={currentRecommendations[0]}
                      intentId={currentIntentId}
                      intentText={journalEntries.find(e => e.id === currentIntentId)?.content || ''}
                      onOrderCreated={handleOrderCreated}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">
                        Waiting for AI recommendations to load...
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}

            {/* Intent Status Tracker */}
            {createdOrders.length > 0 && (
              <IntentStatusTracker
                orders={createdOrders}
                onOrderUpdate={(orderId, status) => {
                  console.log(`Order ${orderId} updated to status: ${status}`)
                }}
              />
            )}
          </div>

          {/* DeFi Dashboard Sidebar */}
          <div className="space-y-4">
            {/* Token Price Feed */}
            <TokenPriceFeed compact={true} showHeader={false} defaultCategory="major" />
            
            {/* DeFi Dashboard */}
            <DeFiDashboard compact={true} showHeader={false} />
            
            {/* Recent Entries */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Entries</CardTitle>
                <CardDescription>
                  Your journal history
                </CardDescription>
              </CardHeader>
              <CardContent>
              {journalEntries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm mb-2">
                    No entries yet
                  </p>
                  <p className="text-xs text-gray-400">
                    Start journaling to build your financial intent history
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {journalEntries.slice(-5).reverse().map((entry) => (
                    <div key={entry.id} className="border-l-4 border-blue-500 pl-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-r">
                      <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3">
                        {entry.content}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </p>
                        {entry.processed ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200 px-2 py-1 rounded flex items-center gap-1">
                              🧠 AI Processed
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 px-2 py-1 rounded">
                            Processing...
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {journalEntries.length > 5 && (
                    <p className="text-xs text-gray-400 text-center">
                      +{journalEntries.length - 5} more entries
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="max-w-4xl mx-auto mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💡 Tips for Better Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Be Specific</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Mention specific tokens, amounts, and timeframes for more targeted recommendations.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Share Context</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Include your risk tolerance, investment goals, and market outlook.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Regular Updates</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Journal regularly to help AI understand your evolving financial intentions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Debug Component for Development */}
          <WalletDataDebug />
        </div>
      </div>
    </div>
  )
}