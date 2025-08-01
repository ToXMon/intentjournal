/**
 * 1inch Data APIs Test Page
 * Comprehensive testing interface for all 1inch Data APIs with BuildBear fork
 */

'use client';

import React from 'react';
import { OneInchDataDashboard } from '@/components/oneinch-data-dashboard';
import { OneInchAPITest } from '@/components/oneinch-api-test';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Database, TrendingUp, History, BarChart3 } from 'lucide-react';

export default function Test1InchDataPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">1inch Data APIs Test</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Comprehensive testing interface for 1inch Data APIs including Balances, Prices, Metadata, 
          and Transaction History using BuildBear Base mainnet fork
        </p>
        <div className="flex justify-center space-x-2">
          <Badge variant="secondary">BuildBear Fork</Badge>
          <Badge variant="secondary">Base Mainnet</Badge>
          <Badge variant="secondary">Chain ID: 27257</Badge>
        </div>
      </div>

      {/* API Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">Balance API</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Real-time wallet balances for all tokens with USD values and metadata
            </CardDescription>
            <div className="mt-3 space-y-1">
              <div className="text-xs text-gray-500">Endpoint: /balance/v1.2/{'{chainId}'}/balances/{'{address}'}</div>
              <div className="text-xs text-gray-500">Cache: 30 seconds</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg">Price API</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Live token prices with 24h changes, volume, and market cap data
            </CardDescription>
            <div className="mt-3 space-y-1">
              <div className="text-xs text-gray-500">Endpoint: /price/v1.1/{'{chainId}'}</div>
              <div className="text-xs text-gray-500">Cache: 1 minute</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-lg">History API</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Complete transaction history with swap details and protocol information
            </CardDescription>
            <div className="mt-3 space-y-1">
              <div className="text-xs text-gray-500">Endpoint: /history/v2.0/{'{chainId}'}/history/{'{address}'}</div>
              <div className="text-xs text-gray-500">Cache: 2 minutes</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-lg">Token Metadata</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Comprehensive token information including logos, descriptions, and social links
            </CardDescription>
            <div className="mt-3 space-y-1">
              <div className="text-xs text-gray-500">Endpoint: /token/v1.2/{'{chainId}'}</div>
              <div className="text-xs text-gray-500">Cache: 5 minutes</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BuildBear Integration Info */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span>BuildBear Base Mainnet Fork Integration</span>
          </CardTitle>
          <CardDescription>
            This demo uses BuildBear's Base mainnet fork for production-like testing without real funds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Fork Details</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Chain ID: 27257 (BuildBear Sandbox)</li>
                <li>• RPC: https://rpc.buildbear.io/smooth-spiderman-faa2b8b9</li>
                <li>• Explorer: BuildBear Ethernal</li>
                <li>• Unlimited gas and transactions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">1inch API Mapping</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• BuildBear fork → Base mainnet (8453)</li>
                <li>• Real contract states and balances</li>
                <li>• Live 1inch protocol data</li>
                <li>• Production-like DeFi environment</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 flex space-x-4">
            <a
              href="https://smooth-spiderman-faa2b8b9.ethernal.buildbear.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              View Explorer <ExternalLink className="w-3 h-3 ml-1" />
            </a>
            <a
              href="https://portal.1inch.dev/documentation"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              1inch API Docs <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* API Test Suite */}
      <OneInchAPITest />

      {/* Main Dashboard */}
      <OneInchDataDashboard />

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Implementation</CardTitle>
          <CardDescription>
            How this demo integrates 1inch Data APIs with BuildBear fork
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">API Proxy Architecture</h4>
              <ul className="text-sm space-y-2 text-gray-600">
                <li>• Next.js API routes handle CORS and authentication</li>
                <li>• Automatic chain ID mapping (27257 → 8453)</li>
                <li>• Response caching with appropriate TTL</li>
                <li>• Error handling with fallback responses</li>
                <li>• Rate limiting and request optimization</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Data Integration</h4>
              <ul className="text-sm space-y-2 text-gray-600">
                <li>• Real-time balance fetching from 1inch APIs</li>
                <li>• Price data with 24h change calculations</li>
                <li>• Transaction history with swap detection</li>
                <li>• Token metadata with logo and description</li>
                <li>• Mock chart data generation for visualization</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium mb-2">Key Features Demonstrated</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Multi-Wallet Support:</strong>
                <br />Para and Web3 wallet compatibility
              </div>
              <div>
                <strong>Real-Time Data:</strong>
                <br />Live prices and balances with caching
              </div>
              <div>
                <strong>Production Ready:</strong>
                <br />Error handling and loading states
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}