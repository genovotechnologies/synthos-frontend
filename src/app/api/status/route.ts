import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://synthos-api-gateway-1072864054735.us-central1.run.app';

export async function GET() {
  try {
    const headers: Record<string, string> = {};

    const staticToken = process.env.GCP_IDENTITY_TOKEN;
    if (staticToken) headers['Authorization'] = `Bearer ${staticToken}`;

    const vercelOidcToken = process.env.VERCEL_OIDC_TOKEN;
    if (vercelOidcToken) {
      headers['Authorization'] = `Bearer ${vercelOidcToken}`;
    }

    const response = await fetch(`${BACKEND_URL}/health`, {
      headers,
      next: { revalidate: 30 },
    });

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
