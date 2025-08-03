import { AdvancedFeaturesDemo } from '@/components/advanced-features-demo'

export default function TestAdvancedUnlockPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Advanced Features Unlock Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Task 10: Unlock advanced features after execution - Requirements 3.5, 4.5
          </p>
        </div>
        
        <AdvancedFeaturesDemo />
      </div>
    </div>
  )
}