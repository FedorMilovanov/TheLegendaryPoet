import { defineConfig, devices } from '@playwright/test';

const mobileSpec = /(mobile-platforms|mobile-home-webkit|yesenin-part-one|articles-catalog|hover-stability|brand-v19-micro|brand-v19-optical)\.spec\.mjs/;

export default defineConfig({
  testDir: './qa',
  timeout: 45_000,
  expect: {
    // Prerendered content can appear before the client shell has hydrated on
    // Linux WebKit. Assertions still require the real element and behavior;
    // this only gives the shell a deterministic hydration window.
    timeout: 20_000,
  },
  // A browser-process exit still gets one fresh worker/browser attempt, but a
  // test that needs that retry is not accepted as green CI.
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
      // mobile-home-webkit supplies isolated fresh-context equivalents for the
      // cumulative route-scroll and dock/search tests below. Other Safari tests
      // in mobile-platforms remain active.
      grepInvert: [
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