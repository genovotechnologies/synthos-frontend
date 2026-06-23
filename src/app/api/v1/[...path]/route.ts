import { NextRequest, NextResponse } from 'next/server';

// The backend is a public API gateway (AWS ALB) at api.synthos.dev. This route is an
// optional same-origin pass-through proxy: it avoids CORS and keeps the backend URL
// out of the client bundle. It forwards the caller's app JWT (Authorization), the
// query string, and the request body unchanged. (No cloud-provider auth needed — the
// previous GCP Workload-Identity/Cloud-Run machinery was removed.)
const BACKEND_URL = (process.env.BACKEND_URL || 'https://api.synthos.dev').replace(/\/+$/, '');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

async function proxyHandler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = new URL(`/api/v1/${path.join('/')}`, BACKEND_URL);
  req.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));

  const headers: Record<string, string> = {};
  const contentType = req.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;
  const authHeader = req.headers.get('authorization');
  if (authHeader) headers['Authorization'] = authHeader;

  try {
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await req.text();
    const response = await fetch(url.toString(), {
      method: req.method,
      headers,
      body: body || undefined,
      cache: 'no-store',
    });
    const responseBody = await response.text();
    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        ...CORS_HEADERS,
      },
    });
  } catch (error) {
    console.error('[proxy] Backend unreachable:', error);
    return NextResponse.json(
      { error: { code: 'PROXY_ERROR', message: 'Failed to reach backend service' } },
      { status: 502, headers: CORS_HEADERS }
    );
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) { return proxyHandler(req, ctx); }
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) { return proxyHandler(req, ctx); }
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) { return proxyHandler(req, ctx); }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) { return proxyHandler(req, ctx); }
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) { return proxyHandler(req, ctx); }
export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS_HEADERS }); }
