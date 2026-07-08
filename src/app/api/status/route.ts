import { NextResponse } from 'next/server';

// The backend health endpoint is public (AWS ALB). No cloud-provider auth needed.
const BACKEND_URL = (process.env.BACKEND_URL || 'https://api.synthos.dev').replace(/\/+$/, '');

// Optional backend extras; both fail soft so the status page never breaks.
async function fetchOptionalJson(url: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, { cache: 'no-store' });

    if (response.ok) {
      const data = await response.json();
      // Real 30-day uptime + maintenance flag, when the backend provides them.
      const uptime = await fetchOptionalJson(`${BACKEND_URL}/health/uptime`);
      return NextResponse.json({
        status: data.status || 'healthy',
        maintenance: data.maintenance_mode === true,
        uptime_30d_pct: typeof uptime?.uptime_30d_pct === 'number' ? uptime.uptime_30d_pct : undefined,
        incidents: Array.isArray(uptime?.incidents) ? uptime.incidents : undefined,
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
