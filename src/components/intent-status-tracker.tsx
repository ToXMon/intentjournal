'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { LimitOrderManager, type LimitOrderResult } from '@/utils/oneinch/limit-orders'
import { FusionManager, type FusionOrderResult } from '@/utils/oneinch/fusion'

interface IntentStatusTrackerProps {
  orders: (LimitOrderResult | FusionOrderResult)[]
  onOrderUpdate?: (orderId: string, status: string) => void
}

export function IntentStatusTracker({ orders, onOrderUpdate }: IntentStatusTrackerProps) {
  const [trackingOrders, setTrackingOrders] = useState<(LimitOrderResult | FusionOrderResult)[]>(orders)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    setTrackingOrders(orders)
  }, [orders])

  const refreshOrderStatus = async (order: LimitOrderResult | FusionOrderResult) => {
    setIsRefreshing(true)
    try {
      let updatedOrder: LimitOrderResult | FusionOrderResult | null = null

      if ('fulfillmentProbability' in order) {
        // Limit Order
        updatedOrder = await LimitOrderManager.getOrderStatus(order.orderHash, 84532)
      } else {
        // Fusion Order
        updatedOrder = await FusionManager.getOrderStatus(order.orderHash, 84532)
      }

      if (updatedOrder) {
        setTrackingOrders(prev => 
          prev.map(o => o.orderId === order.orderId ? updatedOrder! : o)
        )
        onOrderUpdate?.(order.orderId, updatedOrder.status)
      }
    } catch (error) {
      console.error('Failed to refresh order status:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filled':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
      case 'pending':
      case 'auction':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
      case 'expired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
    }
  }

  const getOrderTypeIcon = (order: LimitOrderResult | FusionOrderResult) => {
    if ('fulfillmentProbability' in order) {
      return '📝' // Limit Order
    } else {
      return '⚡' // Fusion Order
    }
  }

  const getOrderTypeName = (order: LimitOrderResult | FusionOrderResult) => {
    if ('fulfillmentProbability' in order) {
      return 'Limit Order'
    } else {
      return 'Fusion Order'
    }
  }

  const calculateProgress = (order: LimitOrderResult | FusionOrderResult) => {
    if ('fulfillmentProbability' in order) {
      // Limit Order - progress based on fill percentage
      const fillPercentage = LimitOrderManager.calculateFillPercentage(
        order.filledAmount,
        order.makingAmount
      )
      return fillPercentage
    } else {
      // Fusion Order - progress based on auction time
      const progress = FusionManager.calculateAuctionProgress(order as FusionOrderResult)
      return progress.progressPercentage
    }
  }

  const getTimeRemaining = (order: LimitOrderResult | FusionOrderResult) => {
    const now = Date.now()
    const expiration = order.expiration || (order as FusionOrderResult).auctionEndTime
    const remaining = expiration - now

    if (remaining <= 0) return 'Expired'

    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  if (trackingOrders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 Intent Status Tracker</CardTitle>
          <CardDescription>
            Track your intent-based orders and their fulfillment progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm mb-2">
              No active orders to track
            </p>
            <p className="text-xs text-gray-400">
              Create intent-based orders to see their progress here
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">📊 Intent Status Tracker</CardTitle>
        <CardDescription>
          Real-time tracking of your intent-based orders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {trackingOrders.map((order) => (
          <div key={order.orderId} className="border rounded-lg p-4 space-y-3">
            {/* Order Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getOrderTypeIcon(order)}</span>
                <div>
                  <p className="font-medium text-sm">{getOrderTypeName(order)}</p>
                  <p className="text-xs text-gray-500 font-mono">{order.orderId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(order.status)}>
                  {order.status.toUpperCase()}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshOrderStatus(order)}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? '🔄' : '↻'}
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{calculateProgress(order).toFixed(1)}%</span>
              </div>
              <Progress value={calculateProgress(order)} className="h-2" />
            </div>

            {/* Order Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Trading Pair</p>
                <p className="font-medium">
                  {/* Extract token symbols from addresses */}
                  {order.makerAsset === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ? 'ETH' : 
                   order.makerAsset === '0x036CbD53842c5426634e7929541eC2318f3dCF7e' ? 'USDC' : 'TOKEN'}
                  {' → '}
                  {order.takerAsset === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ? 'ETH' : 
                   order.takerAsset === '0x036CbD53842c5426634e7929541eC2318f3dCF7e' ? 'USDC' : 'TOKEN'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Time Remaining</p>
                <p className="font-medium">{getTimeRemaining(order)}</p>
              </div>
            </div>

            {/* Intent Context (for Limit Orders) */}
            {'intentText' in order && order.intentText && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                  📝 Original Intent
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 line-clamp-2">
                  "{order.intentText}"
                </p>
              </div>
            )}

            {/* Fulfillment Metrics (for Limit Orders) */}
            {'fulfillmentProbability' in order && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <p className="text-gray-500">AI Confidence</p>
                  <p className="font-medium text-green-600">
                    {((order.aiConfidence || 0) * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">Fill Probability</p>
                  <p className="font-medium text-blue-600">
                    {((order.fulfillmentProbability || 0) * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">Est. Fill Time</p>
                  <p className="font-medium text-purple-600">
                    {order.estimatedFillTime}
                  </p>
                </div>
              </div>
            )}

            {/* Auction Metrics (for Fusion Orders) */}
            {'resolvers' in order && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <p className="text-gray-500">Resolvers</p>
                  <p className="font-medium text-green-600">{order.resolvers}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">Best Rate</p>
                  <p className="font-medium text-blue-600">{order.currentBestRate}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">MEV Protected</p>
                  <p className="font-medium text-purple-600">
                    {order.mevProtected ? '✓' : '✗'}
                  </p>
                </div>
              </div>
            )}

            {/* Market Conditions (for Limit Orders) */}
            {'marketConditions' in order && order.marketConditions && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-xs font-medium mb-2">Market Conditions</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500">Current Price</p>
                    <p className="font-medium">${order.marketConditions.currentPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Price Impact</p>
                    <p className="font-medium">{order.marketConditions.priceImpact.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Liquidity</p>
                    <Badge variant="outline" className="text-xs">
                      {order.marketConditions.liquidity.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Refresh All Button */}
        <div className="text-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              trackingOrders.forEach(order => refreshOrderStatus(order))
            }}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                Refreshing...
              </div>
            ) : (
              'Refresh All Orders'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}