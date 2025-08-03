'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { LimitOrderManager, type LimitOrderResult } from '@/utils/oneinch/limit-orders'
import { useAppStore } from '@/lib/store'
import type { DeFiRecommendation } from '@/types'

interface IntentLimitOrderProps {
  recommendation: DeFiRecommendation
  intentId: string
  intentText: string
  onOrderCreated?: (order: LimitOrderResult) => void
}

export function IntentLimitOrder({ 
  recommendation, 
  intentId, 
  intentText, 
  onOrderCreated 
}: IntentLimitOrderProps) {
  const { address } = useAccount()
  const { connectedChain } = useAppStore()
  const [isCreating, setIsCreating] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<LimitOrderResult | null>(null)
  const [riskTolerance, setRiskTolerance] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate')

  const handleCreateOrder = async () => {
    if (!address || !connectedChain) return

    setIsCreating(true)
    try {
      const order = await LimitOrderManager.createOrderFromIntent(
        intentId,
        intentText,
        {
          fromToken: recommendation.tokenPair.from,
          toToken: recommendation.tokenPair.to,
          fromAmount: recommendation.route.fromAmount,
          toAmount: recommendation.route.toAmount,
          confidence: recommendation.confidence,
        },
        address,
        connectedChain,
        riskTolerance
      )

      if (order) {
        setCreatedOrder(order)
        onOrderCreated?.(order)
        console.log('✅ Intent-based limit order created:', order)
      }
    } catch (error) {
      console.error('❌ Failed to create intent-based limit order:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
  }

  const getFulfillmentColor = (probability: number) => {
    if (probability >= 0.7) return 'text-green-600 dark:text-green-400'
    if (probability >= 0.5) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  if (createdOrder) {
    return (
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-green-800 dark:text-green-200">
              🎯 Intent-Based Limit Order Created
            </CardTitle>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {createdOrder.status.toUpperCase()}
            </Badge>
          </div>
          <CardDescription>
            Your intent has been converted into a gasless limit order
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Order Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Order ID</p>
              <p className="font-mono text-xs">{createdOrder.orderId}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Order Hash</p>
              <p className="font-mono text-xs">{createdOrder.orderHash.slice(0, 10)}...</p>
            </div>
          </div>

          <Separator />

          {/* Trading Pair */}
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-sm font-medium">{recommendation.tokenPair.from.symbol}</p>
              <p className="text-xs text-gray-500">{recommendation.route.fromAmount}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1"></div>
              <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 px-2 py-1 rounded">
                →
              </span>
              <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1"></div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{recommendation.tokenPair.to.symbol}</p>
              <p className="text-xs text-gray-500">{recommendation.route.toAmount}</p>
            </div>
          </div>

          {/* Order Metrics */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">AI Confidence</p>
              <Badge className={getConfidenceColor(createdOrder.aiConfidence || 0)}>
                {((createdOrder.aiConfidence || 0) * 100).toFixed(0)}%
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">Fill Probability</p>
              <p className={`font-medium ${getFulfillmentColor(createdOrder.fulfillmentProbability || 0)}`}>
                {((createdOrder.fulfillmentProbability || 0) * 100).toFixed(0)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">Est. Fill Time</p>
              <p className="font-medium text-blue-600 dark:text-blue-400">
                {createdOrder.estimatedFillTime}
              </p>
            </div>
          </div>

          {/* Market Conditions */}
          {createdOrder.marketConditions && (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Market Conditions</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-gray-500">Current Price</p>
                  <p className="font-medium">${createdOrder.marketConditions.currentPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Price Impact</p>
                  <p className="font-medium">{createdOrder.marketConditions.priceImpact.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Liquidity</p>
                  <Badge variant="outline" className="text-xs">
                    {createdOrder.marketConditions.liquidity.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Intent Context */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
              📝 Original Intent
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 line-clamp-2">
              "{intentText}"
            </p>
          </div>

          {/* Expiration */}
          <div className="text-xs text-gray-500 text-center">
            Expires: {new Date(createdOrder.expiration).toLocaleString()}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">🎯 Create Intent-Based Limit Order</CardTitle>
        <CardDescription>
          Convert your AI recommendation into a gasless limit order on 1inch
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recommendation Summary */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            🤖 AI Recommendation
          </p>
          <div className="flex items-center justify-between text-sm">
            <span>{recommendation.tokenPair.from.symbol}</span>
            <span className="text-blue-600 dark:text-blue-400">→</span>
            <span>{recommendation.tokenPair.to.symbol}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
            <span>{recommendation.route.fromAmount}</span>
            <span>{recommendation.route.toAmount}</span>
          </div>
          <div className="mt-2">
            <Badge className={getConfidenceColor(recommendation.confidence)}>
              {(recommendation.confidence * 100).toFixed(0)}% Confidence
            </Badge>
          </div>
        </div>

        {/* Risk Tolerance Selection */}
        <div>
          <p className="text-sm font-medium mb-2">Risk Tolerance</p>
          <div className="grid grid-cols-3 gap-2">
            {(['conservative', 'moderate', 'aggressive'] as const).map((tolerance) => (
              <Button
                key={tolerance}
                variant={riskTolerance === tolerance ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRiskTolerance(tolerance)}
                className="text-xs"
              >
                {tolerance.charAt(0).toUpperCase() + tolerance.slice(1)}
              </Button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {riskTolerance === 'conservative' && 'Longer expiration, better prices, higher fill probability'}
            {riskTolerance === 'moderate' && 'Balanced approach with reasonable timeframes'}
            {riskTolerance === 'aggressive' && 'Shorter expiration, market prices, faster execution'}
          </p>
        </div>

        {/* Intent Context */}
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <p className="text-sm font-medium mb-1">📝 Your Intent</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
            "{intentText}"
          </p>
        </div>

        {/* Benefits */}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Gasless execution - no upfront gas fees</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Better prices through patient execution</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>AI-optimized parameters based on your intent</span>
          </div>
        </div>

        {/* Create Order Button */}
        <Button
          onClick={handleCreateOrder}
          disabled={isCreating || !address}
          className="w-full"
        >
          {isCreating ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creating Intent-Based Order...
            </div>
          ) : (
            'Create Gasless Limit Order'
          )}
        </Button>

        {!address && (
          <p className="text-xs text-red-500 text-center">
            Please connect your wallet to create limit orders
          </p>
        )}
      </CardContent>
    </Card>
  )
}