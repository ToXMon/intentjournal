/**
 * DeFi Integration Test Component
 * Tests 1inch API operations with both Para and Web3 wallets
 */

"use client";

import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useParaAccount } from '@/hooks/useParaAccount';
import { useAppStore } from '@/lib/store';
import { useWalletBalance, useTokenBalance, useBalanceCheck } from '@/hooks/useWalletBalance';
import { FusionPlusManager } from '@/utils/oneinch/fusion-plus';
import { oneInchAPI } from '@/utils/oneinch/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function DeFiIntegrationTest() {
  const { address: web3Address } = useAccount();
  const { address: paraAddress } = useParaAccount();
  const chainId = useChainId();
  const { walletType } = useAppStore();
  
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTest, setActiveTest] = useState<string | null>(null);

  // Get current wallet info
  const currentAddress = walletType === 'para' ? paraAddress : web3Address;
  const currentWalletType = walletType || 'wagmi';

  // Use balance hooks
  const { balances, loading: balancesLoading, refetch: refetchBalances } = useWalletBalance();
  const { balance: ethBalance, loading: ethLoading } = useTokenBalance('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
  const { hasSufficientBalance, loading: balanceCheckLoading } = useBalanceCheck(
    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    '1000000000000000000' // 1 ETH
  );

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setActiveTest(testName);
    setIsLoading(true);
    
    try {
      console.log(`🧪 Running test: ${testName}`);
      const result = await testFn();
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: true, result, timestamp: Date.now() }
      }));
      console.log(`✅ Test passed: ${testName}`, result);
    } catch (error) {
      console.error(`❌ Test failed: ${testName}`, error);
      setTestResults(prev => ({
        ...prev,
        [testName]: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now()
        }
      }));
    } finally {
      setIsLoading(false);
      setActiveTest(null);
    }
  };

  const tests = {
    // Balance API Tests
    'Balance Check': async () => {
      if (!currentAddress || !chainId) throw new Error('Wallet not connected');
      
      const result = await fetch(`/api/1inch/balance/${chainId}/${currentAddress}`);
      if (!result.ok) throw new Error(`HTTP ${result.status}`);
      
      const data = await result.json();
      return {
        address: data.address,
        chainId: data.chainId,
        tokenCount: Object.keys(data.tokens || {}).length,
        totalBalanceUSD: data.totalBalanceUSD
      };
    },

    // Token Price Tests
    'Token Prices': async () => {
      const ethPrice = await oneInchAPI.getTokenPrice(
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        chainId || 8453
      );
      
      if (!ethPrice) throw new Error('Failed to get ETH price');
      
      return {
        token: ethPrice.symbol,
        price: ethPrice.priceUSD,
        lastUpdated: new Date(ethPrice.lastUpdated).toISOString()
      };
    },

    // Swap Quote Tests
    'Swap Quote': async () => {
      if (!currentAddress) throw new Error('Wallet not connected');
      
      const quote = await oneInchAPI.getSwapQuote({
        src: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ETH
        dst: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
        amount: '1000000000000000000', // 1 ETH
        from: currentAddress,
        slippage: 1
      }, chainId || 8453);
      
      if (!quote) throw new Error('Failed to get swap quote');
      
      return {
        srcAmount: quote.srcAmount,
        dstAmount: quote.dstAmount,
        estimatedGas: quote.estimatedGas,
        protocolsCount: quote.protocols.length
      };
    },

    // Fusion+ Cross-chain Tests
    'Fusion+ Quote': async () => {
      if (!currentAddress) throw new Error('Wallet not connected');
      
      const quote = await FusionPlusManager.getCrossChainQuote({
        srcChainId: 8453, // Base
        dstChainId: 42161, // Arbitrum
        srcTokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
        dstTokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum
        amount: '100000000', // 100 USDC
        walletAddress: currentAddress
      });
      
      if (!quote) throw new Error('Failed to get Fusion+ quote');
      
      return {
        srcChain: quote.srcChainId,
        dstChain: quote.dstChainId,
        srcAmount: quote.srcAmount,
        dstAmount: quote.dstAmount,
        estimatedTime: `${quote.estimatedTime}s`,
        bridgeFee: quote.bridgeFee,
        route: quote.route.join(' → ')
      };
    },

    // Fusion+ Order Creation
    'Fusion+ Order': async () => {
      if (!currentAddress) throw new Error('Wallet not connected');
      
      const order = await FusionPlusManager.createCrossChainOrder({
        srcChainId: 8453, // Base
        dstChainId: 42161, // Arbitrum
        srcTokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
        dstTokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum
        amount: '100000000', // 100 USDC
        walletAddress: currentAddress,
        preset: 'fast'
      });
      
      if (!order) throw new Error('Failed to create Fusion+ order');
      
      return {
        orderId: order.orderId,
        orderHash: order.orderHash.slice(0, 10) + '...',
        status: order.status,
        gasless: order.gasless,
        selfCustody: order.selfCustody,
        executionSteps: order.executionSteps.length
      };
    },

    // Multi-chain Support Test
    'Multi-chain Support': async () => {
      const supportedChains = [8453, 42161, 1, 137]; // Base, Arbitrum, Ethereum, Polygon
      const results = [];
      
      for (const chain of supportedChains) {
        try {
          const healthy = await oneInchAPI.healthCheck(chain);
          results.push({ chainId: chain, healthy });
        } catch (error) {
          results.push({ chainId: chain, healthy: false, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
      
      return {
        totalChains: results.length,
        healthyChains: results.filter(r => r.healthy).length,
        chains: results
      };
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults({});
    
    for (const [testName, testFn] of Object.entries(tests)) {
      await runTest(testName, testFn);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
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

  if (!currentAddress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>DeFi Integration Test</CardTitle>
          <CardDescription>
            Connect a wallet to test 1inch API integration with both Para and Web3 wallets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Please connect either a Para wallet or Web3 wallet to run the tests.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>DeFi Integration Test Suite</CardTitle>
          <CardDescription>
            Testing 1inch API operations with {currentWalletType === 'para' ? 'Para' : 'Web3'} wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Connected Wallet</p>
              <p className="text-xs text-gray-600 font-mono">
                {currentAddress.slice(0, 8)}...{currentAddress.slice(-6)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">
                  {currentWalletType === 'para' ? 'Para' : 'Web3'}
                </Badge>
                <Badge variant="secondary">
                  Chain {chainId}
                </Badge>
              </div>
            </div>
            <Button 
              onClick={runAllTests} 
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? 'Running Tests...' : 'Run All Tests'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tests" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tests">Test Results</TabsTrigger>
          <TabsTrigger value="balances">Wallet Balances</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tests" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(tests).map(([testName, testFn]) => {
              const status = getTestStatus(testName);
              const result = testResults[testName];
              const isActive = activeTest === testName;
              
              return (
                <Card key={testName} className={isActive ? 'ring-2 ring-blue-500' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{testName}</CardTitle>
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
                            <p className="text-green-600 font-medium">✅ Test Passed</p>
                            <pre className="bg-green-50 p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(result.result, null, 2)}
                            </pre>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-red-600 font-medium">❌ Test Failed</p>
                            <p className="bg-red-50 p-2 rounded text-red-700">
                              {result.error}
                            </p>
                          </div>
                        )}
                        <p className="text-gray-500 mt-2">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="balances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Balance Information</CardTitle>
              <CardDescription>
                Current balance data for the connected {currentWalletType} wallet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {balancesLoading ? (
                <p>Loading balances...</p>
              ) : balances ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Total Balance (USD)</p>
                      <p className="text-2xl font-bold">${balances.totalBalanceUSD}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Token Count</p>
                      <p className="text-2xl font-bold">{balances.tokens.length}</p>
                    </div>
                  </div>
                  
                  {ethBalance && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-2">ETH Balance</p>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="font-mono text-sm">
                          {(parseFloat(ethBalance.balance) / 1e18).toFixed(6)} ETH
                        </p>
                        <p className="text-xs text-gray-600">
                          ≈ ${ethBalance.balanceUSD}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Balance Check (1 ETH)</p>
                    <div className={`p-3 rounded ${hasSufficientBalance ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className={`text-sm ${hasSufficientBalance ? 'text-green-700' : 'text-red-700'}`}>
                        {hasSufficientBalance ? '✅ Sufficient balance' : '❌ Insufficient balance'}
                      </p>
                    </div>
                  </div>
                  
                  <Button onClick={refetchBalances} variant="outline" size="sm">
                    Refresh Balances
                  </Button>
                </div>
              ) : (
                <p className="text-gray-600">No balance data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}