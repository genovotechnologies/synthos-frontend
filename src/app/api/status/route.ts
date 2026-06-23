import { NextResponse } from 'next/server';

// The backend health endpoint is public (AWS ALB). No cloud-provider auth needed.
const BACKEND_URL = (process.env.BACKEND_URL || 'https://api.synthos.dev').replace(/\/+$/, '');

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, { cache: 'no-store' });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        status: data.status || 'healthy',
        services: {
          api_gateway: { status: 'healthy', name: 'API Gateway' },
          validation: { status: data.services?.validation || 'unknown', name: 'Validation Engine' },
          collapse: { status: data.services?.collapse || 'unknown', name: 'Collapse Detection' },
          database: { status: data.database || 'unknown', name: 'Database' },
        },
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      status: 'degraded',
      services: {
        api_gateway: { status: 'degraded', name: 'API Gateway' },
        validation: { status: 'unknown', name: 'Validation Engine' },
        collapse: { status: 'unknown', name: 'Collapse Detection' },
        database: { status: 'unknown', name: 'Database' },
      },
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      status: 'outage',
      services: {
        api_gateway: { status: 'down', name: 'API Gateway' },
        validation: { status: 'unknown', name: 'Validation Engine' },
        collapse: { status: 'unknown', name: 'Collapse Detection' },
        database: { status: 'unknown', name: 'Database' },
      },
      timestamp: new Date().toISOString(),
    });
  }
}
