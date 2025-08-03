'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, parseUnits, formatEther, formatUnits } from 'viem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowDownUp, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Coins,
  Zap
} from 'lucide-react';
import { CONTRACTS } from '@/services/real-transaction-executor';

// Mock token ABI (matches deployed contract)
const MOCK_TOKEN_ABI = [
  {
    "inputs": [{"name": "to", "type": "address"}, {"name": "amount", "type": "uint256"}],
    "name": "mint",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "faucet",
    "outputs": [],
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
    "inputs": [],
    "name": "name",
    "outputs": [{"name": "", "type": "string"}],
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

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance?: string;
}

const TOKEN_CONTRACTS = {
  DEMO: '0xD31E022A0Aa45A6B74eBb44DDaC909Ec0dfD2765',
  USDC: '0x064Abf44F593C198e34E55e4C129580c425b499F',
  IJT: '0x84B346891b977E30ba4774A911cb342f1FAb1Ce4'
};

const AVAILABLE_TOKENS: Token[] = [
  {
    address: TOKEN_CONTRACTS.DEMO,
    symbol: 'DEMO',
    name: 'Demo Token',
    decimals: 18
  },
  {
    address: TOKEN_CONTRACTS.USDC,
    symbol: 'mUSDC',
    name: 'Mock USDC',
    decimals: 6
  },
  {
    address: TOKEN_CONTRACTS.IJT,
    symbol: 'INT',
    name: 'Intent Token',
    decimals: 18
  }
];

export function BBethSwap() {
  const { address, isConnected } = useAccount();
  const { data: bbethBalance } = useBalance({ address, chainId: 27257 });
  
  const [selectedToken, setSelectedToken] = useState<Token>(AVAILABLE_TOKENS[0]);
  const [bbethAmount, setBbethAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Simulate swap by minting tokens (since this is a demo)
  const executeSwap = async () => {
    if (!address || !bbethAmount || !selectedToken) return;

    try {
      setIsSwapping(true);
      
      // Calculate token amount based on mock exchange rate (1 BBeth = 1000 tokens for demo)
      const bbethValue = parseFloat(bbethAmount);
      const tokenAmount = bbethValue * 1000; // Mock exchange rate
      
      let amountToMint;
      if (selectedToken.decimals === 6) {
        amountToMint = parseUnits(tokenAmount.toString(), 6);
      } else {
        amountToMint = parseEther(tokenAmount.toString());
      }

      // Mint tokens to simulate swap
      writeContract({
        address: selectedToken.address as `0x${string}`,
        abi: MOCK_TOKEN_ABI,
        functionName: 'mint',
        args: [address, amountToMint],
      });

    } catch (err) {
      console.error('Swap failed:', err);
      setIsSwapping(false);
    }
  };

  // Use faucet to get tokens
  const useFaucet = async (token: Token) => {
    if (!address) return;

    try {
      writeContract({
        address: token.address as `0x${string}`,
        abi: MOCK_TOKEN_ABI,
        functionName: 'faucet',
        args: [],
      });
    } catch (err) {
      console.error('Faucet failed:', err);
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      setLastTxHash(hash);
      setIsSwapping(false);
      setBbethAmount('');
    }
  }, [isConfirmed, hash]);

  // Handle errors
  useEffect(() => {
    if (error) {
      setIsSwapping(false);
    }
  }, [error]);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            BBeth Token Swap
          </CardTitle>
          <CardDescription>
            Connect your wallet to swap BBeth for mock tokens
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
          <Coins className="h-5 w-5" />
          BBeth Token Swap
        </CardTitle>
        <CardDescription>
          Swap your BBeth for mock tokens on BuildBear Base Fork
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* BBeth Balance */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Your BBeth Balance</div>
              <div className="text-2xl font-bold">
                {bbethBalance ? formatEther(bbethBalance.value) : '0.0'} BBeth
              </div>
            </div>
            <div className="text-blue-600 dark:text-blue-400">
              <Coins className="h-8 w-8" />
            </div>
          </div>
        </div>

        {/* Swap Interface */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Amount to Swap (BBeth)</label>
            <Input
              type="number"
              value={bbethAmount}
              onChange={(e) => setBbethAmount(e.target.value)}
              placeholder="0.1"
              disabled={isSwapping || isPending}
            />
            <div className="text-xs text-gray-500 mt-1">
              Available: {bbethBalance ? formatEther(bbethBalance.value) : '0.0'} BBeth
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowDownUp className="h-6 w-6 text-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Select Token to Receive</label>
            <div className="grid grid-cols-1 gap-2">
              {AVAILABLE_TOKENS.map((token) => (
                <button
                  key={token.address}
                  onClick={() => setSelectedToken(token)}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    selectedToken.address === token.address
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={isSwapping || isPending}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{token.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{token.symbol}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        useFaucet(token);
                      }}
                      disabled={isPending}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Faucet
                    </Button>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {bbethAmount && selectedToken && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm">
                <div className="flex justify-between">
                  <span>You will receive:</span>
                  <span className="font-medium">
                    {(parseFloat(bbethAmount) * 1000).toLocaleString()} {selectedToken.symbol}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Exchange Rate: 1 BBeth = 1,000 {selectedToken.symbol} (Demo Rate)
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={executeSwap}
            disabled={!bbethAmount || !selectedToken || isSwapping || isPending || parseFloat(bbethAmount) <= 0}
            className="w-full"
          >
            {isSwapping || isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                {isPending ? 'Confirming...' : 'Swapping...'}
              </>
            ) : (
              <>
                <ArrowDownUp className="h-4 w-4 mr-2" />
                Swap BBeth for {selectedToken?.symbol}
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

        {isConfirmed && lastTxHash && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              <div className="flex items-center justify-between">
                <span>Swap completed successfully!</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(
                    `https://smooth-spiderman-faa2b8b9.ethernal.buildbear.io/tx/${lastTxHash}`,
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

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error.message || 'Transaction failed'}
            </AlertDescription>
          </Alert>
        )}

        {/* Network Info */}
        <div className="text-xs text-gray-500 text-center">
          <div>Connected to BuildBear Base Fork (Chain ID: 27257)</div>
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
