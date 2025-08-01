'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { WalletConnect } from '@/components/wallet-connect'
import { AppNavigation } from '@/components/app-navigation'
import { FlowBreadcrumb } from '@/components/flow-breadcrumb'
import { WalletDataDebug } from '@/components/wallet-data-debug'
import { useParaAccount } from '@/hooks/useParaAccount'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/lib/store'
import { DeFiDashboard } from '@/components/defi-dashboard'
import { TokenPriceFeed } from '@/components/token-price-feed'

export default function JournalPage() {
  const router = useRouter()
  
  // Web3 wallet state
  const { address: web3Address, isConnected: isWeb3Connected } = useAccount()
  
  // Para wallet state
  const { address: paraAddress, isConnected: paraConnected } = useParaAccount()
  
  // App store state (unified wallet state)
  const { walletAddress, walletType, addJournalEntry, journalEntries, generateRecommendations } = useAppStore()
  
  const [journalEntry, setJournalEntry] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleSubmitEntry = async () => {
    if (!journalEntry.trim()) return
    
    setIsSubmitting(true)
    try {
      await addJournalEntry(journalEntry)
      setJournalEntry('')
      
      // Generate AI recommendations after adding entry
      await generateRecommendations()
      
      // Redirect to recommendations page
      router.push('/recommendations')
    } catch (error) {
      console.error('Error submitting journal entry:', error)
    } finally {
      setIsSubmitting(false)
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
              Please connect your wallet to access the journal.
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
          </div>
        </header>

        <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-3">
          {/* Main Journal Entry Section */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Write Your Financial Intent</CardTitle>
              <CardDescription>
                Describe your trading thoughts, market observations, or financial goals. 
                Our AI will analyze your entries to provide personalized DeFi recommendations using 1inch APIs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Example: I'm thinking about diversifying my portfolio. I have some ETH and I'm considering swapping part of it to USDC for stability, but I'm also interested in yield farming opportunities on Base..."
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                className="min-h-[200px] text-base"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmitEntry}
                  disabled={!journalEntry.trim() || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing with AI...
                    </div>
                  ) : (
                    'Submit & Get AI Recommendations'
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setJournalEntry('')}
                  disabled={isSubmitting}
                >
                  Clear
                </Button>
              </div>
              {isSubmitting ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <div className="text-sm">
                      <p className="font-medium">🧠 Venice AI is analyzing your entry...</p>
                      <p className="text-xs mt-1">Creating embeddings and generating personalized recommendations</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  Your entry will be processed with Venice AI to generate personalized DeFi recommendations based on your financial intentions.
                </p>
              )}
            </CardContent>
          </Card>

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