import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './qa',
  testMatch: /home-(?:polish|labels|ambient)\.spec\.mjs/,
  timeout: 45_000,
  expect: { timeout: 12_000 },
  // Match the main Browser QA policy: a rare browser-process exit gets one
  // fresh worker/browser attempt on CI. Reproducible product failures still
  // fail twice with every assertion and threshold unchanged.
  retries: process.env.CI ? 1 : 0,
  fullyParallel: false,
  workers: 1,
  outputDir: 'test-results/home-polish',
  reporter: process.env.CI ? [['line'], ['html', { open: 'never', outputFolder: 'playwright-report/home-polish' }]] : [['line']],
  projects: [
    {
      name: 'home-desktop',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 1000 },
        locale: 'ru-RU',
        timezoneId: 'Europe/Paris',
        colorScheme: 'dark',
      },
    },
    {
      name: 'home-pixel7',
      use: {
        ...devices['Pixel 7'],
        browserName: 'chromium',
        locale: 'ru-RU',
        timezoneId: 'Europe/Paris',
        colorScheme: 'dark',
      },
    },
    {
      name: 'home-iphone-safari',
      use: {
        ...devices['iPhone 15 Pro'],
        browserName: 'webkit',
        locale: 'ru-RU',
        timezoneId: 'Europe/Paris',
        colorScheme: 'dark',
      },
    },
  ],
});
