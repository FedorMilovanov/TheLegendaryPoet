import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './qa',
  testMatch: /webkit-reduced-motion-paint\.spec\.mjs/,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: [['line'], ['html', { open: 'never', outputFolder: 'playwright-report/webkit-paint' }]],
  outputDir: 'test-results/webkit-paint',
  projects: [{
    name: 'iphone-webkit-reduced-paint',
    use: {
      ...devices['iPhone 15 Pro'],
      browserName: 'webkit',
      locale: 'ru-RU',
      timezoneId: 'Europe/Paris',
      colorScheme: 'dark',
      screenshot: 'only-on-failure',
    },
  }],
});
