import { test, expect } from '@playwright/test';
import { registerMediaContract } from './media-contract.mjs';
import fs from 'node:fs';
import path from 'node:path';

// The same guard the other browser suites carry: a declared reduced-motion run
// has to actually be running reduced motion.
registerMediaContract(test);

// What the byte-level guard cannot see: whether the page decodes the bytes it
// was given, and whether it asks a raster for more pixels than the raster has.
// A 300px archive scan stretched across a 576px column decodes perfectly and
// simply looks like a bad photograph, so neither the container check nor a
// successful naturalWidth can stand in for this.

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts', 'image-integrity');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

// The published surface, not a sample: issue #519 was invisible for as long as
// it was because nothing looked at the whole site.
const ROUTES = [
  '/',
  '/ratings',
  '/poets',
  '/poets/alexander-pushkin',
  '/poets/sergei-yesenin',
  '/poets/vladimir-mayakovsky',
  '/music',
  '/music/pushkin-tucha',
  '/music/blok-rossiya',
  '/articles',
  '/archive',
  '/essays/brik-case',
  '/essays/sergei-yesenin-1921-1925',
  '/essays/vykhozhu-odin-ya-na-dorogu-lermontov',
  '/hall',
  '/about',
  '/editorial-policy',
  '/privacy',
];

const CELLS = [
  { key: 'desktop-light', viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, theme: 'light' },
  { key: 'mobile-dark', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, theme: 'dark', isMobile: true },
];

/** Walk the page so lazy images commit, then wait for the local ones to settle. */
async function settleImages(page) {
  const viewportHeight = page.viewportSize()?.height ?? 900;
  // Steps no taller than the viewport: a 1800px jump can step straight over a
  // lazy figure without ever bringing it near enough to start loading.
  const step = Math.round(viewportHeight * 0.8);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let top = 0; top < height; top += step) {
    await page.evaluate((y) => window.scrollTo(0, y), top);
    await page.waitForTimeout(120);
  }
  // Then bring anything still outstanding into the middle of the frame and give
  // it a moment: an audit that waits for an image must have shown the image.
  await page.evaluate(async () => {
    const pending = () => [...document.querySelectorAll('img')]
      .filter((img) => new URL(img.currentSrc || img.src, location.href).origin === location.origin)
      .filter((img) => !img.complete);
    for (let pass = 0; pass < 3 && pending().length > 0; pass += 1) {
      for (const img of pending()) {
        img.scrollIntoView({ block: 'center' });
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  // Remote Commons portraits are outside this contract and, in a sandbox with
  // no egress, would hold a single await open until the test timed out. Only
  // local files are waited for, and only until they report for themselves.
  // Only images the page actually lays out are waited for. A lazy image inside
  // a collapsed block never starts loading, and waiting for it would be waiting
  // for something the reader is not being shown.
  await expect
    .poll(
      () => page.evaluate(() => [...document.querySelectorAll('img')]
        .filter((img) => new URL(img.currentSrc || img.src, location.href).origin === location.origin)
        .filter((img) => img.getBoundingClientRect().width > 0 && img.getBoundingClientRect().height > 0)
        .filter((img) => !img.complete).length),
      { timeout: 20_000, intervals: [200, 300, 500, 800] },
    )
    .toBe(0);
  await page.waitForTimeout(250);
}

/**
 * naturalWidth is not the file's width once srcset and sizes are in play: it is
 * the intrinsic width divided by the selected candidate's density. The honest
 * comparison re-decodes currentSrc on its own, which reports true pixels.
 */
async function localImageReport(page) {
  return page.evaluate(async () => {
    const images = [...document.querySelectorAll('img')];
    const truePixels = new Map();
    const rows = [];
    for (const img of images) {
      const url = new URL(img.currentSrc || img.src, location.href);
      if (url.origin !== location.origin) continue;
      if (!truePixels.has(url.href)) {
        const probe = new Image();
        probe.src = url.href;
        try {
          await probe.decode();
          truePixels.set(url.href, { width: probe.naturalWidth, height: probe.naturalHeight });
        } catch {
          truePixels.set(url.href, null);
        }
      }
      const rect = img.getBoundingClientRect();
      const style = getComputedStyle(img);
      const source = truePixels.get(url.href);
      const laidOut = rect.width > 0 && rect.height > 0;
      rows.push({
        src: url.pathname,
        laidOut,
        decoded: Boolean(img.complete && img.naturalWidth > 0 && img.naturalHeight > 0),
        sourceWidth: source ? source.width : null,
        sourceHeight: source ? source.height : null,
        renderedWidth: Math.round(rect.width * 100) / 100,
        renderedHeight: Math.round(rect.height * 100) / 100,
        devicePixels: Math.round(rect.width * window.devicePixelRatio),
        figure: Boolean(img.closest('figure')),
        // Decorative covers are allowed a designed treatment: this home-panel
        // cover is laid under a scrim at 25%. Content images are not.
        decorative: img.getAttribute('alt') === '' || img.getAttribute('aria-hidden') === 'true',
        objectFit: style.objectFit,
        opacity: Number(style.opacity),
      });
    }
    return rows;
  });
}

test.describe('published local images decode and figures stay inside their own pixels', () => {
  for (const cell of CELLS) {
    test.describe(cell.key, () => {
      test.use({
        viewport: cell.viewport,
        deviceScaleFactor: cell.deviceScaleFactor,
        isMobile: cell.isMobile ? true : undefined,
        hasTouch: cell.isMobile ? true : undefined,
        colorScheme: cell.theme === 'dark' ? 'dark' : 'light',
        contextOptions: { reducedMotion: 'reduce' },
        locale: 'ru-RU',
        timezoneId: 'Europe/Paris',
      });

      for (const route of ROUTES) {
        test(`${route} decodes every local image`, async ({ page }, testInfo) => {
          const pageErrors = [];
          const failedLocalRequests = [];
          page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));
          page.on('requestfailed', (request) => {
            if (request.resourceType() === 'image' && request.url().startsWith(BASE_URL)) {
              failedLocalRequests.push(`${request.url()} ${request.failure()?.errorText ?? ''}`);
            }
          });
          page.on('response', (response) => {
            const url = response.url();
            if (response.request().resourceType() === 'image' && url.startsWith(BASE_URL) && response.status() >= 400) {
              failedLocalRequests.push(`${url} HTTP ${response.status()}`);
            }
          });

          await page.addInitScript((value) => {
            try { window.localStorage.setItem('tlp-theme-mode', value); } catch { /* storage blocked */ }
          }, cell.theme);

          await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
          await page.locator('#main-content, main, body').first().waitFor({ state: 'visible', timeout: 20_000 });
          await settleImages(page);

          const rows = await localImageReport(page);
          expect(rows.length, `${route}: expected local images to paint`).toBeGreaterThan(0);

          const shown = rows.filter((row) => row.laidOut);
          expect(shown.length, `${route}: expected laid-out local images`).toBeGreaterThan(0);

          const undecoded = shown.filter((row) => !row.decoded);
          expect(undecoded.map((row) => row.src), `${route}: local images that failed to decode`).toEqual([]);

          const unsourced = shown.filter((row) => !(row.sourceWidth > 0));
          expect(unsourced.map((row) => row.src), `${route}: local images whose file could not be decoded`).toEqual([]);

          // Some portraits are painted at 0.9 by design, so the floor is not
          // "fully opaque" but "actually painted": an image left at 0 behind a
          // reveal that never fired decodes fine and shows nothing at all.
          const unpainted = shown.filter((row) => !row.decorative && (row.opacity <= 0.5 || row.renderedWidth <= 0));
          expect(unpainted.map((row) => `${row.src} opacity ${row.opacity}`), `${route}: local images left unpainted`).toEqual([]);

          // Editorial figures are the images whose source resolution is a known,
          // pinned quantity, so they are held to it. Full-bleed heroes are not:
          // a 1000px portrait covering a 1440px stage is a sourcing decision the
          // page cannot make on its own, and the factor is recorded below.
          // The rule the page controls: a figure asks a raster for no more CSS
          // pixels than the raster has. Device pixels are a different question —
          // on a 2x screen a 300px archive scan is short no matter how the page
          // behaves — so that gap is recorded as debt, not failed here.
          const stretched = shown
            .filter((row) => row.figure && row.renderedWidth > row.sourceWidth * 1.02)
            .map((row) => `${row.src} painted ${row.renderedWidth}px from ${row.sourceWidth}px`);
          expect(stretched, `${route}: figures painted above their own pixels`).toEqual([]);

          expect(failedLocalRequests, `${route}: failed local image requests`).toEqual([]);
          expect(pageErrors, `${route}: page errors`).toEqual([]);

          const evidence = shown
            .map((row) => ({
              ...row,
              cssFactor: row.sourceWidth
                ? Math.round((row.renderedWidth / row.sourceWidth) * 100) / 100
                : null,
              deviceFactor: row.sourceWidth
                ? Math.round((row.devicePixels / row.sourceWidth) * 100) / 100
                : null,
            }))
            .sort((a, b) => (b.deviceFactor ?? 0) - (a.deviceFactor ?? 0));

          // 1.25 is where an image starts visibly borrowing pixels. Still not a
          // failure, because only a better source can close it, but named on
          // every run: today it is the three 1000px canonical portraits on a
          // 1440px stage at 1.44x, and the two 300px archive scans on a 2x
          // screen at 1.99x.
          const debt = evidence.filter((row) => (row.deviceFactor ?? 0) > 1.25);
          if (debt.length) {
            // Said out loud on every run: a source that cannot hold the screen
            // it is painted on is a sourcing decision, and it should be visible
            // rather than hidden behind a passing decode.
            for (const row of debt) {
              testInfo.annotations.push({
                type: 'source-resolution-debt',
                description: `${route} ${cell.key}: ${row.src} needs ${row.devicePixels}px, the file holds ${row.sourceWidth}px`,
              });
            }
            console.log(
              `source-resolution-debt ${route} ${cell.key}: ${debt.map((row) => `${row.src} x${row.deviceFactor}`).join(', ')}`,
            );
          }

          await testInfo.attach('local-images.json', {
            body: JSON.stringify({ route, cell: cell.key, images: evidence }, null, 2),
            contentType: 'application/json',
          });
        });
      }
    });
  }
});
