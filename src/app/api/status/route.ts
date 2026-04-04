import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://synthos-api-gateway-1072864054735.us-central1.run.app';
const GCP_PROJECT_NUMBER = process.env.GCP_PROJECT_NUMBER || '1072864054735';
const WIF_POOL_ID = process.env.WIF_POOL_ID || 'vercel-pool';
const WIF_PROVIDER_ID = process.env.WIF_PROVIDER_ID || 'vercel-provider';
const GCP_SA_EMAIL = process.env.GCP_SA_EMAIL || 'synthos-vercel-proxy@cs-poc-eeli19j6nx85aphvzv6bmeb.iam.gserviceaccount.com';

async function getGCPToken(): Promise<string | null> {
  // Method 1: Static token
  const staticToken = process.env.GCP_IDENTITY_TOKEN;
  if (staticToken) return staticToken;

  // Method 2: SA key
  const saKey = process.env.GCP_SA_KEY_JSON;
  if (saKey) {
    try {
      const keyData = JSON.parse(Buffer.from(saKey, 'base64').toString('utf-8'));
      const now = Math.floor(Date.now() / 1000);
      const crypto = await import('crypto');
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ iss: keyData.client_email, sub: keyData.client_email, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600, target_audience: BACKEND_URL })).toString('base64url');
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(`${header}.${payload}`);
      const signature = sign.sign(keyData.private_key, 'base64url');
      const jwt = `${header}.${payload}.${signature}`;
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}` });
      if (tokenRes.ok) { const tokenData = await tokenRes.json(); return tokenData.id_token; }
    } catch (e) { console.error('SA key auth failed:', e); }
  }

  // Method 3: WIF
  let vercelOidcToken = process.env.VERCEL_OIDC_TOKEN;
  if (!vercelOidcToken && process.env.VERCEL && process.env.VERCEL_OIDC_TOKEN_URL) {
    try {
      const oidcRes = await fetch(process.env.VERCEL_OIDC_TOKEN_URL, { headers: { 'Authorization': `Bearer ${process.env.VERCEL_OIDC_TOKEN_SECRET || ''}` } });
      if (oidcRes.ok) { const d = await oidcRes.json(); vercelOidcToken = d.token; }
    } catch {}
  }
  if (vercelOidcToken) {
    try {
      const stsAudience = `//iam.googleapis.com/projects/${GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${WIF_POOL_ID}/providers/${WIF_PROVIDER_ID}`;
      const stsRes = await fetch('https://sts.googleapis.com/v1/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange', audience: stsAudience, scope: 'https://www.googleapis.com/auth/cloud-platform', requested_token_type: 'urn:ietf:params:oauth:token-type:access_token', subject_token_type: 'urn:ietf:params:oauth:token-type:jwt', subject_token: vercelOidcToken }) });
      if (stsRes.ok) {
        const stsData = await stsRes.json();
        const idTokenRes = await fetch(`https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${GCP_SA_EMAIL}:generateIdToken`, { method: 'POST', headers: { 'Authorization': `Bearer ${stsData.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ audience: BACKEND_URL, includeEmail: true }) });
        if (idTokenRes.ok) { const d = await idTokenRes.json(); return d.token; }
      }
    } catch (e) { console.error('WIF auth failed:', e); }
  }
  return null;
}

export async function GET() {
  try {
    const gcpToken = await getGCPToken();
    const headers: Record<string, string> = {};
    if (gcpToken) headers['Authorization'] = `Bearer ${gcpToken}`;

    const response = await fetch(`${BACKEND_URL}/health`, { headers, cache: 'no-store' });

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
