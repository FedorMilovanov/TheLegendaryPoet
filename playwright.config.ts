import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.SMOKE_PORT || 4173);
const BASE = (process.env.VITE_BASE || '/TheLegendaryPoet/').replace(/\/?$/, '/');

/**
 * Strict visual / a11y checks against the production build.
 * Expects `npm run build && node scripts/postbuild.mjs` already done,
 * and starts its own preview server.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 45_000,
  expect: {
    toHaveScreenshot: {
      // Strict but not pixel-paranoid across font AA
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    },
  },
  use: {
    baseURL: `http://127.0.0.1:${PORT}${BASE}`,
    trace: 'on-first-retry',
    colorScheme: 'dark',
    locale: 'ru-RU',
    reducedMotion: 'reduce',
  },
  webServer: {
    command: `npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } },
    },
  ],
});
