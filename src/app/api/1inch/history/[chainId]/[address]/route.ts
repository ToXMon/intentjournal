/**
 * 1inch Transaction History API Proxy Route
 * Handles transaction history fetching with BuildBear fork support
 */

import { NextRequest, NextResponse } from 'next/server';

const ONEINCH_API_KEY = process.env.ONEINCH_AUTH_KEY;
const BASE_URL = 'https://api.1inch.dev';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string; address: string }> }
) {
  try {
    const { chainId, address } = await params;
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';
    const timeframe = searchParams.get('timeframe') || '7d';
    
    // Validate parameters
    if (!chainId || !address) {
      return NextResponse.json(
        { error: 'Chain ID and address are required' },
        { status: 400 }
      );
    }

    // Validate address format (basic check)
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      );
    }

    // Map BuildBear fork to Base mainnet for 1inch API
    const apiChainId = chainId === '27257' ? '8453' : chainId;
    
    // Build the 1inch Transaction History API URL
    let url = `${BASE_URL}/history/v2.0/${apiChainId}/history/${address}`;
    
    // Add query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit);
    queryParams.append('offset', offset);
    if (timeframe) queryParams.append('timeframe', timeframe);
    
    url += `?${queryParams.toString()}`;
    
    console.log('🔄 Proxying 1inch Transaction History API request:', url);

    // Make the request to 1inch Transaction History API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(ONEINCH_API_KEY && { 'Authorization': `Bearer ${ONEINCH_API_KEY}` }),
      },
    });

    if (!response.ok) {
      console.error('1inch Transaction History API error:', response.status, response.statusText);
      
      // Handle specific error cases
      if (response.status === 404) {
        return NextResponse.json(
          { 
            error: 'No transaction history found',
            address,
            chainId: parseInt(chainId),
            transactions: [],
            totalCount: 0
          },
          { status: 200 } // Return 200 with empty history instead of 404
        );
      }
      
      // If unauthorized, fall back to mock data
      if (response.status === 401) {
        console.log('🔧 API key unauthorized, falling back to mock data');
        const mockTransactions = [
          {
            txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            blockNumber: 12345678,
            timestamp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
            from: address.toLowerCase(),
            to: '0x111111125421ca6dc452d289314280a0f8842a65',
            value: '1000000000000000000',
            gasUsed: '150000',
            gasPrice: '20000000000',
            status: 'success',
            tokenIn: {
              address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              symbol: 'ETH',
              amount: '1000000000000000000'
            },
            tokenOut: {
              address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
              symbol: 'USDC',
              amount: '2500000000'
            },
            protocol: '1inch',
            type: 'swap'
          },
          {
            txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            blockNumber: 12345677,
            timestamp: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
            from: address.toLowerCase(),
            to: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
            value: '0',
            gasUsed: '65000',
            gasPrice: '18000000000',
            status: 'success',
            protocol: 'ERC20',
            type: 'approval'
          }
        ];
        
        return NextResponse.json({
          address: address.toLowerCase(),
          chainId: parseInt(chainId),
          transactions: mockTransactions,
          totalCount: mockTransactions.length,
          hasMore: false,
          lastUpdated: Date.now(),
        }, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Cache-Control': 'public, max-age=120',
            'X-Mock-Data': 'true',
            'X-Fallback-Reason': 'unauthorized',
          },
        });
      }
      
      return NextResponse.json(
        { error: `1inch Transaction History API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Normalize the response format
    const normalizedData = {
      address: address.toLowerCase(),
      chainId: parseInt(chainId),
      transactions: data.items || [],
      totalCount: data.meta?.totalCount || 0,
      hasMore: data.meta?.hasMore || false,
      lastUpdated: Date.now(),
    };
    
    console.log(`✅ Successfully fetched transaction history for ${address} on chain ${chainId}`);
    
    // Return the data with CORS headers
    return NextResponse.json(normalizedData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'public, max-age=120', // Cache for 2 minutes
      },
    });

  } catch (error) {
    console.error('Transaction history proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Internal proxy error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}