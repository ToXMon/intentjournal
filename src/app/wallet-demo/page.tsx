"use client";

import { WalletConnect } from "@/components/wallet-connect";
import { WalletButton } from "@/components/wallet-button";
import { NetworkSwitcher } from "@/components/network-switcher";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WalletDemoPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Wallet & Network Demo</h1>
        <p className="text-gray-600">
          Test the unified wallet connection and network switching functionality
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Wallet Connect Component */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Main Wallet Component</h2>
          <WalletConnect />
        </div>

        {/* Network Switcher */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Network Switcher</h2>
          <NetworkSwitcher />
        </div>
      </div>

      {/* Wallet Button Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Button Examples</CardTitle>
          <CardDescription>
            Different variations of the wallet button component
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <WalletButton />
            <WalletButton variant="outline" />
            <WalletButton variant="ghost" />
            <WalletButton size="sm" />
            <WalletButton size="lg" />
            <WalletButton showNetwork={false} />
          </div>
        </CardContent>
      </Card>

      {/* Available Networks Info */}
      <Card>
        <CardHeader>
          <CardTitle>Available Networks</CardTitle>
          <CardDescription>
            Networks configured for IntentJournal+
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h3 className="font-medium">Production Networks</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Base Mainnet (Chain ID: 8453)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Test Networks</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Base Sepolia (Chain ID: 84532)</li>
                <li>• BuildBear Fork (Chain ID: 27257)</li>
                <li>• Etherlink Testnet (Chain ID: 128123)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Features Implemented</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-green-700">✅ Completed</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Para wallet OAuth integration</li>
                <li>• Web3 wallet support (MetaMask, WalletConnect, etc.)</li>
                <li>• Network switching for Web3 wallets</li>
                <li>• BuildBear forked network support</li>
                <li>• Unified wallet modal interface</li>
                <li>• Wallet state synchronization</li>
                <li>• Responsive design</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-blue-700">🔄 How it Works</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Para wallet: OAuth-based, auto network switching</li>
                <li>• Web3 wallets: Manual network switching available</li>
                <li>• Both wallet types coexist peacefully</li>
                <li>• State persisted across browser sessions</li>
                <li>• Real-time connection status updates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}