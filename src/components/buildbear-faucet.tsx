'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { formatEther, formatUnits, parseUnits } from 'viem'
import contractAddresses from '@/contracts/addresses.json'

// ABI for the faucet functions
const BBETH_ABI = [
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
  }
] as const

const MOCK_TOKEN_ABI = [
  {
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
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
  }
] as const

interface TokenBalance {
  symbol: string
  balance: string
  decimals: number
}

export function BuildBearFaucet() {
  const { address, isConnected } = useAccount()
  const { writeContract, isPending } = useWriteContract()
  const [isLoading, setIsLoading] = useState(false)

  // Read token balances
  const { data: bbethBalance } = useReadContract({
    address: contractAddresses.BBeth as `0x${string}`,
    abi: BBETH_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected }
  })

  const { data: usdcBalance } = useReadContract({
    address: contractAddresses.USDC as `0x${string}`,
    abi: MOCK_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected }
  })

  const { data: daiBalance } = useReadContract({
    address: contractAddresses.DAI as `0x${string}`,
    abi: MOCK_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected }
  })

  const { data: ijtBalance } = useReadContract({
    address: contractAddresses.INTENT_TOKEN as `0x${string}`,
    abi: MOCK_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected }
  })

  const handleFaucet = async () => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    setIsLoading(true)
    
    try {
      // Get BBeth (1 ETH worth)
      await writeContract({
        address: contractAddresses.BBeth as `0x${string}`,
        abi: BBETH_ABI,
        functionName: 'faucet',
      })

      // Get Mock USDC (1000 USDC)
      await writeContract({
        address: contractAddresses.USDC as `0x${string}`,
        abi: MOCK_TOKEN_ABI,
        functionName: 'faucet',
        args: [address, parseUnits('1000', 6)],
      })

      // Get Mock DAI (1000 DAI)
      await writeContract({
        address: contractAddresses.DAI as `0x${string}`,
        abi: MOCK_TOKEN_ABI,
        functionName: 'faucet',
        args: [address, parseUnits('1000', 18)],
      })

      // Get IJT (10000 IJT)
      await writeContract({
        address: contractAddresses.INTENT_TOKEN as `0x${string}`,
        abi: MOCK_TOKEN_ABI,
        functionName: 'faucet',
        args: [address, parseUnits('10000', 18)],
      })

      toast.success('🎉 Faucet tokens received! Check your wallet.')
      
    } catch (error: any) {
      console.error('Faucet error:', error)
      
      if (error.message?.includes('Already have enough tokens')) {
        toast.error('You already have enough tokens!')
      } else if (error.message?.includes('User rejected')) {
        toast.error('Transaction cancelled')
      } else {
        toast.error('Faucet failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const tokenBalances: TokenBalance[] = [
    {
      symbol: 'BBETH',
      balance: bbethBalance ? formatEther(bbethBalance) : '0',
      decimals: 18
    },
    {
      symbol: 'USDC',
      balance: usdcBalance ? formatUnits(usdcBalance, 6) : '0',
      decimals: 6
    },
    {
      symbol: 'DAI',
      balance: daiBalance ? formatEther(daiBalance) : '0',
      decimals: 18
    },
    {
      symbol: 'IJT',
      balance: ijtBalance ? formatEther(ijtBalance) : '0',
      decimals: 18
    }
  ]

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🚰 BuildBear Faucet</CardTitle>
          <CardDescription>
            Connect your wallet to get test tokens for the demo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Please connect your wallet to access the faucet
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🚰 BuildBear Faucet</CardTitle>
        <CardDescription>
          Get test tokens for IntentJournal+ demo on BuildBear Base Fork
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Balances */}
        <div>
          <h4 className="font-medium mb-2">Current Balances:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {tokenBalances.map((token) => (
              <div key={token.symbol} className="flex justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="font-medium">{token.symbol}:</span>
                <span>{parseFloat(token.balance).toFixed(token.decimals === 6 ? 2 : 4)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Faucet Button */}
        <Button 
          onClick={handleFaucet}
          disabled={isLoading || isPending}
          className="w-full"
        >
          {isLoading || isPending ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Getting Tokens...
            </div>
          ) : (
            '💰 Get Test Tokens'
          )}
        </Button>

        {/* Faucet Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>You'll receive:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>1 BBETH (BuildBear ETH)</li>
            <li>1,000 Mock USDC</li>
            <li>1,000 Mock DAI</li>
            <li>10,000 IJT (IntentJournal Token)</li>
          </ul>
          <p className="mt-2">
            <strong>Network:</strong> BuildBear Base Fork (Chain ID: {contractAddresses.chainId})
          </p>
        </div>
      </CardContent>
    </Card>
  )
}