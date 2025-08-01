/**
 * Comprehensive 1inch Protocol Suite Demo
 * Demonstrates all 4 protocols in order of complexity: Classic → Limit → Fusion → Fusion+
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import { safeFormatUnits, formatTokenAmount } from '@/utils/format-helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  useTokenPrice, 
  useTokenPrices, 
  useSwapQuote, 
  useCommonTokens,
  useOneInchHealth 
} from '@/hooks/useOneInch';
import { 
  COMMON_TOKENS, 
  ClassicSwapManager,
  LimitOrderManager,
  FusionManager,
  FusionPlusManager
} from '@/utils/oneinch';
import { useAppStore } from '@/lib/store';
import type { 
  ClassicSwapResult,
  LimitOrderResult,
  FusionOrderResult,
  FusionPlusOrderResult 
} from '@/utils/oneinch';
import { 
  ArrowRight, 
  TrendingUp, 
  Clock, 
  Shield, 
  Zap, 
  Globe,
  BarChart3,
  Wallet,
  RefreshCw
} from 'lucide-react';
import { IJTTokenInfo } from '@/components/ijt-token-info';
import { BigIntTest } from '@/components/bigint-test';

const IJT_TOKEN_ADDRESS = '0xe5ccdc758917ec96bd81932af3ef39837aebe01a';

export function OneInchProtocolSuite() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { fetchTokenPrice, fetchSwapQuote, tokenPrices } = useAppStore();
  
  // State for different protocols
  const [classicSwapAmount, setClassicSwapAmount] = useState('100');
  const [limitOrderPrice, setLimitOrderPrice] = useState('1.50');
  const [limitOrderAmount, setLimitOrderAmount] = useState('1000');
  const [fusionAmount, setFusionAmount] = useState('500');
  const [fusionPlusFromChain, setFusionPlusFromChain] = useState('8453');
  const [fusionPlusToChain, setFusionPlusToChain] = useState('42161');
  
  // Loading states
  const [classicLoading, setClassicLoading] = useState(false);
  const [limitLoading, setLimitLoading] = useState(false);
  const [fusionLoading, setFusionLoading] = useState(false);
  const [fusionPlusLoading, setFusionPlusLoading] = useState(false);
  
  // Results
  const [classicQuote, setClassicQuote] = useState<ClassicSwapResult | null>(null);
  const [limitOrder, setLimitOrder] = useState<LimitOrderResult | null>(null);
  const [fusionOrder, setFusionOrder] = useState<FusionOrderResult | null>(null);
  const [fusionPlusOrder, setFusionPlusOrder] = useState<FusionPlusOrderResult | null>(null);

  // Get token data
  const { price: ijtPrice, loading: ijtPriceLoading } = useTokenPrice(IJT_TOKEN_ADDRESS);
  const commonTokens = useCommonTokens();
  const { isHealthy } = useOneInchHealth();
  
  // Common token addresses
  const usdcAddress = COMMON_TOKENS[chainId as keyof typeof COMMON_TOKENS]?.USDC;
  const ethAddress = (COMMON_TOKENS[chainId as keyof typeof COMMON_TOKENS] as any)?.ETH;

  if (!address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>1inch Protocol Suite</CardTitle>
          <CardDescription>Connect your wallet to explore all 1inch protocols</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleClassicSwap = async () => {
    if (!usdcAddress) return;
    
    setClassicLoading(true);
    try {
      const params = {
        src: IJT_TOKEN_ADDRESS,
        dst: usdcAddress,
        amount: parseUnits(classicSwapAmount, 18).toString(),
        from: address,
        slippage: 1,
      };
      
      const result = await ClassicSwapManager.getSwapQuote(params, chainId);
      setClassicQuote(result);
    } catch (error) {
      console.error('Classic swap error:', error);
    } finally {
      setClassicLoading(false);
    }
  };

  const handleLimitOrder = async () => {
    if (!usdcAddress) return;
    
    setLimitLoading(true);
    try {
      const params = {
        makerAsset: IJT_TOKEN_ADDRESS,
        takerAsset: usdcAddress,
        makingAmount: parseUnits(limitOrderAmount, 18).toString(),
        takingAmount: parseUnits((parseFloat(limitOrderAmount) * parseFloat(limitOrderPrice)).toString(), 6).toString(),
        maker: address,
        expiration: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      };
      
      const order = await LimitOrderManager.createLimitOrder(params, chainId);
      setLimitOrder(order);
    } catch (error) {
      console.error('Limit order error:', error);
    } finally {
      setLimitLoading(false);
    }
  };

  const handleFusionSwap = async () => {
    if (!usdcAddress) return;
    
    setFusionLoading(true);
    try {
      const params = {
        fromTokenAddress: IJT_TOKEN_ADDRESS,
        toTokenAddress: usdcAddress,
        amount: parseUnits(fusionAmount, 18).toString(),
        walletAddress: address,
        preset: 'medium' as const,
      };
      
      const order = await FusionManager.createFusionOrder(params, chainId);
      setFusionOrder(order);
    } catch (error) {
      console.error('Fusion error:', error);
    } finally {
      setFusionLoading(false);
    }
  };

  const handleFusionPlusSwap = async () => {
    if (!usdcAddress) return;
    
    setFusionPlusLoading(true);
    try {
      const params = {
        srcChainId: parseInt(fusionPlusFromChain),
        dstChainId: parseInt(fusionPlusToChain),
        srcTokenAddress: IJT_TOKEN_ADDRESS,
        dstTokenAddress: usdcAddress,
        amount: parseUnits('100', 18).toString(),
        walletAddress: address,
        preset: 'medium' as const,
      };
      
      const order = await FusionPlusManager.createCrossChainOrder(params);
      setFusionPlusOrder(order);
    } catch (error) {
      console.error('Fusion+ error:', error);
    } finally {
      setFusionPlusLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Protocol Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            1inch Protocol Suite Overview
          </CardTitle>
          <CardDescription>
            Comprehensive demonstration of all 4 1inch protocols in order of complexity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">1</div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">Classic Swap</h3>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Aggregation across 163+ DEXes
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">2</div>
              <h3 className="font-medium text-green-900 dark:text-green-100">Limit Orders</h3>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Gasless orderbook trading
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-2">3</div>
              <h3 className="font-medium text-purple-900 dark:text-purple-100">Fusion</h3>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                Intent-based Dutch auctions
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-2">4</div>
              <h3 className="font-medium text-orange-900 dark:text-orange-100">Fusion+</h3>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                Cross-chain swaps
              </p>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">
              1inch API Status: {isHealthy ? 'Healthy' : 'Unhealthy'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* BigInt Test Component (temporary) */}
      <BigIntTest />

      {/* IJT Token Information */}
      <IJTTokenInfo />

      {/* Protocol Tabs */}
      <Tabs defaultValue="classic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="classic">Classic Swap</TabsTrigger>
          <TabsTrigger value="limit">Limit Orders</TabsTrigger>
          <TabsTrigger value="fusion">Fusion</TabsTrigger>
          <TabsTrigger value="fusionplus">Fusion+</TabsTrigger>
        </TabsList>

        {/* Classic Swap Tab */}
        <TabsContent value="classic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Classic Swap (Aggregation Protocol v6)
              </CardTitle>
              <CardDescription>
                Best-rate swaps across 163+ DEXes with runtime verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>From Token</Label>
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      IJT
                    </div>
                    <div>
                      <p className="font-medium">IntentJournal Token</p>
                      <p className="text-xs text-gray-500">
                        {ijtPrice ? `$${ijtPrice.priceUSD}` : 'Loading...'}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>To Token</Label>
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      USDC
                    </div>
                    <div>
                      <p className="font-medium">USD Coin</p>
                      <p className="text-xs text-gray-500">$1.00</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label>Amount to Swap</Label>
                <Input
                  type="number"
                  value={classicSwapAmount}
                  onChange={(e) => setClassicSwapAmount(e.target.value)}
                  placeholder="Enter IJT amount"
                />
              </div>

              <Button
                onClick={handleClassicSwap}
                disabled={classicLoading || !usdcAddress}
                className="w-full"
              >
                {classicLoading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Getting Best Route...
                  </div>
                ) : (
                  'Get Classic Swap Quote'
                )}
              </Button>

              {classicQuote && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Classic Swap Quote</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>You Pay:</span>
                      <span>{formatTokenAmount(classicQuote.quote.srcAmount, 18, 'IJT')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>You Receive:</span>
                      <span>{formatTokenAmount(classicQuote.quote.dstAmount, 6, 'USDC')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gas Estimate:</span>
                      <span>{classicQuote.quote.estimatedGas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Protocols:</span>
                      <span>{classicQuote.protocols.length} routes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Primary Route:</span>
                      <span>{classicQuote.protocols[0]?.name || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Limit Orders Tab */}
        <TabsContent value="limit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-500" />
                Limit Order Protocol
              </CardTitle>
              <CardDescription>
                Gasless orderbook trading with conditional execution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Sell Amount (IJT)</Label>
                  <Input
                    type="number"
                    value={limitOrderAmount}
                    onChange={(e) => setLimitOrderAmount(e.target.value)}
                    placeholder="Amount to sell"
                  />
                </div>
                <div>
                  <Label>Limit Price (USDC per IJT)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={limitOrderPrice}
                    onChange={(e) => setLimitOrderPrice(e.target.value)}
                    placeholder="Price per token"
                  />
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Total Value:</span>
                    <span>{(parseFloat(limitOrderAmount) * parseFloat(limitOrderPrice)).toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order Type:</span>
                    <span>Limit Order</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expiration:</span>
                    <span>24 hours</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleLimitOrder}
                disabled={limitLoading}
                className="w-full"
              >
                {limitLoading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Creating Order...
                  </div>
                ) : (
                  'Create Limit Order'
                )}
              </Button>

              {limitOrder && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Limit Order Created</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Order ID:</span>
                      <span className="font-mono">{limitOrder.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant="secondary">{limitOrder.status}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Selling:</span>
                      <span>{formatTokenAmount(limitOrder.makingAmount, 18, 'IJT')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>For:</span>
                      <span>{formatTokenAmount(limitOrder.takingAmount, 6, 'USDC')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span>${limitOrder.price} per IJT</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expires:</span>
                      <span>{new Date(limitOrder.expiration).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fusion Tab */}
        <TabsContent value="fusion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-500" />
                Fusion Protocol (Intent-Based)
              </CardTitle>
              <CardDescription>
                Dutch auction system with MEV protection and gasless execution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Amount to Swap (IJT)</Label>
                <Input
                  type="number"
                  value={fusionAmount}
                  onChange={(e) => setFusionAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                  How Fusion Works
                </h4>
                <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                  <li>• Dutch auction starts at premium price</li>
                  <li>• Price decreases over 2-minute period</li>
                  <li>• Resolvers compete for best execution</li>
                  <li>• No gas costs for users</li>
                  <li>• MEV protection built-in</li>
                </ul>
              </div>

              <Button
                onClick={handleFusionSwap}
                disabled={fusionLoading}
                className="w-full"
              >
                {fusionLoading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Starting Auction...
                  </div>
                ) : (
                  'Start Fusion Auction'
                )}
              </Button>

              {fusionOrder && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Fusion Auction Active</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Order ID:</span>
                      <span className="font-mono">{fusionOrder.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant="secondary">{fusionOrder.status}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span>{formatTokenAmount(fusionOrder.fromAmount, 18, 'IJT')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Best Rate:</span>
                      <span>{fusionOrder.currentBestRate ? formatTokenAmount(fusionOrder.currentBestRate, 6, 'USDC') : '0 USDC'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Resolvers:</span>
                      <span>{fusionOrder.resolvers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Auction Ends:</span>
                      <span>{new Date(fusionOrder.auctionEndTime).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MEV Protected:</span>
                      <span>{fusionOrder.mevProtected ? '✅' : '❌'}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fusion+ Tab */}
        <TabsContent value="fusionplus" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-orange-500" />
                Fusion+ Cross-Chain Protocol
              </CardTitle>
              <CardDescription>
                Cross-chain swaps with ultimate self-custody and MEV protection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>From Chain</Label>
                  <select
                    value={fusionPlusFromChain}
                    onChange={(e) => setFusionPlusFromChain(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="8453">Base</option>
                    <option value="1">Ethereum</option>
                    <option value="137">Polygon</option>
                    <option value="42161">Arbitrum</option>
                  </select>
                </div>
                <div>
                  <Label>To Chain</Label>
                  <select
                    value={fusionPlusToChain}
                    onChange={(e) => setFusionPlusToChain(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="42161">Arbitrum</option>
                    <option value="1">Ethereum</option>
                    <option value="137">Polygon</option>
                    <option value="8453">Base</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                  Cross-Chain Swap Details
                </h4>
                <div className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
                  <div className="flex justify-between">
                    <span>From:</span>
                    <span>100 IJT on {fusionPlusFromChain === '8453' ? 'Base' : 'Chain ' + fusionPlusFromChain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>To:</span>
                    <span>~150 USDC on {fusionPlusToChain === '42161' ? 'Arbitrum' : 'Chain ' + fusionPlusToChain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Security:</span>
                    <span>Hashlock + Timelock</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleFusionPlusSwap}
                disabled={fusionPlusLoading}
                className="w-full"
              >
                {fusionPlusLoading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Creating Cross-Chain Order...
                  </div>
                ) : (
                  'Create Fusion+ Cross-Chain Order'
                )}
              </Button>

              {fusionPlusOrder && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Fusion+ Cross-Chain Order</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Order Hash:</span>
                      <span className="font-mono">{fusionPlusOrder.orderHash.slice(0, 10)}...{fusionPlusOrder.orderHash.slice(-8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant="secondary">{fusionPlusOrder.status}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>From:</span>
                      <span>{formatTokenAmount(fusionPlusOrder.srcAmount, 18, 'IJT')} (Chain {fusionPlusOrder.srcChainId})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>To:</span>
                      <span>{formatTokenAmount(fusionPlusOrder.dstAmount, 6, 'USDC')} (Chain {fusionPlusOrder.dstChainId})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Secrets:</span>
                      <span>{fusionPlusOrder.secrets.length} generated</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Self-Custody:</span>
                      <span>{fusionPlusOrder.selfCustody ? '✅' : '❌'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time Lock:</span>
                      <span>{new Date(fusionPlusOrder.timeLock).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}