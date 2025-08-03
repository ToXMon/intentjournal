'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, CheckCircle, AlertCircle, Zap, TrendingUp } from 'lucide-react';
import { useAccount } from 'wagmi';
import { oneInchDataAPI } from '@/utils/oneinch/data-apis';
import { realOneInchApi } from '@/utils/oneinch/real-api-service';

interface DemoResults {
  apiHealth: boolean | null;
  tokenPrices: Record<string, any> | null;
  walletBalances: Record<string, string> | null;
  swapQuote: any | null;
  tokenMetadata: Record<string, any> | null;
  isLoading: boolean;
  errors: string[];
}

const DEMO_TOKENS = {
  // Base Mainnet
  8453: {
    ETH: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    USDC: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    WETH: '0x4200000000000000000000000000000000000006',
  },
  // BuildBear Fork (uses Base addresses)
  27257: {
    ETH: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    USDC: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    WETH: '0x4200000000000000000000000000000000000006',
  },
  // Ethereum Mainnet
  1: {
    ETH: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    USDC: '0xa0b86a33e6441e8c3c7e0c3b3e2e0c3b3e2e0c3b',
    WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  }
};

export default function RealOneInchDemo() {
  const { address, isConnected, chain } = useAccount();
  const [selectedChain, setSelectedChain] = useState<number>(8453); // Default to Base
  const [results, setResults] = useState<DemoResults>({
    apiHealth: null,
    tokenPrices: null,
    walletBalances: null,
    swapQuote: null,
    tokenMetadata: null,
    isLoading: false,
    errors: [],
  });

  // Update selected chain when wallet chain changes
  useEffect(() => {
    if (chain?.id && DEMO_TOKENS[chain.id as keyof typeof DEMO_TOKENS]) {
      setSelectedChain(chain.id);
    }
  }, [chain?.id]);

  const addError = (error: string) => {
    setResults(prev => ({
      ...prev,
      errors: [...prev.errors, error]
    }));
  };

  const clearErrors = () => {
    setResults(prev => ({ ...prev, errors: [] }));
  };

  const testApiHealth = async () => {
    try {
      setResults(prev => ({ ...prev, isLoading: true }));
      clearErrors();
      
      console.log('🏥 Testing 1inch API health...');
      const isHealthy = await realOneInchApi.checkApiHealth(selectedChain);
      
      setResults(prev => ({
        ...prev,
        apiHealth: isHealthy,
        isLoading: false
      }));
      
      if (isHealthy) {
        console.log('✅ 1inch API is healthy!');
      } else {
        addError('1inch API health check failed');
      }
    } catch (error) {
      console.error('❌ API health test failed:', error);
      addError(`API health test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setResults(prev => ({
        ...prev,
        apiHealth: false,
        isLoading: false
      }));
    }
  };

  const testTokenPrices = async () => {
    try {
      setResults(prev => ({ ...prev, isLoading: true }));
      clearErrors();
      
      const chainTokens = DEMO_TOKENS[selectedChain as keyof typeof DEMO_TOKENS];
      if (!chainTokens) {
        throw new Error(`No demo tokens configured for chain ${selectedChain}`);
      }
      
      const tokenAddresses = Object.values(chainTokens);
      console.log('💰 Testing token prices for:', tokenAddresses);
      
      const prices = await oneInchDataAPI.getTokenPrices(selectedChain, tokenAddresses);
      
      setResults(prev => ({
        ...prev,
        tokenPrices: prices,
        isLoading: false
      }));
      
      console.log('✅ Token prices retrieved:', prices);
    } catch (error) {
      console.error('❌ Token prices test failed:', error);
      addError(`Token prices test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setResults(prev => ({
        ...prev,
        tokenPrices: null,
        isLoading: false
      }));
    }
  };

  const testWalletBalances = async () => {
    if (!address) {
      addError('Please connect your wallet first');
      return;
    }

    try {
      setResults(prev => ({ ...prev, isLoading: true }));
      clearErrors();
      
      console.log('👛 Testing wallet balances for:', address);
      const balances = await oneInchDataAPI.getWalletBalances(selectedChain, address);
      
      setResults(prev => ({
        ...prev,
        walletBalances: balances,
        isLoading: false
      }));
      
      console.log('✅ Wallet balances retrieved:', balances);
    } catch (error) {
      console.error('❌ Wallet balances test failed:', error);
      addError(`Wallet balances test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setResults(prev => ({
        ...prev,
        walletBalances: null,
        isLoading: false
      }));
    }
  };

  const testSwapQuote = async () => {
    if (!address) {
      addError('Please connect your wallet first');
      return;
    }

    try {
      setResults(prev => ({ ...prev, isLoading: true }));
      clearErrors();
      
      const chainTokens = DEMO_TOKENS[selectedChain as keyof typeof DEMO_TOKENS];
      if (!chainTokens) {
        throw new Error(`No demo tokens configured for chain ${selectedChain}`);
      }
      
      // Test ETH -> USDC swap
      const quoteParams = {
        chainId: selectedChain,
        src: chainTokens.ETH,
        dst: chainTokens.USDC,
        amount: '1000000000000000000', // 1 ETH in wei
        from: address,
        slippage: 1,
      };
      
      console.log('🔄 Testing swap quote:', quoteParams);
      const quote = await oneInchDataAPI.getSwapQuote(quoteParams);
      
      setResults(prev => ({
        ...prev,
        swapQuote: quote,
        isLoading: false
      }));
      
      console.log('✅ Swap quote retrieved:', quote);
    } catch (error) {
      console.error('❌ Swap quote test failed:', error);
      addError(`Swap quote test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setResults(prev => ({
        ...prev,
        swapQuote: null,
        isLoading: false
      }));
    }
  };

  const testTokenMetadata = async () => {
    try {
      setResults(prev => ({ ...prev, isLoading: true }));
      clearErrors();
      
      const chainTokens = DEMO_TOKENS[selectedChain as keyof typeof DEMO_TOKENS];
      if (!chainTokens) {
        throw new Error(`No demo tokens configured for chain ${selectedChain}`);
      }
      
      const tokenAddresses = Object.values(chainTokens);
      console.log('📋 Testing token metadata for:', tokenAddresses);
      
      const metadata = await oneInchDataAPI.getTokenMetadata(selectedChain, tokenAddresses);
      
      setResults(prev => ({
        ...prev,
        tokenMetadata: metadata,
        isLoading: false
      }));
      
      console.log('✅ Token metadata retrieved:', metadata);
    } catch (error) {
      console.error('❌ Token metadata test failed:', error);
      addError(`Token metadata test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setResults(prev => ({
        ...prev,
        tokenMetadata: null,
        isLoading: false
      }));
    }
  };

  const runAllTests = async () => {
    await testApiHealth();
    await testTokenPrices();
    if (address) {
      await testWalletBalances();
      await testSwapQuote();
    }
    await testTokenMetadata();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🚀 Real 1inch API Integration Demo
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Test real 1inch API calls for token prices, balances, quotes, and metadata. 
          This demonstrates genuine blockchain data integration, not mock responses!
        </p>
        
        {/* Chain Selector */}
        <div className="flex items-center justify-center gap-4">
          <label className="text-sm font-medium">Test Chain:</label>
          <select 
            value={selectedChain} 
            onChange={(e) => setSelectedChain(Number(e.target.value))}
            className="px-3 py-1 border rounded-md"
          >
            <option value={8453}>Base Mainnet (8453)</option>
            <option value={27257}>BuildBear Fork (27257)</option>
            <option value={1}>Ethereum Mainnet (1)</option>
          </select>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
              <span className="text-sm">
                Wallet: {isConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {results.apiHealth === true ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : results.apiHealth === false ? (
                <AlertCircle className="w-4 h-4 text-red-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm">
                1inch API: {results.apiHealth === true ? 'Healthy' : results.apiHealth === false ? 'Unhealthy' : 'Unknown'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">
                Chain: {selectedChain} {chain?.id === selectedChain ? '(Current)' : ''}
              </span>
            </div>
          </div>
          
          {address && (
            <div className="mt-2 p-2 bg-muted rounded text-sm">
              <strong>Wallet:</strong> {address}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>API Tests</CardTitle>
          <CardDescription>
            Test individual 1inch API endpoints or run all tests at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <Button 
              onClick={testApiHealth} 
              disabled={results.isLoading}
              variant="outline"
              size="sm"
            >
              Health Check
            </Button>
            <Button 
              onClick={testTokenPrices} 
              disabled={results.isLoading}
              variant="outline"
              size="sm"
            >
              Token Prices
            </Button>
            <Button 
              onClick={testWalletBalances} 
              disabled={results.isLoading || !address}
              variant="outline"
              size="sm"
            >
              Wallet Balances
            </Button>
            <Button 
              onClick={testSwapQuote} 
              disabled={results.isLoading || !address}
              variant="outline"
              size="sm"
            >
              Swap Quote
            </Button>
            <Button 
              onClick={testTokenMetadata} 
              disabled={results.isLoading}
              variant="outline"
              size="sm"
            >
              Token Metadata
            </Button>
            <Button 
              onClick={runAllTests} 
              disabled={results.isLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              size="sm"
            >
              Run All Tests
            </Button>
          </div>
          
          {results.isLoading && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm text-muted-foreground">Running API tests...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {results.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {results.errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Results Display */}
      <Tabs defaultValue="prices" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="prices">Token Prices</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="quote">Swap Quote</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="raw">Raw Data</TabsTrigger>
        </TabsList>

        <TabsContent value="prices">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Token Prices
              </CardTitle>
              <CardDescription>
                Real-time token prices from 1inch Price API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.tokenPrices ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(results.tokenPrices).map(([address, price]) => (
                    <div key={address} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{price.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {address.slice(0, 6)}...{address.slice(-4)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">${price.priceUSD}</div>
                          {price.change24h && (
                            <div className={`text-sm ${parseFloat(price.change24h) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {parseFloat(price.change24h) >= 0 ? '+' : ''}{price.change24h}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Click "Token Prices" to fetch real-time price data
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Balances</CardTitle>
              <CardDescription>
                Token balances from 1inch Balance API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.walletBalances ? (
                <div className="space-y-2">
                  {Object.entries(results.walletBalances).map(([token, balance]) => (
                    <div key={token} className="flex justify-between items-center p-2 border rounded">
                      <span className="font-mono text-sm">{token.slice(0, 10)}...{token.slice(-8)}</span>
                      <Badge variant="outline">{balance}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {address ? 'Click "Wallet Balances" to fetch your token balances' : 'Connect wallet to view balances'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quote">
          <Card>
            <CardHeader>
              <CardTitle>Swap Quote</CardTitle>
              <CardDescription>
                Real swap quote from 1inch Aggregation API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.swapQuote ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">You Pay</div>
                      <div className="font-bold">1 ETH</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">You Receive</div>
                      <div className="font-bold">
                        {results.swapQuote.dstAmount ? 
                          `${(parseInt(results.swapQuote.dstAmount) / 1e6).toFixed(2)} USDC` : 
                          'Loading...'
                        }
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>Gas Estimate: {results.swapQuote.gas || 'N/A'}</div>
                    <div>Protocols: {results.swapQuote.protocols?.length || 0} routes found</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {address ? 'Click "Swap Quote" to get a real swap quote' : 'Connect wallet to get swap quotes'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metadata">
          <Card>
            <CardHeader>
              <CardTitle>Token Metadata</CardTitle>
              <CardDescription>
                Token information from 1inch Token API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.tokenMetadata ? (
                <div className="space-y-4">
                  {Object.entries(results.tokenMetadata).map(([address, metadata]) => (
                    <div key={address} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {metadata.logoURI && (
                          <img src={metadata.logoURI} alt={metadata.symbol} className="w-8 h-8 rounded-full" />
                        )}
                        <div>
                          <div className="font-semibold">{metadata.name} ({metadata.symbol})</div>
                          <div className="text-sm text-muted-foreground">
                            Decimals: {metadata.decimals} | Address: {address.slice(0, 10)}...{address.slice(-8)}
                          </div>
                          {metadata.tags && metadata.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {metadata.tags.map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Click "Token Metadata" to fetch token information
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="raw">
          <Card>
            <CardHeader>
              <CardTitle>Raw API Responses</CardTitle>
              <CardDescription>
                View the raw JSON responses from 1inch APIs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(results).map(([key, value]) => {
                  if (key === 'isLoading' || key === 'errors' || value === null) return null;
                  
                  return (
                    <div key={key} className="space-y-2">
                      <h4 className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</h4>
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-40">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              This demo uses real 1inch API endpoints. All data is fetched live from the blockchain.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <a 
                href="https://portal.1inch.dev/documentation" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground"
              >
                1inch API Docs <ExternalLink className="w-3 h-3" />
              </a>
              <a 
                href="https://github.com/1inch" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground"
              >
                1inch GitHub <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
