import { useQuery } from "@tanstack/react-query";
import { paraCompat } from "@/lib/para/client";
import { useEffect } from "react";

export function useParaAccount() {
  const { data: account, isLoading, error, refetch } = useQuery({
    queryKey: ["paraAccount"],
    queryFn: async () => {
      try {
        const account = await paraCompat.getAccount();
        console.log("Para account query result:", account);
        if (account) {
          console.log("Account type:", typeof account);
          console.log("Account keys:", Object.keys(account));
          console.log("Account wallets:", account.wallets);
          console.log("Account wallets type:", typeof account.wallets);
          console.log("Account wallets is array:", Array.isArray(account.wallets));
        }
        return account;
      } catch (err) {
        console.log("Para account query error:", err);
        // Return null instead of throwing to avoid error state for unauthenticated users
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    // Check for existing session on mount
    refetchOnMount: true,
  });

  // Auto-refetch when window regains focus to check for session changes
  useEffect(() => {
    const handleFocus = () => {
      if (!isLoading) {
        refetch();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isLoading, refetch]);

  const isConnected = !!account && !!account.userId;
  
  // Ensure wallets is always an array
  let wallets = [];
  if ((account as any)?.embedded?.wallets && Array.isArray((account as any).embedded.wallets)) {
    wallets = (account as any).embedded.wallets;
  } else if (account?.wallets && Array.isArray(account.wallets)) {
    wallets = account.wallets;
  } else if (account?.wallets && typeof account.wallets === 'object') {
    // Handle case where wallets might be an object instead of array
    wallets = Object.values(account.wallets).filter(Boolean);
  }
  
  const primaryWallet = wallets[0];
  const address = primaryWallet?.address;

  return {
    account,
    isConnected,
    address,
    wallets,
    isLoading,
    error,
    refetch,
  };
}