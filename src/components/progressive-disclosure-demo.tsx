'use client'

import { useState } from 'react'
import { ProgressiveDisclosure, JournalStep } from './progressive-disclosure'
import { CleanJournalInterface } from './clean-journal-interface'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function ProgressiveDisclosureDemo() {
  const [currentStep, setCurrentStep] = useState<JournalStep>('entry')
  const [completedSteps, setCompletedSteps] = useState<JournalStep[]>([])
  const [journalEntry, setJournalEntry] = useState('')
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [executionResult, setExecutionResult] = useState<any>(null)

  const handleStepChange = (step: JournalStep) => {
    setCurrentStep(step)
  }

  const handleJournalSubmit = async (entry: string) => {
    setJournalEntry(entry)
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Mock recommendations
    setRecommendations([
      {
        id: '1',
        title: 'Swap ETH to USDC',
        description: 'Based on your risk tolerance, consider swapping 50% of your ETH to USDC for stability',
        confidence: 85,
        protocol: '1inch Fusion+'
      }
    ])
    
    // Mark entry step as completed and move to recommendations
    setCompletedSteps(prev => [...prev, 'entry'])
    setCurrentStep('recommendations')
  }

  const handleExecuteIntent = async () => {
    // Simulate execution
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setExecutionResult({
      txHash: '0x1234567890abcdef',
      status: 'confirmed',
      gasUsed: '21000'
    })
    
    // Mark recommendations step as completed and move to execution
    setCompletedSteps(prev => [...prev, 'recommendations'])
    setCurrentStep('execution')
  }

  const handleUnlockAnalytics = () => {
    // Mark execution step as completed and move to analytics
    setCompletedSteps(prev => [...prev, 'execution'])
    setCurrentStep('analytics')
  }

  const renderStepContent = (step: JournalStep) => {
    switch (step) {
      case 'entry':
        return (
          <div className="p-6">
            <CleanJournalInterface
              onSubmit={handleJournalSubmit}
              isSubmitting={false}
              placeholder="Describe your DeFi intentions..."
              helpText="Be specific about tokens, amounts, and your goals"
            />
          </div>
        )
      
      case 'recommendations':
        return (
          <div className="space-y-4">
            <div className="text-center py-4">
              <h3 className="text-lg font-semibold mb-2">AI-Powered Recommendations</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Based on your journal entry: "{journalEntry.substring(0, 100)}..."
              </p>
            </div>
            
            {recommendations.map((rec) => (
              <Card key={rec.id} className="border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="text-purple-700 dark:text-purple-300">
                    {rec.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {rec.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Confidence: {rec.confidence}% | Protocol: {rec.protocol}
                    </div>
                    <Button onClick={handleExecuteIntent} className="bg-purple-600 hover:bg-purple-700">
                      Execute Intent
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      
      case 'execution':
        return (
          <div className="space-y-4">
            <div className="text-center py-4">
              <h3 className="text-lg font-semibold mb-2">On-Chain Execution</h3>
              {executionResult ? (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-green-800 dark:text-green-200 font-medium">
                      ✅ Transaction Confirmed!
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      Hash: {executionResult.txHash}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Gas Used: {executionResult.gasUsed}
                    </p>
                  </div>
                  <Button onClick={handleUnlockAnalytics} className="bg-green-600 hover:bg-green-700">
                    Unlock Advanced Analytics
                  </Button>
                </div>
              ) : (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-blue-800 dark:text-blue-200">
                    🔄 Executing transaction on-chain...
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      
      case 'analytics':
        return (
          <div className="space-y-4">
            <div className="text-center py-4">
              <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Bias & Edge Analysis and Performance Insights
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-orange-200 dark:border-orange-800">
                <CardHeader>
                  <CardTitle className="text-orange-700 dark:text-orange-300 text-lg">
                    📊 Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Execution Time:</span>
                      <span className="font-medium">2.3s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Slippage:</span>
                      <span className="font-medium text-green-600">0.12%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gas Efficiency:</span>
                      <span className="font-medium text-green-600">95%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-orange-200 dark:border-orange-800">
                <CardHeader>
                  <CardTitle className="text-orange-700 dark:text-orange-300 text-lg">
                    🎯 Bias & Edge Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Risk Score:</span>
                      <span className="font-medium text-yellow-600">Medium</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Market Timing:</span>
                      <span className="font-medium text-green-600">Good</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Protocol Choice:</span>
                      <span className="font-medium text-green-600">Optimal</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Progressive Disclosure Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Experience the step-by-step revelation of IntentJournal+ features
          </p>
        </div>
        
        <ProgressiveDisclosure
          currentStep={currentStep}
          onStepChange={handleStepChange}
          completedSteps={completedSteps}
          allowBackNavigation={true}
        >
          {renderStepContent(currentStep)}
        </ProgressiveDisclosure>
      </div>
    </div>
  )
}