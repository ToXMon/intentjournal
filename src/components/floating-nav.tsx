"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { useParaAccount } from "@/hooks/useParaAccount";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  TrendingUp, 
  Share2, 
  Home, 
  ChevronUp, 
  ChevronDown,
  ArrowRight 
} from "lucide-react";

export function FloatingNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Web3 wallet state
  const { address: web3Address, isConnected: isWeb3Connected } = useAccount();
  
  // Para wallet state
  const { address: paraAddress, isConnected: paraConnected } = useParaAccount();
  
  // App store state (unified wallet state)
  const { walletAddress, walletType } = useAppStore();

  // Determine connection status from multiple sources
  const isConnected = walletType === 'para' ? paraConnected : isWeb3Connected;
  const connectedAddress = walletType === 'para' ? paraAddress : web3Address;

  // Also check the unified store state as fallback
  const isUnifiedConnected = !!walletAddress;
  const unifiedAddress = walletAddress;

  // Use the most reliable connection state
  const finalIsConnected = isConnected || isUnifiedConnected;
  const finalAddress = connectedAddress || unifiedAddress;

  const navigationItems = [
    { 
      path: '/', 
      label: 'Home', 
      icon: Home, 
      color: 'bg-blue-500 hover:bg-blue-600',
      requiresWallet: false 
    },
    { 
      path: '/journal', 
      label: 'Journal', 
      icon: BookOpen, 
      color: 'bg-green-500 hover:bg-green-600',
      requiresWallet: true 
    },
    { 
      path: '/recommendations', 
      label: 'AI Recs', 
      icon: TrendingUp, 
      color: 'bg-purple-500 hover:bg-purple-600',
      requiresWallet: true 
    },
    { 
      path: '/share', 
      label: 'Share', 
      icon: Share2, 
      color: 'bg-orange-500 hover:bg-orange-600',
      requiresWallet: true 
    },
  ];

  const currentIndex = navigationItems.findIndex(item => item.path === pathname);
  const nextItem = navigationItems[currentIndex + 1];
  const prevItem = navigationItems[currentIndex - 1];

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsExpanded(false);
  };

  const getNextAction = () => {
    if (pathname === '/' && finalIsConnected) {
      return { path: '/journal', label: 'Start Journaling', icon: ArrowRight };
    }
    if (pathname === '/journal') {
      return { path: '/recommendations', label: 'Get AI Recommendations', icon: ArrowRight };
    }
    if (pathname === '/recommendations') {
      return { path: '/share', label: 'View Dashboard', icon: ArrowRight };
    }
    return null;
  };

  const nextAction = getNextAction();

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 mobile-safe-area">
        <div className="flex items-center justify-around py-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.path;
            const isDisabled = item.requiresWallet && !finalIsConnected;
            const Icon = item.icon;
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                disabled={isDisabled}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg mobile-touch-target transition-colors ${
                  isActive 
                    ? 'text-blue-600 bg-blue-50' 
                    : isDisabled 
                      ? 'text-gray-400' 
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
                {item.requiresWallet && !finalIsConnected && (
                  <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Connection Status Indicator */}
        <div className="absolute top-1 right-2">
          <div className={`w-2 h-2 rounded-full ${finalIsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>
      </div>

      {/* Desktop Floating Navigation */}
      <div className="hidden md:block fixed bottom-6 right-6 z-50">
        <div className="flex flex-col items-end gap-3">
          {/* Quick Next Action Button */}
          {nextAction && (
            <Button
              onClick={() => handleNavigation(nextAction.path)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg mobile-touch-target"
              size="sm"
            >
              <span className="text-sm font-medium">{nextAction.label}</span>
              <nextAction.icon className="h-4 w-4" />
            </Button>
          )}

          {/* Expanded Navigation */}
          {isExpanded && (
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-3">
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-gray-600 mb-2 text-center">
                    {finalIsConnected ? (
                      <span className="flex items-center gap-1 justify-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 justify-center">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        Not connected
                      </span>
                    )}
                  </div>
                  
                  {navigationItems.map((item) => {
                    const isActive = pathname === item.path;
                    const isDisabled = item.requiresWallet && !finalIsConnected;
                    const Icon = item.icon;
                    
                    return (
                      <Button
                        key={item.path}
                        onClick={() => handleNavigation(item.path)}
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        disabled={isDisabled}
                        className={`justify-start gap-2 mobile-touch-target ${
                          isActive ? item.color + ' text-white' : ''
                        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{item.label}</span>
                        {item.requiresWallet && (
                          <Badge variant="secondary" className="text-xs ml-auto">
                            🔒
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Toggle Button */}
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg mobile-touch-target"
            size="sm"
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </>
  );
}