"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SimpleProviders } from "@/components/simple-providers";

function TestWalletContent() {
  const { address, isConnected, chain } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Simple Wallet Test</h1>
        <p className="text-gray-600">
          Test basic wallet connection without Para session initialization
        </p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Wallet Status</CardTitle>
          <CardDescription>
            Test Web3 wallet connection directly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-green-800 font-medium">
                    Connected
                  </p>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    Web3
                  </Badge>
                </div>
                <p className="text-xs text-green-600 font-mono mb-1">
                  {address?.slice(0, 8)}...{address?.slice(-6)}
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
              
              <Button
                onClick={() => disconnect()}
                variant="outline"
                className="w-full"
              >
                Disconnect
              </Button>
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
                  Connect your Web3 wallet to test network switching
                </p>
                <Button
                  onClick={openConnectModal}
                  className="w-full"
                  size="lg"
                >
                  Connect Web3 Wallet
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Available Networks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Base Mainnet</span>
              <Badge variant="outline" className="bg-green-100 text-green-800">Production</Badge>
            </div>
            <div className="flex justify-between">
              <span>Base Sepolia</span>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">Testnet</Badge>
            </div>
            <div className="flex justify-between">
              <span>BuildBear Fork</span>
              <Badge variant="outline" className="bg-purple-100 text-purple-800">Demo</Badge>
            </div>
            <div className="flex justify-between">
              <span>Etherlink Testnet</span>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">Testnet</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          This page bypasses Para session initialization for testing
        </p>
      </div>
    </div>
  );
}

export default function TestWalletPage() {
  return (
    <SimpleProviders>
      <TestWalletContent />
    </SimpleProviders>
  );
}