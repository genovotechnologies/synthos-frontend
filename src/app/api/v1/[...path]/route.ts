import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://synthos-api-gateway-1072864054735.us-central1.run.app';

const GCP_PROJECT_NUMBER = process.env.GCP_PROJECT_NUMBER || '1072864054735';
const WIF_POOL_ID = process.env.WIF_POOL_ID || 'vercel-pool';
const WIF_PROVIDER_ID = process.env.WIF_PROVIDER_ID || 'vercel-provider';
const GCP_SA_EMAIL = process.env.GCP_SA_EMAIL || 'synthos-vercel-proxy@cs-poc-eeli19j6nx85aphvzv6bmeb.iam.gserviceaccount.com';

async function getGCPToken(): Promise<string | null> {
  // Method 1: Pre-set identity token (for local dev / quick testing)
  const staticToken = process.env.GCP_IDENTITY_TOKEN;
  if (staticToken) return staticToken;

  // Method 2: Service account JSON key (if available)
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

  // Method 3: Workload Identity Federation (Vercel OIDC -> GCP)
  // Get OIDC token from env var (set by Vercel when OIDC is enabled)
  // or fetch it from the Vercel OIDC endpoint
  let vercelOidcToken = process.env.VERCEL_OIDC_TOKEN;
  if (!vercelOidcToken && process.env.VERCEL && process.env.VERCEL_OIDC_TOKEN_URL) {
    try {
      const oidcRes = await fetch(process.env.VERCEL_OIDC_TOKEN_URL, {
        headers: { 'Authorization': `Bearer ${process.env.VERCEL_OIDC_TOKEN_SECRET || ''}` },
      });
      if (oidcRes.ok) {
        const oidcData = await oidcRes.json();
        vercelOidcToken = oidcData.token;
      }
    } catch (e) {
      console.error('Failed to fetch Vercel OIDC token:', e);
    }
  }
  if (vercelOidcToken) {
    try {
      // Step 1: Exchange Vercel OIDC token for a federated access token via STS
      const stsAudience = `//iam.googleapis.com/projects/${GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${WIF_POOL_ID}/providers/${WIF_PROVIDER_ID}`;

      const stsRes = await fetch('https://sts.googleapis.com/v1/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
          audience: stsAudience,
          scope: 'https://www.googleapis.com/auth/cloud-platform',
          requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
          subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
          subject_token: vercelOidcToken,
        }),
      });

      if (!stsRes.ok) {
        const err = await stsRes.text();
        console.error('STS token exchange failed:', err);
        return null;
      }

      const stsData = await stsRes.json();
      const federatedAccessToken = stsData.access_token;

      // Step 2: Use federated token to generate an identity token for the target SA
      const idTokenRes = await fetch(
        `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${GCP_SA_EMAIL}:generateIdToken`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${federatedAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audience: BACKEND_URL,
            includeEmail: true,
          }),
        }
      );

      if (idTokenRes.ok) {
        const idTokenData = await idTokenRes.json();
        return idTokenData.token;
      } else {
        const err = await idTokenRes.text();
        console.error('ID token generation failed:', err);
      }
    } catch (e) {
      console.error('WIF auth failed:', e);
    }
  }

  return null;
}

let cachedToken: { token: string; expiry: number } | null = null;

async function getCachedGCPToken(): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiry) return cachedToken.token;
  const token = await getGCPToken();
  if (token) {
    // Cache for 50 minutes (tokens last 60 min)
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
