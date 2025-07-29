'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { WalletConnect } from '@/components/wallet-connect'
import { useParaAccount } from '@/hooks/useParaAccount'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'
import { Share2, Twitter, Copy, Download, TrendingUp } from 'lucide-react'

export default function SharePage() {
  const router = useRouter()
  const { address: paraAddress, isConnected: paraConnected } = useParaAccount()
  const { 
    activeOrders, 
    tradeHistory, 
    generateSocialPost,
    isLoading 
  } = useAppStore()
  const [generatedPost, setGeneratedPost] = useState<string | null>(null)
  const [isGeneratingPost, setIsGeneratingPost] = useState(false)
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const isConnected = paraConnected

  // Redirect to home if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

  const handleGeneratePost = async (trade: any) => {
    setIsGeneratingPost(true)
    try {
      const post = await generateSocialPost(trade)
      setGeneratedPost(post.text)
    } catch (error) {
      console.error('Error generating social post:', error)
    } finally {
      setIsGeneratingPost(false)
    }
  }

  const handleCopyText = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(type)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  const handleShareToTwitter = (text: string) => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    window.open(twitterUrl, '_blank')
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Redirecting...
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Please connect your wallet to view your trades.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Share Your Trading Journey
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Generate social posts and share your DeFi achievements
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
              onClick={() => router.push('/recommendations')}
            >
              ← Back to Recommendations
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/journal')}
            >
              New Journal Entry
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Active Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Active Orders
                </CardTitle>
                <CardDescription>
                  Your pending Fusion+ orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm mb-2">
                      No active orders
                    </p>
                    <p className="text-xs text-gray-400">
                      Execute recommendations to create Fusion+ orders
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => router.push('/recommendations')}
                    >
                      View Recommendations
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeOrders.map((order) => (
                      <div key={order.hash} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">
                              {order.recommendation.tokenPair.from.symbol} → {order.recommendation.tokenPair.to.symbol}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 font-mono">
                          {order.hash.slice(0, 10)}...{order.hash.slice(-8)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trade History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Completed Trades
                </CardTitle>
                <CardDescription>
                  Your successful DeFi transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tradeHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm mb-2">
                      No completed trades yet
                    </p>
                    <p className="text-xs text-gray-400">
                      Complete your first Fusion+ order to see trade history
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tradeHistory.slice(-5).reverse().map((trade) => (
                      <div key={trade.orderHash} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">
                              {trade.fromAmount} {trade.fromToken.symbol} → {trade.toAmount} {trade.toToken.symbol}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(trade.executionTime).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant={trade.status === 'completed' ? 'default' : 'secondary'}>
                            {trade.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGeneratePost(trade)}
                            disabled={isGeneratingPost}
                          >
                            {isGeneratingPost ? 'Generating...' : 'Generate Post'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Generated Social Post */}
          {generatedPost && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Twitter className="h-5 w-5 text-blue-500" />
                  Generated Social Post
                </CardTitle>
                <CardDescription>
                  AI-generated post about your trading activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm font-medium">
                    {generatedPost}
                  </pre>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleShareToTwitter(generatedPost)}
                    className="flex items-center gap-2"
                  >
                    <Twitter className="h-4 w-4" />
                    Share on Twitter
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCopyText(generatedPost, 'post')}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    {copiedText === 'post' ? 'Copied!' : 'Copy Text'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Journey Summary */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your IntentJournal+ Journey</CardTitle>
              <CardDescription>
                Track your progress through the AI-powered DeFi experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {/* This would come from store */}
                    3
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Journal Entries
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {activeOrders.length}
                  </div>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Active Orders
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {tradeHistory.length}
                  </div>
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    Completed Trades
                  </p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    {generatedPost ? '1' : '0'}
                  </div>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    Social Posts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}