/**
 * Simple 1inch Proxy Test Page
 * Quick test to verify the proxy is working with mock data
 */

"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestProxyPage() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const testEndpoints = [
    {
      name: 'Health Check',
      url: '/api/1inch/swap/8453/healthcheck',
      method: 'GET'
    },
    {
      name: 'Token List',
      url: '/api/1inch/swap/8453/tokens',
      method: 'GET'
    },
    {
      name: 'ETH Price',
      url: '/api/1inch/price/8453/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      method: 'GET'
    },
    {
      name: 'Swap Quote',
      url: '/api/1inch/swap/8453/quote?src=0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&dst=0x833589fcd6edb6e08f4c7c32d4f71b54bda02913&amount=1000000000000000000&from=0x0000000000000000000000000000000000000000',
      method: 'GET'
    }
  ];

  const runTest = async (test: typeof testEndpoints[0]) => {
    setLoading(true);
    try {
      console.log(`Testing: ${test.name} - ${test.url}`);
      const response = await fetch(test.url, { method: test.method });
      const data = await response.json();
      
      setResults(prev => ({
        ...prev,
        [test.name]: {
          success: response.ok,
          status: response.status,
          data,
          headers: {
            mockData: response.headers.get('X-Mock-Data'),
            fallbackReason: response.headers.get('X-Fallback-Reason')
          }
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [test.name]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setResults({});
    for (const test of testEndpoints) {
      await runTest(test);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">1inch Proxy Quick Test</h1>
        <p className="text-gray-600">
          Testing the enhanced 1inch API proxy with mock data fallback
        </p>
        <Button onClick={runAllTests} disabled={loading} size="lg">
          {loading ? 'Running Tests...' : 'Run All Tests'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {testEndpoints.map((test) => {
          const result = results[test.name];
          
          return (
            <Card key={test.name}>
              <CardHeader>
                <CardTitle className="text-base">{test.name}</CardTitle>
                <CardDescription className="font-mono text-xs">
                  {test.method} {test.url}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => runTest(test)}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Test Endpoint
                </Button>
                
                {result && (
                  <div className="text-xs">
                    <div className={`p-2 rounded mb-2 ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className={`font-medium ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                        {result.success ? '✅ Success' : '❌ Failed'} - Status: {result.status}
                      </p>
                      {result.headers?.mockData && (
                        <p className="text-blue-600 mt-1">
                          🔧 Using mock data
                          {result.headers.fallbackReason && ` (${result.headers.fallbackReason})`}
                        </p>
                      )}
                    </div>
                    
                    {result.success ? (
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto max-h-32">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-red-600 p-2 bg-red-50 rounded">
                        {result.error}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proxy Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <p className="font-medium">Total Tests</p>
              <p className="text-2xl">{testEndpoints.length}</p>
            </div>
            <div className="text-center">
              <p className="font-medium">Passed</p>
              <p className="text-2xl text-green-600">
                {Object.values(results).filter(r => r.success).length}
              </p>
            </div>
            <div className="text-center">
              <p className="font-medium">Failed</p>
              <p className="text-2xl text-red-600">
                {Object.values(results).filter(r => !r.success).length}
              </p>
            </div>
            <div className="text-center">
              <p className="font-medium">Mock Data</p>
              <p className="text-2xl text-blue-600">
                {Object.values(results).filter(r => r.headers?.mockData).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}