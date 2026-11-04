import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import { paintedSweep, describeOffenders, describeGradientOffenders } from './painted-contrast.mjs';
import { BASELINE_PAINTED_ROUTES, EXTENDED_PAINTED_ROUTES } from './painted-contrast-routes.mjs';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const STORAGE_KEY = 'tlp-theme-mode';
const normalize = (path) => path.replace(/\/$/, '') || '/';

test('all published and utility routes have exact painted-contrast coverage', () => {
  const xml = fs.readFileSync('public/sitemap.xml', 'utf8');
  const contract = JSON.parse(fs.readFileSync('src/routes/route-contract.json', 'utf8'));
  const canonical = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => normalize(new URL(match[1]).pathname));
  const utility = contract.routes.filter((route) => route.audit === 'utility')
    .map((route) => normalize(route.path));
  const covered = new Set([...BASELINE_PAINTED_ROUTES, ...EXTENDED_PAINTED_ROUTES]
    .map((route) => normalize(route.path)));
  expect(canonical.length, 'published-route inventory must not silently shrink').toBeGreaterThanOrEqual(31);
  expect([...new Set([...canonical, ...utility])].filter((route) => !covered.has(route)),
    'canonical and utility routes without pixel-backed contrast regression').toEqual([]);
});

test.describe('canonical owner extension: real painted pixels', () => {
  test.setTimeout(240_000);
  for (const route of EXTENDED_PAINTED_ROUTES) {
    for (const theme of ['dark', 'light']) {
      for (const viewport of [
        { label: 'desktop', width: 1440, height: 1000 },
        { label: 'mobile', width: 390, height: 844 },
      ]) {
        test(`${route.path} clears painted contrast in ${theme} ${viewport.label}`, async ({ page }) => {
          await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [STORAGE_KEY, theme]);
          await page.emulateMedia({ reducedMotion: 'reduce' });
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          const response = await page.goto(BASE_URL + route.path, { waitUntil: 'networkidle' });
          expect(response?.status(), route.path).toBeLessThan(400);
          await expect(page.locator('h1').first()).toContainText(route.heading);
          await page.waitForTimeout(600);
          const { measured, offenders, gradientOffenders, occluded } = await paintedSweep(page);
          expect(measured.length,
            `${route.path}: ${occluded.length} nodes under fixed chrome; route did not render enough ink`)
            .toBeGreaterThan(route.minimumNodes);
          expect(offenders.map((item) => item.ratio),
            `${route.path} ${theme}/${viewport.label}: ${describeOffenders(offenders)}`).toEqual([]);
          expect(gradientOffenders.map((item) => item.ratio),
            `${route.path} ${theme}/${viewport.label}: ${describeGradientOffenders(gradientOffenders)}`).toEqual([]);
        });
      }
    }
  }
});
