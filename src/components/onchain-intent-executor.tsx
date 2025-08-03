'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { intentExecutionService, type IntentExecutionResult, type OnChainEvidence } from '@/utils/intent-execution'
import { AdvancedFeaturesUnlock } from '@/components/advanced-features-unlock'
import type { DeFiRecommendation } from '@/types'

interface OnChainIntentExecutorProps {
  intentText: string
  recommendation: DeFiRecommendation
  onExecutionComplete?: (result: IntentExecutionResult) => void
  onEvidenceVerified?: (evidence: OnChainEvidence[]) => void
  onAdvancedFeaturesUnlocked?: () => void
}

export function OnChainIntentExecutor({ 
  intentText, 
  recommendation, 
  onExecutionComplete,
  onEvidenceVerified,
  onAdvancedFeaturesUnlocked
}: OnChainIntentExecutorProps) {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionStep, setExecutionStep] = useState<'prepare' | 'approve' | 'execute' | 'verify' | 'complete'>('prepare')
  const [executionResult, setExecutionResult] = useState<IntentExecutionResult | null>(null)
  const [onChainEvidence, setOnChainEvidence] = useState<OnChainEvidence[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showAdvancedUnlock, setShowAdvancedUnlock] = useState(false)

  // Check for existing on-chain evidence on component mount
  useEffect(() => {
    if (address) {
      checkExistingEvidence()
    }
  }, [address])

  const checkExistingEvidence = async () => {
    if (!address) return

    try {
      const evidence = await intentExecutionService.hasOnChainEvidence(address)
      if (evidence.length > 0) {
        setOnChainEvidence(evidence)
        onEvidenceVerified?.(evidence)
        // Show advanced features unlock if evidence exists
        setShowAdvancedUnlock(true)
      }
    } catch (error) {
      console.error('Failed to check existing evidence:', error)
    }
  }

  const executeIntentOnChain = async () => {
    if (!address || !walletClient) {
      setError('Please connect your wallet')
      return
    }

    setIsExecuting(true)
    setError(null)

    try {
      // Step 1: Prepare transaction
      setExecutionStep('prepare')
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Step 2: Token approval (if needed)
      setExecutionStep('approve')
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Step 3: Execute intent order
      setExecutionStep('execute')
      const result = await intentExecutionService.executeIntent({
        intentText,
        sourceToken: recommendation.tokenPair.from.address,
        destinationToken: recommendation.tokenPair.to.address,
        sourceAmount: recommendation.route.fromAmount,
        userAddress: address,
      })

      if (!result.success) {
        throw new Error(result.error || 'Execution failed')
      }

      setExecutionResult(result)

      // Step 4: Verify on-chain evidence
      setExecutionStep('verify')
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Check for on-chain evidence
      const evidence = await intentExecutionService.hasOnChainEvidence(address)
      setOnChainEvidence(evidence)

      // Step 5: Complete
      setExecutionStep('complete')
      
      onExecutionComplete?.(result)
      if (evidence.length > 0) {
        onEvidenceVerified?.(evidence)
        // Show advanced features unlock after successful execution
        setShowAdvancedUnlock(true)
      }

    } catch (error) {
      console.error('Intent execution failed:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsExecuting(false)
    }
  }

  const getStepDescription = (step: string) => {
    switch (step) {
      case 'prepare': return 'Preparing Dutch auction parameters'
      case 'approve': return 'Approving token spending (if needed)'
      case 'execute': return 'Creating intent order on BuildBear Base Fork'
      case 'verify': return 'Verifying on-chain evidence'
      case 'complete': return 'Intent successfully executed on-chain'
      default: return 'Processing...'
    }
  }

  const getStepProgress = (step: string) => {
    switch (step) {
      case 'prepare': return 20
      case 'approve': return 40
      case 'execute': return 60
      case 'verify': return 80
      case 'complete': return 100
      default: return 0
    }
  }

  // Show advanced features unlock if execution is complete and evidence exists
  if (showAdvancedUnlock && (executionResult || onChainEvidence.length > 0)) {
    return (
      <AdvancedFeaturesUnlock
        executionResult={executionResult}
        onChainEvidence={onChainEvidence}
        onUnlockComplete={() => {
          setShowAdvancedUnlock(false)
          onAdvancedFeaturesUnlocked?.()
        }}
      />
    )
  }

  // If user already has on-chain evidence, show it
  if (onChainEvidence.length > 0 && !isExecuting && !showAdvancedUnlock) {
    return (
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-lg text-green-800 dark:text-green-200">
            ✅ On-Chain Intent Evidence Found
          </CardTitle>
          <CardDescription>
            You have verified on-chain intent execution. Advanced features are unlocked.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {onChainEvidence.map((evidence, index) => (
            <div key={evidence.orderId} className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Intent Order #{index + 1}
                </p>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                  {evidence.auctionActive ? 'ACTIVE AUCTION' : 'COMPLETED'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-500">Order ID</p>
                  <p className="font-mono">{evidence.orderId.slice(0, 10)}...</p>
                </div>
                <div>
                  <p className="text-gray-500">Current Price</p>
                  <p className="font-medium">${evidence.currentPrice ? parseFloat(evidence.currentPrice).toFixed(2) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Source Chain</p>
                  <p className="font-medium">BuildBear Base Fork</p>
                </div>
                <div>
                  <p className="text-gray-500">Dest Chain</p>
                  <p className="font-medium">Etherlink Testnet</p>
                </div>
              </div>
              
              <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                <p className="text-xs text-green-700 dark:text-green-300">
                  🔗 Escrow Address: {evidence.escrowAddress.slice(0, 10)}...
                </p>
              </div>
            </div>
          ))}
          
          <Alert>
            <AlertDescription>
              ✨ Your intent has been verified on-chain! Advanced Bias & Edge analysis is now available.
            </AlertDescription>
          </Alert>
          
          <Button
            onClick={() => setShowAdvancedUnlock(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            View Advanced Features Unlock
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Show execution interface
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">🔗 Execute Intent On-Chain</CardTitle>
        <CardDescription>
          Create a real Dutch auction order on BuildBear Base Fork with Etherlink escrow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Intent Summary */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            📝 Intent to Execute
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 line-clamp-2">
            "{intentText}"
          </p>
        </div>

        {/* Trading Pair */}
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <p className="text-sm font-medium mb-2">🔄 Dutch Auction Order</p>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-sm font-medium">{recommendation.tokenPair.from.symbol}</p>
              <p className="text-xs text-gray-500">{recommendation.route.fromAmount}</p>
              <Badge variant="outline" className="text-xs mt-1">BuildBear Base</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1"></div>
              <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200 px-2 py-1 rounded">
                Dutch Auction
              </span>
              <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1"></div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{recommendation.tokenPair.to.symbol}</p>
              <p className="text-xs text-gray-500">{recommendation.route.toAmount}</p>
              <Badge variant="outline" className="text-xs mt-1">Etherlink</Badge>
            </div>
          </div>
        </div>

        {/* Execution Progress */}
        {isExecuting && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <div>
                  <p className="text-sm font-medium">{getStepDescription(executionStep)}</p>
                  <p className="text-xs text-gray-500">Step {Math.ceil(getStepProgress(executionStep) / 20)} of 5</p>
                </div>
              </div>
              <Badge variant="outline">
                {getStepProgress(executionStep)}%
              </Badge>
            </div>
            <Progress value={getStepProgress(executionStep)} className="h-2" />
          </div>
        )}

        {/* Execution Steps */}
        <div className="space-y-2 text-xs">
          <div className={`flex items-center gap-2 ${executionStep === 'prepare' ? 'text-blue-600' : getStepProgress(executionStep) > 20 ? 'text-green-600' : 'text-gray-400'}`}>
            <span>{getStepProgress(executionStep) > 20 ? '✓' : '○'}</span>
            <span>Prepare Dutch auction parameters</span>
          </div>
          <div className={`flex items-center gap-2 ${executionStep === 'approve' ? 'text-blue-600' : getStepProgress(executionStep) > 40 ? 'text-green-600' : 'text-gray-400'}`}>
            <span>{getStepProgress(executionStep) > 40 ? '✓' : '○'}</span>
            <span>Approve token spending (if needed)</span>
          </div>
          <div className={`flex items-center gap-2 ${executionStep === 'execute' ? 'text-blue-600' : getStepProgress(executionStep) > 60 ? 'text-green-600' : 'text-gray-400'}`}>
            <span>{getStepProgress(executionStep) > 60 ? '✓' : '○'}</span>
            <span>Create intent order on BuildBear Base Fork</span>
          </div>
          <div className={`flex items-center gap-2 ${executionStep === 'verify' ? 'text-blue-600' : getStepProgress(executionStep) > 80 ? 'text-green-600' : 'text-gray-400'}`}>
            <span>{getStepProgress(executionStep) > 80 ? '✓' : '○'}</span>
            <span>Verify on-chain evidence</span>
          </div>
          <div className={`flex items-center gap-2 ${executionStep === 'complete' ? 'text-blue-600' : getStepProgress(executionStep) >= 100 ? 'text-green-600' : 'text-gray-400'}`}>
            <span>{getStepProgress(executionStep) >= 100 ? '✓' : '○'}</span>
            <span>Enable Bias & Edge analysis</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="border-red-200 dark:border-red-800">
            <AlertDescription className="text-red-800 dark:text-red-200">
              ❌ {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Result */}
        {executionResult && executionResult.success && (
          <Alert className="border-green-200 dark:border-green-800">
            <AlertDescription className="text-green-800 dark:text-green-200">
              ✅ Intent order created! Order ID: {executionResult.orderId?.slice(0, 10)}...
            </AlertDescription>
          </Alert>
        )}

        {/* Technical Details */}
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <p className="text-sm font-medium mb-2">🔧 Technical Implementation</p>
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <p>• Dutch auction with exponential decay (st1inch method)</p>
            <p>• Cross-chain escrow: BuildBear Base Fork → Etherlink</p>
            <p>• Real on-chain evidence required for Bias & Edge analysis</p>
            <p>• Resolver network for order fulfillment</p>
          </div>
        </div>

        {/* Execute Button */}
        <Button
          onClick={executeIntentOnChain}
          disabled={isExecuting || !address}
          className="w-full"
        >
          {isExecuting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {getStepDescription(executionStep)}...
            </div>
          ) : (
            'Execute Intent On-Chain'
          )}
        </Button>

        {!address && (
          <p className="text-xs text-red-500 text-center">
            Please connect your wallet to execute intents on-chain
          </p>
        )}

        {/* Note about Bias & Edge */}
        <Alert>
          <AlertDescription>
            💡 The Bias & Edge Analyzer will only be available after successful on-chain intent execution with verified evidence.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}