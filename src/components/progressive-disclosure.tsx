'use client'

import { useState, useEffect, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  Circle, 
  ArrowRight,
  Edit3,
  Brain,
  Zap,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Define the journal steps
export type JournalStep = 'entry' | 'recommendations' | 'execution' | 'analytics'

// Step configuration with metadata
interface StepConfig {
  id: JournalStep
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: {
    primary: string
    secondary: string
    background: string
    border: string
  }
}

const STEP_CONFIGS: Record<JournalStep, StepConfig> = {
  entry: {
    id: 'entry',
    title: 'Write Your Intent',
    description: 'Share your DeFi thoughts and intentions',
    icon: Edit3,
    color: {
      primary: 'text-blue-600 dark:text-blue-400',
      secondary: 'text-blue-500 dark:text-blue-300',
      background: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800'
    }
  },
  recommendations: {
    id: 'recommendations',
    title: 'AI Recommendations',
    description: 'Venice AI analyzes your intent and suggests DeFi strategies',
    icon: Brain,
    color: {
      primary: 'text-purple-600 dark:text-purple-400',
      secondary: 'text-purple-500 dark:text-purple-300',
      background: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800'
    }
  },
  execution: {
    id: 'execution',
    title: 'Execute On-Chain',
    description: 'Execute your intent using 1inch protocols',
    icon: Zap,
    color: {
      primary: 'text-green-600 dark:text-green-400',
      secondary: 'text-green-500 dark:text-green-300',
      background: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800'
    }
  },
  analytics: {
    id: 'analytics',
    title: 'Advanced Analytics',
    description: 'Bias & Edge analysis and performance insights',
    icon: BarChart3,
    color: {
      primary: 'text-orange-600 dark:text-orange-400',
      secondary: 'text-orange-500 dark:text-orange-300',
      background: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800'
    }
  }
}

const STEP_ORDER: JournalStep[] = ['entry', 'recommendations', 'execution', 'analytics']

interface ProgressiveDisclosureProps {
  currentStep: JournalStep
  children: ReactNode
  onStepChange: (step: JournalStep) => void
  allowBackNavigation?: boolean
  completedSteps?: JournalStep[]
  className?: string
}

interface StepContentProps {
  step: JournalStep
  isActive: boolean
  isCompleted: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
  onNavigate: () => void
  allowNavigation: boolean
  children?: ReactNode
}

function StepContent({
  step,
  isActive,
  isCompleted,
  isCollapsed,
  onToggleCollapse,
  onNavigate,
  allowNavigation,
  children
}: StepContentProps) {
  const config = STEP_CONFIGS[step]
  const Icon = config.icon
  
  return (
    <Card className={cn(
      'transition-all duration-500 ease-in-out',
      isActive && `${config.color.background} ${config.color.border}`,
      isCompleted && !isActive && 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700',
      !isActive && !isCompleted && 'bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-600 opacity-60'
    )}>
      <CardHeader 
        className={cn(
          'cursor-pointer transition-all duration-200',
          (isCompleted || allowNavigation) && 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
        )}
        onClick={(isCompleted || allowNavigation) ? onNavigate : undefined}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg transition-all duration-200',
              isActive && config.color.background,
              isCompleted && !isActive && 'bg-green-100 dark:bg-green-900/30',
              !isActive && !isCompleted && 'bg-gray-200 dark:bg-gray-700'
            )}>
              {isCompleted && !isActive ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <Icon className={cn(
                  'h-5 w-5',
                  isActive && config.color.primary,
                  isCompleted && !isActive && 'text-green-600 dark:text-green-400',
                  !isActive && !isCompleted && 'text-gray-400'
                )} />
              )}
            </div>
            
            <div>
              <CardTitle className={cn(
                'text-lg transition-colors duration-200',
                isActive && config.color.primary,
                isCompleted && !isActive && 'text-green-700 dark:text-green-300',
                !isActive && !isCompleted && 'text-gray-500'
              )}>
                {config.title}
              </CardTitle>
              <p className={cn(
                'text-sm mt-1 transition-colors duration-200',
                isActive && config.color.secondary,
                isCompleted && !isActive && 'text-green-600 dark:text-green-400',
                !isActive && !isCompleted && 'text-gray-400'
              )}>
                {config.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isCompleted && (
              <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                Completed
              </Badge>
            )}
            
            {isActive && (
              <Badge className={cn('text-xs', config.color.background, config.color.primary)}>
                Active
              </Badge>
            )}
            
            {(isCompleted && children) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleCollapse()
                }}
                className="h-8 w-8 p-0"
              >
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {/* Step content - only show if active or (completed and not collapsed) */}
      {(isActive || (isCompleted && !isCollapsed)) && children && (
        <CardContent className={cn(
          'transition-all duration-500 ease-in-out',
          isActive ? 'opacity-100' : 'opacity-75'
        )}>
          {children}
        </CardContent>
      )}
    </Card>
  )
}

export function ProgressiveDisclosure({
  currentStep,
  children,
  onStepChange,
  allowBackNavigation = true,
  completedSteps = [],
  className
}: ProgressiveDisclosureProps) {
  const [collapsedSteps, setCollapsedSteps] = useState<Set<JournalStep>>(new Set())
  
  // Calculate progress
  const currentStepIndex = STEP_ORDER.indexOf(currentStep)
  const totalSteps = STEP_ORDER.length
  const progressPercentage = ((currentStepIndex + 1) / totalSteps) * 100
  
  // Handle step navigation
  const handleStepNavigation = (targetStep: JournalStep) => {
    const targetIndex = STEP_ORDER.indexOf(targetStep)
    const currentIndex = STEP_ORDER.indexOf(currentStep)
    
    // Allow navigation to completed steps or if back navigation is allowed
    if (completedSteps.includes(targetStep) || (allowBackNavigation && targetIndex <= currentIndex)) {
      onStepChange(targetStep)
    }
  }
  
  // Handle step collapse/expand
  const handleToggleCollapse = (step: JournalStep) => {
    setCollapsedSteps(prev => {
      const newSet = new Set(prev)
      if (newSet.has(step)) {
        newSet.delete(step)
      } else {
        newSet.add(step)
      }
      return newSet
    })
  }
  
  // Auto-expand current step
  useEffect(() => {
    setCollapsedSteps(prev => {
      const newSet = new Set(prev)
      newSet.delete(currentStep)
      return newSet
    })
  }, [currentStep])
  
  // Render children for each step
  const renderStepContent = (step: JournalStep) => {
    if (Array.isArray(children)) {
      const stepIndex = STEP_ORDER.indexOf(step)
      return children[stepIndex]
    } else if (step === currentStep) {
      return children
    }
    return null
  }
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              IntentJournal+ Flow
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Complete each step to unlock the full DeFi experience
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            Step {currentStepIndex + 1} of {totalSteps}
          </Badge>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}% complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
          {STEP_ORDER.map((step, index) => {
            const config = STEP_CONFIGS[step]
            const Icon = config.icon
            const isActive = step === currentStep
            const isCompleted = completedSteps.includes(step)
            const canNavigate = isCompleted || (allowBackNavigation && index <= currentStepIndex)
            
            return (
              <div key={step} className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => canNavigate && handleStepNavigation(step)}
                  disabled={!canNavigate}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
                    'disabled:cursor-not-allowed',
                    isActive && `${config.color.background} ${config.color.border} border`,
                    isCompleted && !isActive && 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700',
                    !isActive && !isCompleted && 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700',
                    canNavigate && 'hover:scale-105 cursor-pointer'
                  )}
                >
                  {isCompleted && !isActive ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Icon className={cn(
                      'h-4 w-4',
                      isActive && config.color.primary,
                      isCompleted && !isActive && 'text-green-600 dark:text-green-400',
                      !isActive && !isCompleted && 'text-gray-400'
                    )} />
                  )}
                  <span className={cn(
                    'text-xs font-medium',
                    isActive && config.color.primary,
                    isCompleted && !isActive && 'text-green-700 dark:text-green-300',
                    !isActive && !isCompleted && 'text-gray-500'
                  )}>
                    {config.title}
                  </span>
                </button>
                
                {index < STEP_ORDER.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Step Content */}
      <div className="space-y-4">
        {STEP_ORDER.map((step) => {
          const isActive = step === currentStep
          const isCompleted = completedSteps.includes(step)
          const isCollapsed = collapsedSteps.has(step)
          const stepIndex = STEP_ORDER.indexOf(step)
          const currentIndex = STEP_ORDER.indexOf(currentStep)
          
          // Only render steps up to and including the current step
          if (stepIndex > currentIndex && !isCompleted) {
            return null
          }
          
          return (
            <StepContent
              key={step}
              step={step}
              isActive={isActive}
              isCompleted={isCompleted}
              isCollapsed={isCollapsed}
              onToggleCollapse={() => handleToggleCollapse(step)}
              onNavigate={() => handleStepNavigation(step)}
              allowNavigation={allowBackNavigation && (isCompleted || stepIndex <= currentIndex)}
            >
              {renderStepContent(step)}
            </StepContent>
          )
        })}
      </div>
    </div>
  )
}