"use client";

import * as React from "react";

/**
 * Cloudflare Turnstile CAPTCHA widget.
 *
 * Renders nothing unless NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, so the app
 * works out of the box and CAPTCHA activates purely through configuration.
 * The server side is verified in the API proxy (src/app/api/v1/[...path]/route.ts)
 * when TURNSTILE_SECRET_KEY is set.
 */

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export const TURNSTILE_ENABLED = Boolean(SITE_KEY);

interface TurnstileApi {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      theme?: "light" | "dark" | "auto";
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("Turnstile script loaded but API missing"));
    };
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load Turnstile script"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export interface TurnstileProps {
  /** Receives the token when solved, null when it expires or errors. */
  onToken: (token: string | null) => void;
  className?: string;
}

export function Turnstile({ onToken, className }: TurnstileProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const onTokenRef = React.useRef(onToken);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    onTokenRef.current = onToken;
  });

  React.useEffect(() => {
    if (!TURNSTILE_ENABLED || !containerRef.current) return;
    let widgetId: string | null = null;
    let cancelled = false;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return;
        widgetId = turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme: "dark",
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          // widget already gone
        }
      }
    };
  }, []);

  if (!TURNSTILE_ENABLED) return null;

  if (failed) {
    return (
      <p className={className ?? "text-[11px] text-amber-400"}>
        Could not load the verification challenge. Disable ad blockers for this
        site and refresh.
      </p>
    );
  }

  return <div ref={containerRef} className={className} />;
}
