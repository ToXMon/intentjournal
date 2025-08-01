/**
 * IJT Token Information Component
 * Shows how the IJT token price is calculated and its properties
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { calculateEnhancedIJTPrice } from '@/utils/oneinch/hybrid-data';
import { Info, ExternalLink, Coins } from 'lucide-react';

export function IJTTokenInfo() {
  const [showDetails, setShowDetails] = useState(false);
  const pricingInfo = calculateEnhancedIJTPrice();

  const tokenDetails = {
    address: '0xe5ccdc758917ec96bd81932af3ef39837aebe01a',
    symbol: 'IJT',
    name: 'IntentJournal Token',
    decimals: 18,
    totalSupply: '1,000,000',
    network: 'BuildBear Base Fork',
    chainId: 27257,
    deploymentTx: '0x4954e7381feb9a4de4e0f0a3dd7579702e16241391e868033072f77aae92f264',
    explorerUrl: 'https://smooth-spiderman-faa2b8b9.ethernal.buildbear.io/',
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-blue-600" />
          IntentJournal Token (IJT)
        </CardTitle>
        <CardDescription>
          Your custom token deployed on BuildBear Base mainnet fork
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Price */}
        <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Current Price</p>
            <p className="text-2xl font-bold text-blue-600">${pricingInfo.price}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {pricingInfo.method}
          </Badge>
        </div>

        {/* Token Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Total Supply</p>
            <p className="font-medium">{tokenDetails.totalSupply} IJT</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Network</p>
            <p className="font-medium">{tokenDetails.network}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Decimals</p>
            <p className="font-medium">{tokenDetails.decimals}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Chain ID</p>
            <p className="font-medium">{tokenDetails.chainId}</p>
          </div>
        </div>

        {/* Contract Address */}
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Contract Address</p>
          <div className="flex items-center justify-between">
            <code className="text-xs font-mono">{tokenDetails.address}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`${tokenDetails.explorerUrl}/address/${tokenDetails.address}`, '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Pricing Details Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full"
        >
          <Info className="h-4 w-4 mr-2" />
          {showDetails ? 'Hide' : 'Show'} Pricing Details
        </Button>

        {showDetails && (
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
            <h4 className="font-medium mb-2">Price Calculation Method</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {pricingInfo.reasoning}
            </p>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Method:</span>
                <span className="font-medium">{pricingInfo.method}</span>
              </div>
              <div className="flex justify-between">
                <span>Data Source:</span>
                <span className="font-medium">Hybrid (Real + Custom)</span>
              </div>
              <div className="flex justify-between">
                <span>Update Frequency:</span>
                <span className="font-medium">Real-time</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> This is demonstration pricing for your BuildBear fork. 
                In production, token prices would be determined by actual market trading, 
                liquidity pools, or oracle feeds.
              </p>
            </div>
          </div>
        )}

        {/* Deployment Info */}
        <div className="pt-3 border-t">
          <p className="text-xs text-gray-500 mb-2">Deployment Transaction:</p>
          <div className="flex items-center justify-between">
            <code className="text-xs font-mono text-gray-600">
              {tokenDetails.deploymentTx.slice(0, 20)}...{tokenDetails.deploymentTx.slice(-10)}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`${tokenDetails.explorerUrl}/tx/${tokenDetails.deploymentTx}`, '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}