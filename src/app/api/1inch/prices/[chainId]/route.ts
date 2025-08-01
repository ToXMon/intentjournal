/**
 * 1inch Token Prices API Proxy Route
 * Handles real-time token price fetching with BuildBear fork support
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
    
    // Get token addresses from query params
    const tokens = searchParams.get('tokens');
    const currency = searchParams.get('currency') || 'USD';
    
    // Validate parameters
    if (!chainId) {
      return NextResponse.json(
        { error: 'Chain ID is required' },
        { status: 400 }
      );
    }

    // Map BuildBear fork to Base mainnet for 1inch API
    const apiChainId = chainId === '27257' ? '8453' : chainId;
    
    // Build the 1inch Token Prices API URL
    let url = `${BASE_URL}/price/v1.1/${apiChainId}`;
    
    // Add query parameters
    const queryParams = new URLSearchParams();
    if (tokens) queryParams.append('tokens', tokens);
    if (currency) queryParams.append('currency', currency);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    console.log('🔄 Proxying 1inch Token Prices API request:', url);

    // Make the request to 1inch Token Prices API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(ONEINCH_API_KEY && { 'Authorization': `Bearer ${ONEINCH_API_KEY}` }),
      },
    });

    if (!response.ok) {
      console.error('1inch Token Prices API error:', response.status, response.statusText);
      
      // Handle specific error cases
      if (response.status === 404) {
        return NextResponse.json(
          { 
            error: 'Token prices not found',
            chainId: parseInt(chainId),
            prices: {}
          },
          { status: 200 } // Return 200 with empty prices instead of 404
        );
      }
      
      // If unauthorized, fall back to mock data
      if (response.status === 401) {
        console.log('🔧 API key unauthorized, falling back to mock data');
        const mockPrices = {
          // Major tokens
          '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': {
            symbol: 'ETH',
            price: '2500.00',
            priceUSD: '2500.00',
            change24h: '2.5',
            volume24h: '1000000000',
            marketCap: '300000000000'
          },
          '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': {
            symbol: 'USDC',
            price: '1.00',
            priceUSD: '1.00',
            change24h: '0.1',
            volume24h: '500000000',
            marketCap: '35000000000'
          },
          '0x4200000000000000000000000000000000000006': {
            symbol: 'WETH',
            price: '2498.50',
            priceUSD: '2498.50',
            change24h: '2.3',
            volume24h: '800000000',
            marketCap: '300000000000'
          },
          '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': {
            symbol: 'DAI',
            price: '0.999',
            priceUSD: '0.999',
            change24h: '-0.05',
            volume24h: '200000000',
            marketCap: '5000000000'
          },
          '0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22': {
            symbol: 'cbETH',
            price: '2650.00',
            priceUSD: '2650.00',
            change24h: '3.2',
            volume24h: '150000000',
            marketCap: '12000000000'
          },
          // Memecoins
          '0x532f27101965dd16442e59d40670faf5ebb142e4': {
            symbol: 'BRETT',
            price: '0.085',
            priceUSD: '0.085',
            change24h: '15.7',
            volume24h: '25000000',
            marketCap: '850000000'
          },
          '0x4ed4e862860bed51a9570b96d89af5e1b0efefed': {
            symbol: 'DEGEN',
            price: '0.012',
            priceUSD: '0.012',
            change24h: '-8.3',
            volume24h: '18000000',
            marketCap: '480000000'
          },
          '0x0578d8a44db98b23bf096a382e016e29a5ce0ffe': {
            symbol: 'HIGHER',
            price: '0.034',
            priceUSD: '0.034',
            change24h: '22.1',
            volume24h: '12000000',
            marketCap: '340000000'
          },
          '0x6921b130d297cc43754afba22e5eac0fbf8db75b': {
            symbol: 'DOGINME',
            price: '0.0045',
            priceUSD: '0.0045',
            change24h: '-12.8',
            volume24h: '8000000',
            marketCap: '45000000'
          },
          // DeFi tokens
          '0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452': {
            symbol: 'wstETH',
            price: '2890.00',
            priceUSD: '2890.00',
            change24h: '4.1',
            volume24h: '120000000',
            marketCap: '28000000000'
          },
          '0x940181a94a35a4569e4529a3cdfb74e38fd98631': {
            symbol: 'AERO',
            price: '1.25',
            priceUSD: '1.25',
            change24h: '7.8',
            volume24h: '45000000',
            marketCap: '1250000000'
          },
          '0x78a087d713be963bf307b18f2ff8122ef9a63ae9': {
            symbol: 'BSWAP',
            price: '0.18',
            priceUSD: '0.18',
            change24h: '-3.2',
            volume24h: '5000000',
            marketCap: '18000000'
          },
          // ReFi tokens
          '0x2416092f143378750bb29b79ed961ab195cceea5': {
            symbol: 'ezETH',
            price: '2520.00',
            priceUSD: '2520.00',
            change24h: '2.8',
            volume24h: '80000000',
            marketCap: '15000000000'
          },
          '0x04c0599ae5a44757c0af6f9ec3b93da8976c150a': {
            symbol: 'weETH',
            price: '2610.00',
            priceUSD: '2610.00',
            change24h: '3.5',
            volume24h: '95000000',
            marketCap: '18000000000'
          },
          // Gaming tokens
          '0x1c7999deb4fcf5ac8a6a92aa669c4d8d96ce1b5f': {
            symbol: 'PRIME',
            price: '8.45',
            priceUSD: '8.45',
            change24h: '12.3',
            volume24h: '35000000',
            marketCap: '845000000'
          }
        };
        
        return NextResponse.json({
          chainId: parseInt(chainId),
          currency,
          prices: mockPrices,
          lastUpdated: Date.now(),
        }, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Cache-Control': 'public, max-age=60',
            'X-Mock-Data': 'true',
            'X-Fallback-Reason': 'unauthorized',
          },
        });
      }
      
      return NextResponse.json(
        { error: `1inch Token Prices API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Normalize the response format
    const normalizedData = {
      chainId: parseInt(chainId),
      currency,
      prices: data || {},
      lastUpdated: Date.now(),
    };
    
    console.log(`✅ Successfully fetched token prices for chain ${chainId}`);
    
    // Return the data with CORS headers
    return NextResponse.json(normalizedData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
      },
    });

  } catch (error) {
    console.error('Token prices proxy error:', error);
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