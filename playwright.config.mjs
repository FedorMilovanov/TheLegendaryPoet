import { defineConfig, devices } from '@playwright/test';

const mobileSpec = /(mobile-platforms|mobile-home-webkit|yesenin-part-one|articles-catalog|hover-stability|brand-emblem|brand-reference-comparison|community-request-topology|reader-journeys)\.spec\.mjs/;
const finePointerOnly = /(?:TiltCard follows live pointer input without a transition backlog|article title remains painted throughout live 3D pointer tracking)/;

export default defineConfig({
  testDir: './qa',
  timeout: 45_000,
  expect: {
    timeout: 20_000,
  },
  retries: process.env.CI ? 1 : 0,
  failOnFlakyTests: Boolean(process.env.CI),
  fullyParallel: false,
  workers: 1,
  outputDir: 'test-results',
  reporter: process.env.CI
    ? [['line'], ['html', { open: 'never' }]]
    : [['line']],
  projects: [
    {
      name: 'chromium-core',
      testIgnore: /(mobile-platforms|mobile-home-webkit)\.spec\.mjs/,
      use: {
        browserName: 'chromium',
      },
    },
    {
      name: 'android-pixel7',
      testMatch: mobileSpec,
      grepInvert: finePointerOnly,
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
      grepInvert: [
        finePointerOnly,
        /mobile engine rendering, safe area, images and runtime/,
        /mobile dock, search sheet and tap targets remain usable/,
      ],
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
