"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { useParaAccount } from "@/hooks/useParaAccount";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AppNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  
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
    { path: '/', label: 'Home', description: 'Connect wallet' },
    { path: '/journal', label: 'Journal', description: 'Write entries', requiresWallet: true },
    { path: '/recommendations', label: 'Recommendations', description: 'AI suggestions', requiresWallet: true },
    { path: '/dashboard', label: 'Dashboard', description: 'DeFi analytics', requiresWallet: true },
    { path: '/share', label: 'Share', description: 'Social posts', requiresWallet: true },
    { path: '/test-1inch-data', label: 'Data APIs', description: '1inch testing', requiresWallet: true },
  ];

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium">App Navigation</h3>
            <div className="text-sm text-gray-600">
              {finalIsConnected ? (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Connected: {finalAddress?.slice(0, 6)}...{finalAddress?.slice(-4)}</span>
                  <Badge variant="outline" className="text-xs">
                    {walletType === 'para' ? 'Para' : 'Web3'}
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span>Not connected</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.path;
            const isDisabled = item.requiresWallet && !finalIsConnected;
            
            return (
              <Button
                key={item.path}
                onClick={() => router.push(item.path)}
                variant={isActive ? "default" : "outline"}
                size="sm"
                disabled={isDisabled}
                className={`flex flex-col h-auto p-3 ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <span className="font-medium text-xs">{item.label}</span>
                <span className="text-xs opacity-75 mt-1">{item.description}</span>
                {item.requiresWallet && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    Requires Wallet
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
        
        {!finalIsConnected && (
          <p className="text-xs text-gray-500 mt-3 text-center">
            Connect a wallet to access journal, recommendations, and sharing features
          </p>
        )}
      </CardContent>
    </Card>
  );
}