import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
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
      if (node.scrollWidth > node.clientWidth + 2) return true;
      const bounds = node.getBoundingClientRect();
      return [...node.querySelectorAll('article, figure, .memory-photo-trigger, img, ol, dl, details')].some((item) => {
        const r = item.getBoundingClientRect();
        // A framed image may extend past its button, but its visible area must
        // stay clipped. The button itself is independently checked above.
        const clip = item.tagName === 'IMG' ? item.closest('.memory-photo-trigger[data-frame="true"]') : null;
        if (clip && getComputedStyle(clip).overflowX !== 'clip') return true;
        const c = clip?.getBoundingClientRect();
        const left = c ? Math.max(r.left, c.left) : r.left;
        const right = c ? Math.min(r.right, c.right) : r.right;
        const frameButton = item.matches('.memory-photo-trigger[data-frame="true"]');
        if (frameButton && (getComputedStyle(item).overflowX !== 'clip' || item.scrollLeft !== 0 || item.scrollTop !== 0)) return true;
        return left < bounds.left - 1 || right > bounds.right + 1 || (!frameButton && item.scrollWidth > item.clientWidth + 2);
      });
    });
    expect(overflow).toBe(false);
    // Persist the real-page witness even when CI uses line/github reporters.
    if (info.project.name === 'chromium-core') {
      const cutout = section.locator('.memory-photo-trigger[data-cutout="true"]');
      await expect(cutout).toHaveCount(1);
      await cutout.scrollIntoViewIfNeeded();
      await mkdir('qa-artifacts', { recursive: true });
      const path = `qa-artifacts/museum-reveal-${theme}-story.png`;
      await section.locator('.memory-story').screenshot({ path, animations: 'disabled', style: '.site-header,.mobile-dock,.scroll-top-btn,[data-custom-cursor-dot],[data-custom-cursor-ring],.cursor-trail { visibility: hidden !important; }' });
      await info.attach(`museum-reveal-${theme}-story`, { path, contentType: 'image/png' });
    }
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
    else if (failure === 'frame') {
      const response = await route.fetch();
      const payload = await response.json();
      const preview = payload[0].photos.find(photo => photo.preview).preview;
      preview.frame = { x: -1, y: 192, width: 518, height: 908 };
      await route.fulfill({ response, json: payload });
    } else await route.continue();
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
  failure = 'frame';
  await section.getByRole('button', { name: 'Повторить' }).click();
  await expect(section.getByRole('button', { name: 'Повторить' })).toBeVisible();
  await expect(section.locator('article')).toHaveCount(0);
  failure = 'none';
  await section.getByRole('button', { name: 'Повторить' }).click();
  await expect(section.locator('article')).toHaveCount(1);
  await expect(section.locator('figure:has(img)')).toHaveCount(3);
  expect(errors).toEqual([]);
  expect(requests.length).toBeGreaterThanOrEqual(4);
  expect(requests.every(path => path.endsWith('/mikhail-lermontov.json'))).toBe(true);
  requests.length = 0;
  await page.goto(base + '/poets', { waitUntil: 'networkidle' });
  await expect(page.locator('#memory-places')).toHaveCount(0);
  expect(requests).toEqual([]);
});

// The preview and full photograph use the same source canvas, not two gallery entries.
test('cutout reveals its documentary original and falls back without a second gallery', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(base + '/poets/mikhail-lermontov#memory-places', { waitUntil: 'domcontentloaded' });
  const section = page.locator('#memory-places');
  const opener = section.locator('.memory-photo-trigger').nth(1);
  await opener.scrollIntoViewIfNeeded();
  const image = opener.locator('img');
  await expect(image).toHaveAttribute('data-image-state', 'loaded');
  await expect(image).toHaveAttribute('src', /figure-cutout\.webp$/);
  await expect(opener).toHaveAttribute('data-cutout', 'true');
  await expect(opener).toHaveAccessibleName(/оригинал/i);
  await expect(opener).toHaveAttribute('data-frame', 'true');
  const measureFrame = () => opener.evaluate(btn => {
    const b = btn.getBoundingClientRect();
    const img = btn.querySelector('img');
    const i = img.getBoundingClientRect();
    const scale = i.width / img.naturalWidth;
    return { width: b.width, height: b.height, left: i.left + 191 * scale - b.left,
      top: i.top + 223 * scale - b.top, right: i.left + 647 * scale - b.left,
      bottom: i.top + 1100 * scale - b.top, scrollLeft: btn.scrollLeft, scrollTop: btn.scrollTop };
  });
  const framed = await measureFrame();
  expect(framed.left).toBeGreaterThanOrEqual(-1);
  expect(framed.top).toBeGreaterThanOrEqual(-1);
  expect(framed.right).toBeLessThanOrEqual(framed.width + 1);
  expect(framed.bottom).toBeLessThanOrEqual(framed.height + 1);
  expect(framed.height).toBeLessThanOrEqual(481);
  expect(framed.scrollLeft).toBe(0);
  expect(framed.scrollTop).toBe(0);
  const sample = locator => locator.evaluate(node => {
    const canvas = document.createElement('canvas');
    canvas.width = node.naturalWidth; canvas.height = node.naturalHeight;
    const ctx = canvas.getContext('2d'); ctx.drawImage(node, 0, 0);
    return [[20,20],[410,450],[400,800]].map(([x,y]) => [...ctx.getImageData(x,y,1,1).data]);
  });
  const preview = await sample(image);
  expect(preview[0][3]).toBe(0);
  expect(preview[1][3]).toBe(255);
  expect(preview[2][3]).toBe(255);
  // Hold only the full photograph: prove the silhouette is painted first,
  // not merely that the eventual original has the correct source pixels.
  let releaseOriginal;
  const gate = new Promise(resolve => { releaseOriginal = resolve; });
  const holdOriginal = async route => { await gate; await route.continue(); };
  await page.route('**/figure.webp', holdOriginal);
  const gallery = page.getByRole('dialog', { name: 'Фотографии места памяти' });
  const original = gallery.locator('img');
  const stage = gallery.locator('.memory-gallery-stage');
  try {
    await opener.click();
    await expect(gallery).toBeVisible();
    await expect(original).toHaveAttribute('src', /figure\.webp$/);
    await expect(original).toHaveAttribute('data-image-state', 'loading');
    await expect(stage).toHaveAttribute('data-reveal', 'true');
    await expect(original).toHaveCSS('opacity', '0');
    const layer = await stage.evaluate(node => {
      const style = getComputedStyle(node, '::before');
      return { content: style.content, background: style.backgroundImage, position: style.position };
    });
    expect(layer.content).not.toBe('none');
    expect(layer.background).toMatch(/figure-cutout\.webp/);
    expect(layer.position).toBe('absolute');
    if (info.project.name === 'chromium-core') {
      await mkdir('qa-artifacts', { recursive: true });
      await stage.screenshot({ path: 'qa-artifacts/museum-reveal-gallery-start.png', animations: 'disabled' });
    }
  } finally {
    releaseOriginal();
  }
  await expect(original).toHaveAttribute('data-image-state', 'loaded');
  await page.unroute('**/figure.webp', holdOriginal);
  const full = await sample(original);
  expect(full[0][3]).toBe(255);
  expect(full.slice(1)).toEqual(preview.slice(1));
  await expect(stage).toHaveAttribute('data-reveal', 'false');
  await expect(original).toHaveCSS('opacity', '1');
  expect(await stage.evaluate(node => getComputedStyle(node, '::before').content)).toBe('none');
  if (info.project.name === 'chromium-core') {
    await stage.screenshot({ path: 'qa-artifacts/museum-reveal-gallery-end.png', animations: 'disabled' });
  }
  await page.keyboard.press('Escape');
  await expect(gallery).toHaveCount(0);
  await expect(opener).toBeFocused();
  await page.route('**/figure-cutout.webp', route => route.abort());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await opener.scrollIntoViewIfNeeded();
  await expect(image).toHaveAttribute('data-image-state', 'fallback');
  await expect(opener).toHaveAttribute('data-cutout', 'false');
  await expect(image).toHaveAttribute('src', /figure\.webp$/);
  const fallbackFrame = await measureFrame();
  expect(Math.abs(fallbackFrame.width - framed.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(fallbackFrame.height - framed.height)).toBeLessThanOrEqual(1);
  await expect(image).toHaveCSS('object-fit', 'contain');
  await opener.click();
  await expect(gallery).toBeVisible();
  await expect(gallery.locator('.memory-gallery-stage')).toHaveAttribute('data-reveal', 'false');
  await expect(original).toHaveAttribute('data-image-state', 'loaded');
  await page.keyboard.press('Escape');
  await expect(gallery).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test('changing motion preference while original loads retires reveal permanently', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  let releaseOriginal;
  const gate = new Promise(resolve => { releaseOriginal = resolve; });
  await page.route('**/figure.webp', async route => {
    await gate;
    await route.continue();
  });
  const gallery = page.getByRole('dialog', { name: 'Фотографии места памяти' });
  const stage = gallery.locator('.memory-gallery-stage');
  try {
    await page.goto(base + '/poets/mikhail-lermontov#memory-places', { waitUntil: 'domcontentloaded' });
    const opener = page.locator('#memory-places .memory-photo-trigger').nth(1);
    await opener.scrollIntoViewIfNeeded();
    await expect(opener).toHaveAttribute('data-cutout', 'true');
    await opener.click();
    await expect(stage).toHaveAttribute('data-reveal', 'true');
    await expect(gallery.locator('img')).toHaveAttribute('data-image-state', 'loading');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(stage).toHaveAttribute('data-reveal', 'false');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(stage).toHaveAttribute('data-reveal', 'false');
  } finally {
    releaseOriginal();
  }
  await expect(gallery.locator('img')).toHaveAttribute('data-image-state', 'loaded');
  await expect(stage).toHaveAttribute('data-reveal', 'false');
  await expect(gallery.locator('img')).toHaveCSS('opacity', '1');
  await page.keyboard.press('Escape');
  await expect(gallery).toHaveCount(0);
});
