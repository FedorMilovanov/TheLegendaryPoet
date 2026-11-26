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
    const sourceLinks = section.locator('details a');
    await expect(sourceLinks.first()).toBeHidden();
    expect(await sourceLinks.evaluateAll(nodes => nodes.every(node => node.getClientRects().length === 0))).toBe(true);
    await section.locator('summary').click();
    await expect(section.locator('details')).toHaveAttribute('open', '');
    await expect(section.locator('details li')).toHaveCount(4);
    await expect(sourceLinks.first()).toBeVisible();
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
    if (info.project.name === 'chromium-core' && process.env.QA_CAPTURE_MEMORY === '1') {
      await section.locator('h2').scrollIntoViewIfNeeded();
      await section.screenshot({ path: info.outputPath(`exhibit-${theme}.png`), animations: 'disabled', style: '.site-header,.mobile-dock,.scroll-top-btn,[data-custom-cursor-dot],[data-custom-cursor-ring],.cursor-trail { visibility: hidden !important; }' });
    }
  });
}

test('the poet catalog has no exhibit section or jump', async ({ page }) => {
  await page.goto(`${base}/poets`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toBeVisible();
  await page.waitForFunction(() => document.readyState === 'complete');
  await expect(page.locator('#memory-places')).toHaveCount(0);
  await expect(page.locator('a[href="#memory-places"]')).toHaveCount(0);
});

for (const [poetId, placeId, photoCount = 2] of [
  ['alexander-pushkin', 'pushkin-mikhailovskoye'],
  ['sergei-yesenin', 'yesenin-konstantinovo'],
  ['alexander-blok', 'blok-shakhmatovo'],
  ['anna-akhmatova', 'akhmatova-fountain-house'],
  ['fyodor-tyutchev', 'tyutchev-ovstug'],
  ['afanasy-fet', 'fet-vorobyovka'],
  ['boris-pasternak', 'pasternak-peredelkino'],
  ['vladimir-mayakovsky', 'mayakovsky-baghdati', 2],
  ['nikolay-gumilev', 'gumilev-gradnitsy', 1],
  ['marina-tsvetaeva', 'tsvetaeva-borisoglebsky', 2],
  ['osip-mandelstam', 'mandelstam-voronezh', 1],
  ['valery-bryusov', 'bryusov-mira', 2],
  ['nikolay-nekrasov', 'nekrasov-karabikha', 1],
  ['konstantin-simonov', 'simonov-buinichi', 1],
  ['aleksey-konstantinovich-tolstoy', 'ak-tolstoy-krasny-rog', 2],
]) {
  test('registered place renders its own images and evidence: ' + poetId, async ({ page }) => {
    await test.step('load poet page', () => page.goto(base + '/poets/' + poetId, { waitUntil: 'domcontentloaded' }));
    const section = page.locator('#memory-places');
    const exhibit = section.locator('#memory-' + placeId);
    await expect(section).toHaveCount(1);
    await expect(exhibit).toHaveCount(1);
    await expect(exhibit.locator('figure:has(img)')).toHaveCount(photoCount);
    for (const photo of await exhibit.locator('figure:has(img)').all()) {
      const img = photo.locator('img');
      await test.step('expose and decode ' + await img.getAttribute('src'), async () => {
        await img.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await expect.poll(() => img.evaluate((node) => node.complete && node.naturalWidth > 0)).toBe(true);
      });
      await expect(img).toHaveAttribute('alt', /.+/);
      await expect(photo.locator('figcaption a[href^="https://commons.wikimedia.org/"]')).toHaveCount(1);
      await expect(photo.locator('figcaption a[href^="https://creativecommons.org/"]')).toHaveCount(1);
    }
    await test.step('open historical sources', async () => {
      const summary = exhibit.locator('summary');
      await summary.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await summary.click();
      await expect(exhibit.locator('details')).toHaveAttribute('open', '');
      expect(await exhibit.locator('details li').count()).toBeGreaterThanOrEqual(2);
    });
    expect(await exhibit.evaluate((node) => node.scrollWidth <= node.clientWidth + 2)).toBe(true);
  });
}

test('memory gallery shares overlay ownership, navigation, zoom and restores focus', async ({ page }, info) => {
  await page.goto(base + '/poets/mikhail-lermontov#memory-places', { waitUntil: 'domcontentloaded' });
  const section = page.locator('#memory-places');
  await expect(section).toBeVisible();
  await expect.poll(() => section.evaluate(node => Math.abs(node.getBoundingClientRect().top - 112))).toBeLessThan(48);
  const opener = section.locator('.memory-photo-trigger').first();
  await opener.scrollIntoViewIfNeeded();
  await opener.focus();
  await opener.click();
  const gallery = page.getByRole('dialog', { name: 'Фотографии места памяти' });
  const close = gallery.getByRole('button', { name: 'Закрыть фотографии' });
  await expect(gallery).toBeVisible();
  await expect(close).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.__TLP_OVERLAY_DEBUG?.topLabel)).toBe('memory-photo-gallery');
  const img = gallery.locator('img');
  await expect(img).toHaveAttribute('data-image-state', 'loaded');
  const initial = await img.getAttribute('src');
  await gallery.getByRole('button', { name: 'Следующая фотография' }).click();
  await expect(img).not.toHaveAttribute('src', initial);
  await expect(img).toHaveAttribute('data-image-state', 'loaded');
  await gallery.getByRole('button', { name: 'Увеличить фотографию' }).click();
  await expect(gallery.locator('.memory-gallery-stage')).toHaveAttribute('data-zoom', 'true');
  await gallery.getByRole('button', { name: 'Уменьшить фотографию' }).click();
  await expect(gallery.locator('.memory-gallery-stage')).toHaveAttribute('data-zoom', 'false');
  await page.keyboard.press('ArrowLeft');
  await expect(img).toHaveAttribute('src', initial);
  await expect(gallery.locator('a[href^="https://creativecommons.org/"]')).toHaveCount(1);
  if (process.env.QA_CAPTURE_MEMORY === '1') await page.screenshot({ path: info.outputPath('gallery.png'), animations: 'disabled' });
  await page.keyboard.press('Escape');
  await expect(gallery).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.__TLP_OVERLAY_DEBUG?.depth)).toBe(0);
  if (info.project.name !== 'chromium-core') {
    expect(await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)).toBe(false);
    await expect(page.locator('[data-custom-cursor-dot]')).toHaveCount(0);
  }
});

test('one-photo gallery does not render meaningless navigation', async ({ page }) => {
  await page.goto(base + '/poets/nikolay-gumilev', { waitUntil: 'domcontentloaded' });
  await page.locator('#memory-places .memory-photo-trigger').click();
  const gallery = page.getByRole('dialog', { name: 'Фотографии места памяти' });
  await expect(gallery).toBeVisible();
  await expect(gallery.getByRole('button', { name: 'Следующая фотография' })).toHaveCount(0);
  await expect(gallery.getByRole('button', { name: 'Предыдущая фотография' })).toHaveCount(0);
  await gallery.getByRole('button', { name: 'Закрыть фотографии' }).click();
  await expect(gallery).toHaveCount(0);
});

test('memory data is scoped to the current poet and retries without affecting the biography', async ({ page }) => {
  const requests = [];
  const endpoint = /\/data\/memory-places\/[^/?]+\.json/;
  let fail = true;
  await page.route(endpoint, async route => {
    const url = new URL(route.request().url());
    requests.push(url.pathname);
    if (fail) await route.fulfill({ status: 503, body: 'unavailable' });
    else await route.continue();
  });
  await page.goto(base + '/poets/mikhail-lermontov', { waitUntil: 'domcontentloaded' });
  const section = page.locator('#memory-places');
  await expect(section.getByRole('button', { name: 'Повторить' })).toBeVisible();
  await expect(page.locator('h1')).toBeVisible();
  fail = false;
  await section.getByRole('button', { name: 'Повторить' }).click();
  await expect(section.locator('article')).toHaveCount(1);
  await expect(section.locator('figure:has(img)')).toHaveCount(3);
  expect(requests.length).toBeGreaterThanOrEqual(2);
  expect(requests.every(path => path.endsWith('/mikhail-lermontov.json'))).toBe(true);
  requests.length = 0;
  await page.goto(base + '/poets', { waitUntil: 'networkidle' });
  await expect(page.locator('#memory-places')).toHaveCount(0);
  expect(requests).toEqual([]);
});
