/**
 * Trading Page
 * Dedicated page for token swapping using 1inch
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TokenSwapInterface } from '@/components/token-swap-interface';
import { TokenPriceFeed } from '@/components/token-price-feed';
import { AppNavigation } from '@/components/app-navigation';
import { 
  TrendingUp, 
  Zap, 
  Shield, 
  Clock,
  BarChart3,
  ArrowRightLeft
} from 'lucide-react';

function TradingFeatures() {
  const features = [
    {
      icon: <TrendingUp className="w-5 h-5 text-green-600" />,
      title: 'Best Rates',
      description: 'Access liquidity from 163+ DEXes for optimal pricing'
    },
    {
      icon: <Shield className="w-5 h-5 text-blue-600" />,
      title: 'MEV Protection',
      description: 'Built-in protection against front-running and sandwich attacks'
    },
    {
      icon: <Clock className="w-5 h-5 text-purple-600" />,
      title: 'Fast Execution',
      description: 'Lightning-fast swaps with minimal slippage'
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-orange-600" />,
      title: 'Real-time Data',
      description: 'Live price feeds and market analytics'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {features.map((feature, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {feature.icon}
            </div>
            <div>
              <h3 className="font-medium text-sm">{feature.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{feature.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function TradingStats() {
  const stats = [
    { label: 'Total Volume', value: '$485B+', change: '+12.5%' },
    { label: 'DEXes Integrated', value: '163+', change: '+5 new' },
    { label: 'Networks Supported', value: '12', change: 'Multi-chain' },
    { label: 'Gas Savings', value: '42%', change: 'vs direct' }
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">1inch Protocol Stats</CardTitle>
        <CardDescription>
          Real-time metrics from the 1inch ecosystem
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
              <Badge variant="secondary" className="text-xs mt-1">
                {stat.change}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TradePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppNavigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <ArrowRightLeft className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">DeFi Trading Hub</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Swap tokens at the best rates using 1inch's advanced aggregation protocol. 
            Access deep liquidity across 163+ decentralized exchanges with MEV protection.
          </p>
        </div>

        {/* Trading Stats */}
        <TradingStats />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Trading Interface */}
          <div className="lg:col-span-2 space-y-6">
            <TradingFeatures />
            <TokenSwapInterface />
          </div>

          {/* Sidebar - Price Feed */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  <span>Live Prices</span>
                </CardTitle>
                <CardDescription>
                  Real-time token prices from 1inch
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TokenPriceFeed compact={true} showHeader={false} />
              </CardContent>
            </Card>

            {/* Trading Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trading Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Zap className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Check Price Impact</p>
                    <p className="text-xs text-gray-500">
                      Keep price impact below 2% for optimal trades
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Set Slippage Wisely</p>
                    <p className="text-xs text-gray-500">
                      1% slippage works for most stable pairs
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Clock className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Time Your Trades</p>
                    <p className="text-xs text-gray-500">
                      Lower gas fees during off-peak hours
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Protocol Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About 1inch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  1inch is a decentralized exchange aggregator that sources liquidity 
                  from various DEXes to offer users the best possible trading rates.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline">Aggregation Protocol</Badge>
                  <Badge variant="outline">Limit Orders</Badge>
                  <Badge variant="outline">Fusion</Badge>
                  <Badge variant="outline">Fusion+</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Powered by 1inch Protocol</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Experience the future of DeFi trading with advanced aggregation, 
              MEV protection, and cross-chain capabilities.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}