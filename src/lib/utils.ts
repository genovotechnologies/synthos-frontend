import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// A03:2021 - Injection Prevention: Sanitize user input to prevent XSS
export function sanitizeInput(input: string): string {
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (div) {
    div.textContent = input;
    return div.innerHTML;
  }
  // Server-side fallback
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// A03:2021 - Validate URL to prevent open redirect attacks
export function isValidRedirectUrl(url: string): boolean {
  // Only allow relative URLs or URLs to the same origin
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true;
  }
  try {
    const parsedUrl = new URL(url, window.location.origin);
    return parsedUrl.origin === window.location.origin;
  } catch {
    return false;
  }
}

// A02:2021 - Cryptographic Failures: Secure token validation
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // Treat invalid tokens as expired
  }
}
