"use client";

import { useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildBearFork, etherlinkTestnet } from "@/lib/wagmi";
import { base, baseSepolia } from "wagmi/chains";

export function NetworkSwitcher() {
  const { chain, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const { walletType } = useAppStore();
  
  // Available networks
  const networks = [
    { 
      chain: base, 
      name: 'Base Mainnet', 
      description: 'Coinbase L2 - Production network',
      status: 'production' as const
    },
    { 
      chain: baseSepolia, 
      name: 'Base Sepolia', 
      description: 'Base testnet for development',
      status: 'testnet' as const
    },
    { 
      chain: buildBearFork, 
      name: 'BuildBear Fork', 
      description: 'Forked Base mainnet for demos',
      status: 'demo' as const
    },
    { 
      chain: etherlinkTestnet, 
      name: 'Etherlink Testnet', 
      description: 'Tezos-based EVM testnet',
      status: 'testnet' as const
    },
  ];

  const handleNetworkSwitch = (chainId: number) => {
    if (isConnected && switchChain && walletType !== 'para') {
      switchChain({ chainId: chainId as 8453 | 84532 | 27257 | 128123 });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'production': return 'bg-green-100 text-green-800 border-green-200';
      case 'testnet': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'demo': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Network Selection</CardTitle>
          <CardDescription>Connect a wallet to switch networks</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Please connect your wallet first to access network switching.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Network Selection</CardTitle>
        <CardDescription>
          {walletType === 'para' 
            ? 'Para wallet handles network switching automatically'
            : 'Select a network to switch to'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {networks.map((network) => (
          <Card 
            key={network.chain.id}
            className={`cursor-pointer transition-all ${
              chain?.id === network.chain.id 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:shadow-md'
            } ${walletType === 'para' || isPending ? 'opacity-60 cursor-not-allowed' : ''}`}
            onClick={() => walletType !== 'para' && !isPending && handleNetworkSwitch(network.chain.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">{network.name}</h3>
                    {chain?.id === network.chain.id && (
                      <Badge variant="default" className="text-xs">
                        {isPending ? 'Switching...' : 'Current'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{network.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Chain ID: {network.chain.id}</p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusColor(network.status)}`}
                >
                  {network.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}

        {walletType === 'para' && (
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            💡 Para wallet handles network switching automatically. For manual network control, 
            connect with a Web3 wallet like MetaMask.
          </div>
        )}

        {isPending && (
          <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded-lg">
            🔄 Network switch in progress... Please confirm in your wallet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}