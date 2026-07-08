This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `BACKEND_URL` | Backend API origin the `/api/v1` proxy forwards to (default `https://api.synthos.dev`). |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key. When set, a CAPTCHA renders on the registration form. |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret. When set, the `/api/v1` proxy verifies the token server-side on `POST /auth/register` and rejects failures with 403 `CAPTCHA_FAILED`. Set both keys to activate bot protection. |

Abuse-prone endpoints (register, login, password reset, OTP, promo) are also
rate-limited per IP in the proxy (`src/app/api/v1/[...path]/route.ts`). The
limiter is in-memory per server instance — keep hard guarantees at the WAF or
backend layer.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
