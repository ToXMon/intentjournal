/**
 * 1inch Data APIs Dashboard
 * Comprehensive UI for Balances, Prices, Metadata, and Charts using BuildBear fork
 */

'use client';

import React, { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, TrendingUp, TrendingDown, Wallet, History, BarChart3, Info } from 'lucide-react';
import {
  useTokenPrices,
  useTokenMetadata,
  useTransactionHistory,
  useWalletData,
  usePriceChart,
  useBuildBearData,
} from '@/hooks/useOneInchData';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { formatEther, formatUnits } from 'viem';

interface TokenRowProps {
  token: any;
  price?: any;
  metadata?: any;
}

function TokenRow({ token, price, metadata }: TokenRowProps) {
  const balance = parseFloat(token.balance || '0');
  const decimals = token.decimals || 18;
  const balanceFormatted = balance / Math.pow(10, decimals);
  const priceUSD = parseFloat(price?.priceUSD || '0');
  const balanceUSD = balanceFormatted * priceUSD;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
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

function TransactionRow({ transaction }: { transaction: any }) {
  const isSwap = transaction.type === 'swap';
  const timestamp = new Date(transaction.timestamp * 1000);

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          transaction.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}>
          {isSwap ? '🔄' : transaction.type === 'transfer' ? '📤' : '✅'}
        </div>
        <div>
          <div className="font-medium capitalize">{transaction.type}</div>
          <div className="text-sm text-gray-500">
            {timestamp.toLocaleDateString()} {timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
      
      <div className="text-right">
        {isSwap && transaction.tokenIn && transaction.tokenOut ? (
          <div>
            <div className="text-sm">
              -{parseFloat(transaction.tokenIn.amount).toFixed(4)} {transaction.tokenIn.symbol}
            </div>
            <div className="text-sm text-green-600">
              +{parseFloat(transaction.tokenOut.amount).toFixed(4)} {transaction.tokenOut.symbol}
            </div>
          </div>
        ) : (
          <div className="text-sm">
            {parseFloat(transaction.value || '0') / 1e18} ETH
          </div>
        )}
        <Badge variant={transaction.status === 'success' ? 'default' : 'destructive'} className="text-xs">
          {transaction.status}
        </Badge>
      </div>
    </div>
  );
}

function PriceChart({ tokenAddress, symbol }: { tokenAddress?: string; symbol?: string }) {
  const { chartData, loading, error } = usePriceChart(tokenAddress, 7);

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (error || chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Chart data not available</p>
        </div>
      </div>
    );
  }

  const minPrice = Math.min(...chartData.map(d => d.price));
  const maxPrice = Math.max(...chartData.map(d => d.price));
  const priceRange = maxPrice - minPrice;

  return (
    <div className="h-64 relative">
      <div className="absolute top-2 left-2 text-sm font-medium">
        {symbol || 'Token'} Price (7 days)
      </div>
      <svg className="w-full h-full" viewBox="0 0 400 200">
        <defs>
          <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {/* Price line */}
        <path
          d={chartData.map((point, index) => {
            const x = (index / (chartData.length - 1)) * 380 + 10;
            const y = 180 - ((point.price - minPrice) / priceRange) * 160;
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ')}
          stroke="#3b82f6"
          strokeWidth="2"
          fill="none"
        />
        
        {/* Fill area */}
        <path
          d={[
            chartData.map((point, index) => {
              const x = (index / (chartData.length - 1)) * 380 + 10;
              const y = 180 - ((point.price - minPrice) / priceRange) * 160;
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' '),
            `L 390 180 L 10 180 Z`
          ].join(' ')}
          fill="url(#priceGradient)"
        />
        
        {/* Data points */}
        {chartData.map((point, index) => {
          const x = (index / (chartData.length - 1)) * 380 + 10;
          const y = 180 - ((point.price - minPrice) / priceRange) * 160;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill="#3b82f6"
              className="hover:r-4 transition-all"
            />
          );
        })}
      </svg>
      
      <div className="absolute bottom-2 right-2 text-xs text-gray-500">
        ${chartData[chartData.length - 1]?.price.toFixed(4) || '0.0000'}
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
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <CardTitle className="text-lg">BuildBear Fork Status</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          Base Mainnet Fork - Chain ID: 27257
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{blockNumber}</div>
            <div className="text-sm text-gray-500">Block Number</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{gasPrice} Gwei</div>
            <div className="text-sm text-gray-500">Gas Price</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{parseFloat(balance).toFixed(4)} ETH</div>
            <div className="text-sm text-gray-500">Wallet Balance</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function OneInchDataDashboard() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  // Use comprehensive wallet data hook
  const { balances, prices, metadata, history, loading, error, refetch } = useWalletData();

  if (!address) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-gray-500">Connect your wallet to view 1inch data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tokens = balances?.tokens ? Object.entries(balances.tokens) : [];
  const totalBalanceUSD = balances?.totalBalanceUSD || '0';

  return (
    <div className="space-y-6">
      <BuildBearStatus />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">1inch Data Dashboard</h2>
          <p className="text-gray-500">
            Comprehensive DeFi data for {address.slice(0, 6)}...{address.slice(-4)} on Chain {chainId}
          </p>
        </div>
        <Button variant="outline" onClick={refetch} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${parseFloat(totalBalanceUSD).toFixed(2)}</div>
            <div className="text-sm text-gray-500">{tokens.length} tokens</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tokens.length}</div>
            <div className="text-sm text-gray-500">With balances</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{history?.transactions.length || 0}</div>
            <div className="text-sm text-gray-500">Last 7 days</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="balances" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="prices">Prices</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="balances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Token Balances</CardTitle>
              <CardDescription>
                Your token holdings with real-time prices from 1inch APIs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : tokens.length > 0 ? (
                <div className="space-y-3">
                  {tokens.map(([address, token]) => (
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

        <TabsContent value="prices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Token Prices</CardTitle>
              <CardDescription>
                Real-time token prices and 24h changes from 1inch Price API
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
                  {Object.entries(prices).map(([address, price]) => {
                    const token = tokens.find(([addr]) => addr.toLowerCase() === address)?.[1];
                    return (
                      <div key={address} className="flex items-center justify-between p-4 border rounded-lg">
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
                          {price.volume24h && (
                            <div className="text-xs text-gray-500">
                              Vol: ${parseFloat(price.volume24h).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Your recent DeFi transactions from 1inch History API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : history?.transactions.length ? (
                <div className="space-y-3">
                  {history.transactions.map((transaction, index) => (
                    <TransactionRow key={`${transaction.txHash}-${index}`} transaction={transaction} />
                  ))}
                  {history.hasMore && (
                    <Button variant="outline" className="w-full">
                      Load More Transactions
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No transaction history found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Price Charts</CardTitle>
              <CardDescription>
                Token price trends and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tokens.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {tokens.slice(0, 5).map(([address, token]) => (
                      <Button
                        key={address}
                        variant={selectedToken === address ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedToken(address)}
                      >
                        {(token as any)?.symbol || 'Unknown'}
                      </Button>
                    ))}
                  </div>
                  
                  {selectedToken ? (
                    <PriceChart 
                      tokenAddress={selectedToken} 
                      symbol={(tokens.find(([addr]) => addr === selectedToken)?.[1] as any)?.symbol}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Select a token to view price chart</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No tokens available for charting</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}