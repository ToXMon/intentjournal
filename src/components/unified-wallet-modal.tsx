"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useParaWalletSync } from "@/hooks/useParaWalletSync";
import { useAppStore } from "@/lib/store";
import { ParaOAuthModal } from "./para-oauth-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { buildBearFork, etherlinkTestnet } from "@/lib/wagmi";
import { base, baseSepolia } from "wagmi/chains";

interface UnifiedWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UnifiedWalletModal({ isOpen, onClose }: UnifiedWalletModalProps) {
  const [showParaModal, setShowParaModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'connect' | 'network'>('connect');
  
  // Web3 wallet hooks
  const { address: web3Address, isConnected: isWeb3Connected, chain } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect: disconnectWeb3 } = useDisconnect();
  const { switchChain } = useSwitchChain();
  
  // Para wallet state
  const { paraWallet } = useParaWalletSync();
  const { walletAddress, walletType, disconnectWallet, disconnectParaWallet } = useAppStore();
  
  // Determine current connection state
  const isConnected = walletType === 'para' ? paraWallet.isConnected : isWeb3Connected;
  const displayAddress = walletType === 'para' ? paraWallet.address : web3Address;
  
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

  const handleWeb3Connect = () => {
    openConnectModal?.();
    onClose();
  };

  const handleParaConnect = () => {
    setShowParaModal(true);
  };

  const handleDisconnect = () => {
    if (walletType === 'para') {
      disconnectParaWallet();
    } else {
      disconnectWeb3();
      disconnectWallet();
    }
    onClose();
  };

  const handleNetworkSwitch = (chainId: number) => {
    if (isWeb3Connected && switchChain) {
      switchChain({ chainId: chainId as any });
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {isConnected ? 'Wallet & Network Settings' : 'Connect Wallet'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Tab Navigation */}
            {isConnected && (
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('connect')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'connect'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Wallet
                </button>
                <button
                  onClick={() => setActiveTab('network')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'network'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Network
                </button>
              </div>
            )}

            {/* Wallet Connection Tab */}
            {(!isConnected || activeTab === 'connect') && (
              <div className="space-y-4">
                {isConnected ? (
                  /* Connected State */
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Connected Wallet</CardTitle>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {walletType === 'para' ? 'Para Wallet' : 'Web3 Wallet'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900">
                          {walletType === 'para' && paraWallet.authMethod
                            ? `Connected via ${paraWallet.authMethod}`
                            : 'Connected'}
                        </p>
                        <p className="text-xs text-gray-600 font-mono mt-1">
                          {displayAddress?.slice(0, 8)}...{displayAddress?.slice(-6)}
                        </p>
                        {chain && (
                          <p className="text-xs text-gray-500 mt-1">
                            Network: {chain.name}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={handleParaConnect}
                          variant="outline"
                          className="flex-1"
                          size="sm"
                        >
                          {walletType === 'para' ? 'Manage Account' : 'Switch to Para'}
                        </Button>
                        <Button
                          onClick={handleDisconnect}
                          variant="outline"
                          className="flex-1"
                          size="sm"
                        >
                          Disconnect
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  /* Connection Options */
                  <div className="space-y-4">
                    {/* Para Wallet Option */}
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleParaConnect}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Para Wallet</CardTitle>
                          <Badge variant="secondary">OAuth</Badge>
                        </div>
                        <CardDescription className="text-sm">
                          Multi-chain wallet with social login (Google, Twitter, Apple, Discord, Facebook)
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {['Google', 'Twitter', 'Apple', 'Discord', 'Facebook'].map((provider) => (
                            <Badge key={provider} variant="outline" className="text-xs">
                              {provider}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">Or</span>
                      </div>
                    </div>

                    {/* Web3 Wallet Option */}
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleWeb3Connect}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Web3 Wallets</CardTitle>
                          <Badge variant="secondary">Traditional</Badge>
                        </div>
                        <CardDescription className="text-sm">
                          Connect with MetaMask, WalletConnect, Coinbase Wallet, and more
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {['MetaMask', 'WalletConnect', 'Coinbase', 'Safe'].map((wallet) => (
                            <Badge key={wallet} variant="outline" className="text-xs">
                              {wallet}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* Network Selection Tab */}
            {isConnected && activeTab === 'network' && (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  {walletType === 'para' 
                    ? 'Para wallet automatically handles network switching'
                    : 'Select a network to switch to'
                  }
                </div>
                
                <div className="space-y-3">
                  {networks.map((network) => (
                    <Card 
                      key={network.chain.id}
                      className={`cursor-pointer transition-all ${
                        chain?.id === network.chain.id 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:shadow-md'
                      } ${walletType === 'para' ? 'opacity-60 cursor-not-allowed' : ''}`}
                      onClick={() => walletType !== 'para' && handleNetworkSwitch(network.chain.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-sm">{network.name}</h3>
                              {chain?.id === network.chain.id && (
                                <Badge variant="default" className="text-xs">Current</Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{network.description}</p>
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
                </div>

                {walletType === 'para' && (
                  <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                    💡 Para wallet handles network switching automatically. For manual network control, 
                    connect with a Web3 wallet like MetaMask.
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Para OAuth Modal */}
      <ParaOAuthModal
        isOpen={showParaModal}
        onClose={() => setShowParaModal(false)}
      />
    </>
  );
}