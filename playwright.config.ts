import { defineConfig, devices } from '@playwright/test';

/**
 * E2E smoke tests for the public surfaces (no account required).
 * Run with: npm run test:e2e
 *
 * Authenticated flows need seeded credentials; provide E2E_EMAIL/E2E_PASSWORD
 * env vars and extend tests/e2e as those flows gain coverage.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // Use the system-provided Chromium when the exact Playwright build isn't
    // downloaded (e.g. sandboxed CI images with PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD).
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : undefined,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
