/**
 * 1inch Proxy Test Page
 * Comprehensive testing of all 1inch protocols through the API proxy
 */

"use client";

import { OneInchProtocolTest } from '@/components/oneinch-protocol-test';
import { DeFiIntegrationTest } from '@/components/defi-integration-test';
import { WalletConnect } from '@/components/wallet-connect';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Test1inchProxyPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">1inch API Proxy Test Suite</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Comprehensive testing of all 1inch protocols (Classic Swap, Limit Orders, Fusion, Fusion+) 
          through our enhanced API proxy with support for both Para and Web3 wallets.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proxy Features</CardTitle>
          <CardDescription>
            Our enhanced Next.js API proxy supports all 1inch protocols with CORS handling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✅ Classic Swap</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Health checks</li>
                <li>• Token listings</li>
                <li>• Swap quotes</li>
                <li>• Transaction data</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✅ Limit Orders</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Active orders</li>
                <li>• Order book</li>
                <li>• Order creation</li>
                <li>• Order cancellation</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✅ Fusion Protocol</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Intent-based quotes</li>
                <li>• Gasless swaps</li>
                <li>• MEV protection</li>
                <li>• Order tracking</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✅ Fusion+ Cross-chain</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Cross-chain quotes</li>
                <li>• Chain support</li>
                <li>• Bridge routing</li>
                <li>• Self-custody</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <WalletConnect />

      <Tabs defaultValue="protocols" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="protocols">Protocol Tests</TabsTrigger>
          <TabsTrigger value="integration">Integration Tests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="protocols" className="space-y-6">
          <OneInchProtocolTest />
        </TabsContent>
        
        <TabsContent value="integration" className="space-y-6">
          <DeFiIntegrationTest />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>API Proxy Endpoints</CardTitle>
          <CardDescription>
            All endpoints are accessible through /api/1inch/ with automatic protocol routing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
            <div className="space-y-3">
              <h4 className="font-sans font-medium text-sm">Classic Swap Endpoints</h4>
              <div className="space-y-1 text-gray-600">
                <p>GET /api/1inch/swap/{'{chainId}'}/healthcheck</p>
                <p>GET /api/1inch/swap/{'{chainId}'}/tokens</p>
                <p>GET /api/1inch/swap/{'{chainId}'}/quote</p>
                <p>GET /api/1inch/swap/{'{chainId}'}/swap</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-sans font-medium text-sm">Balance & Price APIs</h4>
              <div className="space-y-1 text-gray-600">
                <p>GET /api/1inch/balance/{'{chainId}'}/balances/{'{address}'}</p>
                <p>GET /api/1inch/price/{'{chainId}'}/{'{token}'}</p>
                <p>GET /api/1inch/price/{'{chainId}'}?tokens=...</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-sans font-medium text-sm">Limit Order Protocol</h4>
              <div className="space-y-1 text-gray-600">
                <p>GET /api/1inch/orderbook/{'{chainId}'}/active-orders</p>
                <p>GET /api/1inch/orderbook/{'{chainId}'}/orderbook</p>
                <p>POST /api/1inch/orderbook/{'{chainId}'}/order</p>
                <p>DELETE /api/1inch/orderbook/{'{chainId}'}/order</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-sans font-medium text-sm">Fusion Protocols</h4>
              <div className="space-y-1 text-gray-600">
                <p>POST /api/1inch/fusion/{'{chainId}'}/quote</p>
                <p>POST /api/1inch/fusion/{'{chainId}'}/order</p>
                <p>GET /api/1inch/fusion-plus/supported-chains</p>
                <p>POST /api/1inch/fusion-plus/quote</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}