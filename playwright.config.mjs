import { defineConfig, devices } from '@playwright/test';

const mobileSpec = /mobile-platforms\.spec\.mjs/;

export default defineConfig({
  testDir: './qa',
  timeout: 45_000,
  expect: {
    timeout: 12_000,
  },
  fullyParallel: false,
  workers: 1,
  outputDir: 'test-results',
  reporter: process.env.CI
    ? [['line'], ['html', { open: 'never' }]]
    : [['line']],
  projects: [
    {
      name: 'chromium-core',
      testIgnore: mobileSpec,
      use: {
        browserName: 'chromium',
      },
    },
    {
      name: 'android-pixel7',
      testMatch: mobileSpec,
      use: {
        ...devices['Pixel 7'],
        browserName: 'chromium',
        locale: 'ru-RU',
        timezoneId: 'Europe/Paris',
        colorScheme: 'dark',
      },
    },
    {
      name: 'iphone-safari',
      testMatch: mobileSpec,
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
