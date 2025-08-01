"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { useAppStore } from "@/lib/store";

/**
 * Hook to synchronize Web3 wallet state (wagmi) with the app store
 * This ensures the store stays updated when users connect/disconnect Web3 wallets
 */
export function useWeb3WalletSync() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { setWalletConnection, disconnectWallet, walletType } = useAppStore();
  const [hasMounted, setHasMounted] = useState(false);

  // Prevent hydration issues by only syncing after mount
  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    // Don't sync during hydration
    if (!hasMounted) return;

    // Add a small delay to prevent race conditions during hydration
    const timeoutId = setTimeout(() => {
      if (isConnected && address) {
        // Only update if we're not already connected to Para wallet
        // or if we're switching from Para to Web3
        if (walletType !== 'para') {
          console.log('Syncing Web3 wallet connection:', { address, chainId });
          setWalletConnection(address, chainId, 'wagmi');
        }
      } else if (!isConnected && walletType === 'wagmi') {
        // Only disconnect if the current wallet type is wagmi
        console.log('Syncing Web3 wallet disconnection');
        disconnectWallet();
      }
    }, 100); // Small delay to prevent hydration conflicts

    return () => clearTimeout(timeoutId);
  }, [hasMounted, isConnected, address, chainId, setWalletConnection, disconnectWallet, walletType]);

  return {
    isConnected,
    address,
    chainId,
  };
}