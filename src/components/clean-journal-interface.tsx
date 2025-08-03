'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface CleanJournalInterfaceProps {
  onSubmit: (entry: string) => Promise<void>
  isSubmitting: boolean
  placeholder?: string
  helpText?: string
}

export function CleanJournalInterface({
  onSubmit,
  isSubmitting,
  placeholder = "Share your DeFi thoughts and intentions...",
  helpText
}: CleanJournalInterfaceProps) {
  const [entry, setEntry] = useState('')

  const handleSubmit = async () => {
    if (!entry.trim()) return
    
    try {
      await onSubmit(entry)
      setEntry('') // Clear after successful submission
    } catch (error) {
      console.error('Error submitting journal entry:', error)
    }
  }

  const handleClear = () => {
    setEntry('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Clean, centered header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Financial Intent Journal
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Share your DeFi thoughts and get AI-powered recommendations
            </p>
          </div>

          {/* Main journal entry card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
            <div className="space-y-6">
              {/* Prominent textarea */}
              <div>
                <Textarea
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  placeholder={placeholder}
                  className="min-h-[300px] text-lg leading-relaxed border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-4">
                <Button 
                  onClick={handleSubmit}
                  disabled={!entry.trim() || isSubmitting}
                  className="flex-1 h-12 text-lg font-medium"
                  size="lg"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing with AI...
                    </div>
                  ) : (
                    'Submit Intent'
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleClear}
                  disabled={isSubmitting || !entry.trim()}
                  className="h-12 px-8"
                  size="lg"
                >
                  Clear
                </Button>
              </div>

              {/* Processing feedback */}
              {isSubmitting && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3 text-blue-800 dark:text-blue-200">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <div>
                      <p className="font-medium">🧠 Venice AI is analyzing your entry...</p>
                      <p className="text-sm mt-1 opacity-80">
                        Creating embeddings and generating personalized DeFi recommendations
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Help text */}
              {helpText && !isSubmitting && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  {helpText}
                </p>
              )}
            </div>
          </div>

          {/* Helpful guidance without clutter */}
          <div className="text-center space-y-4">
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                💡 Get Better Recommendations
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl mb-2">🎯</div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Be Specific</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Mention tokens, amounts, and timeframes
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Share Context</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Include risk tolerance and goals
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🔄</div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Be Regular</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Journal often for better AI insights
                  </p>
                </div>
              </div>
            </div>

            {/* Example placeholder text */}
            {!entry && !isSubmitting && (
              <div className="text-xs text-gray-400 max-w-2xl mx-auto">
                <p className="mb-2">
                  <strong>Example:</strong> "I'm thinking about diversifying my portfolio. I have some ETH and I'm considering swapping part of it to USDC for stability, but I'm also interested in yield farming opportunities on Base..."
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}