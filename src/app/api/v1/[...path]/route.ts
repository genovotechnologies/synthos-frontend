import { NextRequest, NextResponse } from 'next/server';

// The backend is a public API gateway (AWS ALB) at api.synthos.dev. This route is an
// optional same-origin pass-through proxy: it avoids CORS and keeps the backend URL
// out of the client bundle. It forwards the caller's app JWT (Authorization), the
// query string, and the request body unchanged. (No cloud-provider auth needed — the
// previous GCP Workload-Identity/Cloud-Run machinery was removed.)
const BACKEND_URL = (process.env.BACKEND_URL || 'https://api.synthos.dev').replace(/\/+$/, '');

// Cloudflare Turnstile server-side verification for registration. Active only when
// TURNSTILE_SECRET_KEY is set (pair with NEXT_PUBLIC_TURNSTILE_SITE_KEY for the widget).
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || '';
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

// ---------------------------------------------------------------------------
// Per-IP rate limiting for abuse-prone endpoints (bot signups, OTP spam,
// credential stuffing, promo brute-forcing). In-memory sliding window: state is
// per server instance, so treat this as a first line of defense and keep any
// hard guarantees at the WAF/backend layer.
// ---------------------------------------------------------------------------
interface RateRule {
  method: string;
  /** Max requests per window */
  limit: number;
  /** Window length in ms */
  windowMs: number;
}

const RATE_RULES: Record<string, RateRule> = {
  'auth/register': { method: 'POST', limit: 5, windowMs: 15 * 60_000 },
  'auth/login': { method: 'POST', limit: 10, windowMs: 5 * 60_000 },
  'auth/forgot-password': { method: 'POST', limit: 5, windowMs: 15 * 60_000 },
  'auth/reset-password': { method: 'POST', limit: 10, windowMs: 15 * 60_000 },
  'auth/resend-otp': { method: 'POST', limit: 5, windowMs: 10 * 60_000 },
  'auth/verify-email': { method: 'POST', limit: 12, windowMs: 10 * 60_000 },
  'promo/validate': { method: 'GET', limit: 20, windowMs: 5 * 60_000 },
  'credits/redeem': { method: 'POST', limit: 10, windowMs: 15 * 60_000 },
};

const rateBuckets = new Map<string, number[]>();
const MAX_BUCKETS = 10_000;

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

/** Returns seconds to wait, or 0 when the request is allowed. */
function checkRateLimit(path: string, method: string, ip: string): number {
  const rule = RATE_RULES[path];
  if (!rule || rule.method !== method) return 0;

  const now = Date.now();
  const key = `${path}:${ip}`;
  const cutoff = now - rule.windowMs;
  const hits = (rateBuckets.get(key) || []).filter((t) => t > cutoff);

  if (hits.length >= rule.limit) {
    rateBuckets.set(key, hits);
    return Math.max(1, Math.ceil((hits[0] + rule.windowMs - now) / 1000));
  }

  hits.push(now);
  rateBuckets.set(key, hits);

  // Opportunistic pruning so the map can't grow unbounded on a busy instance.
  if (rateBuckets.size > MAX_BUCKETS) {
    for (const [k, v] of rateBuckets) {
      if (v.every((t) => t <= cutoff)) rateBuckets.delete(k);
      if (rateBuckets.size <= MAX_BUCKETS / 2) break;
    }
  }
  return 0;
}

async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  if (!token) return false;
  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: TURNSTILE_SECRET_KEY, response: token, remoteip: ip }),
      cache: 'no-store',
    });
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('[proxy] Turnstile verification failed:', error);
    // Fail closed: registration is the abuse target, so an unverifiable token is rejected.
    return false;
  }
}

async function proxyHandler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const joinedPath = path.join('/');
  const ip = clientIp(req);

  const retryAfter = checkRateLimit(joinedPath, req.method, ip);
  if (retryAfter > 0) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
      { status: 429, headers: { 'Retry-After': String(retryAfter), ...CORS_HEADERS } }
    );
  }

  const url = new URL(`/api/v1/${joinedPath}`, BACKEND_URL);
  req.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));

  const headers: Record<string, string> = {};
  const contentType = req.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;
  const authHeader = req.headers.get('authorization');
  if (authHeader) headers['Authorization'] = authHeader;

  try {
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await req.text();

    // CAPTCHA gate on registration (active only when the secret is configured).
    if (TURNSTILE_SECRET_KEY && joinedPath === 'auth/register' && req.method === 'POST') {
      let token: string | undefined;
      try {
        token = JSON.parse(body || '{}').turnstile_token;
      } catch {
        token = undefined;
      }
      if (!(await verifyTurnstile(token, ip))) {
        return NextResponse.json(
          { error: { code: 'CAPTCHA_FAILED', message: 'Verification challenge failed. Please retry the challenge and submit again.' } },
          { status: 403, headers: CORS_HEADERS }
        );
      }
    }

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
