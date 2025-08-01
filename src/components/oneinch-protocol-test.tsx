/**
 * Comprehensive 1inch Protocol Test Suite
 * Tests all 1inch protocols through the API proxy
 */

"use client";

import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useParaAccount } from '@/hooks/useParaAccount';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TestResult {
  success: boolean;
  result?: any;
  error?: string;
  timestamp: number;
  duration: number;
}

export function OneInchProtocolTest() {
  const { address: web3Address } = useAccount();
  const { address: paraAddress } = useParaAccount();
  const chainId = useChainId();
  const { walletType } = useAppStore();
  
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTest, setActiveTest] = useState<string | null>(null);

  // Get current wallet info
  const currentAddress = walletType === 'para' ? paraAddress : web3Address;
  const currentChainId = chainId || 8453; // Default to Base

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setActiveTest(testName);
    const startTime = Date.now();
    
    try {
      console.log(`🧪 Running ${testName}...`);
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      setTestResults(prev => ({
        ...prev,
        [testName]: { 
          success: true, 
          result, 
          timestamp: Date.now(),
          duration
        }
      }));
      
      console.log(`✅ ${testName} passed in ${duration}ms`, result);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ ${testName} failed:`, error);
      
      setTestResults(prev => ({
        ...prev,
        [testName]: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
          duration
        }
      }));
    } finally {
      setActiveTest(null);
    }
  };

  // Test suite for all 1inch protocols
  const protocolTests = {
    // Classic Swap (Aggregation Protocol v6) Tests
    'Classic Swap - Health Check': async () => {
      const response = await fetch(`/api/1inch/swap/${currentChainId}/healthcheck`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },

    'Classic Swap - Supported Tokens': async () => {
      const response = await fetch(`/api/1inch/swap/${currentChainId}/tokens`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return {
        tokenCount: Object.keys(data.tokens || {}).length,
        sampleTokens: Object.keys(data.tokens || {}).slice(0, 3)
      };
    },

    'Classic Swap - Quote': async () => {
      if (!currentAddress) throw new Error('Wallet not connected');
      
      const params = new URLSearchParams({
        src: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ETH
        dst: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
        amount: '1000000000000000000', // 1 ETH
        from: currentAddress,
        slippage: '1'
      });
      
      const response = await fetch(`/api/1inch/swap/${currentChainId}/quote?${params}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      return {
        srcAmount: data.srcAmount,
        dstAmount: data.dstAmount,
        estimatedGas: data.estimatedGas,
        protocols: data.protocols?.length || 0
      };
    },

    'Classic Swap - Swap Data': async () => {
      if (!currentAddress) throw new Error('Wallet not connected');
      
      const params = new URLSearchParams({
        src: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ETH
        dst: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
        amount: '1000000000000000000', // 1 ETH
        from: currentAddress,
        slippage: '1'
      });
      
      const response = await fetch(`/api/1inch/swap/${currentChainId}/swap?${params}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      return {
        hasTransactionData: !!data.tx,
        toAddress: data.tx?.to,
        value: data.tx?.value,
        gasPrice: data.tx?.gasPrice
      };
    },

    // Price API Tests
    'Price API - ETH Price': async () => {
      const response = await fetch(`/api/1inch/price/${currentChainId}/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      return {
        symbol: data.symbol,
        price: data.price,
        hasPrice: !!data.price
      };
    },

    'Price API - Multiple Tokens': async () => {
      const tokens = [
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ETH
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'  // USDC
      ].join(',');
      
      const response = await fetch(`/api/1inch/price/${currentChainId}?tokens=${tokens}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      return {
        tokenCount: Object.keys(data).length,
        tokens: Object.keys(data)
      };
    },

    // Balance API Tests
    'Balance API - Wallet Balances': async () => {
      if (!currentAddress) throw new Error('Wallet not connected');
      
      const response = await fetch(`/api/1inch/balance/${currentChainId}/balances/${currentAddress}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      return {
        address: data.address,
        tokenCount: Object.keys(data.tokens || {}).length,
        totalBalanceUSD: data.totalBalanceUSD
      };
    },

    // Limit Order Protocol Tests
    'Limit Orders - Active Orders': async () => {
      if (!currentAddress) throw new Error('Wallet not connected');
      
      const response = await fetch(`/api/1inch/orderbook/${currentChainId}/active-orders?maker=${currentAddress}`);
      // Note: This might return 404 if no orders exist, which is expected
      if (response.status === 404) {
        return { activeOrders: 0, message: 'No active orders found' };
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      return {
        activeOrders: data.orders?.length || 0,
        hasOrders: !!data.orders?.length
      };
    },

    'Limit Orders - Order Book': async () => {
      const response = await fetch(`/api/1inch/orderbook/${currentChainId}/orderbook?makerAsset=0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&takerAsset=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      return {
        bids: data.bids?.length || 0,
        asks: data.asks?.length || 0,
        hasLiquidity: (data.bids?.length || 0) > 0 || (data.asks?.length || 0) > 0
      };
    },

    // Fusion Protocol Tests
    'Fusion - Quote': async () => {
      if (!currentAddress) throw new Error('Wallet not connected');
      
      const requestBody = {
        srcTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        dstTokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        amount: '1000000000000000000',
        walletAddress: currentAddress
      };
      
      const response = await fetch(`/api/1inch/fusion/${currentChainId}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      return {
        srcAmount: data.srcAmount,
        dstAmount: data.dstAmount,
        hasQuote: !!data.dstAmount
      };
    },

    // Cross-chain Tests (Fusion+)
    'Fusion+ - Supported Chains': async () => {
      const response = await fetch(`/api/1inch/fusion-plus/supported-chains`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      return {
        chainCount: data.chains?.length || 0,
        supportedChains: data.chains?.slice(0, 5) || []
      };
    },

    // Transaction History API Tests
    'History API - Transaction History': async () => {
      if (!currentAddress) throw new Error('Wallet not connected');
      
      const response = await fetch(`/api/1inch/history/${currentChainId}/transactions?address=${currentAddress}&limit=10`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      return {
        transactionCount: data.transactions?.length || 0,
        hasHistory: !!data.transactions?.length
      };
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults({});
    
    for (const [testName, testFn] of Object.entries(protocolTests)) {
      await runTest(testName, testFn);
      // Small delay between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsLoading(false);
  };

  const getTestStatus = (testName: string) => {
    const result = testResults[testName];
    if (!result) return 'pending';
    return result.success ? 'success' : 'error';
  };

  const getTestBadgeVariant = (status: string) => {
    switch (status) {
      case 'success': return 'default';
      case 'error': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const getProtocolFromTestName = (testName: string) => {
    if (testName.includes('Classic Swap')) return 'Classic Swap';
    if (testName.includes('Price API')) return 'Price API';
    if (testName.includes('Balance API')) return 'Balance API';
    if (testName.includes('Limit Orders')) return 'Limit Orders';
    if (testName.includes('Fusion+')) return 'Fusion+';
    if (testName.includes('Fusion')) return 'Fusion';
    if (testName.includes('History API')) return 'History API';
    return 'Other';
  };

  const groupedTests = Object.entries(protocolTests).reduce((acc, [testName, testFn]) => {
    const protocol = getProtocolFromTestName(testName);
    if (!acc[protocol]) acc[protocol] = [];
    acc[protocol].push([testName, testFn]);
    return acc;
  }, {} as Record<string, Array<[string, () => Promise<any>]>>);

  if (!currentAddress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>1inch Protocol Test Suite</CardTitle>
          <CardDescription>
            Connect a wallet to test all 1inch protocols through the API proxy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Please connect either a Para wallet or Web3 wallet to run the protocol tests.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1inch Protocol Test Suite</CardTitle>
          <CardDescription>
            Comprehensive testing of all 1inch protocols via API proxy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Test Configuration</p>
              <p className="text-xs text-gray-600">
                Wallet: {currentAddress.slice(0, 8)}...{currentAddress.slice(-6)} ({walletType})
              </p>
              <p className="text-xs text-gray-600">
                Chain: {currentChainId}
              </p>
            </div>
            <Button 
              onClick={runAllTests} 
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? 'Running Tests...' : 'Run All Protocol Tests'}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="text-center">
              <p className="font-medium">Total Tests</p>
              <p className="text-lg">{Object.keys(protocolTests).length}</p>
            </div>
            <div className="text-center">
              <p className="font-medium">Passed</p>
              <p className="text-lg text-green-600">
                {Object.values(testResults).filter(r => r.success).length}
              </p>
            </div>
            <div className="text-center">
              <p className="font-medium">Failed</p>
              <p className="text-lg text-red-600">
                {Object.values(testResults).filter(r => !r.success).length}
              </p>
            </div>
            <div className="text-center">
              <p className="font-medium">Protocols</p>
              <p className="text-lg">{Object.keys(groupedTests).length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={Object.keys(groupedTests)[0]} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {Object.keys(groupedTests).slice(0, 4).map(protocol => (
            <TabsTrigger key={protocol} value={protocol} className="text-xs">
              {protocol}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {Object.entries(groupedTests).map(([protocol, tests]) => (
          <TabsContent key={protocol} value={protocol} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tests.map(([testName, testFn]) => {
                const status = getTestStatus(testName);
                const result = testResults[testName];
                const isActive = activeTest === testName;
                
                return (
                  <Card key={testName} className={isActive ? 'ring-2 ring-blue-500' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">
                          {testName.replace(`${protocol} - `, '')}
                        </CardTitle>
                        <Badge variant={getTestBadgeVariant(status)}>
                          {isActive ? 'Running...' : status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        onClick={() => runTest(testName, testFn)}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        {isActive ? 'Running...' : 'Run Test'}
                      </Button>
                      
                      {result && (
                        <div className="text-xs">
                          {result.success ? (
                            <div className="space-y-2">
                              <p className="text-green-600 font-medium">
                                ✅ Passed ({result.duration}ms)
                              </p>
                              <pre className="bg-green-50 p-2 rounded text-xs overflow-x-auto max-h-32">
                                {JSON.stringify(result.result, null, 2)}
                              </pre>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-red-600 font-medium">
                                ❌ Failed ({result.duration}ms)
                              </p>
                              <p className="bg-red-50 p-2 rounded text-red-700">
                                {result.error}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}