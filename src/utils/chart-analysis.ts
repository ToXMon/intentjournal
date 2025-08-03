/**
 * Advanced Chart Analysis with Technical Indicators and AI Vision
 * Integrates 1inch API data with Venice AI vision models for comprehensive analysis
 */

export interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalPattern {
  name: string;
  type: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  description: string;
  significance: 'high' | 'medium' | 'low';
}

export interface ChartAnalysisResult {
  technicalPatterns: TechnicalPattern[];
  trendDirection: 'bullish' | 'bearish' | 'sideways';
  trendStrength: number; // 0-1
  supportLevels: number[];
  resistanceLevels: number[];
  volumeAnalysis: {
    trend: 'increasing' | 'decreasing' | 'stable';
    significance: number;
  };
  aiVisionAnalysis?: {
    chartImageUrl: string;
    visionInsights: string;
    confidence: number;
  };
  overallBias: 'bullish' | 'bearish' | 'neutral';
  edgeScore: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high';
}

export class ChartAnalyzer {
  private static readonly CANDLESTICK_PATTERNS = {
    bearish: [
      {
        name: 'Hanging Man',
        description: 'Long wick below with small body, signals trend reversal in uptrend',
        significance: 'medium' as const
      },
      {
        name: 'Shooting Star',
        description: 'Long wick above with small body, signals trend exhaustion',
        significance: 'high' as const
      },
      {
        name: 'Gravestone Doji',
        description: 'Open, close, and low are same - sellers pushed price down',
        significance: 'medium' as const
      },
      {
        name: 'Bearish Engulfing',
        description: 'Large red candle engulfs small green candle',
        significance: 'high' as const
      },
      {
        name: 'Dark Cloud Cover',
        description: 'Red candle closes halfway through previous green candle',
        significance: 'medium' as const
      },
      {
        name: 'Bearish Harami',
        description: 'Small bear candle within previous bull candle',
        significance: 'low' as const
      },
      {
        name: 'Evening Star',
        description: 'Three-candle pattern: bull, doji, strong bear',
        significance: 'high' as const
      }
    ],
    bullish: [
      {
        name: 'Hammer',
        description: 'Long wick below in downtrend, signals reversal',
        significance: 'high' as const
      },
      {
        name: 'Inverted Hammer',
        description: 'Long wick above at end of downtrend',
        significance: 'medium' as const
      },
      {
        name: 'Dragonfly Doji',
        description: 'Open, close, and high are same - buyers pushed price up',
        significance: 'medium' as const
      },
      {
        name: 'Bullish Engulfing',
        description: 'Large green candle engulfs small red candle',
        significance: 'high' as const
      },
      {
        name: 'Piercing Pattern',
        description: 'Green candle closes halfway through previous red candle',
        significance: 'medium' as const
      },
      {
        name: 'Bullish Harami',
        description: 'Small bull candle within previous bear candle',
        significance: 'low' as const
      },
      {
        name: 'Morning Star',
        description: 'Three-candle pattern: bear, doji, strong bull',
        significance: 'high' as const
      }
    ]
  };

  /**
   * Fetch token price history from 1inch API
   */
  static async fetchTokenPriceHistory(
    tokenAddress: string,
    chainId: number = 1,
    timeframe: '1h' | '4h' | '1d' | '1w' = '1h',
    limit: number = 100
  ): Promise<CandlestickData[]> {
    try {
      // This would integrate with 1inch Price API for historical data
      // For now, we'll generate realistic mock data
      const mockData: CandlestickData[] = [];
      const basePrice = 2500; // Starting price
      let currentPrice = basePrice;
      const now = Date.now();
      const timeInterval = timeframe === '1h' ? 3600000 : 
                          timeframe === '4h' ? 14400000 :
                          timeframe === '1d' ? 86400000 : 604800000;

      for (let i = limit - 1; i >= 0; i--) {
        const timestamp = now - (i * timeInterval);
        const volatility = 0.02; // 2% volatility
        const trend = Math.sin(i * 0.1) * 0.01; // Slight trend component
        
        const open = currentPrice;
        const priceChange = (Math.random() - 0.5) * volatility * currentPrice + trend * currentPrice;
        const close = Math.max(open + priceChange, 0.01);
        
        const high = Math.max(open, close) * (1 + Math.random() * 0.01);
        const low = Math.min(open, close) * (1 - Math.random() * 0.01);
        const volume = Math.random() * 1000000 + 500000;

        mockData.push({
          timestamp,
          open,
          high,
          low,
          close,
          volume
        });

        currentPrice = close;
      }

      return mockData;
    } catch (error) {
      console.error('Failed to fetch token price history:', error);
      return [];
    }
  }

  /**
   * Generate chart image URL for vision analysis
   */
  static generateChartImageUrl(
    tokenAddress: string,
    chainId: number,
    timeframe: string
  ): string {
    // This would generate a chart image URL using a charting service
    // For demo purposes, we'll use a placeholder that represents the chart
    return `https://api.placeholder.com/800x400/chart?token=${tokenAddress}&chain=${chainId}&timeframe=${timeframe}`;
  }

  /**
   * Analyze chart using Venice AI vision model
   */
  static async analyzeChartWithVision(
    chartImageUrl: string,
    candlestickData: CandlestickData[]
  ): Promise<{
    visionInsights: string;
    confidence: number;
    detectedPatterns: string[];
  }> {
    try {
      // Import Venice AI client
      const { veniceClient } = await import('@/utils/embeddings');

      // Create a detailed prompt for chart analysis
      const chartContext = this.generateChartContext(candlestickData);
      
      const visionPrompt = `Analyze this cryptocurrency price chart and provide technical analysis insights.

CHART CONTEXT:
${chartContext}

CANDLESTICK PATTERNS TO LOOK FOR:
${this.getCandlestickPatternsPrompt()}

Please analyze the chart for:
1. Trend direction and strength
2. Support and resistance levels
3. Candlestick patterns (bullish/bearish signals)
4. Volume analysis
5. Overall market sentiment

Provide a JSON response with:
{
  "visionInsights": "Detailed technical analysis of the chart",
  "confidence": 0.85,
  "detectedPatterns": ["pattern1", "pattern2"],
  "trendDirection": "bullish|bearish|sideways",
  "keyLevels": {
    "support": [2400, 2350],
    "resistance": [2600, 2650]
  }
}`;

      const response = await veniceClient.createChatCompletion([
        {
          role: 'system',
          content: 'You are an expert technical analyst specializing in cryptocurrency chart analysis and candlestick patterns. Analyze charts with precision and provide actionable insights.'
        },
        {
          role: 'user',
          content: visionPrompt
        }
      ], {
        taskType: 'vision_tasks',
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 800
      });

      const aiContent = response.choices[0]?.message?.content || '';
      
      try {
        const analysis = JSON.parse(aiContent);
        return {
          visionInsights: analysis.visionInsights || 'Chart analysis completed',
          confidence: analysis.confidence || 0.7,
          detectedPatterns: analysis.detectedPatterns || []
        };
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          visionInsights: aiContent || 'Technical analysis indicates mixed signals with moderate volatility.',
          confidence: 0.6,
          detectedPatterns: []
        };
      }
    } catch (error) {
      console.error('Vision analysis failed:', error);
      return {
        visionInsights: 'Vision analysis temporarily unavailable. Using technical indicators only.',
        confidence: 0.5,
        detectedPatterns: []
      };
    }
  }

  /**
   * Detect candlestick patterns in price data
   */
  static detectCandlestickPatterns(data: CandlestickData[]): TechnicalPattern[] {
    if (data.length < 3) return [];

    const patterns: TechnicalPattern[] = [];
    const recent = data.slice(-5); // Analyze last 5 candles

    // Check for various patterns
    patterns.push(...this.detectSingleCandlePatterns(recent));
    patterns.push(...this.detectTwoCandlePatterns(recent));
    patterns.push(...this.detectThreeCandlePatterns(recent));

    return patterns;
  }

  /**
   * Detect single candle patterns (Hammer, Shooting Star, Doji, etc.)
   */
  private static detectSingleCandlePatterns(data: CandlestickData[]): TechnicalPattern[] {
    const patterns: TechnicalPattern[] = [];
    const latest = data[data.length - 1];
    
    if (!latest) return patterns;

    const bodySize = Math.abs(latest.close - latest.open);
    const upperWick = latest.high - Math.max(latest.open, latest.close);
    const lowerWick = Math.min(latest.open, latest.close) - latest.low;
    const totalRange = latest.high - latest.low;

    // Hammer pattern (bullish in downtrend)
    if (lowerWick > bodySize * 2 && upperWick < bodySize * 0.5 && this.isInDowntrend(data)) {
      patterns.push({
        name: 'Hammer',
        type: 'bullish',
        confidence: 0.75,
        description: 'Hammer pattern detected - potential bullish reversal',
        significance: 'high'
      });
    }

    // Shooting Star pattern (bearish in uptrend)
    if (upperWick > bodySize * 2 && lowerWick < bodySize * 0.5 && this.isInUptrend(data)) {
      patterns.push({
        name: 'Shooting Star',
        type: 'bearish',
        confidence: 0.8,
        description: 'Shooting Star pattern - trend exhaustion signal',
        significance: 'high'
      });
    }

    // Doji patterns
    if (bodySize < totalRange * 0.1) {
      if (upperWick > lowerWick * 3) {
        patterns.push({
          name: 'Gravestone Doji',
          type: 'bearish',
          confidence: 0.65,
          description: 'Gravestone Doji - sellers dominated the session',
          significance: 'medium'
        });
      } else if (lowerWick > upperWick * 3) {
        patterns.push({
          name: 'Dragonfly Doji',
          type: 'bullish',
          confidence: 0.65,
          description: 'Dragonfly Doji - buyers dominated the session',
          significance: 'medium'
        });
      }
    }

    return patterns;
  }

  /**
   * Detect two candle patterns (Engulfing, Harami, etc.)
   */
  private static detectTwoCandlePatterns(data: CandlestickData[]): TechnicalPattern[] {
    const patterns: TechnicalPattern[] = [];
    if (data.length < 2) return patterns;

    const prev = data[data.length - 2];
    const curr = data[data.length - 1];

    // Bullish Engulfing
    if (prev.close < prev.open && curr.close > curr.open && 
        curr.open < prev.close && curr.close > prev.open) {
      patterns.push({
        name: 'Bullish Engulfing',
        type: 'bullish',
        confidence: 0.85,
        description: 'Bullish Engulfing pattern - strong reversal signal',
        significance: 'high'
      });
    }

    // Bearish Engulfing
    if (prev.close > prev.open && curr.close < curr.open && 
        curr.open > prev.close && curr.close < prev.open) {
      patterns.push({
        name: 'Bearish Engulfing',
        type: 'bearish',
        confidence: 0.85,
        description: 'Bearish Engulfing pattern - strong reversal signal',
        significance: 'high'
      });
    }

    return patterns;
  }

  /**
   * Detect three candle patterns (Morning Star, Evening Star)
   */
  private static detectThreeCandlePatterns(data: CandlestickData[]): TechnicalPattern[] {
    const patterns: TechnicalPattern[] = [];
    if (data.length < 3) return patterns;

    const first = data[data.length - 3];
    const middle = data[data.length - 2];
    const last = data[data.length - 1];

    // Morning Star (bullish)
    if (first.close < first.open && // First candle is bearish
        Math.abs(middle.close - middle.open) < (first.high - first.low) * 0.3 && // Middle is small/doji
        last.close > last.open && // Last candle is bullish
        last.close > (first.open + first.close) / 2) { // Last closes above midpoint of first
      patterns.push({
        name: 'Morning Star',
        type: 'bullish',
        confidence: 0.9,
        description: 'Morning Star pattern - strong bullish reversal',
        significance: 'high'
      });
    }

    // Evening Star (bearish)
    if (first.close > first.open && // First candle is bullish
        Math.abs(middle.close - middle.open) < (first.high - first.low) * 0.3 && // Middle is small/doji
        last.close < last.open && // Last candle is bearish
        last.close < (first.open + first.close) / 2) { // Last closes below midpoint of first
      patterns.push({
        name: 'Evening Star',
        type: 'bearish',
        confidence: 0.9,
        description: 'Evening Star pattern - strong bearish reversal',
        significance: 'high'
      });
    }

    return patterns;
  }

  /**
   * Determine if price is in uptrend
   */
  private static isInUptrend(data: CandlestickData[]): boolean {
    if (data.length < 5) return false;
    const recent = data.slice(-5);
    const first = recent[0].close;
    const last = recent[recent.length - 1].close;
    return last > first * 1.02; // 2% increase
  }

  /**
   * Determine if price is in downtrend
   */
  private static isInDowntrend(data: CandlestickData[]): boolean {
    if (data.length < 5) return false;
    const recent = data.slice(-5);
    const first = recent[0].close;
    const last = recent[recent.length - 1].close;
    return last < first * 0.98; // 2% decrease
  }

  /**
   * Generate chart context for AI analysis
   */
  private static generateChartContext(data: CandlestickData[]): string {
    if (data.length === 0) return 'No price data available';

    const latest = data[data.length - 1];
    const oldest = data[0];
    const priceChange = ((latest.close - oldest.close) / oldest.close) * 100;
    const avgVolume = data.reduce((sum, candle) => sum + candle.volume, 0) / data.length;

    return `
Price Data Summary:
- Current Price: $${latest.close.toFixed(2)}
- Price Change: ${priceChange.toFixed(2)}%
- High: $${Math.max(...data.map(d => d.high)).toFixed(2)}
- Low: $${Math.min(...data.map(d => d.low)).toFixed(2)}
- Average Volume: ${avgVolume.toLocaleString()}
- Data Points: ${data.length} candles
- Trend: ${this.isInUptrend(data) ? 'Uptrend' : this.isInDowntrend(data) ? 'Downtrend' : 'Sideways'}
`;
  }

  /**
   * Get candlestick patterns prompt for AI
   */
  private static getCandlestickPatternsPrompt(): string {
    return `
BEARISH PATTERNS:
- Hanging Man: Long lower wick, small body, appears in uptrend
- Shooting Star: Long upper wick, small body, trend exhaustion
- Gravestone Doji: Open=Close=Low, sellers dominated
- Bearish Engulfing: Large red candle engulfs small green candle
- Dark Cloud Cover: Red candle closes halfway through green candle
- Evening Star: Bull + Doji + Strong Bear pattern

BULLISH PATTERNS:
- Hammer: Long lower wick in downtrend, reversal signal
- Inverted Hammer: Long upper wick at end of downtrend
- Dragonfly Doji: Open=Close=High, buyers dominated
- Bullish Engulfing: Large green candle engulfs small red candle
- Piercing Pattern: Green candle closes halfway through red candle
- Morning Star: Bear + Doji + Strong Bull pattern
`;
  }

  /**
   * Comprehensive chart analysis combining all methods
   */
  static async performComprehensiveAnalysis(
    tokenAddress: string,
    chainId: number = 1,
    timeframe: '1h' | '4h' | '1d' | '1w' = '4h'
  ): Promise<ChartAnalysisResult> {
    try {
      // Fetch price data
      const candlestickData = await this.fetchTokenPriceHistory(tokenAddress, chainId, timeframe);
      
      // Generate chart image URL
      const chartImageUrl = this.generateChartImageUrl(tokenAddress, chainId, timeframe);
      
      // Detect technical patterns
      const technicalPatterns = this.detectCandlestickPatterns(candlestickData);
      
      // Perform AI vision analysis
      const aiVisionAnalysis = await this.analyzeChartWithVision(chartImageUrl, candlestickData);
      
      // Calculate overall metrics
      const trendDirection = this.calculateTrendDirection(candlestickData);
      const trendStrength = this.calculateTrendStrength(candlestickData);
      const supportResistance = this.calculateSupportResistance(candlestickData);
      const volumeAnalysis = this.analyzeVolume(candlestickData);
      
      // Calculate overall bias and edge score
      const { overallBias, edgeScore, riskLevel } = this.calculateOverallMetrics(
        technicalPatterns,
        trendDirection,
        trendStrength,
        aiVisionAnalysis
      );

      return {
        technicalPatterns,
        trendDirection,
        trendStrength,
        supportLevels: supportResistance.support,
        resistanceLevels: supportResistance.resistance,
        volumeAnalysis,
        aiVisionAnalysis: {
          chartImageUrl,
          visionInsights: aiVisionAnalysis.visionInsights,
          confidence: aiVisionAnalysis.confidence
        },
        overallBias,
        edgeScore,
        riskLevel
      };
    } catch (error) {
      console.error('Comprehensive chart analysis failed:', error);
      
      // Return fallback analysis
      return {
        technicalPatterns: [],
        trendDirection: 'sideways',
        trendStrength: 0.5,
        supportLevels: [],
        resistanceLevels: [],
        volumeAnalysis: { trend: 'stable', significance: 0.5 },
        overallBias: 'neutral',
        edgeScore: 0.3,
        riskLevel: 'medium'
      };
    }
  }

  /**
   * Calculate trend direction from price data
   */
  private static calculateTrendDirection(data: CandlestickData[]): 'bullish' | 'bearish' | 'sideways' {
    if (data.length < 10) return 'sideways';
    
    const recent = data.slice(-10);
    const sma5 = this.calculateSMA(recent.slice(-5));
    const sma10 = this.calculateSMA(recent);
    
    if (sma5 > sma10 * 1.02) return 'bullish';
    if (sma5 < sma10 * 0.98) return 'bearish';
    return 'sideways';
  }

  /**
   * Calculate trend strength (0-1)
   */
  private static calculateTrendStrength(data: CandlestickData[]): number {
    if (data.length < 5) return 0.5;
    
    const recent = data.slice(-5);
    const priceChange = Math.abs((recent[recent.length - 1].close - recent[0].close) / recent[0].close);
    return Math.min(priceChange * 10, 1); // Scale to 0-1
  }

  /**
   * Calculate support and resistance levels
   */
  private static calculateSupportResistance(data: CandlestickData[]): {
    support: number[];
    resistance: number[];
  } {
    if (data.length < 20) return { support: [], resistance: [] };
    
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    
    // Simple pivot point calculation
    const resistance = [Math.max(...highs.slice(-10))];
    const support = [Math.min(...lows.slice(-10))];
    
    return { support, resistance };
  }

  /**
   * Analyze volume trends
   */
  private static analyzeVolume(data: CandlestickData[]): {
    trend: 'increasing' | 'decreasing' | 'stable';
    significance: number;
  } {
    if (data.length < 10) return { trend: 'stable', significance: 0.5 };
    
    const recent = data.slice(-5);
    const older = data.slice(-10, -5);
    
    const recentAvg = recent.reduce((sum, d) => sum + d.volume, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.volume, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.1) return { trend: 'increasing', significance: Math.min(change, 1) };
    if (change < -0.1) return { trend: 'decreasing', significance: Math.min(Math.abs(change), 1) };
    return { trend: 'stable', significance: 0.5 };
  }

  /**
   * Calculate Simple Moving Average
   */
  private static calculateSMA(data: CandlestickData[]): number {
    if (data.length === 0) return 0;
    return data.reduce((sum, d) => sum + d.close, 0) / data.length;
  }

  /**
   * Calculate overall metrics from all analysis
   */
  private static calculateOverallMetrics(
    patterns: TechnicalPattern[],
    trendDirection: 'bullish' | 'bearish' | 'sideways',
    trendStrength: number,
    aiAnalysis: { confidence: number }
  ): {
    overallBias: 'bullish' | 'bearish' | 'neutral';
    edgeScore: number;
    riskLevel: 'low' | 'medium' | 'high';
  } {
    // Calculate bias from patterns
    const bullishPatterns = patterns.filter(p => p.type === 'bullish');
    const bearishPatterns = patterns.filter(p => p.type === 'bearish');
    
    let biasScore = 0;
    bullishPatterns.forEach(p => biasScore += p.confidence);
    bearishPatterns.forEach(p => biasScore -= p.confidence);
    
    // Adjust for trend
    if (trendDirection === 'bullish') biasScore += trendStrength;
    if (trendDirection === 'bearish') biasScore -= trendStrength;
    
    const overallBias = biasScore > 0.2 ? 'bullish' : biasScore < -0.2 ? 'bearish' : 'neutral';
    
    // Calculate edge score
    const patternStrength = patterns.reduce((sum, p) => sum + p.confidence, 0) / Math.max(patterns.length, 1);
    const edgeScore = (patternStrength + trendStrength + aiAnalysis.confidence) / 3;
    
    // Calculate risk level
    const volatility = trendStrength; // Higher trend strength = higher volatility
    const riskLevel = volatility > 0.7 ? 'high' : volatility > 0.4 ? 'medium' : 'low';
    
    return { overallBias, edgeScore, riskLevel };
  }
}