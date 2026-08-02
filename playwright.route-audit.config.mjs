import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './qa',
  testMatch: /site-route-integrity\.spec\.mjs/,
  timeout: 45_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  failOnFlakyTests: Boolean(process.env.CI),
  fullyParallel: false,
  workers: process.env.CI ? 2 : 1,
  outputDir: 'test-results/site-route-integrity',
  reporter: process.env.CI
    ? [['line'], ['html', { open: 'never', outputFolder: 'playwright-report/site-route-integrity' }]]
    : [['line']],
  use: {
    browserName: 'chromium',
    viewport: { width: 1365, height: 900 },
    locale: 'ru-RU',
    timezoneId: 'Europe/Paris',
    colorScheme: 'dark',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
});
