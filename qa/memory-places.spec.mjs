import { test, expect } from '@playwright/test';
import { contrastMeasurements } from './contrast-helpers.mjs';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

for (const theme of ['dark', 'light']) {
  test(`memory places: accessible exhibit, image rights and navigation in ${theme}`, async ({ page }, info) => {
    if (info.project.name === 'chromium-core') {
      await page.setViewportSize(theme === 'dark' ? { width: 1440, height: 1000 } : { width: 320, height: 780 });
    }
    await page.addInitScript((value) => localStorage.setItem('tlp-theme-mode', value), theme);
    await page.goto(`${base}/poets/mikhail-lermontov`, { waitUntil: 'domcontentloaded' });
    const jump = page.locator('a[href="#memory-places"]');
    const section = page.locator('#memory-places');
    await expect(jump).toHaveCount(1);
    await expect(section).toHaveCount(1);
    await jump.click();
    await expect.poll(() => new URL(page.url()).hash).toBe('#memory-places');
    await expect(section.locator('h2')).toBeVisible();
    await expect.poll(() => page.locator('html').getAttribute('data-theme')).toBe(theme);
    await expect(section.locator('article')).toHaveCount(1);
    await expect(section.locator('figure:has(img)')).toHaveCount(3);
    for (const photo of await section.locator('figure:has(img)').all()) {
      const img = photo.locator('img');
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate((node) => node.complete && node.naturalWidth > 0)).toBe(true);
      await expect(img).toHaveAttribute('loading', 'lazy');
      await expect(img).toHaveAttribute('alt', /.+/);
      await expect(photo.locator('figcaption a[href^="https://commons.wikimedia.org/"]')).toHaveCount(1);
      await expect(photo.locator('figcaption a[href="https://creativecommons.org/licenses/by-sa/4.0"]')).toHaveCount(1);
    }
    await section.locator('summary').click();
    await expect(section.locator('details')).toHaveAttribute('open', '');
    await expect(section.locator('details li')).toHaveCount(4);
    const readings = await contrastMeasurements(section.locator('p, h2, h3, h4, dt, dd, blockquote span, figcaption a, summary, details a'), true);
    expect(readings.length).toBeGreaterThan(20);
    for (const { text, ratio } of readings) expect(ratio, text).toBeGreaterThanOrEqual(4.5);
    const overflow = await section.evaluate((node) => {
      const bounds = node.getBoundingClientRect();
      return [...node.querySelectorAll('article, figure, img, ol, dl, details')].some((item) => {
        const r = item.getBoundingClientRect();
        return r.left < bounds.left - 1 || r.right > bounds.right + 1 || item.scrollWidth > item.clientWidth + 2;
      });
    });
    expect(overflow).toBe(false);
    if (info.project.name === 'chromium-core') {
      await section.locator('h2').scrollIntoViewIfNeeded();
      await section.screenshot({ path: info.outputPath(`exhibit-${theme}.png`), animations: 'disabled', style: '.site-header,.mobile-dock,.scroll-top-btn,[data-custom-cursor-dot],[data-custom-cursor-ring],.cursor-trail { visibility: hidden !important; }' });
    }
  });
}

test('a poet with no registered memory places has no empty section or jump', async ({ page }) => {
  await page.goto(`${base}/poets/vladimir-mayakovsky`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('#memory-places')).toHaveCount(0);
  await expect(page.locator('a[href="#memory-places"]')).toHaveCount(0);
});

for (const [poetId, placeId] of [
  ['alexander-pushkin', 'pushkin-mikhailovskoye'],
  ['sergei-yesenin', 'yesenin-konstantinovo'],
  ['alexander-blok', 'blok-shakhmatovo'],
]) {
  test('registered estate renders its own images and evidence: ' + poetId, async ({ page }) => {
    await page.goto(base + '/poets/' + poetId, { waitUntil: 'domcontentloaded' });
    const section = page.locator('#memory-places');
    const exhibit = section.locator('#memory-' + placeId);
    await expect(section).toHaveCount(1);
    await expect(exhibit).toHaveCount(1);
    await expect(exhibit.locator('figure:has(img)')).toHaveCount(2);
    for (const photo of await exhibit.locator('figure:has(img)').all()) {
      const img = photo.locator('img');
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate((node) => node.complete && node.naturalWidth > 0)).toBe(true);
      await expect(img).toHaveAttribute('alt', /.+/);
      await expect(photo.locator('figcaption a[href^="https://commons.wikimedia.org/"]')).toHaveCount(1);
      await expect(photo.locator('figcaption a[href^="https://creativecommons.org/"]')).toHaveCount(1);
    }
    await exhibit.locator('summary').click();
    expect(await exhibit.locator('details li').count()).toBeGreaterThanOrEqual(2);
    expect(await exhibit.evaluate((node) => node.scrollWidth <= node.clientWidth + 2)).toBe(true);
  });
}
