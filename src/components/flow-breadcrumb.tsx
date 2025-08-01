"use client";

import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { useParaAccount } from "@/hooks/useParaAccount";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, ArrowRight } from "lucide-react";

export function FlowBreadcrumb() {
  const pathname = usePathname();
  
  // Web3 wallet state
  const { address: web3Address, isConnected: isWeb3Connected } = useAccount();
  
  // Para wallet state
  const { address: paraAddress, isConnected: paraConnected } = useParaAccount();
  
  // App store state (unified wallet state)
  const { walletAddress, walletType, journalEntries, currentRecommendations } = useAppStore();

  // Determine connection status from multiple sources
  const isConnected = walletType === 'para' ? paraConnected : isWeb3Connected;
  const connectedAddress = walletType === 'para' ? paraAddress : web3Address;

  // Also check the unified store state as fallback
  const isUnifiedConnected = !!walletAddress;
  const unifiedAddress = walletAddress;

  // Use the most reliable connection state
  const finalIsConnected = isConnected || isUnifiedConnected;
  const finalAddress = connectedAddress || unifiedAddress;

  const steps = [
    {
      id: 'connect',
      label: 'Connect Wallet',
      path: '/',
      completed: finalIsConnected,
      current: pathname === '/' && !finalIsConnected,
      description: 'Para or Web3 wallet'
    },
    {
      id: 'journal',
      label: 'Write Journal',
      path: '/journal',
      completed: journalEntries.length > 0,
      current: pathname === '/journal',
      description: 'Financial thoughts & intents'
    },
    {
      id: 'recommendations',
      label: 'AI Recommendations',
      path: '/recommendations',
      completed: currentRecommendations.length > 0,
      current: pathname === '/recommendations',
      description: 'Venice AI analysis'
    },
    {
      id: 'share',
      label: 'Execute & Share',
      path: '/share',
      completed: false, // Could check for completed trades
      current: pathname === '/share',
      description: '1inch Fusion+ & social posts'
    }
  ];

  // Don't show on test pages
  if (pathname.includes('/test') || pathname.includes('/demo')) {
    return null;
  }

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            IntentJournal+ Flow
          </h3>
          <Badge variant="outline" className="text-xs">
            {finalIsConnected ? `Connected: ${walletType?.toUpperCase()}` : 'Not Connected'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {steps.map((step, index) => {
            const Icon = step.completed ? CheckCircle : Circle;
            const isActive = step.current;
            
            return (
              <div key={step.id} className="flex items-center gap-2 flex-shrink-0">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700' 
                    : step.completed 
                      ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700'
                      : 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700'
                }`}>
                  <Icon className={`h-4 w-4 ${
                    step.completed 
                      ? 'text-green-600 dark:text-green-400' 
                      : isActive 
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400'
                  }`} />
                  <div className="text-left">
                    <p className={`text-xs font-medium ${
                      isActive 
                        ? 'text-blue-900 dark:text-blue-100' 
                        : step.completed 
                          ? 'text-green-900 dark:text-green-100'
                          : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {step.description}
                    </p>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Progress indicator */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{steps.filter(s => s.completed).length}/{steps.length} completed</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ 
                width: `${(steps.filter(s => s.completed).length / steps.length) * 100}%` 
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}