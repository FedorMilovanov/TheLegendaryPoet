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
  if (info.project.name === 'chromium-core') await page.setViewportSize({ width: 1440, height: 900 });
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
  const stage = gallery.locator('.memory-gallery-stage');
  const measure = () => stage.evaluate(node => {
    const rect = node.querySelector('img').getBoundingClientRect();
    return { width: rect.width, height: rect.height, stageWidth: node.clientWidth,
      stageHeight: node.clientHeight, scrollWidth: node.scrollWidth, scrollHeight: node.scrollHeight };
  });
  const fit = async () => {
    const value = await measure();
    expect(value.width).toBeGreaterThan(0);
    expect(value.height).toBeGreaterThan(0);
    expect(value.width).toBeLessThanOrEqual(value.stageWidth + 1);
    expect(value.height).toBeLessThanOrEqual(value.stageHeight + 1);
    expect(value.scrollWidth).toBeLessThanOrEqual(value.stageWidth + 1);
    expect(value.scrollHeight).toBeLessThanOrEqual(value.stageHeight + 1);
    return value;
  };
  await fit();
  const initial = await img.getAttribute('src');
  await gallery.getByRole('button', { name: 'Следующая фотография' }).click();
  await expect(img).not.toHaveAttribute('src', initial);
  await expect(img).toHaveAttribute('data-image-state', 'loaded');
  // A portrait must fit even on a short landscape phone.
  if (info.project.name === 'iphone-safari') await page.setViewportSize({ width: 844, height: 390 });
  const fitted = await fit();
  await gallery.getByRole('button', { name: 'Увеличить фотографию' }).click();
  await expect(stage).toHaveAttribute('data-zoom', 'true');
  const zoomed = await measure();
  expect(zoomed.width / fitted.width).toBeGreaterThanOrEqual(1.9);
  expect(zoomed.width / fitted.width).toBeLessThanOrEqual(2.1);
  expect(zoomed.height / fitted.height).toBeGreaterThanOrEqual(1.9);
  expect(zoomed.height / fitted.height).toBeLessThanOrEqual(2.1);
  await gallery.getByRole('button', { name: 'Уменьшить фотографию' }).click();
  await expect(stage).toHaveAttribute('data-zoom', 'false');
  await fit();
  await page.keyboard.press('ArrowLeft');
  await expect(img).toHaveAttribute('src', initial);
  await expect(img).toHaveAttribute('data-image-state', 'loaded');
  await fit();
  if (info.project.name === 'iphone-safari') {
    // Large reader text on a small screen must not crowd the photo out.
    await page.setViewportSize({ width: 320, height: 568 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    const largeTextFit = await fit();
    expect(largeTextFit.stageHeight).toBeGreaterThanOrEqual(200);
    const controls = await gallery.locator('.memory-gallery-control').evaluateAll(nodes =>
      nodes.every(node => {
        const rect = node.getBoundingClientRect();
        return rect.width >= 44 && rect.height >= 44 && rect.left >= 0 &&
          rect.right <= innerWidth + 1 && rect.top >= 0 && rect.bottom <= innerHeight + 1;
      }));
    expect(controls).toBe(true);
    await page.setViewportSize({ width: 568, height: 320 });
    const landscapeFit = await fit();
    expect(landscapeFit.stageHeight).toBeGreaterThanOrEqual(120);
    await page.evaluate(() => { document.documentElement.style.removeProperty('font-size'); });
  }
  await expect(gallery.locator('a[href^="https://creativecommons.org/"]')).toHaveCount(1);
  if (process.env.QA_CAPTURE_MEMORY === '1') await page.screenshot({ path: info.outputPath('gallery.png'), animations: 'disabled' });
  await page.keyboard.press('Escape');
  await expect(gallery).toHaveCount(0);
  await expect(opener).toBeFocused();
  if (info.project.name === 'iphone-safari') {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    expect(await section.locator('article').evaluate(node =>
      node.scrollWidth <= node.clientWidth + 2 &&
      [...node.querySelectorAll('.memory-events, .memory-event')].every(el => el.scrollWidth <= el.clientWidth + 2)
    )).toBe(true);
    await page.evaluate(() => { document.documentElement.style.removeProperty('font-size'); });
  }
  await expect.poll(() => page.evaluate(() => window.__TLP_OVERLAY_DEBUG?.depth)).toBe(0);
  if (info.project.name !== 'chromium-core') {
    expect(await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)).toBe(false);
    await expect(page.locator('[data-custom-cursor-dot]')).toHaveCount(0);
  }
});

test('one-photo gallery does not render meaningless navigation and handles missing photos', async ({ page }) => {
  const endpoint = '**/images/memory-places/gumilev-gradnitsy/**';
  await page.route(endpoint, route => route.abort());
  await page.goto(base + '/poets/nikolay-gumilev', { waitUntil: 'domcontentloaded' });
  const opener = page.locator('#memory-places .memory-photo-trigger');
  await opener.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await expect(opener.locator('img')).toHaveAttribute('data-image-state', 'failed');
  await expect(opener).toHaveAccessibleName(/фотография недоступна/i);
  await opener.click();
  const gallery = page.getByRole('dialog', { name: 'Фотографии места памяти' });
  await expect(gallery).toBeVisible();
  await expect(gallery.getByRole('button', { name: 'Следующая фотография' })).toHaveCount(0);
  await expect(gallery.getByRole('button', { name: 'Предыдущая фотография' })).toHaveCount(0);
  await expect(gallery.locator('img')).toHaveAttribute('data-image-state', 'failed');
  await expect(gallery.locator('[aria-live="polite"]')).toContainText('Фотография недоступна');
  await expect(gallery.getByRole('button', { name: 'Увеличить фотографию' })).toBeDisabled();
  await expect(gallery.locator('footer a[href^="https://creativecommons.org/"]')).toHaveCount(1);
  await gallery.getByRole('button', { name: 'Закрыть фотографии' }).click();
  await expect(gallery).toHaveCount(0);
  await expect(opener).toBeFocused();
  await page.unroute(endpoint);
  await opener.click();
  await expect(gallery.locator('img')).toHaveAttribute('data-image-state', 'loaded');
  await expect(gallery.getByRole('button', { name: 'Увеличить фотографию' })).toBeEnabled();
  await gallery.getByRole('button', { name: 'Закрыть фотографии' }).click();
  await expect(gallery).toHaveCount(0);
});

test('memory data is scoped to the current poet and retries without affecting the biography', async ({ page }) => {
  const requests = [];
  const endpoint = /\/data\/memory-places\/[^/?]+\.json/;
  let failure = 'http';
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(endpoint, async route => {
    const url = new URL(route.request().url());
    requests.push(url.pathname);
    if (failure === 'http') await route.fulfill({ status: 503, body: 'unavailable' });
    else if (failure === 'payload') await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ poetId: 'mikhail-lermontov', id: 'broken-place', title: 'Broken', location: 'Place', date: 'Date', intro: 'Intro', photos: [null], facts: [null], timeline: [null], sources: [null] }]),
    });
    else await route.continue();
  });
  await page.goto(base + '/poets/mikhail-lermontov', { waitUntil: 'domcontentloaded' });
  const section = page.locator('#memory-places');
  await expect(section.getByRole('button', { name: 'Повторить' })).toBeVisible();
  await expect(page.locator('h1')).toBeVisible();
  failure = 'payload';
  await section.getByRole('button', { name: 'Повторить' }).click();
  await expect(section.getByRole('button', { name: 'Повторить' })).toBeVisible();
  await expect(section.locator('article')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 2, name: /Полная Биография/i })).toBeVisible();
  failure = 'none';
  await section.getByRole('button', { name: 'Повторить' }).click();
  await expect(section.locator('article')).toHaveCount(1);
  await expect(section.locator('figure:has(img)')).toHaveCount(3);
  expect(errors).toEqual([]);
  expect(requests.length).toBeGreaterThanOrEqual(3);
  expect(requests.every(path => path.endsWith('/mikhail-lermontov.json'))).toBe(true);
  requests.length = 0;
  await page.goto(base + '/poets', { waitUntil: 'networkidle' });
  await expect(page.locator('#memory-places')).toHaveCount(0);
  expect(requests).toEqual([]);
});
