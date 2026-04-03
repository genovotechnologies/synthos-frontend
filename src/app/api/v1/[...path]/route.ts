import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://synthos-api-gateway-1072864054735.us-central1.run.app';

// GCP Identity Token from env (generated via: gcloud auth print-identity-token --audiences=BACKEND_URL)
// Set as VERCEL env var: GCP_IDENTITY_TOKEN
// This needs to be refreshed periodically (1 hour expiry)
// For production, use Workload Identity Federation

async function getGCPToken(): Promise<string | null> {
  // Method 1: Pre-set identity token (simplest - set via Vercel env var)
  const staticToken = process.env.GCP_IDENTITY_TOKEN;
  if (staticToken) return staticToken;

  // Method 2: Service account JSON (if org policy allows key creation)
  const saKey = process.env.GCP_SA_KEY_JSON;
  if (saKey) {
    try {
      const keyData = JSON.parse(Buffer.from(saKey, 'base64').toString('utf-8'));
      const now = Math.floor(Date.now() / 1000);
      const crypto = await import('crypto');

      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        iss: keyData.client_email,
        sub: keyData.client_email,
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
        target_audience: BACKEND_URL,
      })).toString('base64url');

      const sign = crypto.createSign('RSA-SHA256');
      sign.update(`${header}.${payload}`);
      const signature = sign.sign(keyData.private_key, 'base64url');
      const jwt = `${header}.${payload}.${signature}`;

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
      });

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        return tokenData.id_token;
      }
    } catch (e) {
      console.error('SA key auth failed:', e);
    }
  }

  return null;
}

let cachedToken: { token: string; expiry: number } | null = null;

async function getCachedGCPToken(): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiry) return cachedToken.token;
  const token = await getGCPToken();
  if (token) {
    cachedToken = { token, expiry: Date.now() + 50 * 60 * 1000 };
  }
  return token;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

async function proxyHandler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const apiPath = `/api/v1/${path.join('/')}`;
  const url = new URL(apiPath, BACKEND_URL);

  req.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));

  const headers: Record<string, string> = {};
  const contentType = req.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;

  // Forward app JWT
  const authHeader = req.headers.get('authorization');
  if (authHeader) headers['Authorization'] = authHeader;

  // Add GCP auth
  const gcpToken = await getCachedGCPToken();
  if (gcpToken) {
    if (authHeader) {
      headers['X-Serverless-Authorization'] = `Bearer ${gcpToken}`;
    } else {
      headers['Authorization'] = `Bearer ${gcpToken}`;
    }
  }

  try {
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await req.text();
    const response = await fetch(url.toString(), { method: req.method, headers, body: body || undefined });
    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('content-type') || 'application/json', ...CORS_HEADERS },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: { code: 'PROXY_ERROR', message: 'Failed to reach backend service' } }, { status: 502, headers: CORS_HEADERS });
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) { return proxyHandler(req, ctx); }
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) { return proxyHandler(req, ctx); }
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) { return proxyHandler(req, ctx); }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) { return proxyHandler(req, ctx); }
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) { return proxyHandler(req, ctx); }
export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS_HEADERS }); }
