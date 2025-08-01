/**
 * 1inch API Test Component
 * Comprehensive testing interface for all 1inch Data APIs
 */

'use client';

import React, { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Search, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { useTokenPrices, useTokenMetadata, useTransactionHistory, useWalletData } from '@/hooks/useOneInchData';

interface APITestResult {
  endpoint: string;
  status: 'loading' | 'success' | 'error';
  data?: any;
  error?: string;
  responseTime?: number;
}

export function OneInchAPITest() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [testAddress, setTestAddress] = useState('');
  const [testResults, setTestResults] = useState<Record<string, APITestResult>>({});

  // Use hooks for real-time data
  const { prices, loading: pricesLoading, error: pricesError } = useTokenPrices();
  const { metadata, loading: metadataLoading, error: metadataError } = useTokenMetadata();
  const { history, loading: historyLoading, error: historyError } = useTransactionHistory();
  const { balances, loading: walletLoading, error: walletError } = useWalletData();

  const runAPITest = async (endpoint: string, testFn: () => Promise<any>) => {
    const startTime = Date.now();
    setTestResults(prev => ({
      ...prev,
      [endpoint]: { endpoint, status: 'loading' }
    }));

    try {
      const data = await testFn();
      const responseTime = Date.now() - startTime;
      
      setTestResults(prev => ({
        ...prev,
        [endpoint]: {
          endpoint,
          status: 'success',
          data,
          responseTime
        }
      }));
    } catch (error) {
      const responseTime = Date.now() - startTime;
      setTestResults(prev => ({
        ...prev,
        [endpoint]: {
          endpoint,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          responseTime
        }
      }));
    }
  };

  const testBalanceAPI = () => {
    const targetAddress = testAddress || address;
    if (!targetAddress || !chainId) return;

    runAPITest('Balance API', async () => {
      const response = await fetch(`/api/1inch/balance/${chainId}/${targetAddress}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    });
  };

  const testPriceAPI = () => {
    if (!chainId) return;

    runAPITest('Price API', async () => {
      const response = await fetch(`/api/1inch/prices/${chainId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    });
  };

  const testTokenAPI = () => {
    if (!chainId) return;

    runAPITest('Token Metadata API', async () => {
      const response = await fetch(`/api/1inch/tokens/${chainId}?limit=10`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    });
  };

  const testHistoryAPI = () => {
    const targetAddress = testAddress || address;
    if (!targetAddress || !chainId) return;

    runAPITest('History API', async () => {
      const response = await fetch(`/api/1inch/history/${chainId}/${targetAddress}?limit=10`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    });
  };

  const runAllTests = () => {
    testBalanceAPI();
    testPriceAPI();
    testTokenAPI();
    testHistoryAPI();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'loading':
        return <Badge variant="secondary">Loading</Badge>;
      case 'success':
        return <Badge variant="default">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Not Tested</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>1inch API Test Suite</CardTitle>
          <CardDescription>
            Test all 1inch Data APIs with BuildBear Base mainnet fork (Chain ID: {chainId})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder={`Test address (default: ${address?.slice(0, 10)}...)`}
                value={testAddress}
                onChange={(e) => setTestAddress(e.target.value)}
              />
            </div>
            <Button onClick={runAllTests} disabled={!chainId}>
              <Search className="w-4 h-4 mr-2" />
              Run All Tests
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" size="sm" onClick={testBalanceAPI}>
              Test Balance API
            </Button>
            <Button variant="outline" size="sm" onClick={testPriceAPI}>
              Test Price API
            </Button>
            <Button variant="outline" size="sm" onClick={testTokenAPI}>
              Test Token API
            </Button>
            <Button variant="outline" size="sm" onClick={testHistoryAPI}>
              Test History API
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Balance API Results */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center space-x-2">
                {getStatusIcon(testResults['Balance API']?.status || 'idle')}
                <span>Balance API</span>
              </CardTitle>
              {getStatusBadge(testResults['Balance API']?.status || 'idle')}
            </div>
            <CardDescription>
              /api/1inch/balance/{chainId}/{testAddress || address?.slice(0, 10) + '...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testResults['Balance API']?.status === 'loading' ? (
              <Skeleton className="h-20 w-full" />
            ) : testResults['Balance API']?.status === 'success' ? (
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Total Balance:</strong> ${testResults['Balance API'].data?.totalBalanceUSD || '0'}
                </div>
                <div className="text-sm">
                  <strong>Tokens:</strong> {Object.keys(testResults['Balance API'].data?.tokens || {}).length}
                </div>
                <div className="text-xs text-gray-500">
                  Response time: {testResults['Balance API'].responseTime}ms
                </div>
              </div>
            ) : testResults['Balance API']?.status === 'error' ? (
              <div className="text-red-600 text-sm">
                Error: {testResults['Balance API'].error}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                Click "Test Balance API" to run test
              </div>
            )}
          </CardContent>
        </Card>

        {/* Price API Results */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center space-x-2">
                {getStatusIcon(testResults['Price API']?.status || 'idle')}
                <span>Price API</span>
              </CardTitle>
              {getStatusBadge(testResults['Price API']?.status || 'idle')}
            </div>
            <CardDescription>
              /api/1inch/prices/{chainId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testResults['Price API']?.status === 'loading' ? (
              <Skeleton className="h-20 w-full" />
            ) : testResults['Price API']?.status === 'success' ? (
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Prices:</strong> {Object.keys(testResults['Price API'].data?.prices || {}).length}
                </div>
                <div className="text-sm">
                  <strong>Currency:</strong> {testResults['Price API'].data?.currency || 'USD'}
                </div>
                <div className="text-xs text-gray-500">
                  Response time: {testResults['Price API'].responseTime}ms
                </div>
              </div>
            ) : testResults['Price API']?.status === 'error' ? (
              <div className="text-red-600 text-sm">
                Error: {testResults['Price API'].error}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                Click "Test Price API" to run test
              </div>
            )}
          </CardContent>
        </Card>

        {/* Token Metadata API Results */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center space-x-2">
                {getStatusIcon(testResults['Token Metadata API']?.status || 'idle')}
                <span>Token Metadata API</span>
              </CardTitle>
              {getStatusBadge(testResults['Token Metadata API']?.status || 'idle')}
            </div>
            <CardDescription>
              /api/1inch/tokens/{chainId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testResults['Token Metadata API']?.status === 'loading' ? (
              <Skeleton className="h-20 w-full" />
            ) : testResults['Token Metadata API']?.status === 'success' ? (
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Tokens:</strong> {testResults['Token Metadata API'].data?.tokens?.length || 0}
                </div>
                <div className="text-sm">
                  <strong>Chain ID:</strong> {testResults['Token Metadata API'].data?.chainId}
                </div>
                <div className="text-xs text-gray-500">
                  Response time: {testResults['Token Metadata API'].responseTime}ms
                </div>
              </div>
            ) : testResults['Token Metadata API']?.status === 'error' ? (
              <div className="text-red-600 text-sm">
                Error: {testResults['Token Metadata API'].error}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                Click "Test Token API" to run test
              </div>
            )}
          </CardContent>
        </Card>

        {/* History API Results */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center space-x-2">
                {getStatusIcon(testResults['History API']?.status || 'idle')}
                <span>History API</span>
              </CardTitle>
              {getStatusBadge(testResults['History API']?.status || 'idle')}
            </div>
            <CardDescription>
              /api/1inch/history/{chainId}/{testAddress || address?.slice(0, 10) + '...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testResults['History API']?.status === 'loading' ? (
              <Skeleton className="h-20 w-full" />
            ) : testResults['History API']?.status === 'success' ? (
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Transactions:</strong> {testResults['History API'].data?.transactions?.length || 0}
                </div>
                <div className="text-sm">
                  <strong>Total Count:</strong> {testResults['History API'].data?.totalCount || 0}
                </div>
                <div className="text-xs text-gray-500">
                  Response time: {testResults['History API'].responseTime}ms
                </div>
              </div>
            ) : testResults['History API']?.status === 'error' ? (
              <div className="text-red-600 text-sm">
                Error: {testResults['History API'].error}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                Click "Test History API" to run test
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Live Data Preview</CardTitle>
          <CardDescription>
            Real-time data from 1inch APIs using React hooks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {walletLoading ? '...' : Object.keys(balances?.tokens || {}).length}
              </div>
              <div className="text-sm text-gray-500">Token Balances</div>
              {walletError && <div className="text-xs text-red-500 mt-1">Error</div>}
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {pricesLoading ? '...' : Object.keys(prices).length}
              </div>
              <div className="text-sm text-gray-500">Token Prices</div>
              {pricesError && <div className="text-xs text-red-500 mt-1">Error</div>}
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {metadataLoading ? '...' : Object.keys(metadata).length}
              </div>
              <div className="text-sm text-gray-500">Token Metadata</div>
              {metadataError && <div className="text-xs text-red-500 mt-1">Error</div>}
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {historyLoading ? '...' : history?.transactions.length || 0}
              </div>
              <div className="text-sm text-gray-500">Transactions</div>
              {historyError && <div className="text-xs text-red-500 mt-1">Error</div>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentation Links */}
      <Card>
        <CardHeader>
          <CardTitle>Documentation & Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">1inch API Documentation</h4>
              <div className="space-y-2">
                <a
                  href="https://portal.1inch.dev/documentation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  1inch Developer Portal <ExternalLink className="w-3 h-3 ml-1" />
                </a>
                <a
                  href="https://docs.1inch.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  1inch Protocol Docs <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">BuildBear Resources</h4>
              <div className="space-y-2">
                <a
                  href="https://smooth-spiderman-faa2b8b9.ethernal.buildbear.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  Fork Explorer <ExternalLink className="w-3 h-3 ml-1" />
                </a>
                <a
                  href="https://buildbear.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  BuildBear Platform <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}