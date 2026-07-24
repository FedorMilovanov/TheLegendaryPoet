import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.QA_BASE_URL ?? 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // CI traces and screenshots are enough to reproduce regressions. Keeping a
    // video for every retry made the audit artifact exceed GitHub's practical
    // download limit and hid the concise failure report we actually need.
    video: process.env.CI ? 'off' : 'retain-on-failure',
    actionTimeout: 12_000,
    navigationTimeout: 30_000,
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: baseURL,
    // Manual QA starts a production preview itself and exposes it through
    // QA_BASE_URL. Reuse that server in CI instead of attempting to bind the
    // same port a second time. Other CI/local runs retain the prior behavior.
    reuseExistingServer: Boolean(process.env.QA_BASE_URL) || !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 7'],
      },
    },
  ],
});
