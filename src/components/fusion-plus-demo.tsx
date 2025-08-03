'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { FusionPlusManager, type FusionPlusOrderParams, type FusionPlusOrderResult } from '@/utils/oneinch/fusion-plus';
import { realTransactionExecutor } from '@/services/real-transaction-executor';
import { parseEther, formatEther } from 'viem';

export default function FusionPlusDemo() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<FusionPlusOrderResult | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>('');
  const [tokenBalances, setTokenBalances] = useState<any>({});
  const [swapParams, setSwapParams] = useState({
    amount: '10',
    srcChain: 27257, // BuildBear Base Fork
    dstChain: 128123, // Etherlink Testnet
  });

  // Token addresses - using centralized config
  const TOKENS = {
    IJT: '0x84B346891b977E30ba4774A911cb342f1FAb1Ce4',
    USDC: '0x064Abf44F593C198e34E55e4C129580c425b499F',
    DEMO: '0xD31E022A0Aa45A6B74eBb44DDaC909Ec0dfD2765',
  };

  // Load token balances
  useEffect(() => {
    if (address && walletClient) {
      loadTokenBalances();
    }
  }, [address, walletClient]);

  const loadTokenBalances = async () => {
    if (!address || !walletClient) return;

    try {
      realTransactionExecutor.initializeWalletClients(walletClient);
      
      const [ijtBalance, usdcBalance, demoBalance] = await Promise.all([
        realTransactionExecutor.checkTokenBalance(address, TOKENS.IJT, '0'),
        realTransactionExecutor.checkTokenBalance(address, TOKENS.USDC, '0'),
        realTransactionExecutor.checkTokenBalance(address, TOKENS.DEMO, '0'),
      ]);

      setTokenBalances({
        IJT: ijtBalance,
        USDC: usdcBalance,
        DEMO: demoBalance,
      });
    } catch (error) {
      console.error('Failed to load token balances:', error);
    }
  };

  const handleCreateCrossChainOrder = async () => {
    if (!address) return;

    setIsLoading(true);
    setOrderStatus('Creating cross-chain order...');

    try {
      const orderParams: FusionPlusOrderParams = {
        srcChainId: swapParams.srcChain,
        dstChainId: swapParams.dstChain,
        srcTokenAddress: TOKENS.IJT,
        dstTokenAddress: TOKENS.USDC,
        amount: parseEther(swapParams.amount).toString(),
        walletAddress: address,
        preset: 'fast',
      };

      // Create the cross-chain order
      const order = await FusionPlusManager.createCrossChainOrder(orderParams);
      
      if (order) {
        setCurrentOrder(order);
        setOrderStatus('Cross-chain order created successfully!');
        
        // Start monitoring order status
        monitorOrderProgress(order.orderHash);
      } else {
        setOrderStatus('Failed to create cross-chain order');
      }
    } catch (error) {
      console.error('Error creating cross-chain order:', error);
      setOrderStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const monitorOrderProgress = async (orderHash: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await FusionPlusManager.getOrderStatus(orderHash);
        if (status) {
          setCurrentOrder(status);
          
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(interval);
            setOrderStatus(`Order ${status.status}!`);
          }
        }
      } catch (error) {
        console.error('Error monitoring order:', error);
        clearInterval(interval);
      }
    }, 5000); // Check every 5 seconds

    // Clear interval after 10 minutes
    setTimeout(() => clearInterval(interval), 600000);
  };

  const handleSubmitSecrets = async () => {
    if (!currentOrder) return;

    setIsLoading(true);
    setOrderStatus('Submitting secrets...');

    try {
      const success = await FusionPlusManager.submitSecrets(
        currentOrder.orderHash,
        currentOrder.secrets,
        currentOrder.dstChainId
      );

      if (success) {
        setOrderStatus('Secrets submitted successfully!');
        // Refresh order status
        const updatedOrder = await FusionPlusManager.getOrderStatus(currentOrder.orderHash);
        if (updatedOrder) {
          setCurrentOrder(updatedOrder);
        }
      } else {
        setOrderStatus('Failed to submit secrets');
      }
    } catch (error) {
      console.error('Error submitting secrets:', error);
      setOrderStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressPercentage = () => {
    if (!currentOrder) return 0;
    return FusionPlusManager.calculateExecutionProgress(currentOrder).progressPercentage;
  };

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 27257: return 'BuildBear Base Fork';
      case 128123: return 'Etherlink Testnet';
      case 8453: return 'Base';
      case 42161: return 'Arbitrum';
      case 1: return 'Ethereum';
      case 137: return 'Polygon';
      default: return `Chain ${chainId}`;
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🌉 Fusion+ Cross-Chain Demo</h3>
        <p className="text-gray-600">Connect your wallet to test Fusion+ cross-chain swaps</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🌉 Fusion+ Cross-Chain Protocol</h3>
      
      {/* Token Balances */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-2">💰 Your Token Balances</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="font-medium text-purple-800">IJT</div>
            <div className="text-purple-600">
              {tokenBalances.IJT ? tokenBalances.IJT.balanceFormatted : '0.00'}
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="font-medium text-blue-800">USDC</div>
            <div className="text-blue-600">
              {tokenBalances.USDC ? tokenBalances.USDC.balanceFormatted : '0.00'}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="font-medium text-gray-800">BBETH</div>
            <div className="text-gray-600">
              {tokenBalances.BBETH ? tokenBalances.BBETH.balanceFormatted : '0.00'}
            </div>
          </div>
        </div>
      </div>

      {/* Swap Configuration */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-3">⚙️ Cross-Chain Swap Configuration</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (IJT)</label>
            <input
              type="number"
              value={swapParams.amount}
              onChange={(e) => setSwapParams(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="10"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source Chain</label>
              <select
                value={swapParams.srcChain}
                onChange={(e) => setSwapParams(prev => ({ ...prev, srcChain: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value={27257}>BuildBear Base Fork</option>
                <option value={8453}>Base</option>
                <option value={42161}>Arbitrum</option>
                <option value={1}>Ethereum</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination Chain</label>
              <select
                value={swapParams.dstChain}
                onChange={(e) => setSwapParams(prev => ({ ...prev, dstChain: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value={128123}>Etherlink Testnet</option>
                <option value={8453}>Base</option>
                <option value={42161}>Arbitrum</option>
                <option value={137}>Polygon</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6">
        <div className="flex space-x-3">
          <button
            onClick={handleCreateCrossChainOrder}
            disabled={isLoading || !tokenBalances.IJT?.sufficient}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '⏳ Creating...' : '🌉 Create Cross-Chain Order'}
          </button>
          
          <button
            onClick={loadTokenBalances}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            🔄 Refresh Balances
          </button>
          
          {currentOrder && currentOrder.status === 'secrets_required' && (
            <button
              onClick={handleSubmitSecrets}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? '⏳ Submitting...' : '🔐 Submit Secrets'}
            </button>
          )}
        </div>
      </div>

      {/* Order Status */}
      {orderStatus && (
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">{orderStatus}</p>
          </div>
        </div>
      )}

      {/* Current Order Details */}
      {currentOrder && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">📋 Current Order Details</h4>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Order ID:</span>
                <div className="text-gray-600 font-mono text-xs">{currentOrder.orderId}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <div className={`inline-block px-2 py-1 rounded text-xs font-medium ml-2 ${
                  currentOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                  currentOrder.status === 'failed' ? 'bg-red-100 text-red-800' :
                  currentOrder.status === 'executing' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {currentOrder.status.toUpperCase()}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Source:</span>
                <div className="text-gray-600">
                  {formatEther(BigInt(currentOrder.srcAmount))} IJT on {getNetworkName(currentOrder.srcChainId)}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Destination:</span>
                <div className="text-gray-600">
                  {(parseFloat(currentOrder.dstAmount) / 1e6).toFixed(2)} USDC on {getNetworkName(currentOrder.dstChainId)}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Execution Progress</span>
                <span>{getProgressPercentage().toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>

            {/* Execution Steps */}
            <div>
              <span className="font-medium text-gray-700 text-sm">Execution Steps:</span>
              <div className="mt-2 space-y-2">
                {currentOrder.executionSteps.map((step, index) => (
                  <div key={index} className="flex items-center space-x-3 text-sm">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      step.status === 'completed' ? 'bg-green-100 text-green-800' :
                      step.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {step.status === 'completed' ? '✓' : 
                       step.status === 'in_progress' ? '⏳' : step.step}
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-800">{step.description}</div>
                      <div className="text-gray-500 text-xs">
                        {getNetworkName(step.chainId)}
                        {step.txHash && (
                          <span className="ml-2">
                            • TX: {step.txHash.slice(0, 10)}...{step.txHash.slice(-8)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>🔒 <strong>Self-Custody:</strong> You maintain control of your funds throughout the process</p>
        <p>⛽ <strong>Gasless:</strong> No gas fees required for cross-chain execution</p>
        <p>🛡️ <strong>MEV Protection:</strong> Built-in protection against MEV attacks</p>
        <p>🌉 <strong>Cross-Chain:</strong> Seamless swaps between different blockchain networks</p>
        <p>🔐 <strong>Hashlock Security:</strong> Cryptographic security using secret-based locks</p>
      </div>
    </div>
  );
}