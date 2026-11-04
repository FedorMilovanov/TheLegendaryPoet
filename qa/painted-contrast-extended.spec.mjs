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

// The visual poem layer is decorative but it is real reader-visible ink.
// Its intrinsic height must contribute to the dark surface instead of
// spilling out of an absolutely-positioned layer onto the light page.
test('Gumilev verse ink remains inside its own painted reading surface', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [STORAGE_KEY, 'light']);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    const response = await page.goto(BASE_URL + '/poets/nikolay-gumilev', { waitUntil: 'networkidle' });
    expect(response?.status()).toBeLessThan(400);
    const cards = page.locator('[data-poem-text]');
    await expect(cards.first()).toBeAttached();
    await page.evaluate(() => document.fonts.ready);
    const count = await cards.count();
    expect(count, 'all poem cards must remain rendered').toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      const card = cards.nth(index);
      await card.scrollIntoViewIfNeeded();
      const detail = await card.evaluate((surface) => {
        const box = surface.getBoundingClientRect();
        const words = [...surface.querySelectorAll('[data-poem-visual] > div > span')];
        const outside = words.flatMap((word) => {
          const rect = word.getBoundingClientRect();
          return rect.top < box.top - 1 || rect.bottom > box.bottom + 1 ||
            rect.left < box.left - 1 || rect.right > box.right + 1
            ? [{ word: word.textContent?.trim(), top: rect.top, bottom: rect.bottom,
              surfaceTop: box.top, surfaceBottom: box.bottom }] : [];
        });
        return { visibleWordCount: words.length, outside };
      });
      expect(detail.visibleWordCount, 'the presentation layer must not disappear').toBeGreaterThan(4);
      expect(detail.outside, 'every visible word must be contained by the dark reading surface').toEqual([]);
    }
  }
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
          // On a genuine painted-pixel failure retain the live CSS surface
          // and a reader-visible screenshot, without changing any thresholds.
          if (offenders.length || gradientOffenders.length) {
            const ids = offenders.slice(0, 5).map((item) => String(item.id));
            const detail = await page.evaluate((keys) => {
              const ancestry = (element) => {
                const entries = [];
                for (let node = element, depth = 0; node && depth < 5; node = node.parentElement, depth += 1) {
                  const style = getComputedStyle(node);
                  const rect = node.getBoundingClientRect();
                  entries.push({ tag: node.tagName, className: String(node.className).slice(0, 120),
                    bg: style.backgroundColor, color: style.color,
                    rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) } });
                }
                return entries;
              };
              const host = document.querySelector('[data-poem-text]');
              return { viewport: { width: innerWidth, height: innerHeight, scrollY },
                bodyTheme: document.documentElement.className,
                surface: host ? ancestry(host).slice(0, 2) : [],
                offending: keys.map((key) => {
                  const node = document.querySelector('[data-sweep-node="' + key + '"]');
                  return { key, parents: node ? ancestry(node) : [] };
                }) };
            }, ids);
            console.log('[painted-contrast-failure-context] ' + JSON.stringify(detail));
            if (await page.locator('[data-poem-text]').count()) {
              fs.mkdirSync('qa-artifacts', { recursive: true });
              await page.locator('[data-poem-text]').first().screenshot({
                path: 'qa-artifacts/painted-contrast-failure-' + theme + '-' + viewport.label + '.png',
                animations: 'disabled',
              });
            }
          }
          expect(offenders.map((item) => item.ratio),
            `${route.path} ${theme}/${viewport.label}: ${describeOffenders(offenders)}`).toEqual([]);
          expect(gradientOffenders.map((item) => item.ratio),
            `${route.path} ${theme}/${viewport.label}: ${describeGradientOffenders(gradientOffenders)}`).toEqual([]);
        });
      }
    }
  }
});
