'use client';

import React, { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { realTransactionExecutor } from '@/services/real-transaction-executor';
import { parseEther, formatEther } from 'viem';

export default function IJTTokenFaucet() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isRequesting, setIsRequesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; txHash?: string; explorerUrl?: string } | null>(null);

  // Token addresses from deployment
  const IJT_TOKEN_ADDRESS = '0x84B346891b977E30ba4774A911cb342f1FAb1Ce4';
  const DEMO_TOKEN_ADDRESS = '0xD31E022A0Aa45A6B74eBb44DDaC909Ec0dfD2765';
  const USDC_TOKEN_ADDRESS = '0x064Abf44F593C198e34E55e4C129580c425b499F';

  const requestIJTTokens = async () => {
    if (!address || !walletClient) return;
    
    setIsRequesting(true);
    setResult(null);
    
    try {
      // Initialize wallet client in transaction executor
      realTransactionExecutor.initializeWalletClients(walletClient);

      // Request IJT tokens from the faucet (simulate transfer from deployer)
      const faucetResult = await realTransactionExecutor.requestTokensFromFaucet(
        address,
        IJT_TOKEN_ADDRESS,
        parseEther('100').toString(), // 100 IJT tokens
        'IJT'
      );

      if (faucetResult.success) {
        setResult({
          success: true,
          message: `✅ Successfully received 100 IJT tokens! TX: ${faucetResult.txHash?.slice(0, 10)}...`,
          txHash: faucetResult.txHash,
          explorerUrl: `https://smooth-spiderman-faa2b8b9.ethernal.buildbear.io/tx/${faucetResult.txHash}`
        });
      } else {
        throw new Error(faucetResult.error || 'Faucet request failed');
      }
    } catch (error) {
      setResult({
        success: false,
        message: `❌ IJT token request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const checkIJTBalance = async () => {
    if (!address || !walletClient) return;
    
    try {
      // Initialize wallet client in transaction executor
      realTransactionExecutor.initializeWalletClients(walletClient);

      // Check IJT token balance
      const ijtBalance = await realTransactionExecutor.checkTokenBalance(
        address,
        IJT_TOKEN_ADDRESS,
        '0'
      );

      // Check BBETH balance for gas
      const bbethBalance = await realTransactionExecutor.checkTokenBalance(
        address,
        DEMO_TOKEN_ADDRESS,
        '0'
      );

      // Check USDC balance for swaps
      const usdcBalance = await realTransactionExecutor.checkTokenBalance(
        address,
        USDC_TOKEN_ADDRESS,
        '0'
      );

      setResult({
        success: true,
        message: `💰 Token Balances:\n• IJT: ${ijtBalance.balanceFormatted}\n• BBETH: ${bbethBalance.balanceFormatted}\n• USDC: ${usdcBalance.balanceFormatted}`
      });
    } catch (error) {
      setResult({
        success: false,
        message: `❌ Balance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600">Connect your wallet to get IJT tokens</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🪙 IJT Token Faucet</h3>
      
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          <p><strong>IJT Token:</strong> IntentJournal Token</p>
          <p><strong>Address:</strong> {IJT_TOKEN_ADDRESS}</p>
          <p><strong>Network:</strong> BuildBear Base Fork (Chain ID: 27257)</p>
          <p><strong>Your Wallet:</strong> {address?.slice(0, 6)}...{address?.slice(-4)}</p>
          <p><strong>Faucet Amount:</strong> 100 IJT per request</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={requestIJTTokens}
            disabled={isRequesting}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRequesting ? '⏳ Requesting...' : '🚰 Get 100 IJT'}
          </button>
          
          <button
            onClick={checkIJTBalance}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            🔍 Check Balances
          </button>
        </div>
        
        {result && (
          <div className={`p-3 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={result.success ? 'text-green-800' : 'text-red-800'}>
              {result.message}
            </p>
            {result.txHash && result.explorerUrl && (
              <div className="mt-2">
                <a
                  href={result.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  View Transaction: {result.txHash.slice(0, 10)}...{result.txHash.slice(-8)} →
                </a>
              </div>
            )}
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          <p>💡 This faucet distributes IJT tokens for Fusion+ cross-chain testing</p>
          <p>🔗 IJT tokens are needed for cross-chain swaps and intent execution</p>
          <p>⚡ Use these tokens to test the Fusion+ protocol implementation</p>
          <p>🌉 Cross-chain swaps: BuildBear Base Fork ↔ Etherlink Testnet</p>
        </div>
      </div>
    </div>
  );
}