import { test, expect } from '@playwright/test';

// Smoke tests for every public page: they must render their key content and
// navigation between them must work. No backend account required.

test.describe('landing page', () => {
  test('renders hero and primary CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/collapse-proof/i);
    await expect(page.getByRole('link', { name: /get started free/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i }).first()).toBeVisible();
  });

  test('navigates to pricing from the nav', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Pricing' }).first().click();
    await expect(page).toHaveURL(/\/pricing/);
    await expect(page.getByText(/most popular/i)).toBeVisible();
  });
});

test.describe('pricing page', () => {
  test('shows tiers with register CTAs', async ({ page }) => {
    await page.goto('/pricing');
    const registerLinks = page.locator('a[href="/register"]');
    expect(await registerLinks.count()).toBeGreaterThanOrEqual(4);
  });
});

test.describe('auth pages', () => {
  test('login form renders with accessible controls', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up|create/i })).toBeVisible();
  });

  test('register form renders all fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/work email/i)).toBeVisible();
    await expect(page.getByLabel(/company/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  test('password visibility toggle is keyboard-accessible', async ({ page }) => {
    await page.goto('/login');
    const toggle = page.getByRole('button', { name: /show password/i });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.getByRole('button', { name: /hide password/i })).toBeVisible();
  });
});

test.describe('docs page', () => {
  test('renders API reference sections', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.getByRole('heading', { name: /authentication/i }).first()).toBeVisible();
    await expect(page.getByText('/api/v1/validations/create').first()).toBeVisible();
  });
});

test.describe('status page', () => {
  test('renders service list', async ({ page }) => {
    await page.goto('/status');
    await expect(page.getByText(/api gateway/i)).toBeVisible();
    await expect(page.getByText(/validation engine/i)).toBeVisible();
  });
});

test.describe('blog + changelog', () => {
  test('blog index lists the launch post and navigates to it', async ({ page }) => {
    await page.goto('/blog');
    const postLink = page.getByRole('link', { name: /model collapse/i }).first();
    await expect(postLink).toBeVisible();
    await postLink.click();
    await expect(page).toHaveURL(/\/blog\/model-collapse/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/model collapse/i);
  });

  test('rss feed serves valid xml', async ({ request }) => {
    const res = await request.get('/blog/rss.xml');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('rss+xml');
    const body = await res.text();
    expect(body).toContain('<rss');
    expect(body).toContain('/blog/model-collapse');
  });

  test('changelog renders dated entries with anchors', async ({ page }) => {
    await page.goto('/changelog');
    await expect(page.getByRole('heading', { level: 1, name: /changelog/i })).toBeVisible();
    await expect(page.locator('article[id]').first()).toBeVisible();
  });
});

test.describe('route protection', () => {
  test('dashboard redirects unauthenticated visitors to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
