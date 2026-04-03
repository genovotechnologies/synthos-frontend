import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://synthos-api-gateway-1072864054735.us-central1.run.app';

const GCP_PROJECT_NUMBER = process.env.GCP_PROJECT_NUMBER || '1072864054735';
const WIF_POOL_ID = process.env.WIF_POOL_ID || 'vercel-pool';
const WIF_PROVIDER_ID = process.env.WIF_PROVIDER_ID || 'vercel-provider';
const GCP_SA_EMAIL = process.env.GCP_SA_EMAIL || 'synthos-vercel-proxy@cs-poc-eeli19j6nx85aphvzv6bmeb.iam.gserviceaccount.com';

// Cached GCP identity token (from WIF or SA key exchange)
let cachedGCPToken: { token: string; expiry: number } | null = null;

/**
 * Get a GCP identity token to authenticate with Cloud Run.
 * Priority: WIF (auto-renewing) > SA Key > Static token (fallback)
 */
async function getGCPToken(): Promise<string | null> {
  // Return cached token if still valid (with 2-min buffer)
  if (cachedGCPToken && Date.now() < cachedGCPToken.expiry - 120_000) {
    return cachedGCPToken.token;
  }

  // Method 1 (Primary): Workload Identity Federation via Vercel OIDC
  // This auto-renews - no manual token management needed
  const wifToken = await getTokenViaWIF();
  if (wifToken) {
    cachedGCPToken = { token: wifToken, expiry: Date.now() + 55 * 60 * 1000 };
    return wifToken;
  }

  // Method 2: Service account JSON key
  const saToken = await getTokenViaSAKey();
  if (saToken) {
    cachedGCPToken = { token: saToken, expiry: Date.now() + 55 * 60 * 1000 };
    return saToken;
  }

  // Method 3 (Fallback): Static identity token from env var
  // Only for local dev or emergency - expires in 1 hour
  const staticToken = process.env.GCP_IDENTITY_TOKEN;
  if (staticToken) {
    console.warn('[proxy] Using static GCP_IDENTITY_TOKEN - this expires in 1 hour');
    return staticToken;
  }

  console.error('[proxy] No GCP auth method available. Set BACKEND_URL, enable Vercel OIDC, or provide GCP_SA_KEY_JSON');
  return null;
}

/**
 * Exchange Vercel OIDC token for a GCP identity token via Workload Identity Federation.
 * This is the production-grade approach - tokens are auto-issued per deployment.
 */
async function getTokenViaWIF(): Promise<string | null> {
  // Vercel injects VERCEL_OIDC_TOKEN when OIDC Federation is enabled
  let oidcToken = process.env.VERCEL_OIDC_TOKEN;

  // Some Vercel setups provide a URL endpoint instead
  if (!oidcToken && process.env.VERCEL_OIDC_TOKEN_URL) {
    try {
      const res = await fetch(process.env.VERCEL_OIDC_TOKEN_URL, {
        headers: process.env.VERCEL_OIDC_TOKEN_SECRET
          ? { Authorization: `Bearer ${process.env.VERCEL_OIDC_TOKEN_SECRET}` }
          : {},
      });
      if (res.ok) {
        const data = await res.json();
        oidcToken = data.token || data.access_token;
      } else {
        console.error('[proxy:wif] OIDC endpoint returned', res.status);
      }
    } catch (e) {
      console.error('[proxy:wif] Failed to fetch OIDC token:', e);
    }
  }

  if (!oidcToken) {
    // Not running on Vercel or OIDC not enabled - skip silently
    if (process.env.VERCEL) {
      console.warn('[proxy:wif] Running on Vercel but no OIDC token available. Enable OIDC Federation in Project Settings > General.');
    }
    return null;
  }

  try {
    // Step 1: Exchange Vercel OIDC token for federated access token via STS
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
        subject_token: oidcToken,
      }),
    });

    if (!stsRes.ok) {
      const err = await stsRes.text();
      console.error('[proxy:wif] STS exchange failed:', stsRes.status, err);
      return null;
    }

    const stsData = await stsRes.json();

    // Step 2: Use federated token to generate a Cloud Run identity token
    const idTokenRes = await fetch(
      `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${GCP_SA_EMAIL}:generateIdToken`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stsData.access_token}`,
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
      console.log('[proxy:wif] GCP identity token obtained via WIF');
      return idTokenData.token;
    }

    const err = await idTokenRes.text();
    console.error('[proxy:wif] ID token generation failed:', idTokenRes.status, err);
    return null;
  } catch (e) {
    console.error('[proxy:wif] WIF auth error:', e);
    return null;
  }
}

/**
 * Generate a GCP identity token using a service account JSON key.
 */
async function getTokenViaSAKey(): Promise<string | null> {
  const saKey = process.env.GCP_SA_KEY_JSON;
  if (!saKey) return null;

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
      console.log('[proxy:sa] GCP identity token obtained via SA key');
      return tokenData.id_token;
    }

    console.error('[proxy:sa] Token exchange failed:', tokenRes.status);
    return null;
  } catch (e) {
    console.error('[proxy:sa] SA key auth error:', e);
    return null;
  }
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
  const gcpToken = await getGCPToken();
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
