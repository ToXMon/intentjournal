"use client";

import { useState } from "react";
import { para, paraCompat } from "@/lib/para/client";
import { runFullDiagnostics, formatDiagnosticResults } from "@/lib/para/troubleshooting";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DebugPara() {
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingOAuth, setIsTestingOAuth] = useState(false);

  const testParaConnection = async () => {
    setIsLoading(true);
    setDebugInfo("");
    
    try {
      // Run full diagnostics first
      const diagnostics = runFullDiagnostics();
      setDebugInfo(prev => prev + "=== DIAGNOSTICS ===\n");
      setDebugInfo(prev => prev + formatDiagnosticResults(diagnostics) + "\n\n");
      
      // Test basic Para client initialization
      console.log("Para client:", para);
      setDebugInfo(prev => prev + "=== PARA CLIENT TEST ===\n");
      setDebugInfo(prev => prev + "✓ Para client initialized\n");
      
      // Test environment variables
      const apiKey = process.env.NEXT_PUBLIC_PARA_API_KEY;
      const secretKey = process.env.NEXT_PUBLIC_PARA_SECRET_KEY; // Client-side accessible version
      const serverSecretKey = process.env.PARA_SECRET_KEY; // Server-side only
      
      console.log("API Key:", apiKey ? `${apiKey.slice(0, 8)}...` : "NOT SET");
      console.log("Client Secret Key:", secretKey ? `${secretKey.slice(0, 8)}...` : "NOT SET");
      console.log("Server Secret Key:", serverSecretKey ? `${serverSecretKey.slice(0, 8)}...` : "NOT SET");
      
      setDebugInfo(prev => prev + `✓ API Key: ${apiKey ? `${apiKey.slice(0, 8)}...` : "NOT SET"}\n`);
      setDebugInfo(prev => prev + `✓ Client Secret Key: ${secretKey ? `${secretKey.slice(0, 8)}...` : "NOT SET"}\n`);
      setDebugInfo(prev => prev + `✓ Server Secret Key: ${serverSecretKey ? `${serverSecretKey.slice(0, 8)}...` : "NOT SET (expected on client)"}\n`);
      
      // List available methods for debugging
      const methods = Object.getOwnPropertyNames(para).filter(prop => typeof para[prop] === 'function');
      const prototypeMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(para)).filter(prop => typeof para[prop] === 'function');
      console.log("Available Para methods:", methods);
      console.log("Available Para prototype methods:", prototypeMethods);
      setDebugInfo(prev => prev + `✓ Instance methods: ${methods.join(', ')}\n`);
      setDebugInfo(prev => prev + `✓ Prototype methods: ${prototypeMethods.join(', ')}\n`);
      
      // Test account check using compatibility wrapper
      setDebugInfo(prev => prev + "\n=== ACCOUNT TEST ===\n");
      try {
        const account = await paraCompat.getAccount();
        console.log("Account:", account);
        setDebugInfo(prev => prev + `✓ Account check: ${account ? "Connected" : "Not connected"}\n`);
        
        if (account) {
          setDebugInfo(prev => prev + `✓ Account details: ${JSON.stringify(account, null, 2)}\n`);
        }
      } catch (error) {
        console.log("Account check error:", error);
        setDebugInfo(prev => prev + `✗ Account check error: ${error instanceof Error ? error.message : "Unknown error"}\n`);
      }
      
      // Test OAuth methods availability
      setDebugInfo(prev => prev + "\n=== OAUTH METHODS TEST ===\n");
      const oauthMethods = ['verifyOAuth', 'waitForWalletCreation', 'waitForLogin', 'logout'];
      oauthMethods.forEach(method => {
        const available = typeof para[method] === 'function';
        setDebugInfo(prev => prev + `${available ? '✓' : '✗'} ${method}: ${available ? 'Available' : 'Not found'}\n`);
      });
      
    } catch (error) {
      console.error("Debug error:", error);
      setDebugInfo(prev => prev + `✗ Error: ${error instanceof Error ? error.message : "Unknown error"}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const testOAuthFlow = async () => {
    setIsTestingOAuth(true);
    setDebugInfo(prev => prev + "\n=== OAUTH FLOW TEST ===\n");
    
    try {
      // Test the OAuth verification with minimal parameters
      const result = await paraCompat.verifyOAuth({
        method: "GOOGLE",
        onOAuthUrl: (url: string) => {
          setDebugInfo(prev => prev + `✓ OAuth URL received: ${url.substring(0, 50)}...\n`);
          // Don't actually open the popup, just log the URL
        },
        isCanceled: () => {
          setDebugInfo(prev => prev + "✓ OAuth canceled check called\n");
          return true; // Cancel immediately for testing
        }
      });
      
      setDebugInfo(prev => prev + `✓ OAuth verification result: ${JSON.stringify(result, null, 2)}\n`);
    } catch (error) {
      console.error("OAuth test error:", error);
      setDebugInfo(prev => prev + `✗ OAuth test error: ${error instanceof Error ? error.message : "Unknown error"}\n`);
      
      // Try to extract more specific error information
      if (error instanceof Error && error.message.includes('400')) {
        setDebugInfo(prev => prev + "ℹ️ This is likely the same 400 error you're seeing in the console\n");
      }
    } finally {
      setIsTestingOAuth(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Para Debug Info</CardTitle>
        <CardDescription>
          Debug information for Para SDK integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={testParaConnection}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? "Testing..." : "Test Para Connection"}
          </Button>
          
          <Button 
            onClick={testOAuthFlow}
            disabled={isTestingOAuth || isLoading}
            variant="outline"
          >
            {isTestingOAuth ? "Testing OAuth..." : "Test OAuth Flow"}
          </Button>
        </div>
        
        {debugInfo && (
          <div className="bg-gray-100 p-3 rounded font-mono text-sm whitespace-pre-wrap">
            {debugInfo}
          </div>
        )}
      </CardContent>
    </Card>
  );
}