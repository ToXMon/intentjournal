/**
 * DeFi Dashboard Component
 * Real-time token and pricing data integrated into the main application flow
 */

'use client';

import React, { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, TrendingUp, TrendingDown, Wallet, BarChart3, Eye, EyeOff } from 'lucide-react';
import {
  useTokenPrices,
  useTokenMetadata,
  useTransactionHistory,
  useWalletData,
  useBuildBearData,
} from '@/hooks/useOneInchData';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { formatEther } from 'viem';
import { TokenPriceFeed } from '@/components/token-price-feed';

interface TokenRowProps {
  token: any;
  price?: any;
  metadata?: any;
  compact?: boolean;
}

function TokenRow({ token, price, metadata, compact = false }: TokenRowProps) {
  const balance = parseFloat(token.balance || '0');
  const decimals = token.decimals || 18;
  const balanceFormatted = balance / Math.pow(10, decimals);
  const priceUSD = parseFloat(price?.priceUSD || '0');
  const balanceUSD = balanceFormatted * priceUSD;

  if (compact) {
    return (
      <div className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium">{token.symbol?.charAt(0) || '?'}</span>
          </div>
          <div>
            <div className="text-sm font-medium">{token.symbol || 'UNKNOWN'}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">
            {balanceFormatted.toFixed(4)}
          </div>
          <div className="text-xs text-gray-500">
            ${balanceUSD.toFixed(2)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
      <div className="flex items-center space-x-3">
        {metadata?.logoURI ? (
          <img 
            src={metadata.logoURI} 
            alt={token.symbol}
            className="w-8 h-8 rounded-full"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium">{token.symbol?.charAt(0) || '?'}</span>
          </div>
        )}
        <div>
          <div className="font-medium">{token.symbol || 'UNKNOWN'}</div>
          <div className="text-sm text-gray-500">{metadata?.name || token.name || 'Unknown Token'}</div>
        </div>
      </div>
      
      <div className="text-right">
        <div className="font-medium">
          {balanceFormatted.toFixed(6)} {token.symbol}
        </div>
        <div className="text-sm text-gray-500">
          ${balanceUSD.toFixed(2)}
        </div>
        {price?.change24h && (
          <div className={`text-xs flex items-center ${
            parseFloat(price.change24h) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {parseFloat(price.change24h) >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {Math.abs(parseFloat(price.change24h)).toFixed(2)}%
          </div>
        )}
      </div>
    </div>
  );
}

function BuildBearStatus() {
  const { isConnected, blockNumber, gasPrice, balance, isBuildBearFork, loading, error, refetch } = useBuildBearData();

  if (!isBuildBearFork) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <CardTitle className="text-sm">BuildBear Fork</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="font-bold">{blockNumber}</div>
            <div className="text-gray-500">Block</div>
          </div>
          <div className="text-center">
            <div className="font-bold">{gasPrice} Gwei</div>
            <div className="text-gray-500">Gas</div>
          </div>
          <div className="text-center">
            <div className="font-bold">{parseFloat(balance).toFixed(2)} ETH</div>
            <div className="text-gray-500">Balance</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DeFiDashboardProps {
  compact?: boolean;
  showHeader?: boolean;
  defaultTab?: string;
}

export function DeFiDashboard({ compact = false, showHeader = true, defaultTab = 'overview' }: DeFiDashboardProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [isVisible, setIsVisible] = useState(true);

  // Use comprehensive wallet data hook
  const { balances, prices, metadata, history, loading, error, refetch } = useWalletData();

  if (!address) {
    return (
      <Card className={compact ? 'mb-4' : 'mb-6'}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Wallet className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm text-gray-500">Connect wallet to view DeFi data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tokens = balances?.tokens ? Object.entries(balances.tokens) : [];
  const totalBalanceUSD = balances?.totalBalanceUSD || '0';

  if (compact) {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">DeFi Portfolio</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(!isVisible)}
              >
                {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={refetch} disabled={loading}>
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        {isVisible && (
          <CardContent className="pt-0">
            <div className="mb-3">
              <div className="text-lg font-bold">${parseFloat(totalBalanceUSD).toFixed(2)}</div>
              <div className="text-xs text-gray-500">{tokens.length} tokens</div>
            </div>
            
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : tokens.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {tokens.slice(0, 5).map(([address, token]) => (
                  <TokenRow
                    key={address}
                    token={token}
                    price={prices[address.toLowerCase()]}
                    metadata={metadata[address.toLowerCase()]}
                    compact={true}
                  />
                ))}
                {tokens.length > 5 && (
                  <div className="text-xs text-gray-500 text-center py-1">
                    +{tokens.length - 5} more tokens
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-xs">
                No token balances found
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <BuildBearStatus />
      
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">DeFi Dashboard</h3>
            <p className="text-sm text-gray-500">
              Real-time data for {address.slice(0, 6)}...{address.slice(-4)} on Chain {chainId}
            </p>
          </div>
          <Button variant="outline" onClick={refetch} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600 text-sm">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${parseFloat(totalBalanceUSD).toFixed(2)}</div>
            <div className="text-xs text-gray-500">{tokens.length} tokens</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tokens.length}</div>
            <div className="text-xs text-gray-500">With balances</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{history?.transactions.length || 0}</div>
            <div className="text-xs text-gray-500">Last 7 days</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Portfolio Overview</CardTitle>
              <CardDescription>
                Your token holdings with real-time prices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : tokens.length > 0 ? (
                <div className="space-y-3">
                  {tokens.slice(0, 8).map(([address, token]) => (
                    <TokenRow
                      key={address}
                      token={token}
                      price={prices[address.toLowerCase()]}
                      metadata={metadata[address.toLowerCase()]}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No token balances found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Token Prices</CardTitle>
              <CardDescription>
                Real-time token prices and 24h changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : Object.keys(prices).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(prices).map(([address, price]) => (
                    <div key={address} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium">{price.symbol?.charAt(0) || '?'}</span>
                        </div>
                        <div>
                          <div className="font-medium">{price.symbol}</div>
                          <div className="text-sm text-gray-500">${price.priceUSD}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {price.change24h && (
                          <div className={`text-sm flex items-center ${
                            parseFloat(price.change24h) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {parseFloat(price.change24h) >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                            {Math.abs(parseFloat(price.change24h)).toFixed(2)}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No price data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Token Market Feed</CardTitle>
              <CardDescription>
                Live token prices categorized by type using 1inch Price API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TokenPriceFeed compact={false} showHeader={false} defaultCategory="major" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>
                Your recent DeFi transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : history?.transactions.length ? (
                <div className="space-y-3">
                  {history.transactions.slice(0, 5).map((transaction, index) => (
                    <div key={`${transaction.txHash}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          transaction.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {transaction.type === 'swap' ? '🔄' : transaction.type === 'transfer' ? '📤' : '✅'}
                        </div>
                        <div>
                          <div className="font-medium capitalize">{transaction.type}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(transaction.timestamp * 1000).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant={transaction.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No recent activity found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}