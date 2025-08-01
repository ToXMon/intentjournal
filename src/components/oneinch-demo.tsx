/**
 * Demo component to test 1inch API integration with IJT token
 */

'use client';

import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { 
  useTokenPrice, 
  useTokenPrices, 
  useSwapQuote, 
  useCommonTokens,
  useOneInchHealth,
  useSwapQuoteBuilder 
} from '@/hooks/useOneInch';
import { COMMON_TOKENS, RecommendationEnhancer } from '@/utils/oneinch';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const IJT_TOKEN_ADDRESS = '0xe5ccdc758917ec96bd81932af3ef39837aebe01a';

export function OneInchDemo() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [swapAmount, setSwapAmount] = useState('100');
  const { fetchTokenPrice, fetchSwapQuote, tokenPrices } = useAppStore();
  
  // Get IJT token price
  const { price: ijtPrice, loading: ijtPriceLoading, error: ijtPriceError } = useTokenPrice(IJT_TOKEN_ADDRESS);
  
  // Get common token prices
  const commonTokens = useCommonTokens();
  const commonTokenAddresses = commonTokens.map(token => token.address);
  const { prices: commonPrices, loading: pricesLoading } = useTokenPrices(commonTokenAddresses);
  
  // Health check
  const { isHealthy, loading: healthLoading, lastCheck } = useOneInchHealth();
  
  // Swap quote builder
  const { buildQuoteParams } = useSwapQuoteBuilder();
  
  // Build swap quote for IJT -> USDC
  const usdcAddress = COMMON_TOKENS[chainId as keyof typeof COMMON_TOKENS]?.USDC;
  const swapParams = buildQuoteParams(
    IJT_TOKEN_ADDRESS,
    usdcAddress || '',
    parseUnits(swapAmount, 18).toString(),
    1
  );
  
  const { quote, loading: quoteLoading, error: quoteError } = useSwapQuote(swapParams || undefined);

  if (!address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>1inch API Demo</CardTitle>
          <CardDescription>Connect your wallet to test 1inch integration</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1inch API Health Status</CardTitle>
          <CardDescription>Current API status for chain {chainId}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isHealthy ? 'Healthy' : 'Unhealthy'}</span>
            {healthLoading && <span className="text-sm text-gray-500">Checking...</span>}
          </div>
          {lastCheck && (
            <p className="text-sm text-gray-500 mt-2">
              Last checked: {lastCheck.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>IntentJournal Token (IJT) Price</CardTitle>
          <CardDescription>Your custom token deployed on BuildBear fork</CardDescription>
        </CardHeader>
        <CardContent>
          {ijtPriceLoading ? (
            <p>Loading IJT price...</p>
          ) : ijtPriceError ? (
            <p className="text-red-500">Error: {ijtPriceError}</p>
          ) : ijtPrice ? (
            <div>
              <p className="text-2xl font-bold">${ijtPrice.priceUSD}</p>
              <p className="text-sm text-gray-500">
                Symbol: {ijtPrice.symbol} | Address: {ijtPrice.address}
              </p>
              {ijtPrice.change24h && (
                <p className={`text-sm ${parseFloat(ijtPrice.change24h) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  24h Change: {ijtPrice.change24h}%
                </p>
              )}
            </div>
          ) : (
            <p className="text-yellow-600">
              Price not available (custom token may not be in 1inch price feeds)
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Common Token Prices</CardTitle>
          <CardDescription>Prices for common tokens on current network</CardDescription>
        </CardHeader>
        <CardContent>
          {pricesLoading ? (
            <p>Loading token prices...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {commonTokens.map((token) => {
                const price = commonPrices[token.address];
                return (
                  <div key={token.address} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{token.symbol}</span>
                      {price ? (
                        <span className="text-lg">${price.priceUSD}</span>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{token.address}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Swap Quote Demo</CardTitle>
          <CardDescription>Get a quote for swapping IJT to USDC</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Amount of IJT to swap:
            </label>
            <input
              type="number"
              value={swapAmount}
              onChange={(e) => setSwapAmount(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="Enter amount"
            />
          </div>
          
          {!usdcAddress ? (
            <p className="text-yellow-600">USDC not available on current network</p>
          ) : quoteLoading ? (
            <p>Loading swap quote...</p>
          ) : quoteError ? (
            <p className="text-red-500">Quote Error: {quoteError}</p>
          ) : quote ? (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Swap Quote</h4>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Input:</span> {formatUnits(BigInt(quote.srcAmount), 18)} IJT
                </p>
                <p>
                  <span className="font-medium">Output:</span> {formatUnits(BigInt(quote.dstAmount), 6)} USDC
                </p>
                <p>
                  <span className="font-medium">Estimated Gas:</span> {quote.estimatedGas}
                </p>
                <p>
                  <span className="font-medium">Protocols:</span> {quote.protocols.length} routes found
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Enter amount to get quote</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Store Integration Test</CardTitle>
          <CardDescription>Test the 1inch integration with the app store</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={async () => {
                console.log('Testing store integration...');
                const price = await fetchTokenPrice(IJT_TOKEN_ADDRESS, chainId);
                console.log('IJT Price from store:', price);
              }}
              variant="outline"
            >
              Test IJT Price Fetch
            </Button>
            <Button
              onClick={async () => {
                if (!address || !usdcAddress) return;
                const params = {
                  src: IJT_TOKEN_ADDRESS,
                  dst: usdcAddress,
                  amount: parseUnits('100', 18).toString(),
                  from: address,
                  slippage: 1,
                };
                const quote = await fetchSwapQuote(params, chainId);
                console.log('Swap quote from store:', quote);
              }}
              variant="outline"
              disabled={!address || !usdcAddress}
            >
              Test Swap Quote
            </Button>
          </div>
          
          {Object.keys(tokenPrices).length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Cached Token Prices:</h4>
              <div className="text-sm space-y-1">
                {Object.entries(tokenPrices).map(([address, price]) => (
                  <div key={address} className="flex justify-between">
                    <span>{price.symbol}:</span>
                    <span>${price.priceUSD}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}