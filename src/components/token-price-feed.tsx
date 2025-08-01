/**
 * Token Price Feed Component
 * Displays categorized token prices using 1inch Price API
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useChainId } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, TrendingUp, TrendingDown, Star, Flame, Zap } from 'lucide-react';
import { useTokenPrices } from '@/hooks/useOneInchData';
import {
  TOKEN_CATEGORIES,
  CATEGORY_CONFIG,
  getAllTokenAddresses,
  getTokenAddressesByCategory,
  getTokenInfo,
  type TokenInfo
} from '@/utils/oneinch/token-categories';

interface TokenPriceRowProps {
  tokenInfo: TokenInfo;
  price?: any;
  compact?: boolean;
  showCategory?: boolean;
}

function TokenPriceRow({ tokenInfo, price, compact = false, showCategory = false }: TokenPriceRowProps) {
  // Debug logging to see what price data we're getting
  if (tokenInfo.symbol === 'ETH' || tokenInfo.symbol === 'USDC') {
    console.log(`🔍 TokenPriceRow debug for ${tokenInfo.symbol}:`, {
      tokenAddress: tokenInfo.address,
      priceObject: price,
      priceUSD: price?.priceUSD,
      priceValue: price?.price
    });
  }
  
  const priceUSD = parseFloat(price?.priceUSD || '0');
  const change24h = parseFloat(price?.change24h || '0');
  const volume24h = price?.volume24h ? parseFloat(price.volume24h) : 0;

  const getCategoryColor = (category: string) => {
    const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
    return config?.color || 'gray';
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(1)}K`;
    return `$${volume.toFixed(0)}`;
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
        <div className="flex items-center space-x-2">
          {tokenInfo.logoURI ? (
            <img 
              src={tokenInfo.logoURI} 
              alt={tokenInfo.symbol}
              className="w-5 h-5 rounded-full"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium">{tokenInfo.symbol.charAt(0)}</span>
            </div>
          )}
          <div>
            <div className="text-sm font-medium">{tokenInfo.symbol}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">
            ${priceUSD.toFixed(priceUSD < 1 ? 6 : 2)}
          </div>
          {change24h !== 0 && (
            <div className={`text-xs flex items-center ${
              change24h >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {change24h >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {Math.abs(change24h).toFixed(2)}%
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div className="flex items-center space-x-3">
        {tokenInfo.logoURI ? (
          <img 
            src={tokenInfo.logoURI} 
            alt={tokenInfo.symbol}
            className="w-10 h-10 rounded-full"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">{tokenInfo.symbol.charAt(0)}</span>
          </div>
        )}
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">{tokenInfo.symbol}</span>
            {showCategory && (
              <Badge variant="outline" className={`text-xs text-${getCategoryColor(tokenInfo.category)}-600`}>
                {CATEGORY_CONFIG[tokenInfo.category as keyof typeof CATEGORY_CONFIG]?.icon} {tokenInfo.category}
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-500">{tokenInfo.name}</div>
          {tokenInfo.description && (
            <div className="text-xs text-gray-400 max-w-xs truncate">{tokenInfo.description}</div>
          )}
        </div>
      </div>
      
      <div className="text-right">
        <div className="text-lg font-bold">
          ${priceUSD.toFixed(priceUSD < 1 ? 6 : 2)}
        </div>
        {change24h !== 0 && (
          <div className={`text-sm flex items-center justify-end ${
            change24h >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {change24h >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {Math.abs(change24h).toFixed(2)}%
          </div>
        )}
        {volume24h > 0 && (
          <div className="text-xs text-gray-500">
            Vol: {formatVolume(volume24h)}
          </div>
        )}
      </div>
    </div>
  );
}

interface CategoryFeedProps {
  category: keyof typeof TOKEN_CATEGORIES;
  prices: Record<string, any>;
  loading: boolean;
  compact?: boolean;
}

function CategoryFeed({ category, prices, loading, compact = false }: CategoryFeedProps) {
  const tokens = TOKEN_CATEGORIES[category];
  const config = CATEGORY_CONFIG[category];

  if (loading) {
    return (
      <div className="space-y-3">
        {tokens.slice(0, compact ? 3 : 5).map((_, i) => (
          <Skeleton key={i} className={compact ? "h-12 w-full" : "h-20 w-full"} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tokens.slice(0, compact ? 3 : 10).map((tokenInfo) => {
        const priceData = prices[tokenInfo.address.toLowerCase()];
        
        // Enhance price data with token info if symbol is missing
        const enhancedPriceData = priceData ? {
          ...priceData,
          symbol: priceData.symbol === 'UNKNOWN' ? tokenInfo.symbol : priceData.symbol
        } : undefined;
        
        // Debug logging for first few tokens
        if (tokenInfo.symbol === 'ETH' || tokenInfo.symbol === 'USDC') {
          console.log(`🔍 CategoryFeed debug for ${tokenInfo.symbol}:`, {
            tokenAddress: tokenInfo.address,
            lookupAddress: tokenInfo.address.toLowerCase(),
            originalPriceData: priceData,
            enhancedPriceData,
            allPricesKeys: Object.keys(prices).slice(0, 5)
          });
        }
        
        return (
          <TokenPriceRow
            key={tokenInfo.address}
            tokenInfo={tokenInfo}
            price={enhancedPriceData}
            compact={compact}
          />
        );
      })}
    </div>
  );
}

interface TokenPriceFeedProps {
  compact?: boolean;
  showHeader?: boolean;
  defaultCategory?: keyof typeof TOKEN_CATEGORIES;
}

export function TokenPriceFeed({ compact = false, showHeader = true, defaultCategory = 'major' }: TokenPriceFeedProps) {
  const chainId = useChainId();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Fetch prices for all tokens
  const { prices, loading, error, refetch } = useTokenPrices(getAllTokenAddresses());

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  if (compact) {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Token Prices</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <CardDescription className="text-xs">
            Live prices from 1inch API
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue={defaultCategory} className="space-y-3">
            <TabsList className="grid w-full grid-cols-3 h-8">
              <TabsTrigger value="major" className="text-xs">💎 Major</TabsTrigger>
              <TabsTrigger value="memecoins" className="text-xs">🐸 Meme</TabsTrigger>
              <TabsTrigger value="defi" className="text-xs">🏦 DeFi</TabsTrigger>
            </TabsList>
            
            {(['major', 'memecoins', 'defi'] as const).map((category) => (
              <TabsContent key={category} value={category} className="mt-3">
                <CategoryFeed
                  category={category}
                  prices={prices}
                  loading={loading}
                  compact={true}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span>Token Price Feed</span>
            </h3>
            <p className="text-sm text-gray-500">
              Real-time prices by category using 1inch Price API
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              Chain {chainId}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600 text-sm">Error loading prices: {error}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue={defaultCategory} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          {(Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>).map((category) => {
            const config = CATEGORY_CONFIG[category];
            return (
              <TabsTrigger key={category} value={category} className="flex items-center space-x-1">
                <span>{config.icon}</span>
                <span className="hidden sm:inline">{config.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>).map((category) => {
          const config = CATEGORY_CONFIG[category];
          return (
            <TabsContent key={category} value={category} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>{config.icon}</span>
                    <span>{config.name}</span>
                  </CardTitle>
                  <CardDescription>
                    {config.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CategoryFeed
                    category={category}
                    prices={prices}
                    loading={loading}
                    compact={false}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Market Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span>Market Overview</span>
          </CardTitle>
          <CardDescription>
            Top performers and market movers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(prices)
                .filter(([_, price]) => price && parseFloat(price.change24h || '0') !== 0)
                .sort(([_, a], [__, b]) => Math.abs(parseFloat(b.change24h || '0')) - Math.abs(parseFloat(a.change24h || '0')))
                .slice(0, 8)
                .map(([address, price]) => {
                  const tokenInfo = getTokenInfo(address);
                  if (!tokenInfo) return null;
                  return (
                    <TokenPriceRow
                      key={address}
                      tokenInfo={tokenInfo}
                      price={price}
                      showCategory={true}
                    />
                  );
                })
                .filter(Boolean)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Integration Info */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-sm">1inch Price API Integration</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-gray-600 space-y-1">
            <p>• Real-time token prices with 24h change data</p>
            <p>• Volume and market cap information</p>
            <p>• Automatic refresh every 30 seconds</p>
            <p>• Fallback to mock data when API is unavailable</p>
            <p>• Categorized by token type for better discovery</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}