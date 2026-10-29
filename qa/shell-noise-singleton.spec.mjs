import { test, expect } from '@playwright/test';
import { registerMediaContract } from './media-contract.mjs';

registerMediaContract(test);

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

test.describe('persistent shell noise ownership', () => {
  test('one preboot noise layer survives hydration and SPA navigation', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-core', 'one desktop browser witness is sufficient for the shell singleton invariant');

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });

    const allNoiseLayers = page.locator('.noise-bg');
    const persistentNoise = page.locator('[data-shell-noise="persistent"]');

    await expect(allNoiseLayers, 'hydrated document must contain exactly one noise layer').toHaveCount(1);
    await expect(persistentNoise, 'the static preboot layer must own runtime noise').toHaveCount(1);
    await expect(persistentNoise).toHaveAttribute('aria-hidden', 'true');

    const computed = await persistentNoise.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        position: style.position,
        pointerEvents: style.pointerEvents,
        inset: [style.top, style.right, style.bottom, style.left],
      };
    });
    expect(computed.position).toBe('fixed');
    expect(computed.pointerEvents).toBe('none');
    expect(computed.inset).toEqual(['0px', '0px', '0px', '0px']);

    // Mark the physical DOM node so the post-navigation assertion proves that
    // the same preboot owner survives the SPA transition instead of being
    // replaced by a second React-owned full-screen turbulence layer.
    await persistentNoise.evaluate((element) => element.setAttribute('data-qa-shell-node', 'retained'));

    const poetsLink = page.locator('a[href="/poets"]').first();
    await expect(poetsLink).toBeVisible();
    await poetsLink.click();
    await expect(page).toHaveURL(/\/poets$/);
    await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });

    await expect(page.locator('.noise-bg'), 'SPA navigation must not duplicate shell noise').toHaveCount(1);
    await expect(page.locator('[data-shell-noise="persistent"]')).toHaveAttribute('data-qa-shell-node', 'retained');
  });
});

async function expectReservedViewport(page) {
  const geometry = await page.evaluate(() => {
    const main = document.querySelector('main').getBoundingClientRect();
    const footer = document.querySelector('footer').getBoundingClientRect();
    return { mainHeight: main.height, footerTop: footer.top + scrollY, viewport: innerHeight };
  });
  expect(geometry.mainHeight, 'the persistent main owns the first viewport').toBeGreaterThanOrEqual(geometry.viewport - 1);
  expect(geometry.footerTop, 'footer must not enter the initial viewport during route delivery').toBeGreaterThanOrEqual(geometry.viewport - 1);
  await expect(page.getByRole('contentinfo')).toBeVisible();
}

async function painted(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

const viewportCases = [
  ['desktop dark', 1440, 1000, 'dark', 'no-preference'],
  ['desktop light', 1440, 1000, 'light', 'reduce'],
  ['short dark', 1280, 600, 'dark', 'reduce'],
  ['tall light', 1280, 1200, 'light', 'no-preference'],
  ['mobile dark', 390, 844, 'dark', 'reduce'],
  ['mobile light', 390, 844, 'light', 'no-preference'],
];

for (const [name, width, height, colorScheme, reducedMotion] of viewportCases) {
  test.describe(`route viewport — ${name}`, () => {
    test.use({ viewport: { width, height }, colorScheme, contextOptions: { reducedMotion }, isMobile: width < 500, hasTouch: width < 500 });
    test('cold, slow SPA and warm routes keep the footer outside the first viewport', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'chromium-core', 'viewport/motion matrix is explicit in this suite');
      await page.addInitScript((theme) => {
        localStorage.setItem('tlp-theme-mode', theme);
        window.shellShifts = [];
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) if (!entry.hadRecentInput) {
            window.shellShifts.push({ value: entry.value, footer: entry.sources.some((source) => source.node?.closest('footer')) });
          }
        }).observe({ type: 'layout-shift', buffered: true });
      }, colorScheme);
      let releaseHome, releaseAbout, aboutRequested = false, homeRequests = 0;
      const homeGate = new Promise((resolve) => { releaseHome = resolve; });
      const aboutGate = new Promise((resolve) => { releaseAbout = resolve; });
      await page.route('**/assets/HomePage-*.js', async (route) => { homeRequests++; await homeGate; await route.continue(); });
      await page.route('**/assets/AboutPage-*.js', async (route) => { aboutRequested = true; await aboutGate; await route.continue(); });
      try {
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('status', { name: 'Загрузка страницы' })).toBeVisible();
        await painted(page);
        await expectReservedViewport(page);
        releaseHome();
        await expect(page.locator('main h1')).toContainText('LEGENDARY');
        await expect(page.getByRole('status', { name: 'Загрузка страницы' })).toBeHidden();
        await painted(page);
        await expectReservedViewport(page);
        const shifts = await page.evaluate(() => window.shellShifts);
        await testInfo.attach('cold-layout-shifts', { body: JSON.stringify(shifts), contentType: 'application/json' });
        // Sum is stricter than session-window CLS; do not filter non-footer shifts out.
        expect(shifts.reduce((sum, shift) => sum + shift.value, 0)).toBeLessThan(0.1);
        expect(shifts.filter((shift) => shift.footer).reduce((sum, shift) => sum + shift.value, 0)).toBeLessThan(0.01);
        await page.locator('footer').evaluate((node) => { node.dataset.shellViewportWitness = 'retained'; });
        await page.locator('footer a[href="/about"]').click();
        await expect.poll(() => aboutRequested).toBe(true);
        await expectReservedViewport(page); // Suspense may retain the previous page during SPA delivery.
        releaseAbout();
        await expect(page.locator('main h1')).toContainText('О Проекте');
        await expectReservedViewport(page);
        await page.locator('header a[href="/"]:has([data-brand-mark])').click();
        await expect(page.locator('main h1')).toContainText('LEGENDARY');
        await expectReservedViewport(page);
        expect(homeRequests, 'warm navigation must reuse the loaded module').toBe(1);
        await expect(page.locator('footer')).toHaveAttribute('data-shell-viewport-witness', 'retained');
        // Scrolling the whole footer does not guarantee a particular child is
        // in a short viewport. Exercise the actual destination, then use it.
        const aboutLink = page.locator('footer a[href="/about"]');
        await aboutLink.scrollIntoViewIfNeeded();
        await expect(aboutLink).toBeInViewport();
        await aboutLink.click();
        await expect(page.locator('main h1')).toContainText('О Проекте');
      } finally { releaseHome(); releaseAbout(); }
    });
  });
}

for (const theme of ['dark', 'light']) for (const state of ['short', 'error']) {
  test(`route viewport — ${state} page in ${theme}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-core', 'shared layout boundary, not offline transport certification');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.addInitScript((theme) => localStorage.setItem('tlp-theme-mode', theme), theme);
    const body = state === 'short'
      ? 'export default function Fixture(){return "Short route viewport fixture"}'
      : 'export default function Fixture(){throw new Error("route-viewport-fixture")}';
    await page.route('**/assets/RatingsPage-*.js', (route) => route.fulfill({ contentType: 'text/javascript', body }));
    await page.goto(`${BASE_URL}/ratings`, { waitUntil: 'networkidle' });
    if (state === 'error') await expect(page.getByRole('alert')).toBeVisible();
    else await expect(page.locator('main')).toContainText('Short route viewport fixture');
    await expectReservedViewport(page);
  });
}
