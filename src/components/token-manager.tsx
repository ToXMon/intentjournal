'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, ExternalLink, RefreshCw, CheckCircle, AlertTriangle, Coins, Eye, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BUILDBEAR_TOKENS, TOKEN_METADATA, getExplorerUrl } from '@/config/tokens';
import { realTransactionExecutor, type TokenBalance, type TransactionResult } from '@/services/real-transaction-executor';

interface TokenManagerProps {
  onBalanceUpdate?: (balance: TokenBalance) => void;
  onTransactionComplete?: (transaction: TransactionResult) => void;
}

// Supported tokens on BuildBear
const AVAILABLE_TOKENS = [
  {
    symbol: 'mUSDC',
    name: 'Mock USDC',
    address: BUILDBEAR_TOKENS.MOCK_USDC,
    decimals: 6,
    color: 'bg-blue-100 text-blue-800'
  },
  {
    symbol: 'INT',
    name: 'Intent Token',
    address: BUILDBEAR_TOKENS.INTENT_TOKEN,
    decimals: 18,
    color: 'bg-green-100 text-green-800'
  },
  {
    symbol: 'DEMO',
    name: 'Demo Token',
    address: BUILDBEAR_TOKENS.DEMO_TOKEN,
    decimals: 18,
    color: 'bg-purple-100 text-purple-800'
  }
];

export function TokenManager({ onBalanceUpdate, onTransactionComplete }: TokenManagerProps) {
  const { address, isConnected } = useAccount();
  
  const [tokenBalances, setTokenBalances] = useState<Record<string, TokenBalance>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isMinting, setIsMinting] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Load token balances
  const loadTokenBalances = async () => {
    if (!address || !isConnected) return;

    setIsLoading(true);
    setError(null);

    try {
      const balances: Record<string, TokenBalance> = {};
      
      for (const token of AVAILABLE_TOKENS) {
        const balance = await realTransactionExecutor.checkTokenBalance(
          address,
          token.address,
          '1' // Check for minimum 1 token
        );
        balances[token.address] = balance;
        onBalanceUpdate?.(balance);
      }

      setTokenBalances(balances);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load token balances');
    } finally {
      setIsLoading(false);
    }
  };

  // Mint tokens
  const mintTokens = async (tokenAddress: string, amount: string) => {
    if (!address) return;

    setIsMinting(prev => ({ ...prev, [tokenAddress]: true }));
    setError(null);

    try {
      const result = await realTransactionExecutor.mintTokens(
        address,
        tokenAddress,
        amount
      );

      if (result.success) {
        onTransactionComplete?.(result);
        // Refresh balances after successful mint
        await loadTokenBalances();
      } else {
        throw new Error(result.error || 'Minting failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsMinting(prev => ({ ...prev, [tokenAddress]: false }));
    }
  };

  // Request tokens from faucet
  const requestFromFaucet = async (tokenAddress: string) => {
    if (!address) return;

    const token = AVAILABLE_TOKENS.find((t: any) => t.address === tokenAddress);
    if (!token) return;

    setIsMinting(prev => ({ ...prev, [tokenAddress]: true }));
    setError(null);

    try {
      const result = await realTransactionExecutor.requestTokensFromFaucet(
        address,
        tokenAddress,
        '1000', // Request 1000 tokens
        token.symbol
      );

      if (result.success && result.txHash) {
        const transactionResult: TransactionResult = {
          success: true,
          txHash: result.txHash,
          explorerUrl: realTransactionExecutor.generateExplorerUrl(result.txHash, 27257),
          timestamp: Date.now(),
          chainId: 27257
        };
        onTransactionComplete?.(transactionResult);
        // Refresh balances after successful faucet request
        await loadTokenBalances();
      } else {
        throw new Error(result.error || 'Faucet request failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsMinting(prev => ({ ...prev, [tokenAddress]: false }));
    }
  };

  // Load balances on mount and address change
  useEffect(() => {
    if (address && isConnected) {
      loadTokenBalances();
    }
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Token Manager
          </CardTitle>
          <CardDescription>
            Connect your wallet to manage tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to view and manage token balances
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
          Token Manager
        </CardTitle>
        <CardDescription>
          Manage your test tokens on BuildBear Base Fork
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Refresh Button */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {lastUpdate && `Last updated: ${lastUpdate.toLocaleTimeString()}`}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadTokenBalances}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Token Balances */}
        <div className="space-y-3">
          {AVAILABLE_TOKENS.map((token: any) => {
            const balance = tokenBalances[token.address];
            const isMintingToken = isMinting[token.address];

            return (
              <div key={token.address} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium">{token.name} ({token.symbol})</div>
                    <div className="text-xs text-gray-500 font-mono">{token.address}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(
                      realTransactionExecutor.generateAddressExplorerUrl(token.address, 27257),
                      '_blank'
                    )}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>

                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ) : balance ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-mono">{balance.balanceFormatted}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Raw: {balance.balance} (decimals: {balance.decimals})
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={balance.sufficient ? 'default' : 'destructive'}>
                          {balance.sufficient ? 'Sufficient' : 'Low Balance'}
                        </Badge>
                        {balance.mintRequired && (
                          <Badge variant="outline">Mint Needed</Badge>
                        )}
                      </div>
                    </div>

                    {/* Mint Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => mintTokens(token.address, '100')}
                        disabled={isMintingToken}
                        variant="outline"
                      >
                        {isMintingToken ? (
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Plus className="h-3 w-3 mr-1" />
                        )}
                        Mint 100
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => mintTokens(token.address, '1000')}
                        disabled={isMintingToken}
                        variant="outline"
                      >
                        {isMintingToken ? (
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Plus className="h-3 w-3 mr-1" />
                        )}
                        Mint 1000
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => requestFromFaucet(token.address)}
                        disabled={isMintingToken}
                        variant="outline"
                      >
                        {isMintingToken ? (
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Coins className="h-3 w-3 mr-1" />
                        )}
                        Faucet
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Balance not loaded
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Network Info */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-sm">
            <div className="font-medium mb-1">BuildBear Base Fork</div>
            <div className="text-gray-600 dark:text-gray-300">
              Chain ID: 27257 | All tokens are for testing purposes only
            </div>
            <Button
              variant="link"
              size="sm"
              onClick={() => window.open('https://smooth-spiderman-faa2b8b9.ethernal.buildbear.io', '_blank')}
              className="h-auto p-0 mt-1"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View on Explorer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
