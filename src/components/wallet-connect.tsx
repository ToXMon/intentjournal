"use client";

import { useState, useEffect } from "react";
import { useParaWalletSync } from "@/hooks/useParaWalletSync";
import { useAppStore } from "@/lib/store";
import { ParaOAuthModal } from "./para-oauth-modal";
import { DebugPara } from "./debug-para";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function WalletConnect() {
  const [showParaModal, setShowParaModal] = useState(false);
  const { paraWallet } = useParaWalletSync(); // This handles state synchronization
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
  const isConnected = walletType === 'para' ? paraWallet.isConnected : !!walletAddress;
  const displayAddress = walletType === 'para' ? paraWallet.address : walletAddress;
  const connectionMethod = walletType === 'para' ? 
    (paraWallet.authMethod ? `Connected via ${paraWallet.authMethod}` : 'Connected via Para') :
    'Connected via Web3';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Wallet Connection</CardTitle>
          <CardDescription>
            {walletType === 'para' ? 
              "Para multi-chain OAuth wallet" : 
              "Choose your wallet connection method"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="space-y-2">
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800 font-medium">
                  {connectionMethod}
                </p>
                <p className="text-xs text-green-600 font-mono">
                  {displayAddress?.slice(0, 6)}...{displayAddress?.slice(-4)}
                </p>
                {walletType && (
                  <p className="text-xs text-green-500 mt-1">
                    Wallet Type: {walletType.toUpperCase()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowParaModal(true)}
                  variant="outline"
                  className="flex-1"
                >
                  {walletType === 'para' ? 'Manage Account' : 'Connect Para'}
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
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Multi-chain wallet with OAuth login (Google, Twitter, Apple, Discord, Facebook)
              </p>
              <Button
                onClick={() => setShowParaModal(true)}
                className="w-full"
              >
                Connect with Para
              </Button>
              {/* TODO: Add traditional Web3 wallet options here */}
              <p className="text-xs text-gray-500 text-center">
                Traditional Web3 wallets coming soon
              </p>
            </div>
          )}
          
          {paraWallet.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800">
                Error: {paraWallet.error}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <ParaOAuthModal
        isOpen={showParaModal}
        onClose={() => setShowParaModal(false)}
      />
      
      <DebugPara />
    </div>
  );
}