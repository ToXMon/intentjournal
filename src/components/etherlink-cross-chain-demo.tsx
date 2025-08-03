'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'

interface EtherlinkCrossChainDemoProps {
  intentText: string
  recommendation?: {
    fromToken: { symbol: string; address: string };
    toToken: { symbol: string; address: string };
    fromAmount: string;
    toAmount: string;
  }
}

export function EtherlinkCrossChainDemo({ intentText, recommendation }: EtherlinkCrossChainDemoProps) {
  const [demoStep, setDemoStep] = useState<'setup' | 'escrow' | 'bridge' | 'complete'>('setup')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const simulateCrossChainSwap = async () => {
    setIsProcessing(true)
    
    // Step 1: Setup escrow
    setDemoStep('escrow')
    setProgress(25)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Step 2: Bridge to Etherlink
    setDemoStep('bridge')
    setProgress(50)
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Step 3: Execute swap on Etherlink
    setProgress(75)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Step 4: Complete
    setDemoStep('complete')
    setProgress(100)
    setIsProcessing(false)
  }

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'setup': return '⚙️'
      case 'escrow': return '🔒'
      case 'bridge': return '🌉'
      case 'complete': return '✅'
      default: return '⏳'
    }
  }

  const getStepDescription = (step: string) => {
    switch (step) {
      case 'setup': return 'Preparing cross-chain swap parameters'
      case 'escrow': return 'Deploying escrow contract on Base Sepolia'
      case 'bridge': return 'Bridging assets to Etherlink testnet'
      case 'complete': return 'Cross-chain swap completed successfully'
      default: return 'Processing...'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">🌉 Etherlink Cross-Chain Demo</CardTitle>
        <CardDescription>
          Simulate cross-chain swap from Base Sepolia to Etherlink testnet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Source Chain</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">Base Sepolia</p>
            <p className="text-xs text-gray-500">Chain ID: 84532</p>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Destination Chain</p>
            <p className="text-xs text-purple-600 dark:text-purple-400">Etherlink Testnet</p>
            <p className="text-xs text-gray-500">Chain ID: 128123</p>
          </div>
        </div>

        {/* Swap Details */}
        {recommendation && (
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-sm font-medium mb-2">Cross-Chain Swap Details</p>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-sm font-medium">{recommendation.fromToken.symbol}</p>
                <p className="text-xs text-gray-500">{recommendation.fromAmount}</p>
                <Badge variant="outline" className="text-xs mt-1">Base Sepolia</Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1"></div>
                <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200 px-2 py-1 rounded">
                  🌉
                </span>
                <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1"></div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{recommendation.toToken.symbol}</p>
                <p className="text-xs text-gray-500">{recommendation.toAmount}</p>
                <Badge variant="outline" className="text-xs mt-1">Etherlink</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        {isProcessing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getStepIcon(demoStep)}</span>
                <div>
                  <p className="text-sm font-medium">
                    {demoStep.charAt(0).toUpperCase() + demoStep.slice(1)} Phase
                  </p>
                  <p className="text-xs text-gray-500">
                    {getStepDescription(demoStep)}
                  </p>
                </div>
              </div>
              <Badge variant="outline">
                {progress}%
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Demo Steps */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Demo Process:</p>
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className={demoStep === 'setup' ? 'text-blue-600' : progress >= 25 ? 'text-green-600' : 'text-gray-400'}>
                {progress >= 25 ? '✓' : '○'}
              </span>
              <span>Deploy escrow contract with hashlock/timelock</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={demoStep === 'escrow' ? 'text-blue-600' : progress >= 50 ? 'text-green-600' : 'text-gray-400'}>
                {progress >= 50 ? '✓' : '○'}
              </span>
              <span>Lock funds in escrow on Base Sepolia</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={demoStep === 'bridge' ? 'text-blue-600' : progress >= 75 ? 'text-green-600' : 'text-gray-400'}>
                {progress >= 75 ? '✓' : '○'}
              </span>
              <span>Bridge assets to Etherlink testnet</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={demoStep === 'complete' ? 'text-blue-600' : progress >= 100 ? 'text-green-600' : 'text-gray-400'}>
                {progress >= 100 ? '✓' : '○'}
              </span>
              <span>Execute swap and release funds</span>
            </div>
          </div>
        </div>

        {/* Intent Context */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
            📝 Intent-Based Cross-Chain Swap
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 line-clamp-2">
            "{intentText}"
          </p>
        </div>

        {/* Success Message */}
        {demoStep === 'complete' && (
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600">✅</span>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Cross-Chain Swap Completed!
              </p>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300">
              Your intent has been successfully executed across Base Sepolia and Etherlink testnet using secure escrow mechanisms.
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="text-center">
          <Button
            onClick={simulateCrossChainSwap}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {getStepDescription(demoStep)}...
              </div>
            ) : demoStep === 'complete' ? (
              'Demo Completed ✅'
            ) : (
              'Start Cross-Chain Demo'
            )}
          </Button>
        </div>

        {/* Technical Details */}
        <Separator />
        <div className="text-xs text-gray-500 space-y-1">
          <p className="font-medium">Technical Implementation:</p>
          <div className="space-y-1">
            <p>• Escrow contracts with hashlock/timelock mechanisms</p>
            <p>• Atomic swaps ensuring transaction safety</p>
            <p>• Intent-based routing via 1inch Fusion+</p>
            <p>• Cross-chain message passing simulation</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}