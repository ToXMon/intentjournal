'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { WalletConnect } from '@/components/wallet-connect'
import { useParaAccount } from '@/hooks/useParaAccount'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  const router = useRouter()
  const { address: paraAddress, isConnected: paraConnected } = useParaAccount()

  const isConnected = paraConnected
  const connectedAddress = paraAddress

  // Redirect to journal page if wallet is connected
  useEffect(() => {
    if (isConnected && connectedAddress) {
      router.push('/journal')
    }
  }, [isConnected, connectedAddress, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            IntentJournal<span className="text-blue-600">+</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            AI-Powered DeFi Journaling with 1inch Integration
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Journal your financial thoughts, get AI-powered DeFi recommendations, 
            execute cross-chain swaps with Fusion+, and share your trading journey.
          </p>
          
          {/* Golden Path Flow Visualization */}
          <div className="mb-12">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-sm">
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                <span>Connect Wallet</span>
              </div>
              <div className="hidden md:block text-gray-400">→</div>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                <span>Journal Entry</span>
              </div>
              <div className="hidden md:block text-gray-400">→</div>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                <span>AI Recommendations</span>
              </div>
              <div className="hidden md:block text-gray-400">→</div>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
                <span>Execute & Share</span>
              </div>
            </div>
          </div>

          <WalletConnect />
          
          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-16 text-left">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🤖 AI-Powered Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Venice AI analyzes your journal entries to understand your financial intentions and market sentiment.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🔄 Cross-Chain DeFi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Execute trades across multiple chains using 1inch Fusion+ for optimal pricing and security.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📱 Social Sharing</CardTitle>
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