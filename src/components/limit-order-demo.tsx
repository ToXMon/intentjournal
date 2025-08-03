'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, formatUnits, parseEther, formatEther } from 'viem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowRight, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react';
import { CONTRACTS } from '@/services/real-transaction-executor';

// Mock token ABI (simplified ERC20)
const MOCK_TOKEN_ABI = [
  {
    "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "owner", "type": "address"}, {"name": "spender", "type": "address"}],
    "name": "allowance",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Simple Limit Order Contract ABI (for demo)
const LIMIT_ORDER_ABI = [
  {
    "inputs": [
      {"name": "tokenIn", "type": "address"},
      {"name": "tokenOut", "type": "address"},
      {"name": "amountIn", "type": "uint256"},
      {"name": "minAmountOut", "type": "uint256"},
      {"name": "deadline", "type": "uint256"}
    ],
    "name": "createOrder",
    "outputs": [{"name": "orderId", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

interface LimitOrderData {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  minAmountOut: string;
  deadline: number;
  price: string;
}

export function LimitOrderDemo() {
  const { address, isConnected } = useAccount();
  
  // Order state
  const [orderData, setOrderData] = useState<LimitOrderData>({
    tokenIn: CONTRACTS.BUILDBEAR.MOCK_USDC,
    tokenOut: CONTRACTS.BUILDBEAR.INTENT_TOKEN,
    amountIn: '100',
    minAmountOut: '95',
    deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    price: '0.95'
  });

  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Read token balances
  const { data: tokenInBalance } = useReadContract({
    address: orderData.tokenIn as `0x${string}`,
    abi: MOCK_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address }
  });

  const { data: tokenOutBalance } = useReadContract({
    address: orderData.tokenOut as `0x${string}`,
    abi: MOCK_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address }
  });

  // Read token symbols
  const { data: tokenInSymbol } = useReadContract({
    address: orderData.tokenIn as `0x${string}`,
    abi: MOCK_TOKEN_ABI,
    functionName: 'symbol'
  });

  const { data: tokenOutSymbol } = useReadContract({
    address: orderData.tokenOut as `0x${string}`,
    abi: MOCK_TOKEN_ABI,
    functionName: 'symbol'
  });

  // Read token decimals
  const { data: tokenInDecimals } = useReadContract({
    address: orderData.tokenIn as `0x${string}`,
    abi: MOCK_TOKEN_ABI,
    functionName: 'decimals'
  });

  const { data: tokenOutDecimals } = useReadContract({
    address: orderData.tokenOut as `0x${string}`,
    abi: MOCK_TOKEN_ABI,
    functionName: 'decimals'
  });

  // Check allowance
  const { data: allowance } = useReadContract({
    address: orderData.tokenIn as `0x${string}`,
    abi: MOCK_TOKEN_ABI,
    functionName: 'allowance',
    args: [address!, CONTRACTS.BUILDBEAR.IntentManager as `0x${string}`],
    query: { enabled: !!address }
  });

  // Check if approval is needed
  useEffect(() => {
    if (allowance && orderData.amountIn && tokenInDecimals) {
      const amountInWei = tokenInDecimals === 6 
        ? parseUnits(orderData.amountIn, 6)
        : parseEther(orderData.amountIn);
      setNeedsApproval(allowance < amountInWei);
    }
  }, [allowance, orderData.amountIn, tokenInDecimals]);

  // Approve token spending
  const approveToken = async () => {
    if (!address || !tokenInDecimals) return;

    try {
      const amountInWei = tokenInDecimals === 6 
        ? parseUnits(orderData.amountIn, 6)
        : parseEther(orderData.amountIn);

      writeContract({
        address: orderData.tokenIn as `0x${string}`,
        abi: MOCK_TOKEN_ABI,
        functionName: 'approve',
        args: [CONTRACTS.BUILDBEAR.IntentManager as `0x${string}`, amountInWei],
      });
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  // Create limit order (simulated)
  const createLimitOrder = async () => {
    if (!address || !tokenInDecimals || !tokenOutDecimals) return;

    try {
      setIsCreatingOrder(true);
      
      // For demo purposes, we'll create a mock transaction
      // In a real implementation, this would interact with 1inch Limit Order Protocol
      
      const amountInWei = tokenInDecimals === 6 
        ? parseUnits(orderData.amountIn, 6)
        : parseEther(orderData.amountIn);
      
      const minAmountOutWei = tokenOutDecimals === 6 
        ? parseUnits(orderData.minAmountOut, 6)
        : parseEther(orderData.minAmountOut);

      // Simulate order creation by approving tokens (for demo)
      writeContract({
        address: orderData.tokenIn as `0x${string}`,
        abi: MOCK_TOKEN_ABI,
        functionName: 'approve',
        args: [CONTRACTS.BUILDBEAR.IntentManager as `0x${string}`, amountInWei],
      });

      // Set a mock order ID
      setLastOrderId(`ORDER_${Date.now()}`);

    } catch (err) {
      console.error('Order creation failed:', err);
      setIsCreatingOrder(false);
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      setIsCreatingOrder(false);
    }
  }, [isConfirmed]);

  // Calculate output amount based on price
  const calculateOutput = (input: string, price: string) => {
    const inputNum = parseFloat(input) || 0;
    const priceNum = parseFloat(price) || 0;
    return (inputNum * priceNum).toFixed(6);
  };

  // Update min amount out when input or price changes
  useEffect(() => {
    const newMinAmount = calculateOutput(orderData.amountIn, orderData.price);
    setOrderData(prev => ({ ...prev, minAmountOut: newMinAmount }));
  }, [orderData.amountIn, orderData.price]);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            1inch Limit Order Protocol
          </CardTitle>
          <CardDescription>
            Connect your wallet to create limit orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to the BuildBear Base Fork network
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          1inch Limit Order Protocol Demo
        </CardTitle>
        <CardDescription>
          Create limit orders on BuildBear Base Fork using mock tokens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Token Balances */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-300">You have</div>
            <div className="font-bold">
              {tokenInBalance && tokenInDecimals ? 
                formatUnits(tokenInBalance, tokenInDecimals === 6 ? 6 : 18) : '0'
              } {tokenInSymbol || 'TOKEN'}
            </div>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-300">You have</div>
            <div className="font-bold">
              {tokenOutBalance && tokenOutDecimals ? 
                formatUnits(tokenOutBalance, tokenOutDecimals === 6 ? 6 : 18) : '0'
              } {tokenOutSymbol || 'TOKEN'}
            </div>
          </div>
        </div>

        {/* Order Configuration */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sell Amount</label>
              <Input
                type="number"
                value={orderData.amountIn}
                onChange={(e) => setOrderData(prev => ({ ...prev, amountIn: e.target.value }))}
                placeholder="100"
                disabled={isCreatingOrder || isPending}
              />
              <div className="text-xs text-gray-500 mt-1">
                {tokenInSymbol || 'TOKEN'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Limit Price</label>
              <Input
                type="number"
                step="0.000001"
                value={orderData.price}
                onChange={(e) => setOrderData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.95"
                disabled={isCreatingOrder || isPending}
              />
              <div className="text-xs text-gray-500 mt-1">
                {tokenOutSymbol || 'TOKEN'} per {tokenInSymbol || 'TOKEN'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Minimum Receive</label>
            <Input
              type="number"
              value={orderData.minAmountOut}
              onChange={(e) => setOrderData(prev => ({ ...prev, minAmountOut: e.target.value }))}
              placeholder="95"
              disabled={isCreatingOrder || isPending}
            />
            <div className="text-xs text-gray-500 mt-1">
              {tokenOutSymbol || 'TOKEN'}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-sm font-medium mb-2">Order Summary</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Sell:</span>
              <span>{orderData.amountIn} {tokenInSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span>For at least:</span>
              <span>{orderData.minAmountOut} {tokenOutSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span>Price:</span>
              <span>{orderData.price} {tokenOutSymbol}/{tokenInSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span>Expires:</span>
              <span>{new Date(orderData.deadline * 1000).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {needsApproval && (
            <Button
              onClick={approveToken}
              disabled={isPending}
              variant="outline"
              className="w-full"
            >
              {isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve {tokenInSymbol}
                </>
              )}
            </Button>
          )}

          <Button
            onClick={createLimitOrder}
            disabled={needsApproval || isCreatingOrder || isPending || !orderData.amountIn || !orderData.minAmountOut}
            className="w-full"
          >
            {isCreatingOrder || isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creating Order...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Create Limit Order
              </>
            )}
          </Button>
        </div>

        {/* Transaction Status */}
        {isConfirming && (
          <Alert>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Transaction is being confirmed on BuildBear...
            </AlertDescription>
          </Alert>
        )}

        {isConfirmed && hash && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              <div className="flex items-center justify-between">
                <span>Limit order created successfully!</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(
                    `https://smooth-spiderman-faa2b8b9.ethernal.buildbear.io/tx/${hash}`,
                    '_blank'
                  )}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {lastOrderId && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Order ID: {lastOrderId}
            </div>
            <div className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
              This is a demo order. In production, this would be managed by 1inch Limit Order Protocol.
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error.message || 'Transaction failed'}
            </AlertDescription>
          </Alert>
        )}

        {/* Info */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <div>🔗 BuildBear Base Fork (Chain ID: 27257)</div>
          <div>⚡ Powered by 1inch Limit Order Protocol (Demo)</div>
          <Button
            variant="link"
            size="sm"
            onClick={() => window.open('https://smooth-spiderman-faa2b8b9.ethernal.buildbear.io', '_blank')}
            className="h-auto p-0 text-xs"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View on Explorer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
