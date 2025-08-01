/**
 * Token Swap Interface Component
 * Complete trading interface using 1inch Swap API
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowUpDown, 
  RefreshCw, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  Zap,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useParaAccount } from '@/hooks/useParaAccount';
import { useAppStore } from '@/lib/store';
import {
  getSwapQuote,
  getSwapTransaction,
  formatTokenAmount,
  parseTokenAmount,
  calculatePriceImpact,
  getCommonTokens,
  getTokenInfo,
  isNativeETH,
  type SwapQuote,
  type SwapTransaction
} from '@/utils/oneinch/swap';
import { useWalletBalance, useTokenBalance } from '@/hooks/useWalletBalance';

interface TokenSelectProps {
  selectedToken: string;
  onTokenSelect: (address: string) => void;
  label: string;
  balance?: string;
  amount?: string;
  onAmountChange?: (amount: string) => void;
  readOnly?: boolean;
}

function TokenSelect({ 
  selectedToken, 
  onTokenSelect, 
  label, 
  balance, 
  amount, 
  onAmountChange, 
  readOnly = false 
}: TokenSelectProps) {
  const chainId = useChainId();
  const commonTokens = getCommonTokens(chainId || 8453);
  const tokenInfo = getTokenInfo(selectedToken);

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        {balance && (
          <span className="text-xs text-gray-400">
            Balance: {parseFloat(balance).toFixed(6)} {tokenInfo.symbol}
          </span>
        )}
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Token Logo and Info */}
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {tokenInfo.logoURI ? (
            <img 
              src={tokenInfo.logoURI} 
              alt={tokenInfo.symbol}
              className="w-8 h-8 rounded-full"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium">{tokenInfo.symbol.charAt(0)}</span>
            </div>
          )}
          
          <div className="min-w-0">
            <div className="font-medium">{tokenInfo.symbol}</div>
            <div className="text-xs text-gray-500 truncate">{tokenInfo.name}</div>
          </div>
        </div>
        
        {/* Amount Input */}
        <div className="flex-1 max-w-xs">
          <Input
            type="number"
            placeholder="0.0"
            value={amount || ''}
            onChange={(e) => onAmountChange?.(e.target.value)}
            readOnly={readOnly}
            className="text-right text-lg font-medium"
            step="any"
          />
        </div>
      </div>
      
      {/* Token Selection */}
      <div className="flex flex-wrap gap-2 mt-3">
        {Object.entries(commonTokens).map(([symbol, address]) => (
          <Button
            key={address}
            variant={selectedToken.toLowerCase() === address.toLowerCase() ? "default" : "outline"}
            size="sm"
            onClick={() => onTokenSelect(address)}
            className="text-xs"
          >
            {symbol}
          </Button>
        ))}
      </div>
    </Card>
  );
}

interface SwapDetailsProps {
  quote: SwapQuote | null;
  loading: boolean;
  priceImpact: number;
  slippage: number;
}

function SwapDetails({ quote, loading, priceImpact, slippage }: SwapDetailsProps) {
  if (loading) {
    return (
      <Card className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </Card>
    );
  }
  
  if (!quote) {
    return (
      <Card className="p-4">
        <div className="text-center text-gray-500 text-sm">
          Enter an amount to see swap details
        </div>
      </Card>
    );
  }
  
  const outputAmount = formatTokenAmount(
    quote.dstAmount,
    quote.dstToken.decimals,
    quote.dstToken.symbol
  );
  
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">You'll receive</span>
          <span className="font-medium">{outputAmount}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Price Impact</span>
          <span className={`text-sm font-medium ${
            priceImpact > 5 ? 'text-red-600' : priceImpact > 2 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {priceImpact.toFixed(2)}%
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Slippage Tolerance</span>
          <span className="text-sm font-medium">{slippage}%</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Estimated Gas</span>
          <span className="text-sm font-medium">{quote.estimatedGas}</span>
        </div>
        
        {quote.mockData && (
          <div className="flex items-center space-x-2 p-2 bg-amber-50 rounded border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-xs text-amber-700">{quote.warning}</span>
          </div>
        )}
        
        {quote.protocols && quote.protocols.length > 0 && (
          <div className="pt-2 border-t">
            <div className="text-xs text-gray-500 mb-1">Route via:</div>
            <div className="flex flex-wrap gap-1">
              {quote.protocols[0]?.[0]?.map((protocol: any, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {protocol.name} ({protocol.part}%)
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export function TokenSwapInterface() {
  const chainId = useChainId();
  const { address: web3Address } = useAccount();
  const { address: paraAddress } = useParaAccount();
  const { sendTransaction, isPending: isSending, data: txHash } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  
  // Use Para wallet if available, otherwise Web3 wallet
  const address = paraAddress || web3Address;
  
  // State
  const [srcToken, setSrcToken] = useState('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'); // ETH
  const [dstToken, setDstToken] = useState('0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'); // USDC
  const [srcAmount, setSrcAmount] = useState('');
  const [slippage, setSlippage] = useState(1);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [swapData, setSwapData] = useState<SwapTransaction | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isLoadingSwap, setIsLoadingSwap] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceImpact, setPriceImpact] = useState(0);
  
  // Get wallet balances
  const { balance: srcBalance } = useTokenBalance(srcToken);
  const { balance: dstBalance } = useTokenBalance(dstToken);
  
  // Fetch quote when parameters change
  const fetchQuote = useCallback(async () => {
    if (!srcAmount || !srcToken || !dstToken || !chainId || parseFloat(srcAmount) <= 0) {
      setQuote(null);
      setSwapData(null);
      setPriceImpact(0);
      return;
    }
    
    try {
      setIsLoadingQuote(true);
      setError(null);
      
      const srcTokenInfo = getTokenInfo(srcToken);
      const amount = parseTokenAmount(srcAmount, srcTokenInfo.decimals);
      
      const quoteResult = await getSwapQuote({
        srcToken,
        dstToken,
        amount,
        chainId
      });
      
      setQuote(quoteResult);
      
      // Calculate price impact (simplified)
      const impact = calculatePriceImpact(
        amount,
        quoteResult.dstAmount,
        quoteResult.srcToken.decimals,
        quoteResult.dstToken.decimals
      );
      setPriceImpact(impact);
      
    } catch (err) {
      console.error('Quote fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch quote');
      setQuote(null);
    } finally {
      setIsLoadingQuote(false);
    }
  }, [srcToken, dstToken, srcAmount, chainId]);
  
  // Debounced quote fetching
  useEffect(() => {
    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [fetchQuote]);
  
  // Prepare swap transaction
  const prepareSwap = async () => {
    if (!quote || !address || !chainId) return;
    
    try {
      setIsLoadingSwap(true);
      setError(null);
      
      const srcTokenInfo = getTokenInfo(srcToken);
      const amount = parseTokenAmount(srcAmount, srcTokenInfo.decimals);
      
      const swapResult = await getSwapTransaction({
        srcToken,
        dstToken,
        amount,
        fromAddress: address,
        slippage,
        chainId
      });
      
      setSwapData(swapResult);
      
    } catch (err) {
      console.error('Swap preparation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to prepare swap');
    } finally {
      setIsLoadingSwap(false);
    }
  };
  
  // Execute swap
  const executeSwap = async () => {
    if (!swapData || !address) return;
    
    try {
      await sendTransaction({
        to: swapData.tx.to as `0x${string}`,
        data: swapData.tx.data as `0x${string}`,
        value: BigInt(swapData.tx.value),
        gas: BigInt(swapData.tx.gas),
      });
      
    } catch (err) {
      console.error('Swap execution error:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute swap');
    }
  };
  
  // Swap tokens
  const handleSwapTokens = () => {
    const tempToken = srcToken;
    setSrcToken(dstToken);
    setDstToken(tempToken);
    setSrcAmount('');
  };
  
  // Check if swap is ready
  const isSwapReady = quote && srcAmount && parseFloat(srcAmount) > 0 && address;
  const hasInsufficientBalance = srcBalance ? parseFloat(srcAmount) > parseFloat(srcBalance.balance) : false;
  
  return (
    <div className="max-w-md mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <span>1inch Token Swap</span>
          </CardTitle>
          <CardDescription>
            Swap tokens at the best rates across 163+ DEXes
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Source Token */}
          <TokenSelect
            selectedToken={srcToken}
            onTokenSelect={setSrcToken}
            label="From"
            balance={srcBalance?.balance}
            amount={srcAmount}
            onAmountChange={setSrcAmount}
          />
          
          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSwapTokens}
              className="rounded-full p-2"
            >
              <ArrowUpDown className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Destination Token */}
          <TokenSelect
            selectedToken={dstToken}
            onTokenSelect={setDstToken}
            label="To"
            balance={dstBalance?.balance}
            readOnly
          />
          
          {/* Swap Details */}
          <SwapDetails
            quote={quote}
            loading={isLoadingQuote}
            priceImpact={priceImpact}
            slippage={slippage}
          />
          
          {/* Error Display */}
          {error && (
            <Card className="p-3 bg-red-50 border-red-200">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </Card>
          )}
          
          {/* Wallet Connection */}
          {!address && (
            <Card className="p-4 text-center">
              <div className="text-sm text-gray-500 mb-2">
                Connect your wallet to start trading
              </div>
              <Button variant="outline" size="sm">
                Connect Wallet
              </Button>
            </Card>
          )}
          
          {/* Swap Actions */}
          {address && (
            <div className="space-y-2">
              {!swapData ? (
                <Button
                  onClick={prepareSwap}
                  disabled={!isSwapReady || isLoadingSwap || hasInsufficientBalance}
                  className="w-full"
                  size="lg"
                >
                  {isLoadingSwap ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Preparing Swap...
                    </>
                  ) : hasInsufficientBalance ? (
                    'Insufficient Balance'
                  ) : !isSwapReady ? (
                    'Enter Amount'
                  ) : (
                    'Prepare Swap'
                  )}
                </Button>
              ) : (
                <Button
                  onClick={executeSwap}
                  disabled={isSending || isConfirming}
                  className="w-full"
                  size="lg"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending Transaction...
                    </>
                  ) : isConfirming ? (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Execute Swap
                    </>
                  )}
                </Button>
              )}
              
              {swapData && !isSending && (
                <Button
                  variant="outline"
                  onClick={() => setSwapData(null)}
                  className="w-full"
                  size="sm"
                >
                  Get New Quote
                </Button>
              )}
            </div>
          )}
          
          {/* Transaction Status */}
          {txHash && (
            <Card className="p-3 bg-green-50 border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    {isConfirmed ? 'Swap Completed!' : 'Transaction Sent'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`https://basescan.org/tx/${txHash}`, '_blank')}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          )}
          
          {/* Settings */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Slippage: {slippage}%</span>
            </div>
            <div className="flex space-x-1">
              {[0.5, 1, 2, 5].map((value) => (
                <Button
                  key={value}
                  variant={slippage === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSlippage(value)}
                  className="text-xs px-2 py-1"
                >
                  {value}%
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}