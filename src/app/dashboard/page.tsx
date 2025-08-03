/**
 * Dedicated DeFi Dashboard Page
 * Full-featured real-time DeFi analytics and portfolio management
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { WalletConnect } from '@/components/wallet-connect';
import { AppNavigation } from '@/components/app-navigation';
import { FlowBreadcrumb } from '@/components/flow-breadcrumb';
import { useParaAccount } from '@/hooks/useParaAccount';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import { DeFiDashboard } from '@/components/defi-dashboard';
import { OneInchDataDashboard } from '@/components/oneinch-data-dashboard';
import { TokenPriceFeed } from '@/components/token-price-feed';
import FusionPlusDemo from '@/components/fusion-plus-demo';
import IJTTokenFaucet from '@/components/ijt-token-faucet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Wallet, Activity } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  
  // Web3 wallet state
  const { address: web3Address, isConnected: isWeb3Connected } = useAccount();
  
  // Para wallet state
  const { address: paraAddress, isConnected: paraConnected } = useParaAccount();
  
  // App store state (unified wallet state)
  const { walletAddress, walletType } = useAppStore();

  // Determine connection status from multiple sources
  const isConnected = walletType === 'para' ? paraConnected : isWeb3Connected;
  const connectedAddress = walletType === 'para' ? paraAddress : web3Address;

  // Also check the unified store state as fallback
  const isUnifiedConnected = !!walletAddress;
  const unifiedAddress = walletAddress;

  // Use the most reliable connection state
  const finalIsConnected = isConnected || isUnifiedConnected;
  const finalAddress = connectedAddress || unifiedAddress;

  // Redirect to home if not connected
  useEffect(() => {
    if (!finalIsConnected) {
      console.log('No wallet connected, redirecting to home');
      router.push('/');
    }
  }, [finalIsConnected, router]);

  if (!finalIsConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Redirecting...
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Please connect your wallet to access the DeFi dashboard.
            </p>
          </div>
        </div>
      </div>
    );
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
                DeFi Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Real-time portfolio analytics and 1inch Data APIs integration
              </p>
            </div>
            <WalletConnect />
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
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
              onClick={() => router.push('/recommendations')}
            >
              View Recommendations
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/test-1inch-data')}
            >
              API Testing
            </Button>
          </div>

          {/* Dashboard Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Portfolio
              </TabsTrigger>
              <TabsTrigger value="market" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Market
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* IJT Token Faucet */}
              <IJTTokenFaucet />
              
              {/* Fusion+ Cross-Chain Demo */}
              <FusionPlusDemo />
              
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Overview</CardTitle>
                  <CardDescription>
                    Your complete DeFi portfolio with real-time data from 1inch APIs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DeFiDashboard compact={false} showHeader={false} defaultTab="overview" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="portfolio" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Token Holdings</CardTitle>
                  <CardDescription>
                    Detailed view of your token balances and prices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DeFiDashboard compact={false} showHeader={false} defaultTab="tokens" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="market" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Token Market Feed</CardTitle>
                  <CardDescription>
                    Live token prices categorized by major tokens, memecoins, DeFi, ReFi, and gaming
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TokenPriceFeed compact={false} showHeader={true} defaultCategory="major" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Advanced Analytics</CardTitle>
                    <CardDescription>
                      Comprehensive 1inch Data APIs dashboard with charts and insights
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <OneInchDataDashboard />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Activity</CardTitle>
                  <CardDescription>
                    Your recent DeFi transactions and trading history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DeFiDashboard compact={false} showHeader={false} defaultTab="activity" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Navigate to different parts of your IntentJournal+ experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => router.push('/journal')}
                >
                  <div className="text-2xl">📝</div>
                  <span className="text-sm">Write Journal Entry</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => router.push('/recommendations')}
                >
                  <div className="text-2xl">🤖</div>
                  <span className="text-sm">AI Recommendations</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => router.push('/share')}
                >
                  <div className="text-2xl">📊</div>
                  <span className="text-sm">Trading Dashboard</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => router.push('/test-1inch-data')}
                >
                  <div className="text-2xl">🔧</div>
                  <span className="text-sm">API Testing</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Integration Info */}
          <Card className="mt-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span>1inch Data APIs Integration</span>
              </CardTitle>
              <CardDescription>
                This dashboard showcases real-time DeFi data powered by 1inch APIs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Live Data Sources</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Balance API - Real-time wallet balances</li>
                    <li>• Price API - Live token prices with 24h changes</li>
                    <li>• Token Metadata API - Comprehensive token information</li>
                    <li>• Transaction History API - Complete trading history</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">BuildBear Integration</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Base mainnet fork for production-like testing</li>
                    <li>• Unlimited gas and transactions</li>
                    <li>• Real contract states and balances</li>
                    <li>• Chain ID 27257 → Base mainnet (8453) mapping</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}