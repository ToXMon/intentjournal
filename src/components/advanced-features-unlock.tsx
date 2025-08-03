'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  Lock, 
  Unlock, 
  BarChart3, 
  Brain, 
  TrendingUp,
  Eye,
  Zap,
  Shield,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { IntentExecutionResult, OnChainEvidence } from '@/utils/intent-execution'

interface AdvancedFeaturesUnlockProps {
  executionResult: IntentExecutionResult | null
  onChainEvidence: OnChainEvidence[]
  onUnlockComplete: () => void
  className?: string
}

interface FeatureUnlockStatus {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  unlocked: boolean
  verificationStep: string
  color: string
}

export function AdvancedFeaturesUnlock({
  executionResult,
  onChainEvidence,
  onUnlockComplete,
  className
}: AdvancedFeaturesUnlockProps) {
  const [verificationStep, setVerificationStep] = useState<'checking' | 'verifying' | 'unlocking' | 'complete'>('checking')
  const [features, setFeatures] = useState<FeatureUnlockStatus[]>([
    {
      id: 'bias-edge-analyzer',
      name: 'Bias & Edge Analyzer',
      description: 'AI-powered market sentiment and edge detection with Venice AI',
      icon: Brain,
      unlocked: false,
      verificationStep: 'Checking on-chain evidence...',
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      id: 'technical-analysis',
      name: 'Technical Analysis',
      description: 'Advanced chart patterns and candlestick analysis',
      icon: BarChart3,
      unlocked: false,
      verificationStep: 'Verifying transaction confirmation...',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      id: 'ai-vision',
      name: 'AI Vision Analysis',
      description: 'Computer vision analysis of price charts and patterns',
      icon: Eye,
      unlocked: false,
      verificationStep: 'Validating execution success...',
      color: 'text-green-600 dark:text-green-400'
    },
    {
      id: 'performance-insights',
      name: 'Performance Insights',
      description: 'Real-time portfolio tracking and optimization suggestions',
      icon: TrendingUp,
      unlocked: false,
      verificationStep: 'Enabling advanced analytics...',
      color: 'text-orange-600 dark:text-orange-400'
    }
  ])
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationProgress, setVerificationProgress] = useState(0)

  // Start verification process when execution result is available
  useEffect(() => {
    if (executionResult?.success && onChainEvidence.length > 0) {
      startVerificationProcess()
    }
  }, [executionResult, onChainEvidence])

  const startVerificationProcess = async () => {
    setIsVerifying(true)
    setVerificationStep('checking')
    setVerificationProgress(0)

    try {
      // Step 1: Check on-chain evidence
      setVerificationStep('checking')
      await simulateVerificationStep('Checking on-chain evidence...', 25)
      
      // Step 2: Verify transaction confirmation
      setVerificationStep('verifying')
      await simulateVerificationStep('Verifying transaction confirmation...', 50)
      
      // Step 3: Validate execution success
      await simulateVerificationStep('Validating execution success...', 75)
      
      // Step 4: Unlock features
      setVerificationStep('unlocking')
      await simulateVerificationStep('Unlocking advanced features...', 100)
      
      // Unlock all features
      setFeatures(prev => prev.map(feature => ({
        ...feature,
        unlocked: true,
        verificationStep: 'Unlocked ✓'
      })))
      
      setVerificationStep('complete')
      
      // Notify parent component
      setTimeout(() => {
        onUnlockComplete()
      }, 1000)
      
    } catch (error) {
      console.error('Verification failed:', error)
    } finally {
      setIsVerifying(false)
    }
  }

  const simulateVerificationStep = async (description: string, progress: number) => {
    // Update feature descriptions
    setFeatures(prev => prev.map((feature, index) => ({
      ...feature,
      verificationStep: index === Math.floor(progress / 25) - 1 ? description : feature.verificationStep
    })))
    
    setVerificationProgress(progress)
    await new Promise(resolve => setTimeout(resolve, 1500))
  }

  const getVerificationStepDescription = (step: string) => {
    switch (step) {
      case 'checking': return 'Checking on-chain evidence and transaction status'
      case 'verifying': return 'Verifying transaction confirmation on BuildBear Base Fork'
      case 'unlocking': return 'Unlocking advanced analytics features'
      case 'complete': return 'All advanced features have been unlocked'
      default: return 'Processing verification...'
    }
  }

  const hasValidEvidence = executionResult?.success && onChainEvidence.length > 0
  const allFeaturesUnlocked = features.every(f => f.unlocked)

  // If no execution result yet, show locked state
  if (!executionResult) {
    return (
      <Card className={cn('border-gray-300 dark:border-gray-600', className)}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-600 dark:text-gray-400">
                Advanced Features Locked
              </CardTitle>
              <CardDescription>
                Execute your intent on-chain to unlock Bias & Edge analysis
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Advanced analytics require verified on-chain evidence of intent execution. 
              Complete the execution step to unlock these features.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg opacity-60">
                  <Icon className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">{feature.name}</p>
                    <p className="text-xs text-gray-400">{feature.description}</p>
                  </div>
                  <Lock className="h-3 w-3 text-gray-400 ml-auto" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  // If execution failed, show error state
  if (!executionResult.success) {
    return (
      <Card className={cn('border-red-200 dark:border-red-800', className)}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
              <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-red-800 dark:text-red-200">
                Execution Required
              </CardTitle>
              <CardDescription>
                Intent execution failed - advanced features remain locked
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 dark:border-red-800">
            <AlertDescription className="text-red-800 dark:text-red-200">
              ❌ {executionResult.error || 'Intent execution failed'}. 
              Please retry execution to unlock advanced features.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Show verification in progress
  if (isVerifying) {
    return (
      <Card className={cn('border-blue-200 dark:border-blue-800', className)}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
            <div>
              <CardTitle className="text-lg text-blue-800 dark:text-blue-200">
                Verifying On-Chain Evidence
              </CardTitle>
              <CardDescription>
                Checking transaction confirmation and unlocking features
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Verification Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">{getVerificationStepDescription(verificationStep)}</p>
                  <p className="text-xs text-gray-500">Step {Math.ceil(verificationProgress / 25)} of 4</p>
                </div>
              </div>
              <Badge variant="outline">
                {verificationProgress}%
              </Badge>
            </div>
            <Progress value={verificationProgress} className="h-2" />
          </div>

          {/* On-Chain Evidence */}
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
              ✅ On-Chain Evidence Found
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-500">Order ID</p>
                <p className="font-mono">{executionResult.orderId?.slice(0, 10)}...</p>
              </div>
              <div>
                <p className="text-gray-500">Transaction</p>
                <p className="font-mono">{executionResult.txHash?.slice(0, 10)}...</p>
              </div>
              <div>
                <p className="text-gray-500">Evidence Count</p>
                <p className="font-medium">{onChainEvidence.length} verified</p>
              </div>
              <div>
                <p className="text-gray-500">Chain</p>
                <p className="font-medium">BuildBear Base Fork</p>
              </div>
            </div>
          </div>

          {/* Features Being Unlocked */}
          <div className="space-y-2">
            <p className="text-sm font-medium">🔓 Unlocking Features</p>
            <div className="grid grid-cols-1 gap-2">
              {features.map((feature, index) => {
                const Icon = feature.icon
                const isCurrentStep = index === Math.floor(verificationProgress / 25) - 1
                const isUnlocked = verificationProgress > (index + 1) * 25
                
                return (
                  <div key={feature.id} className={cn(
                    'flex items-center gap-3 p-2 rounded-lg transition-all duration-300',
                    isCurrentStep && 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800',
                    isUnlocked && 'bg-green-50 dark:bg-green-900/20',
                    !isCurrentStep && !isUnlocked && 'bg-gray-50 dark:bg-gray-800'
                  )}>
                    {isUnlocked ? (
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : isCurrentStep ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : (
                      <Icon className="h-4 w-4 text-gray-400" />
                    )}
                    <div className="flex-1">
                      <p className={cn(
                        'text-sm font-medium',
                        isUnlocked && 'text-green-700 dark:text-green-300',
                        isCurrentStep && 'text-blue-700 dark:text-blue-300',
                        !isCurrentStep && !isUnlocked && 'text-gray-500'
                      )}>
                        {feature.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isCurrentStep ? feature.verificationStep : feature.description}
                      </p>
                    </div>
                    {isUnlocked && (
                      <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        Unlocked
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show unlocked state
  return (
    <Card className={cn('border-green-200 dark:border-green-800', className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
            <Unlock className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <CardTitle className="text-lg text-green-800 dark:text-green-200">
              🎉 Advanced Features Unlocked!
            </CardTitle>
            <CardDescription>
              Your on-chain evidence has been verified - all features are now available
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success Message */}
        <Alert className="border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            ✅ Transaction confirmed on BuildBear Base Fork! Your intent execution has been verified 
            and all advanced analytics features are now unlocked.
          </AlertDescription>
        </Alert>

        {/* Transaction Details */}
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              📋 Execution Summary
            </p>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => window.open(`https://smooth-spiderman-faa2b8b9.ethernal.buildbear.io/tx/${executionResult.txHash}`, '_blank')}
            >
              View Transaction <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-gray-500">Order ID</p>
              <p className="font-mono">{executionResult.orderId?.slice(0, 10)}...</p>
            </div>
            <div>
              <p className="text-gray-500">Transaction Hash</p>
              <p className="font-mono">{executionResult.txHash?.slice(0, 10)}...</p>
            </div>
            <div>
              <p className="text-gray-500">Evidence Count</p>
              <p className="font-medium">{onChainEvidence.length} verified</p>
            </div>
            <div>
              <p className="text-gray-500">Escrow Address</p>
              <p className="font-mono">{executionResult.escrowAddress?.slice(0, 10)}...</p>
            </div>
          </div>
        </div>

        {/* Unlocked Features */}
        <div className="space-y-3">
          <p className="text-sm font-medium">🚀 Now Available</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.id} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className={cn('p-2 rounded-lg bg-white dark:bg-gray-800')}>
                    <Icon className={cn('h-4 w-4', feature.color)} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">{feature.name}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">{feature.description}</p>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              )
            })}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            🎯 What's Next?
          </p>
          <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
            <p>• Access the Bias & Edge Analyzer for market sentiment analysis</p>
            <p>• View technical patterns and AI vision insights</p>
            <p>• Track your portfolio performance and optimization suggestions</p>
            <p>• Generate social posts with your verified on-chain achievements</p>
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center pt-2">
          <Button
            onClick={onUnlockComplete}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Continue to Advanced Analytics
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}