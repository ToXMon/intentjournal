import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paraCompat } from "@/lib/para/client";

import type { TOAuthMethod, AuthStateLogin, AuthStateSignup } from "@getpara/web-sdk";

interface VerifyOAuthParams {
  method: Exclude<TOAuthMethod, "TELEGRAM" | "FARCASTER">;
  onOAuthUrl: (url: string) => void;
  isCanceled?: () => boolean;
}



interface HandleAuthStateParams {
  authState: AuthStateLogin | AuthStateSignup;
  openPopup: (url: string, name: string, features: string) => Window | null;
  popupWindow: React.MutableRefObject<Window | null>;
}

export function useParaOAuth() {
  const queryClient = useQueryClient();

  // Verify OAuth mutation
  const verifyOAuthMutation = useMutation({
    mutationFn: async (params: VerifyOAuthParams) => {
      console.log("Verifying OAuth with method:", params.method);
      try {
        // Add timeout and better error handling
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("OAuth verification timeout")), 30000);
        });
        
        const verifyPromise = paraCompat.verifyOAuth({
          ...params,
          // Ensure proper callback handling
          onOAuthUrl: (url: string) => {
            console.log("OAuth URL received:", url);
            params.onOAuthUrl(url);
          }
        });
        
        const result = await Promise.race([verifyPromise, timeoutPromise]);
        console.log("OAuth verification result:", result);
        console.log("OAuth result type:", typeof result);
        console.log("OAuth result keys:", result ? Object.keys(result) : 'null');
        console.log("OAuth result stringified:", JSON.stringify(result, null, 2));
        return result;
      } catch (error) {
        console.error("OAuth verification error:", error);
        
        // Handle specific error types
        if (error instanceof Error) {
          if (error.message.includes('400')) {
            throw new Error("Invalid API request. Please check your Para API configuration.");
          } else if (error.message.includes('timeout')) {
            throw new Error("OAuth verification timed out. Please try again.");
          } else if (error.message.includes('CORS')) {
            throw new Error("Cross-origin policy error. Please try a different browser or disable extensions.");
          }
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paraAccount"] });
    },
    onError: (error) => {
      console.error("OAuth mutation error:", error);
    },
  });



  // Handle auth state mutation
  const handleAuthStateMutation = useMutation({
    mutationFn: async ({ authState, openPopup, popupWindow }: HandleAuthStateParams) => {
      console.log("Handling auth state:", authState);
      console.log("Auth state stage:", authState.stage);
      console.log("Auth state keys:", Object.keys(authState));
      
      const popupConfig = {
        isCanceled: () => Boolean(popupWindow.current?.closed),
      };

      if (authState.stage === "signup") {
        console.log("Processing signup flow");
        if (!authState.passkeyUrl) {
          throw new Error("Passkey URL is required for signup");
        }
        console.log("Opening signup popup with URL:", authState.passkeyUrl);
        openPopup(authState.passkeyUrl, "signUpPopup", "popup=true");
        const result = await paraCompat.waitForWalletCreation(popupConfig);
        console.log("Wallet creation result:", result);
        if (!result.walletIds) {
          throw new Error("Failed to create wallet");
        }
        return result;
      }

      if (authState.stage === "login") {
        console.log("Processing login flow");
        if (!authState.passkeyUrl) {
          throw new Error("Passkey URL is required for login");
        }
        console.log("Opening login popup with URL:", authState.passkeyUrl);
        openPopup(authState.passkeyUrl, "loginPopup", "popup=true");
        const result = await paraCompat.waitForLogin(popupConfig);
        console.log("Login result:", result);
        return result;
      }

      console.error("Invalid auth state stage:", authState.stage);
      throw new Error("Invalid auth state");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paraAccount"] });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await paraCompat.logout();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  return {
    verifyOAuth: verifyOAuthMutation.mutate,
    verifyOAuthAsync: verifyOAuthMutation.mutateAsync,
    isVerifyingOAuth: verifyOAuthMutation.isPending,
    verifyOAuthError: verifyOAuthMutation.error,

    handleAuthState: handleAuthStateMutation.mutate,
    handleAuthStateAsync: handleAuthStateMutation.mutateAsync,
    isHandlingAuthState: handleAuthStateMutation.isPending,
    handleAuthStateError: handleAuthStateMutation.error,
    logout: logoutMutation.mutate,
    logoutAsync: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    logoutError: logoutMutation.error,
  };
}