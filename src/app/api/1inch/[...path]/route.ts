/**
 * 1inch API Proxy Route
 * Handles CORS issues by proxying requests server-side
 * Supports all 1inch protocols: Classic Swap, Limit Orders, Fusion, Fusion+
 */

import { NextRequest, NextResponse } from 'next/server';

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, Accept',
  'Access-Control-Max-Age': '86400',
};



// Try multiple API key environment variables
const ONEINCH_API_KEY = process.env.ONEINCH_AUTH_KEY || 
                      process.env.ONEINCH_DEV_PORTAL_KEY || 
                      process.env.NEXT_PUBLIC_ONEINCH_API_KEY;

const BASE_URL = 'https://api.1inch.dev';

// BuildBear fork configuration
const BUILDBEAR_RPC_URL = 'https://rpc.buildbear.io/smooth-spiderman-faa2b8b9';
const BUILDBEAR_CHAIN_ID = 27257;

// Always try real API first, fallback to mock only on failure
const USE_REAL_TIME_DATA = true; // Always attempt real API calls
const FORCE_MOCK_DATA = process.env.FORCE_MOCK_DATA === 'true';

console.log('🔑 1inch API Key available:', !!ONEINCH_API_KEY);
console.log('🌐 Real-time data enabled:', USE_REAL_TIME_DATA);

// 1inch API endpoint mappings for different protocols
const PROTOCOL_ENDPOINTS = {
  // Classic Swap (Aggregation Protocol v6)
  swap: 'swap/v6.0',
  quote: 'swap/v6.0',
  tokens: 'swap/v6.0',
  healthcheck: 'swap/v6.0',
  
  // Price API
  price: 'price/v1.1',
  
  // Balance API  
  balance: 'balance/v1.2',
  
  // Limit Order Protocol
  'limit-order': 'orderbook/v4.0',
  orderbook: 'orderbook/v4.0',
  
  // Fusion Protocol
  fusion: 'fusion/v1.0',
  
  // Fusion+ Cross-chain Protocol
  'fusion-plus': 'fusion-plus/v1.0',
  'cross-chain': 'fusion-plus/v1.0',
  
  // Transaction History API
  history: 'history/v2.0',
  
  // Transaction Traces API
  traces: 'traces/v1.0',
};

/**
 * Enhance API path to ensure proper routing to 1inch protocols
 */
function enhanceApiPath(apiPath: string): string {
  // If path already includes version, return as-is
  if (apiPath.includes('/v') && apiPath.match(/\/v\d+\.\d+/)) {
    return apiPath;
  }
  
  const pathSegments = apiPath.split('/');
  
  // Handle different API patterns
  if (pathSegments.includes('prices')) {
    // Convert /prices/chainId to /price/v1.1/chainId
    const chainIndex = pathSegments.indexOf('prices') + 1;
    if (chainIndex < pathSegments.length) {
      const chainId = pathSegments[chainIndex];
      return `price/v1.1/${chainId}`;
    }
  }
  
  if (pathSegments.includes('balance')) {
    // Convert /balance/chainId/address to /balance/v1.2/chainId/balances/address
    const chainIndex = pathSegments.indexOf('balance') + 1;
    if (chainIndex + 1 < pathSegments.length) {
      const chainId = pathSegments[chainIndex];
      const address = pathSegments[chainIndex + 1];
      return `balance/v1.2/${chainId}/balances/${address}`;
    }
  }
  
  if (pathSegments.includes('tokens')) {
    // Convert /tokens/chainId to /swap/v6.0/chainId/tokens
    const chainIndex = pathSegments.indexOf('tokens') + 1;
    if (chainIndex < pathSegments.length) {
      const chainId = pathSegments[chainIndex];
      return `swap/v6.0/${chainId}/tokens`;
    }
  }
  
  if (pathSegments.includes('swap')) {
    // Handle swap endpoints - /swap/chainId/quote -> /swap/v6.0/chainId/quote
    const chainIndex = pathSegments.indexOf('swap') + 1;
    if (chainIndex < pathSegments.length) {
      const chainId = pathSegments[chainIndex];
      const remaining = pathSegments.slice(chainIndex + 1).join('/');
      return `swap/v6.0/${chainId}/${remaining}`;
    }
  }
  
  if (pathSegments.includes('history')) {
    // Convert /history/chainId/address to /history/v2.0/chainId/history/address
    const chainIndex = pathSegments.indexOf('history') + 1;
    if (chainIndex + 1 < pathSegments.length) {
      const chainId = pathSegments[chainIndex];
      const address = pathSegments[chainIndex + 1];
      return `history/v2.0/${chainId}/history/${address}`;
    }
  }
  
  // Map protocol endpoints
  if (pathSegments[0] in PROTOCOL_ENDPOINTS) {
    const protocolBase = PROTOCOL_ENDPOINTS[pathSegments[0] as keyof typeof PROTOCOL_ENDPOINTS];
    const remainingPath = pathSegments.slice(1).join('/');
    return remainingPath ? `${protocolBase}/${remainingPath}` : protocolBase;
  }
  
  // Handle specific endpoint patterns
  if (pathSegments[0] === 'swap' || pathSegments[0] === 'quote' || pathSegments[0] === 'tokens') {
    // Classic Swap endpoints - ensure they go to swap API
    const chainId = pathSegments[1];
    const endpoint = pathSegments[2] || pathSegments[0];
    const remainingPath = pathSegments.slice(3).join('/');
    
    if (chainId && /^\d+$/.test(chainId)) {
      const basePath = `swap/v6.0/${chainId}/${endpoint}`;
      return remainingPath ? `${basePath}/${remainingPath}` : basePath;
    }
  }
  
  if (pathSegments[0] === 'balance') {
    // Balance API endpoints
    const chainId = pathSegments[1];
    const endpoint = pathSegments[2] || 'balances';
    const address = pathSegments[3];
    
    if (chainId && /^\d+$/.test(chainId)) {
      const basePath = `balance/v1.2/${chainId}/${endpoint}`;
      return address ? `${basePath}/${address}` : basePath;
    }
  }
  
  if (pathSegments[0] === 'price') {
    // Price API endpoints
    const chainId = pathSegments[1];
    const remainingPath = pathSegments.slice(2).join('/');
    
    if (chainId && /^\d+$/.test(chainId)) {
      const basePath = `price/v1.1/${chainId}`;
      return remainingPath ? `${basePath}/${remainingPath}` : basePath;
    }
  }
  
  // Default: return original path
  return apiPath;
}

/**
 * Get protocol-specific headers
 */
function getProtocolHeaders(apiPath: string, method: string): Record<string, string> {
  const baseHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(ONEINCH_API_KEY && { 'Authorization': `Bearer ${ONEINCH_API_KEY}` }),
  };
  
  // Add protocol-specific headers
  if (apiPath.includes('limit-order') || apiPath.includes('orderbook')) {
    return {
      ...baseHeaders,
      'X-API-Version': '4.0',
    };
  }
  
  if (apiPath.includes('fusion')) {
    return {
      ...baseHeaders,
      'X-API-Version': '1.0',
    };
  }
  
  if (apiPath.includes('swap')) {
    return {
      ...baseHeaders,
      'X-API-Version': '6.0',
    };
  }
  
  return baseHeaders;
}

/**
 * Generate mock responses for development and testing
 */
function generateMockResponse(apiPath: string, method: string, body?: string): any {
  console.log(`🔧 Generating mock response for: ${method} ${apiPath}`);
  
  // Health check responses
  if (apiPath.includes('healthcheck')) {
    return { status: 'OK', timestamp: Date.now() };
  }
  
  // Token list responses
  if (apiPath.includes('tokens')) {
    return {
      tokens: {
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': {
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
          address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          logoURI: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png'
        },
        '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': {
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          logoURI: 'https://tokens.1inch.io/0xa0b86a33e6441e6c7d3e4c5b4b6b8b8b8b8b8b8b.png'
        }
      }
    };
  }
  
  // Quote responses
  if (apiPath.includes('quote')) {
    return {
      srcAmount: '1000000000000000000', // 1 ETH
      dstAmount: '2500000000', // 2500 USDC
      protocols: [
        [
          [
            {
              name: 'UNISWAP_V3',
              part: 100,
              fromTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              toTokenAddress: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
            }
          ]
        ]
      ],
      estimatedGas: '150000'
    };
  }
  
  // Swap responses
  if (apiPath.includes('swap')) {
    return {
      srcAmount: '1000000000000000000',
      dstAmount: '2500000000',
      protocols: [
        [
          [
            {
              name: 'UNISWAP_V3',
              part: 100,
              fromTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              toTokenAddress: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
            }
          ]
        ]
      ],
      estimatedGas: '150000',
      tx: {
        from: '0x0000000000000000000000000000000000000000',
        to: '0x111111125421ca6dc452d289314280a0f8842a65',
        data: '0x12aa3caf000000000000000000000000e37e799d5077682fa0a244d46e5649f71457bd09000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        value: '1000000000000000000',
        gasPrice: '20000000000',
        gas: '150000'
      }
    };
  }
  
  // Balance responses
  if (apiPath.includes('balance')) {
    return {
      address: '0x0000000000000000000000000000000000000000',
      chainId: 8453,
      totalBalanceUSD: '5000.00',
      tokens: {
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': {
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
          balance: '2000000000000000000', // 2 ETH
          balanceUSD: '5000.00',
          price: '2500.00'
        }
      }
    };
  }
  
  // Price responses
  if (apiPath.includes('price')) {
    if (apiPath.includes('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')) {
      return {
        symbol: 'ETH',
        price: '2500.00',
        change24h: '2.5'
      };
    }
    
    // Multiple token prices
    return {
      '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': {
        symbol: 'ETH',
        price: '2500.00',
        change24h: '2.5'
      },
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': {
        symbol: 'USDC',
        price: '1.00',
        change24h: '0.1'
      }
    };
  }
  
  // Limit order responses
  if (apiPath.includes('orderbook')) {
    if (apiPath.includes('active-orders')) {
      return { orders: [] };
    }
    
    return {
      bids: [],
      asks: []
    };
  }
  
  // Fusion responses
  if (apiPath.includes('fusion')) {
    if (method === 'POST') {
      return {
        srcAmount: '1000000000000000000',
        dstAmount: '2500000000',
        orderHash: '0x' + Array(64).fill('a').join(''),
        status: 'pending'
      };
    }
    
    return {
      supported: true,
      chains: [1, 8453, 42161, 137]
    };
  }
  
  // Default response
  return {
    success: true,
    message: 'Mock response',
    timestamp: Date.now(),
    path: apiPath,
    method
  };
}

async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
  method: string
) {
  try {
    // Await params for Next.js 15 compatibility
    const resolvedParams = await params;
    
    // Reconstruct the 1inch API path
    const apiPath = resolvedParams.path.join('/');
    const searchParams = request.nextUrl.searchParams;
    
    // Detect protocol and enhance path if needed
    const enhancedPath = enhanceApiPath(apiPath);
    
    // Build the full URL
    let url = `${BASE_URL}/${enhancedPath}`;
    if (searchParams.toString()) {
      url += `?${searchParams.toString()}`;
    }

    console.log(`🔄 Proxying 1inch API ${method} request:`, url);
    console.log(`📍 Original path: ${apiPath} → Enhanced path: ${enhancedPath}`);

    // Get request body for POST/PUT requests
    let body = undefined;
    if (method === 'POST' || method === 'PUT') {
      try {
        body = await request.text();
        console.log('📝 Request body:', body);
      } catch (err) {
        console.warn('Could not read request body:', err);
      }
    }

    // Check if we should force mock data (for testing)
    if (FORCE_MOCK_DATA) {
      console.log('🔧 Using mock data (forced by FORCE_MOCK_DATA env var)');
      const mockData = generateMockResponse(enhancedPath, method, body);
      
      return NextResponse.json(mockData, {
        headers: {
          ...corsHeaders,
          'Cache-Control': method === 'GET' ? 'public, max-age=30' : 'no-cache',
          'X-Mock-Data': 'true',
          'X-Mock-Reason': 'forced',
        },
      });
    }

    // If no API key, fall back to mock data
    if (!USE_REAL_TIME_DATA) {
      console.log('🔧 Using mock data (no API key available)');
      const mockData = generateMockResponse(enhancedPath, method, body);
      
      return NextResponse.json(mockData, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400',
          'Cache-Control': method === 'GET' ? 'public, max-age=30' : 'no-cache',
          'X-Mock-Data': 'true',
          'X-Mock-Reason': 'no-api-key',
        },
      });
    }

    // Get protocol-specific headers
    const headers = getProtocolHeaders(enhancedPath, method);
    
    // Make the request to 1inch API
    const response = await fetch(url, {
      method,
      headers,
      ...(body && { body }),
    });

    if (!response.ok) {
      console.error('1inch API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      
      // If unauthorized and we have a fallback, use mock data
      if (response.status === 401) {
        console.log('🔧 API key unauthorized, falling back to mock data');
        const mockData = generateMockResponse(enhancedPath, method, body);
        
        return NextResponse.json(mockData, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
            'Access-Control-Max-Age': '86400',
            'Cache-Control': method === 'GET' ? 'public, max-age=30' : 'no-cache',
            'X-Mock-Data': 'true',
            'X-Fallback-Reason': 'unauthorized',
          },
        });
      }
      
      return NextResponse.json(
        { 
          error: `1inch API error: ${response.statusText}`,
          details: errorText,
          status: response.status
        },
        { 
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          },
        }
      );
    }

    const data = await response.json();
    
    console.log('✅ Successfully fetched real-time data from 1inch API');
    
    // Return the data with enhanced CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
        'Cache-Control': method === 'GET' ? 'public, max-age=30' : 'no-cache',
        'X-Real-Time-Data': 'true',
        'X-Data-Source': '1inch-api',
      },
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Internal proxy error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        },
      }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, { params }, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, { params }, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, { params }, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, { params }, 'DELETE');
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}