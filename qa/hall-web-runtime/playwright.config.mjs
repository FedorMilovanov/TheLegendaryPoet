import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '..',
  testMatch: /hall-web-runtime\.spec\.mjs/,
  timeout: 45_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  failOnFlakyTests: Boolean(process.env.CI),
  workers: 1,
  outputDir: '../../test-results/hall-web-runtime',
  reporter: [['line']],
  use: {
    baseURL: process.env.HALL_WEB_PROOF_URL || 'http://127.0.0.1:4174',
    colorScheme: 'dark',
    locale: 'ru-RU',
    timezoneId: 'Europe/Paris',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'webkit-iphone',
      use: {
        ...devices['iPhone 15 Pro'],
        browserName: 'webkit',
      },
    },
  ],
});
