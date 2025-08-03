"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useParaWalletSync } from "@/hooks/useParaWalletSync";
import { useAppStore } from "@/lib/store";
import { UnifiedWalletModal } from "./unified-wallet-modal";
import { DebugPara } from "./debug-para";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function WalletConnect() {
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  // Web3 wallet state
  const { address: web3Address, isConnected: isWeb3Connected, chain } = useAccount();
  
  // Para wallet state
  const { paraWallet } = useParaWalletSync();
  const { walletAddress, walletType, disconnectWallet, disconnectParaWallet } = useAppStore();

  // Handle wallet disconnection
  const handleDisconnect = () => {
    if (walletType === 'para') {
      disconnectParaWallet();
    } else {
      disconnectWallet();
    }
  };

  // Determine connection status from unified state
  const isConnected = walletType === 'para' ? paraWallet.isConnected : isWeb3Connected;
  const displayAddress = walletType === 'para' ? paraWallet.address : web3Address;
  const connectionMethod = walletType === 'para' ? 
    (paraWallet.authMethod ? `Connected via ${paraWallet.authMethod}` : 'Connected via Para') :
    'Connected via Web3';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Wallet & Network</CardTitle>
          <CardDescription>
            Connect your wallet and select network for DeFi operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="space-y-3">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-green-800 font-medium">
                    {connectionMethod}
                  </p>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    {walletType === 'para' ? 'Para' : 'Web3'}
                  </Badge>
                </div>
                <p className="text-xs text-green-600 font-mono mb-1">
                  {displayAddress?.slice(0, 8)}...{displayAddress?.slice(-6)}
                </p>
                {chain && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-green-600">
                      Network: {chain.name}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      Chain ID: {chain.id}
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowWalletModal(true)}
                  variant="outline"
                  className="flex-1"
                >
                  Manage Wallet & Network
                </Button>
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  className="flex-1"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Connect your wallet to access DeFi features and network switching
                </p>
                <Button
                  onClick={() => setShowWalletModal(true)}
                  className="w-full"
                  size="lg"
                >
                  Connect Wallet
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                <div className="text-center">
                  <div className="font-medium">Para Wallet</div>
                  <div>OAuth login</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Web3 Wallets</div>
                  <div>MetaMask, WalletConnect</div>
                </div>
              </div>
            </div>
          )}
          
          {paraWallet.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                Error: {paraWallet.error}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <UnifiedWalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
      
      <DebugPara />
    </div>
  );
}