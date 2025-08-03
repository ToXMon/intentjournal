'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';

export default function BuildBearFaucetSimple() {
  const { address, isConnected } = useAccount();
  const [isRequesting, setIsRequesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const requestFunds = async () => {
    if (!address) return;
    
    setIsRequesting(true);
    setResult(null);
    
    try {
      // BuildBear faucet endpoint
      const response = await fetch('https://rpc.buildbear.io/smooth-spiderman-faa2b8b9', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'buildbear_setBalance',
          params: [address, '0x56BC75E2D630E0000'], // 100 ETH in hex
          id: 1
        })
      });
      
      const data = await response.json();
      
      if (data.result) {
        setResult({
          success: true,
          message: '✅ Successfully funded wallet with 100 BBETH!'
        });
      } else {
        throw new Error(data.error?.message || 'Faucet request failed');
      }
    } catch (error) {
      setResult({
        success: false,
        message: `❌ Faucet failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const checkBalance = async () => {
    if (!address) return;
    
    try {
      const response = await fetch('https://rpc.buildbear.io/smooth-spiderman-faa2b8b9', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 1
        })
      });
      
      const data = await response.json();
      const balance = parseInt(data.result, 16);
      const ethBalance = (balance / 1e18).toFixed(6);
      
      setResult({
        success: true,
        message: `💰 Current balance: ${ethBalance} BBETH`
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
        <p className="text-gray-600">Connect your wallet to use the faucet</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🚰 BuildBear Faucet</h3>
      
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          <p><strong>Network:</strong> BuildBear Base Fork (Chain ID: 27257)</p>
          <p><strong>Address:</strong> {address?.slice(0, 6)}...{address?.slice(-4)}</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={requestFunds}
            disabled={isRequesting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRequesting ? '⏳ Requesting...' : '💰 Get 100 BBETH'}
          </button>
          
          <button
            onClick={checkBalance}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            🔍 Check Balance
          </button>
        </div>
        
        {result && (
          <div className={`p-3 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={result.success ? 'text-green-800' : 'text-red-800'}>
              {result.message}
            </p>
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          <p>💡 This faucet gives you testnet BBETH for gas fees on BuildBear Base Fork</p>
          <p>🔗 Explorer: <a href="https://smooth-spiderman-faa2b8b9.ethernal.buildbear.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View on BuildBear Explorer</a></p>
        </div>
      </div>
    </div>
  );
}