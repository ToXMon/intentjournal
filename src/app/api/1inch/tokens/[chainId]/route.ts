/**
 * 1inch Token Metadata API Proxy Route
 * Handles token metadata fetching with BuildBear fork support
 */

import { NextRequest, NextResponse } from 'next/server';

const ONEINCH_API_KEY = process.env.ONEINCH_AUTH_KEY;
const BASE_URL = 'https://api.1inch.dev';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  try {
    const { chainId } = await params;
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const addresses = searchParams.get('addresses');
    const limit = searchParams.get('limit') || '100';
    const offset = searchParams.get('offset') || '0';
    
    // Validate parameters
    if (!chainId) {
      return NextResponse.json(
        { error: 'Chain ID is required' },
        { status: 400 }
      );
    }

    // Map BuildBear fork to Base mainnet for 1inch API
    const apiChainId = chainId === '27257' ? '8453' : chainId;
    
    // Build the 1inch Token Metadata API URL
    let url = `${BASE_URL}/token/v1.2/${apiChainId}`;
    
    // Add query parameters
    const queryParams = new URLSearchParams();
    if (addresses) queryParams.append('addresses', addresses);
    queryParams.append('limit', limit);
    queryParams.append('offset', offset);
    
    url += `?${queryParams.toString()}`;
    
    console.log('🔄 Proxying 1inch Token Metadata API request:', url);

    // Make the request to 1inch Token Metadata API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(ONEINCH_API_KEY && { 'Authorization': `Bearer ${ONEINCH_API_KEY}` }),
      },
    });

    if (!response.ok) {
      console.error('1inch Token Metadata API error:', response.status, response.statusText);
      
      // Handle specific error cases
      if (response.status === 404) {
        return NextResponse.json(
          { 
            error: 'Token metadata not found',
            chainId: parseInt(chainId),
            tokens: []
          },
          { status: 200 } // Return 200 with empty tokens instead of 404
        );
      }
      
      // If unauthorized, fall back to mock data
      if (response.status === 401) {
        console.log('🔧 API key unauthorized, falling back to mock data');
        const mockTokens = [
          {
            address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            symbol: 'ETH',
            name: 'Ethereum',
            decimals: 18,
            logoURI: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png',
            tags: ['native'],
            description: 'Ethereum native token',
            website: 'https://ethereum.org',
            isFoT: false,
            synth: false
          },
          {
            address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
            logoURI: 'https://tokens.1inch.io/0xa0b86a33e6441e6c7d3e4c5b4b6b8b8b8b8b8b8b.png',
            tags: ['stablecoin'],
            description: 'USD Coin stablecoin',
            website: 'https://centre.io',
            isFoT: false,
            synth: false
          }
        ];
        
        return NextResponse.json({
          chainId: parseInt(chainId),
          tokens: mockTokens,
          lastUpdated: Date.now(),
        }, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Cache-Control': 'public, max-age=300',
            'X-Mock-Data': 'true',
            'X-Fallback-Reason': 'unauthorized',
          },
        });
      }
      
      return NextResponse.json(
        { error: `1inch Token Metadata API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Normalize the response format
    const normalizedData = {
      chainId: parseInt(chainId),
      tokens: data || [],
      lastUpdated: Date.now(),
    };
    
    console.log(`✅ Successfully fetched token metadata for chain ${chainId}`);
    
    // Return the data with CORS headers
    return NextResponse.json(normalizedData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });

  } catch (error) {
    console.error('Token metadata proxy error:', error);
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