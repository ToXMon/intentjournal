"use client";

import { useState, useRef, useEffect } from "react";
// Simplified type until Para SDK is properly integrated
type TOAuthMethod = "GOOGLE" | "TWITTER" | "APPLE" | "DISCORD" | "FACEBOOK" | "TELEGRAM";
import { useParaOAuth } from "@/hooks/useParaOAuth";
import { useParaWalletSync } from "@/hooks/useParaWalletSync";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface OAuthOption {
  method: TOAuthMethod;
  label: string;
  icon: string;
}

const oAuthOptions: OAuthOption[] = [
  {
    method: "GOOGLE",
    label: "Continue with Google",
    icon: "🔍",
  },
  {
    method: "TWITTER",
    label: "Continue with Twitter",
    icon: "🐦",
  },
  {
    method: "APPLE",
    label: "Continue with Apple",
    icon: "🍎",
  },
  {
    method: "DISCORD",
    label: "Continue with Discord",
    icon: "💬",
  },
  {
    method: "FACEBOOK",
    label: "Continue with Facebook",
    icon: "📘",
  },
];

interface ParaOAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ParaOAuthModal({ isOpen, onClose }: ParaOAuthModalProps) {
  const { paraWallet } = useParaWalletSync(); // Use synced state
  const { disconnectParaWallet } = useAppStore();
  const [error, setError] = useState("");
  const [authenticatingMethod, setAuthenticatingMethod] = useState<TOAuthMethod | null>(null);
  const popupWindow = useRef<Window | null>(null);

  // Use unified state from store
  const isConnected = paraWallet.isConnected;
  const address = paraWallet.address;

  const {
    verifyOAuthAsync,
    handleAuthStateAsync,
    logoutAsync,
    isLoggingOut,
  } = useParaOAuth();

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError("");
      setAuthenticatingMethod(null);
      popupWindow.current?.close();
    }
  }, [isOpen]);

  const openPopup = (url: string, name: string, features: string) => {
    try {
      popupWindow.current?.close();
    } catch (e) {
      // Ignore CORS errors when closing popup
      console.warn("Could not close popup due to CORS policy");
    }
    
    // Enhanced popup features to handle CORS better
    const enhancedFeatures = `${features},toolbar=no,menubar=no,location=no,status=no`;
    popupWindow.current = window.open(url, name, enhancedFeatures);
    
    if (!popupWindow.current) {
      throw new Error("Popup was blocked. Please allow popups for this site and try again.");
    }
    
    return popupWindow.current;
  };

  const handleOAuthAuthentication = async (method: TOAuthMethod) => {
    setError("");
    setAuthenticatingMethod(method);

    try {
      if (method === "TELEGRAM") {
        throw new Error("Telegram authentication is not supported in this example.");
      }

      let authState;

      // Create a safer popup checker that handles CORS issues
      const createPopupChecker = () => {
        let isClosed = false;
        let checkCount = 0;
        const maxChecks = 300; // 5 minutes max
        let lastKnownState = false;
        
        const checkInterval = setInterval(() => {
          checkCount++;
          try {
            const currentlyClosed = popupWindow.current?.closed || false;
            
            // If we can read the closed property and it changed to true
            if (currentlyClosed && !lastKnownState) {
              isClosed = true;
              clearInterval(checkInterval);
            }
            
            lastKnownState = currentlyClosed;
          } catch (e) {
            // Handle CORS errors - assume popup is still open unless we know otherwise
            console.warn("Popup check blocked by CORS policy, assuming popup is still open");
            
            // If we can't check the popup state due to CORS, 
            // we'll rely on the Para SDK's own timeout mechanisms
          }
          
          // Stop checking after max time
          if (checkCount >= maxChecks) {
            console.warn("Popup check timeout reached");
            clearInterval(checkInterval);
          }
        }, 1000);

        return () => {
          clearInterval(checkInterval);
          return isClosed;
        };
      };

      const popupChecker = createPopupChecker();

      authState = await verifyOAuthAsync({
        method,
        onOAuthUrl: (oAuthUrl: string) => {
          openPopup(oAuthUrl, "oAuthPopup", "popup=yes,width=500,height=600,scrollbars=yes,resizable=yes");
        },
        isCanceled: popupChecker,
      });

      await handleAuthStateAsync({
        authState: authState as any,
        openPopup,
        popupWindow
      });

      onClose();
    } catch (err: unknown) {
      console.error("OAuth authentication error:", err);
      let errorMessage = "Authentication failed";
      
      if (err instanceof Error) {
        errorMessage = err.message;
        // Check for specific API errors
        if (err.message.includes('400') || err.message.includes('Bad Request')) {
          errorMessage = "Invalid request to Para API. This might be due to:\n• Invalid API key\n• Incorrect OAuth configuration\n• Network connectivity issues\n\nPlease check your configuration and try again.";
        } else if (err.message.includes('CORS') || err.message.includes('Cross-Origin')) {
          errorMessage = "Cross-origin policy error. Please try again or use a different browser.";
        } else if (err.message.includes('popup') || err.message.includes('blocked')) {
          errorMessage = "Popup was blocked. Please allow popups for this site and try again.";
        } else if (err.message.includes('timeout')) {
          errorMessage = "Authentication timed out. Please try again.";
        }
      }
      
      setError(errorMessage);
    } finally {
      setAuthenticatingMethod(null);
    }
  };

  const handleLogout = async () => {
    setError("");
    try {
      await logoutAsync();
      // Also disconnect from app store
      disconnectParaWallet();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to logout");
    }
  };

  const isAuthenticating = authenticatingMethod !== null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4">
        <CardHeader>
          <CardTitle>
            {isConnected ? "Account Settings" : "Connect with Para"}
          </CardTitle>
          <CardDescription>
            {isConnected 
              ? "Manage your Para wallet connection" 
              : "Connect using OAuth providers with Para's multi-chain wallet"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Connected Account</p>
                <p className="text-sm font-mono text-gray-900">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              </div>
              <Button
                onClick={handleLogout}
                disabled={isLoggingOut}
                variant="destructive"
                className="w-full"
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {oAuthOptions.map(({ method, label, icon }) => {
                  const isCurrentlyAuthenticating = authenticatingMethod === method;
                  const isDisabled = isAuthenticating || isLoggingOut;

                  return (
                    <Button
                      key={method}
                      onClick={() => handleOAuthAuthentication(method)}
                      disabled={isDisabled}
                      variant="outline"
                      className="w-full justify-start gap-3"
                    >
                      <span className="text-lg" aria-hidden="true">
                        {icon}
                      </span>
                      <span className="text-sm font-medium">
                        {isCurrentlyAuthenticating ? "Loading..." : label}
                      </span>
                    </Button>
                  );
                })}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </>
          )}

          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}