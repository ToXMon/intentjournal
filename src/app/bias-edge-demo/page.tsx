'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, CheckCircle, Clock, AlertCircle, ArrowRight, Zap, Brain, TrendingUp, TrendingDown } from 'lucide-react';
import { BiasEdgeAnalyzer } from '@/components/bias-edge-analyzer';

interface TokenPrice {
  address: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
}

interface ChartData {
  timestamp: number;
  price: number;
  volume: number;
}

const DEMO_TOKENS = {
  ETH: {
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    symbol: 'ETH',
    name: 'Ethereum'
  },
  USDC: {
    address: '0xa0b86a33e6441b8c0b8d9b0b8b8b8b8b8b8b8b8b',
    symbol: 'USDC',
    name: 'USD Coin'
  },
  WBTC: {
    address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin'
  }
};

const SAMPLE_INTENTS = [
  "I want to swap 1 ETH for USDC when ETH breaks above $3,500 resistance",
  "Looking to buy the dip on ETH if it drops below $3,200 support",
  "Bullish on ETH, want to accumulate more on any weakness",
  "Bearish sentiment on crypto, looking to reduce ETH exposure",
  "ETH showing strong momentum, want to ride the trend higher"
];

export default function BiasEdgeDemoPage() {
  const [selectedToken, setSelectedToken] = useState('ETH');
  const [intentText, setIntentText] = useState(SAMPLE_INTENTS[0]);
  const [tokenPrice, setTokenPrice] = useState<TokenPrice | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  // Mock price data for demo
  const mockPriceData = {
    ETH: { price: 3456.78, change24h: 2.34, volume24h: 15234567890 },
    USDC: { price: 1.0001, change24h: 0.01, volume24h: 8765432100 },
    WBTC: { price: 67890.12, change24h: -1.23, volume24h: 5432109876 }
  };

  // Generate mock chart data
  const generateMockChartData = (basePrice: number) => {
    const data: ChartData[] = [];
    const now = Date.now();
    let currentPrice = basePrice;
    
    for (let i = 168; i >= 0; i--) { // 7 days of hourly data
      const timestamp = now - (i * 60 * 60 * 1000);
      const volatility = 0.02; // 2% volatility
      const change = (Math.random() - 0.5) * volatility;
      currentPrice = currentPrice * (1 + change);
      
      data.push({
        timestamp,
        price: currentPrice,
        volume: Math.random() * 1000000 + 500000
      });
    }
    
    return data;
  };

  useEffect(() => {
    // Load mock price data
    const token = selectedToken as keyof typeof mockPriceData;
    const priceData = mockPriceData[token];
    
    setTokenPrice({
      address: DEMO_TOKENS[token].address,
      symbol: DEMO_TOKENS[token].symbol,
      ...priceData
    });

    // Generate mock chart data
    setChartData(generateMockChartData(priceData.price));
  }, [selectedToken]);

  const handleAnalysisComplete = (analysisResult: any) => {
    setAnalysis(analysisResult);
  };

  const renderPriceChart = () => {
    if (!chartData.length) return null;

    const minPrice = Math.min(...chartData.map(d => d.price));
    const maxPrice = Math.max(...chartData.map(d => d.price));
    const priceRange = maxPrice - minPrice;

    return (
      <div className="h-64 w-full relative bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <div className="absolute top-2 left-4">
          <p className="text-sm font-medium">{selectedToken} Price Chart (7D)</p>
          <p className="text-xs text-gray-500">Hourly candlesticks</p>
        </div>
        
        <svg className="w-full h-full" viewBox="0 0 800 200">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={i}
              x1="0"
              y1={40 + (i * 32)}
              x2="800"
              y2={40 + (i * 32)}
              stroke="#e5e7eb"
              strokeWidth="0.5"
            />
          ))}
          
          {/* Price line */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            points={chartData.map((d, i) => {
              const x = (i / (chartData.length - 1)) * 800;
              const y = 180 - ((d.price - minPrice) / priceRange) * 140;
              return `${x},${y}`;
            }).join(' ')}
          />
          
          {/* Support/Resistance levels */}
          <line
            x1="0"
            y1={180 - ((minPrice * 1.02 - minPrice) / priceRange) * 140}
            x2="800"
            y2={180 - ((minPrice * 1.02 - minPrice) / priceRange) * 140}
            stroke="#ef4444"
            strokeWidth="1"
            strokeDasharray="5,5"
          />
          <line
            x1="0"
            y1={180 - ((maxPrice * 0.98 - minPrice) / priceRange) * 140}
            x2="800"
            y2={180 - ((maxPrice * 0.98 - minPrice) / priceRange) * 140}
            stroke="#22c55e"
            strokeWidth="1"
            strokeDasharray="5,5"
          />
        </svg>
        
        <div className="absolute bottom-2 right-4 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-red-500"></div>
              <span>Support</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-green-500"></div>
              <span>Resistance</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🧠 Bias & Edge Analyzer Demo</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Experience advanced AI-powered market analysis with Venice AI and real-time chart data
        </p>
      </div>

      <Tabs defaultValue="demo" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="demo">Live Demo</TabsTrigger>
          <TabsTrigger value="analysis">Analysis Results</TabsTrigger>
          <TabsTrigger value="features">Features Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📊 Market Data</CardTitle>
                  <CardDescription>
                    Real-time price data and chart analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Token Selection */}
                  <div>
                    <p className="text-sm font-medium mb-2">Select Token</p>
                    <Select value={selectedToken} onValueChange={setSelectedToken}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose token" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(DEMO_TOKENS).map(([key, token]) => (
                          <SelectItem key={key} value={key}>
                            {token.symbol} - {token.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Display */}
                  {tokenPrice && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{tokenPrice.symbol}</span>
                        <Badge variant={tokenPrice.change24h >= 0 ? "default" : "destructive"}>
                          {tokenPrice.change24h >= 0 ? '+' : ''}{tokenPrice.change24h.toFixed(2)}%
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold">
                        ${tokenPrice.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-gray-500">
                        24h Volume: ${(tokenPrice.volume24h / 1e9).toFixed(2)}B
                      </div>
                    </div>
                  )}

                  {/* Chart */}
                  {renderPriceChart()}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">✍️ Trading Intent</CardTitle>
                  <CardDescription>
                    Describe your trading intention for AI analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Your Intent</p>
                    <Input
                      value={intentText}
                      onChange={(e) => setIntentText(e.target.value)}
                      placeholder="Describe your trading intent..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Quick Examples</p>
                    <div className="space-y-1">
                      {SAMPLE_INTENTS.map((intent, index) => (
                        <button
                          key={index}
                          onClick={() => setIntentText(intent)}
                          className="text-xs text-left w-full p-2 rounded bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          {intent}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analysis Panel */}
            <div>
              <BiasEdgeAnalyzer
                intentText={intentText}
                tokenAddress={tokenPrice?.address}
                hasOnChainEvidence={true} // Enable for demo
                onChainEvidence={[{ txHash: 'demo' }]} // Mock evidence
                onAnalysisComplete={handleAnalysisComplete}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {analysis ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Market Bias Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {analysis.marketBias === 'bullish' ? '📈' : analysis.marketBias === 'bearish' ? '📉' : '➡️'}
                    Market Bias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <Badge className={`text-lg px-4 py-2 ${
                      analysis.marketBias === 'bullish' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                      analysis.marketBias === 'bearish' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
                    }`}>
                      {analysis.marketBias.toUpperCase()}
                    </Badge>
                    <p className="text-sm text-gray-500 mt-2">
                      AI detected sentiment direction
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Edge Score Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    ⚡ Edge Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">
                      {(analysis.edgeScore * 100).toFixed(0)}%
                    </div>
                    <Progress value={analysis.edgeScore * 100} className="h-3 mb-2" />
                    <p className="text-sm text-gray-500">
                      Trading confidence level
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Assessment Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    🛡️ Risk Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <Badge className={`text-lg px-4 py-2 ${
                      analysis.riskLevel === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                      analysis.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                    }`}>
                      {analysis.riskLevel.toUpperCase()} RISK
                    </Badge>
                    <p className="text-sm text-gray-500 mt-2">
                      Overall risk assessment
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Patterns */}
              {analysis.chartAnalysis?.technicalPatterns && (
                <Card className="md:col-span-2 lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="text-lg">📊 Technical Patterns Detected</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {analysis.chartAnalysis.technicalPatterns.slice(0, 6).map((pattern: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm px-2 py-1 rounded ${
                              pattern.type === 'bullish' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                              pattern.type === 'bearish' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
                            }`}>
                              {pattern.type === 'bullish' ? '📈' : pattern.type === 'bearish' ? '📉' : '➡️'}
                            </span>
                            <Badge variant="outline">
                              {(pattern.confidence * 100).toFixed(0)}%
                            </Badge>
                          </div>
                          <p className="font-medium text-sm">{pattern.name}</p>
                          <p className="text-xs text-gray-500">{pattern.significance} significance</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AI Reasoning */}
              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-lg">🔍 AI Analysis Reasoning</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm leading-relaxed">
                      {analysis.reasoning}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Run an analysis in the Demo tab to see detailed results here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🧠 Venice AI Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Natural language intent analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Sentiment detection and scoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Market bias identification</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Risk assessment and edge scoring</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📊 Technical Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Candlestick pattern recognition</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Support and resistance levels</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Trend direction and strength</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Volume analysis and patterns</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">👁️ AI Vision Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Computer vision chart analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Visual pattern recognition</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Chart formation insights</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Confidence scoring</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">⚡ 1inch Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Real-time price data</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Historical chart data</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Fusion+ optimization</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">MEV protection recommendations</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🚀 How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">1️⃣</span>
                  </div>
                  <h3 className="font-medium mb-2">Intent Analysis</h3>
                  <p className="text-sm text-gray-500">Venice AI analyzes your trading intent for sentiment and bias</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">2️⃣</span>
                  </div>
                  <h3 className="font-medium mb-2">Chart Analysis</h3>
                  <p className="text-sm text-gray-500">Technical patterns and trends are detected from price data</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">3️⃣</span>
                  </div>
                  <h3 className="font-medium mb-2">AI Vision</h3>
                  <p className="text-sm text-gray-500">Computer vision analyzes chart formations and patterns</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">4️⃣</span>
                  </div>
                  <h3 className="font-medium mb-2">Combined Score</h3>
                  <p className="text-sm text-gray-500">All analyses combine into bias, edge, and risk scores</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
