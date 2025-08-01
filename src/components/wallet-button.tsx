"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useAppStore } from "@/lib/store";
import { useParaWalletSync } from "@/hooks/useParaWalletSync";
import { UnifiedWalletModal } from "./unified-wallet-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface WalletButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  showNetwork?: boolean;
  className?: string;
}

export function WalletButton({ 
  variant = "default", 
  size = "default", 
  showNetwork = true,
  className 
}: WalletButtonProps) {
  const [showModal, setShowModal] = useState(false);
  
  // Web3 wallet state
  const { address: web3Address, isConnected: isWeb3Connected, chain } = useAccount();
  
  // Para wallet state
  const { paraWallet } = useParaWalletSync();
  const { walletType } = useAppStore();

  // Determine connection status
  const isConnected = walletType === 'para' ? paraWallet.isConnected : isWeb3Connected;
  const displayAddress = walletType === 'para' ? paraWallet.address : web3Address;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <>
        <Button
          onClick={() => setShowModal(true)}
          variant={variant}
          size={size}
          className={className}
        >
          Connect Wallet
        </Button>
        
        <UnifiedWalletModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        variant={variant}
        size={size}
        className={`${className} flex items-center gap-2`}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="font-mono text-sm">
            {formatAddress(displayAddress!)}
          </span>
          {showNetwork && chain && (
            <Badge variant="secondary" className="text-xs">
              {chain.name}
            </Badge>
          )}
        </div>
      </Button>
      
      <UnifiedWalletModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}