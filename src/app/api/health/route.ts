import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        api: 'operational',
        database: 'operational', // localStorage-based, always operational
        external_apis: {
          venice_ai: process.env.NEXT_PUBLIC_VENICE_API_KEY ? 'configured' : 'not_configured',
          oneinch: process.env.NEXT_PUBLIC_ONEINCH_API_KEY ? 'configured' : 'not_configured',
          walletconnect: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ? 'configured' : 'not_configured'
        }
      }
    };

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

export async function HEAD() {
  // Simple HEAD request for basic health check
  return new NextResponse(null, { status: 200 });
}