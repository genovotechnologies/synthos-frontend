import Cookies from 'js-cookie';

/**
 * Admin "view as user" support tool. The admin's own tokens are parked in
 * sessionStorage while the short-lived impersonation token occupies the
 * access_token cookie; exiting restores the admin session exactly.
 *
 * While impersonating, billing and destructive writes are blocked client-side
 * (see guardWriteWhileImpersonating, enforced in the axios request interceptor).
 */

const STORAGE_KEY = 'synthos_impersonation';

const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  expires: 7,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
};

export interface ImpersonationState {
  user_id: string;
  user_label: string;
  impersonator_id: string;
  expires_at: string;
  admin_access_token: string;
  admin_refresh_token?: string;
}

export function getImpersonation(): ImpersonationState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as ImpersonationState;
    if (state.expires_at && new Date(state.expires_at).getTime() < Date.now()) {
      // Token expired — restore the admin session rather than stranding the user.
      endImpersonation();
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

export function isImpersonating(): boolean {
  return getImpersonation() !== null;
}

export function startImpersonation(params: {
  token: string;
  expires_at: string;
  impersonator_id: string;
  user_id: string;
  user_label: string;
}): void {
  const adminAccess = Cookies.get('access_token');
  if (!adminAccess) throw new Error('No admin session to return to');
  const state: ImpersonationState = {
    user_id: params.user_id,
    user_label: params.user_label,
    impersonator_id: params.impersonator_id,
    expires_at: params.expires_at,
    admin_access_token: adminAccess,
    admin_refresh_token: Cookies.get('refresh_token'),
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  Cookies.set('access_token', params.token, COOKIE_OPTIONS);
  // The impersonation token must never be silently renewed into a full session.
  Cookies.remove('refresh_token', { path: '/' });
}

export function endImpersonation(): void {
  const raw = typeof window !== 'undefined' ? sessionStorage.getItem(STORAGE_KEY) : null;
  if (!raw) return;
  try {
    const state = JSON.parse(raw) as ImpersonationState;
    Cookies.set('access_token', state.admin_access_token, COOKIE_OPTIONS);
    if (state.admin_refresh_token) {
      Cookies.set('refresh_token', state.admin_refresh_token, { ...COOKIE_OPTIONS, expires: 30 });
    }
  } finally {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

// Billing + destructive surfaces that must stay untouchable while viewing as a
// user. Matched against the apiClient-relative URL (no /api/v1 prefix).
const BLOCKED_PATTERNS: { pattern: RegExp; methods?: string[] }[] = [
  { pattern: /^\/credits\/(purchase|redeem)/ },
  { pattern: /^\/auth\/(change-password|2fa)/ },
  { pattern: /^\/api-keys/ },
  { pattern: /^\/webhooks/ },
  { pattern: /^\/warranties\/.+\/(request|claim)/ },
  { pattern: /^\/datasets/, methods: ['delete'] },
  { pattern: /^\/dataset-groups/, methods: ['delete'] },
  { pattern: /^\/validations/, methods: ['delete'] },
];

/**
 * Returns a human-readable refusal when the request must be blocked during
 * impersonation, or null to allow it.
 */
export function guardWriteWhileImpersonating(method?: string, url?: string): string | null {
  const m = (method || 'get').toLowerCase();
  if (m === 'get' || m === 'head' || m === 'options') return null;
  if (!isImpersonating()) return null;
  const path = (url || '').replace(/^https?:\/\/[^/]+/, '').replace(/^\/api\/v1/, '');
  for (const rule of BLOCKED_PATTERNS) {
    if (rule.methods && !rule.methods.includes(m)) continue;
    if (rule.pattern.test(path)) {
      return 'This action is disabled while viewing as a user. Exit impersonation to make changes on your own account.';
    }
  }
  return null;
}
