"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";

/**
 * Hook to automatically save wallet-specific data when it changes
 * This ensures data is persisted whenever journal entries, embeddings, etc. are updated
 */
export function useWalletDataPersistence() {
  const { 
    walletAddress, 
    journalEntries, 
    embeddings, 
    tradeHistory, 
    currentRecommendations, 
    activeOrders,
    saveWalletData 
  } = useAppStore();
  
  const previousWalletRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save data when it changes (with debouncing)
  useEffect(() => {
    if (!walletAddress) return;

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce saves to avoid excessive localStorage writes
    saveTimeoutRef.current = setTimeout(() => {
      console.log('Auto-saving wallet data for:', walletAddress);
      saveWalletData(walletAddress);
    }, 1000); // Save after 1 second of inactivity

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [walletAddress, journalEntries, embeddings, tradeHistory, currentRecommendations, activeOrders, saveWalletData]);

  // Save data immediately when wallet changes (before clearing)
  useEffect(() => {
    const previousWallet = previousWalletRef.current;
    
    if (previousWallet && previousWallet !== walletAddress && previousWallet !== null) {
      console.log('Wallet changed, saving data for previous wallet:', previousWallet);
      // Save data for the previous wallet before switching
      saveWalletData(previousWallet);
    }
    
    previousWalletRef.current = walletAddress;
  }, [walletAddress, saveWalletData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Save data one final time on unmount
      if (walletAddress) {
        saveWalletData(walletAddress);
      }
    };
  }, [walletAddress, saveWalletData]);
}