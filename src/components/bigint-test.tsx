/**
 * Test component to verify BigInt conversion fixes
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { safeBigInt, safeFormatUnits, formatTokenAmount } from '@/utils/format-helpers';

export function BigIntTest() {
  const [testValue, setTestValue] = useState('1.455e+26');
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const runTest = () => {
    try {
      setError('');
      
      console.log('Testing value:', testValue);
      
      // Test safeBigInt conversion
      const bigIntResult = safeBigInt(testValue);
      console.log('BigInt result:', bigIntResult.toString());
      
      // Test safeFormatUnits
      const formattedResult = safeFormatUnits(testValue, 18);
      console.log('Formatted result:', formattedResult);
      
      // Test formatTokenAmount
      const tokenResult = formatTokenAmount(testValue, 18, 'TEST');
      console.log('Token result:', tokenResult);
      
      setResult(`
BigInt: ${bigIntResult.toString().slice(0, 50)}${bigIntResult.toString().length > 50 ? '...' : ''}
Formatted: ${formattedResult}
Token: ${tokenResult}
      `.trim());
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Test failed:', err);
    }
  };

  const testValues = [
    '1.455e+26',
    '1000000000000000000',
    '1500000',
    '123.456',
    'invalid',
    '0',
    '',
  ];

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>BigInt Conversion Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Test Value:</label>
          <div className="flex gap-2">
            <Input
              value={testValue}
              onChange={(e) => setTestValue(e.target.value)}
              placeholder="Enter test value"
            />
            <Button onClick={runTest}>Test</Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Quick Tests:</label>
          <div className="flex flex-wrap gap-2">
            {testValues.map((value) => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                onClick={() => setTestValue(value)}
              >
                {value || 'empty'}
              </Button>
            ))}
          </div>
        </div>

        {result && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
              ✅ Success
            </h4>
            <pre className="text-sm text-green-700 dark:text-green-300 whitespace-pre-wrap">
              {result}
            </pre>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
              ❌ Error
            </h4>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>This component tests the safeBigInt and formatting functions to ensure they handle scientific notation and large numbers correctly.</p>
        </div>
      </CardContent>
    </Card>
  );
}