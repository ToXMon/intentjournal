'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Brain } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FusionManager } from '@/utils/oneinch/fusion'
import { ChartAnalyzer, type ChartAnalysisResult, type TechnicalPattern } from '@/utils/chart-analysis'

interface BiasEdgeAnalyzerProps {
  intentText: string
  tokenAddress?: string
  hasOnChainEvidence?: boolean
  onChainEvidence?: any[]
  onAnalysisComplete?: (analysis: {
    marketBias: 'bullish' | 'bearish' | 'neutral';
    edgeScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    reasoning: string;
    chartAnalysis?: ChartAnalysisResult;
  }) => void
}

export function BiasEdgeAnalyzer({ 
  intentText, 
  tokenAddress, 
  hasOnChainEvidence = false,
  onChainEvidence = [],
  onAnalysisComplete 
}: BiasEdgeAnalyzerProps) {
  const [analysis, setAnalysis] = useState<{
    marketBias: 'bullish' | 'bearish' | 'neutral';
    edgeScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    reasoning: string;
    chartAnalysis?: ChartAnalysisResult;
  } | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedToken, setSelectedToken] = useState(tokenAddress || '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')
  const [timeframe, setTimeframe] = useState<'1h' | '4h' | '1d' | '1w'>('4h')
  const [analysisStep, setAnalysisStep] = useState<'intent' | 'chart' | 'vision' | 'complete'>('intent')

  useEffect(() => {
    if (intentText.trim()) {
      analyzeIntent()
    }
  }, [intentText])

  const analyzeIntent = async () => {
    if (!intentText.trim()) return

    setIsAnalyzing(true)
    setAnalysisStep('intent')
    
    try {
      // Step 1: Analyze intent sentiment
      setAnalysisStep('intent')
      const intentAnalysis = await FusionManager.analyzeIntentBiasAndEdge(intentText)
      
      // Step 2: Perform comprehensive chart analysis
      setAnalysisStep('chart')
      const chartAnalysis = await ChartAnalyzer.performComprehensiveAnalysis(
        selectedToken,
        1, // Ethereum mainnet
        timeframe
      )
      
      // Step 3: AI vision analysis (included in chart analysis)
      setAnalysisStep('vision')
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate vision processing
      
      // Step 4: Combine all analyses
      setAnalysisStep('complete')
      const combinedAnalysis = combineAnalyses(intentAnalysis, chartAnalysis)
      
      setAnalysis(combinedAnalysis)
      onAnalysisComplete?.(combinedAnalysis)
    } catch (error) {
      console.error('Failed to analyze intent:', error)
      // Fallback to basic intent analysis
      const fallbackResult = await FusionManager.analyzeIntentBiasAndEdge(intentText)
      setAnalysis(fallbackResult)
      onAnalysisComplete?.(fallbackResult)
    } finally {
      setIsAnalyzing(false)
      setAnalysisStep('complete')
    }
  }

  const combineAnalyses = (
    intentAnalysis: any,
    chartAnalysis: ChartAnalysisResult
  ) => {
    // Weight the analyses: 40% intent, 60% technical/chart
    const intentWeight = 0.4
    const chartWeight = 0.6
    
    // Combine bias
    let combinedBias: 'bullish' | 'bearish' | 'neutral'
    const intentBiasScore = intentAnalysis.marketBias === 'bullish' ? 1 : 
                           intentAnalysis.marketBias === 'bearish' ? -1 : 0
    const chartBiasScore = chartAnalysis.overallBias === 'bullish' ? 1 : 
                          chartAnalysis.overallBias === 'bearish' ? -1 : 0
    
    const totalBiasScore = (intentBiasScore * intentWeight) + (chartBiasScore * chartWeight)
    
    if (totalBiasScore > 0.2) combinedBias = 'bullish'
    else if (totalBiasScore < -0.2) combinedBias = 'bearish'
    else combinedBias = 'neutral'
    
    // Combine edge scores
    const combinedEdgeScore = (intentAnalysis.edgeScore * intentWeight) + (chartAnalysis.edgeScore * chartWeight)
    
    // Combine risk levels
    const riskScores = { low: 1, medium: 2, high: 3 }
    const intentRiskScore = riskScores[intentAnalysis.riskLevel as keyof typeof riskScores] || 2
    const chartRiskScore = riskScores[chartAnalysis.riskLevel]
    const avgRiskScore = (intentRiskScore * intentWeight) + (chartRiskScore * chartWeight)
    
    const combinedRiskLevel: 'low' | 'medium' | 'high' = avgRiskScore <= 1.5 ? 'low' : avgRiskScore <= 2.5 ? 'medium' : 'high'
    
    // Generate comprehensive reasoning
    const reasoning = generateCombinedReasoning(intentAnalysis, chartAnalysis, combinedBias, combinedEdgeScore)
    
    return {
      marketBias: combinedBias,
      edgeScore: combinedEdgeScore,
      riskLevel: combinedRiskLevel,
      reasoning,
      chartAnalysis
    }
  }

  const generateCombinedReasoning = (
    intentAnalysis: any,
    chartAnalysis: ChartAnalysisResult,
    bias: string,
    edgeScore: number
  ): string => {
    const patternCount = chartAnalysis.technicalPatterns.length
    const strongPatterns = chartAnalysis.technicalPatterns.filter(p => p.significance === 'high')
    
    return `Combined Analysis: ${bias.toUpperCase()} bias with ${(edgeScore * 100).toFixed(0)}% edge score. ` +
           `Intent analysis shows ${intentAnalysis.marketBias} sentiment. ` +
           `Technical analysis detected ${patternCount} patterns (${strongPatterns.length} high-significance). ` +
           `Trend: ${chartAnalysis.trendDirection} with ${(chartAnalysis.trendStrength * 100).toFixed(0)}% strength. ` +
           `AI vision confidence: ${(chartAnalysis.aiVisionAnalysis?.confidence || 0.5) * 100}%.`
  }

  const getBiasColor = (bias: 'bullish' | 'bearish' | 'neutral') => {
    switch (bias) {
      case 'bullish':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
      case 'bearish':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
      case 'neutral':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
    }
  }

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
    }
  }

  const getEdgeScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600 dark:text-green-400'
    if (score >= 0.4) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  // If no on-chain evidence, show locked state
  if (!hasOnChainEvidence || onChainEvidence.length === 0) {
    return (
      <Card className="border-gray-300 dark:border-gray-600">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
              <Brain className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-600 dark:text-gray-400">
                🔒 Bias & Edge Analysis Locked
              </CardTitle>
              <CardDescription>
                Execute your intent on-chain to unlock advanced AI analysis
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Brain className="h-4 w-4" />
            <AlertDescription>
              Advanced Bias & Edge analysis requires verified on-chain evidence of intent execution. 
              Complete the execution step to unlock this powerful AI-driven market analysis.
            </AlertDescription>
          </Alert>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              🧠 What You'll Get After Execution
            </p>
            <div className="grid grid-cols-1 gap-2 text-xs text-blue-700 dark:text-blue-300">
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Venice AI sentiment analysis of your trading intent</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Advanced candlestick pattern detection</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>AI computer vision analysis of price charts</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Support/resistance level identification</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Market edge scoring and risk assessment</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Fusion+ protocol optimization recommendations</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              🔗 Execute your intent on-chain to unlock these features
            </p>
            <Button disabled className="w-full">
              Analysis Locked - Execute Intent First
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getBiasIcon = (bias: 'bullish' | 'bearish' | 'neutral') => {
    switch (bias) {
      case 'bullish':
        return '📈'
      case 'bearish':
        return '📉'
      case 'neutral':
        return '➡️'
    }
  }

  const getRecommendedStrategy = () => {
    if (!analysis) return null

    const { marketBias, edgeScore, riskLevel } = analysis

    if (edgeScore >= 0.7 && riskLevel === 'low') {
      return {
        strategy: 'Aggressive Position',
        description: 'High confidence signal with low risk - consider larger position size',
        color: 'text-green-600 dark:text-green-400'
      }
    } else if (edgeScore >= 0.5 && riskLevel === 'medium') {
      return {
        strategy: 'Moderate Position',
        description: 'Decent signal with manageable risk - standard position size',
        color: 'text-blue-600 dark:text-blue-400'
      }
    } else if (edgeScore < 0.4 || riskLevel === 'high') {
      return {
        strategy: 'Conservative Approach',
        description: 'Weak signal or high risk - consider smaller position or wait',
        color: 'text-yellow-600 dark:text-yellow-400'
      }
    } else {
      return {
        strategy: 'Balanced Approach',
        description: 'Mixed signals - proceed with standard risk management',
        color: 'text-gray-600 dark:text-gray-400'
      }
    }
  }

  const getStepDescription = (step: string) => {
    switch (step) {
      case 'intent': return 'Analyzing intent sentiment with Venice AI'
      case 'chart': return 'Fetching chart data and detecting patterns'
      case 'vision': return 'AI vision analysis of candlestick patterns'
      case 'complete': return 'Combining all analyses'
      default: return 'Processing...'
    }
  }

  const getStepProgress = (step: string) => {
    switch (step) {
      case 'intent': return 25
      case 'chart': return 50
      case 'vision': return 75
      case 'complete': return 100
      default: return 0
    }
  }

  if (isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🧠 AI Bias & Edge Analysis</CardTitle>
          <CardDescription>
            Advanced technical analysis with AI vision and candlestick patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <div>
                  <p className="text-sm font-medium">{getStepDescription(analysisStep)}</p>
                  <p className="text-xs text-gray-500">Step {Math.ceil(getStepProgress(analysisStep) / 25)} of 4</p>
                </div>
              </div>
              <Badge variant="outline">
                {getStepProgress(analysisStep)}%
              </Badge>
            </div>
            <Progress value={getStepProgress(analysisStep)} className="h-2" />
          </div>

          {/* Analysis Steps */}
          <div className="space-y-2 text-xs">
            <div className={`flex items-center gap-2 ${analysisStep === 'intent' ? 'text-blue-600' : getStepProgress(analysisStep) > 25 ? 'text-green-600' : 'text-gray-400'}`}>
              <span>{getStepProgress(analysisStep) > 25 ? '✓' : '○'}</span>
              <span>Intent sentiment analysis</span>
            </div>
            <div className={`flex items-center gap-2 ${analysisStep === 'chart' ? 'text-blue-600' : getStepProgress(analysisStep) > 50 ? 'text-green-600' : 'text-gray-400'}`}>
              <span>{getStepProgress(analysisStep) > 50 ? '✓' : '○'}</span>
              <span>Technical pattern detection</span>
            </div>
            <div className={`flex items-center gap-2 ${analysisStep === 'vision' ? 'text-blue-600' : getStepProgress(analysisStep) > 75 ? 'text-green-600' : 'text-gray-400'}`}>
              <span>{getStepProgress(analysisStep) > 75 ? '✓' : '○'}</span>
              <span>AI vision chart analysis</span>
            </div>
            <div className={`flex items-center gap-2 ${analysisStep === 'complete' ? 'text-blue-600' : getStepProgress(analysisStep) >= 100 ? 'text-green-600' : 'text-gray-400'}`}>
              <span>{getStepProgress(analysisStep) >= 100 ? '✓' : '○'}</span>
              <span>Combined analysis synthesis</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🧠 AI Bias & Edge Analysis</CardTitle>
          <CardDescription>
            Advanced technical analysis with AI vision and candlestick patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Token Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2">Token to Analyze</p>
              <Select value={selectedToken} onValueChange={setSelectedToken}>
                <SelectTrigger>
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee">ETH</SelectItem>
                  <SelectItem value="0xA0b86a33E6441b8C0b8d9B0b8b8b8b8b8b8b8b8b">BTC</SelectItem>
                  <SelectItem value="0x036CbD53842c5426634e7929541eC2318f3dCF7e">USDC</SelectItem>
                  <SelectItem value="0x514910771AF9Ca656af840dff83E8264EcF986CA">LINK</SelectItem>
                  <SelectItem value="0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984">UNI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Timeframe</p>
              <Select value={timeframe} onValueChange={(value: '1h' | '4h' | '1d' | '1w') => setTimeframe(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="4h">4 Hours</SelectItem>
                  <SelectItem value="1d">1 Day</SelectItem>
                  <SelectItem value="1w">1 Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Analysis Features */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              🔍 Analysis Features
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-700 dark:text-blue-300">
              <div className="flex items-center gap-1">
                <span>✓</span>
                <span>Intent sentiment analysis</span>
              </div>
              <div className="flex items-center gap-1">
                <span>✓</span>
                <span>Candlestick pattern detection</span>
              </div>
              <div className="flex items-center gap-1">
                <span>✓</span>
                <span>AI vision chart analysis</span>
              </div>
              <div className="flex items-center gap-1">
                <span>✓</span>
                <span>Support/resistance levels</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button onClick={analyzeIntent} disabled={!intentText.trim()} className="w-full">
              Start Advanced Analysis
            </Button>
            {!intentText.trim() && (
              <p className="text-xs text-gray-500 mt-2">
                Write your intent to enable analysis
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const recommendedStrategy = getRecommendedStrategy()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">🧠 AI Bias & Edge Analysis</CardTitle>
        <CardDescription>
          Venice AI analysis of your trading intent and market edge
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Market Bias */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getBiasIcon(analysis.marketBias)}</span>
            <div>
              <p className="text-sm font-medium">Market Bias</p>
              <p className="text-xs text-gray-500">Detected sentiment direction</p>
            </div>
          </div>
          <Badge className={getBiasColor(analysis.marketBias)}>
            {analysis.marketBias.toUpperCase()}
          </Badge>
        </div>

        {/* Edge Score */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Trading Edge Score</p>
              <p className="text-xs text-gray-500">Confidence in signal strength</p>
            </div>
            <span className={`font-bold ${getEdgeScoreColor(analysis.edgeScore)}`}>
              {(analysis.edgeScore * 100).toFixed(0)}%
            </span>
          </div>
          <Progress value={analysis.edgeScore * 100} className="h-2" />
        </div>

        {/* Risk Level */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Risk Assessment</p>
            <p className="text-xs text-gray-500">Overall risk evaluation</p>
          </div>
          <Badge className={getRiskColor(analysis.riskLevel)}>
            {analysis.riskLevel.toUpperCase()} RISK
          </Badge>
        </div>

        {/* Recommended Strategy */}
        {recommendedStrategy && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">💡</span>
              <p className={`text-sm font-medium ${recommendedStrategy.color}`}>
                {recommendedStrategy.strategy}
              </p>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {recommendedStrategy.description}
            </p>
          </div>
        )}

        {/* Technical Patterns */}
        {analysis.chartAnalysis?.technicalPatterns && analysis.chartAnalysis.technicalPatterns.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">📊 Detected Patterns</p>
            <div className="grid grid-cols-1 gap-2">
              {analysis.chartAnalysis.technicalPatterns.slice(0, 3).map((pattern, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      pattern.type === 'bullish' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                      pattern.type === 'bearish' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
                    }`}>
                      {pattern.type === 'bullish' ? '📈' : pattern.type === 'bearish' ? '📉' : '➡️'}
                    </span>
                    <div>
                      <p className="text-xs font-medium">{pattern.name}</p>
                      <p className="text-xs text-gray-500">{pattern.significance} significance</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {(pattern.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chart Analysis Summary */}
        {analysis.chartAnalysis && (
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <p className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">
              📈 Technical Analysis
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-500">Trend Direction</p>
                <p className="font-medium capitalize">{analysis.chartAnalysis.trendDirection}</p>
              </div>
              <div>
                <p className="text-gray-500">Trend Strength</p>
                <p className="font-medium">{(analysis.chartAnalysis.trendStrength * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-gray-500">Volume Trend</p>
                <p className="font-medium capitalize">{analysis.chartAnalysis.volumeAnalysis.trend}</p>
              </div>
              <div>
                <p className="text-gray-500">AI Vision</p>
                <p className="font-medium">{((analysis.chartAnalysis.aiVisionAnalysis?.confidence || 0.5) * 100).toFixed(0)}%</p>
              </div>
            </div>
          </div>
        )}

        {/* AI Vision Insights */}
        {analysis.chartAnalysis?.aiVisionAnalysis && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
            <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200 mb-1">
              👁️ AI Vision Analysis
            </p>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 line-clamp-3">
              {analysis.chartAnalysis.aiVisionAnalysis.visionInsights}
            </p>
          </div>
        )}

        {/* Analysis Reasoning */}
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <p className="text-sm font-medium mb-1">🔍 Combined Analysis</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {analysis.reasoning}
          </p>
        </div>

        {/* Fusion+ Optimization */}
        <div className="border-t pt-3">
          <p className="text-xs text-gray-500 mb-2">
            ⚡ Fusion+ Optimization
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-gray-500">Recommended Preset</p>
              <p className="font-medium">
                {analysis.edgeScore > 0.7 && analysis.riskLevel === 'low' ? 'Slow' :
                 analysis.edgeScore < 0.4 || analysis.riskLevel === 'high' ? 'Fast' : 'Medium'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">MEV Protection</p>
              <p className="font-medium text-green-600">✓ Enabled</p>
            </div>
          </div>
        </div>

        {/* Refresh Analysis */}
        <div className="text-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={analyzeIntent}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}