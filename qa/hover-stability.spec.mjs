import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts', 'hover-stability');
const MAX_IMAGES_PER_SURFACE = 6;
const MAX_CANDIDATES_PER_SURFACE = 16;
const INTERACTIVE_MEDIA_SELECTOR = [
  'img.hover-media',
  'img[class*="group-hover:scale-"]',
  'img[class*="hover:scale-"]',
  'img[class*="group-focus-within:scale-"]',
  'img[class*="focus-visible:scale-"]',
  'img[class*="group-hover:rotate-"]',
  'img[class*="hover:rotate-"]',
  'img[class*="group-hover:translate-"]',
  'img[class*="hover:translate-"]',
  'img[class*="group-hover:saturate-"]',
  'img[class*="hover:saturate-"]',
  'img[class*="group-hover:brightness-"]',
  'img[class*="hover:brightness-"]',
  'img[class*="group-hover:contrast-"]',
  'img[class*="hover:contrast-"]',
  'img[class*="group-hover:opacity-"]',
  'img[class*="hover:opacity-"]',
].join(',');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const surfaces = [
  { name: 'home', path: '/', minimum: 0 },
  { name: 'articles', path: '/articles', minimum: 1 },
  { name: 'essay', path: '/essays/yesenin-duncan-first-meeting-documents', minimum: 1 },
  { name: 'poets', path: '/poets', minimum: 1 },
  { name: 'music', path: '/music', minimum: 1 },
  { name: 'archive', path: '/archive', minimum: 0 },
  { name: 'ratings', path: '/ratings', minimum: 0 },
];

async function getSampledImages(page) {
  const images = page.locator(INTERACTIVE_MEDIA_SELECTOR);
  const sampledImages = [];
  const count = Math.min(await images.count(), MAX_CANDIDATES_PER_SURFACE);
  for (let index = 0; index < count && sampledImages.length < MAX_IMAGES_PER_SURFACE; index += 1) {
    const image = images.nth(index);
    await image.scrollIntoViewIfNeeded().catch(() => undefined);
    if (await image.isVisible()) sampledImages.push(image);
  }
  return sampledImages;
}

async function imageSnapshot(image) {
  return image.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      connected: node.isConnected,
      src: node.currentSrc || node.src,
      complete: node.complete,
      naturalWidth: node.naturalWidth,
      naturalHeight: node.naturalHeight,
      state: node.dataset.imageState ?? 'native',
      opacity: Number(style.opacity),
      visibility: style.visibility,
      display: style.display,
      transform: style.transform,
      transitionProperty: style.transitionProperty,
      backfaceVisibility: style.backfaceVisibility,
    };
  });
}

async function ensureNativeImageReady(image) {
  await image.scrollIntoViewIfNeeded();
  await expect(image).toBeVisible();
  await image.evaluate(async (node) => {
    node.loading = 'eager';
    if (node.complete) return;
    await Promise.race([
      new Promise((resolve) => {
        node.addEventListener('load', resolve, { once: true });
        node.addEventListener('error', resolve, { once: true });
      }),
      new Promise((resolve) => setTimeout(resolve, 12_000)),
    ]);
  });
  await expect.poll(
    async () => {
      const snapshot = await imageSnapshot(image);
      return snapshot.connected
        && snapshot.complete
        && snapshot.naturalWidth > 0
        && snapshot.state !== 'failed'
        && snapshot.opacity > 0
        && snapshot.visibility !== 'hidden'
        && snapshot.display !== 'none';
    },
    { timeout: 15_000, message: 'native image completed and its reveal transition settled visibly' },
  ).toBe(true);
}

async function samplePointerInteraction(page, image, finePointer) {
  const samples = [];
  const box = await image.boundingBox();
  expect(box).not.toBeNull();

  if (finePointer) {
    for (const [x, y] of [[0.2, 0.2], [0.5, 0.5], [0.8, 0.72]]) {
      await page.mouse.move(box.x + box.width * x, box.y + box.height * y, { steps: 5 });
      await page.waitForTimeout(70);
      samples.push(await imageSnapshot(image));
    }
    await page.mouse.move(2, 2, { steps: 4 });
    await page.waitForTimeout(380);
    samples.push(await imageSnapshot(image));
  } else {
    await page.evaluate(() => window.scrollBy({ top: 72, behavior: 'auto' }));
    await page.waitForTimeout(140);
    samples.push(await imageSnapshot(image));
  }

  return samples;
}

function assertStableSamples(initial, samples) {
  const minimumOpacity = Math.max(0, initial.opacity - 0.05);
  for (const sample of samples) {
    expect(sample.connected).toBe(true);
    expect(sample.src).toBe(initial.src);
    expect(sample.complete).toBe(true);
    expect(sample.naturalWidth).toBe(initial.naturalWidth);
    expect(sample.naturalHeight).toBe(initial.naturalHeight);
    expect(sample.state).not.toBe('failed');
    expect(sample.opacity).toBeGreaterThanOrEqual(minimumOpacity);
    expect(sample.visibility).not.toBe('hidden');
    expect(sample.display).not.toBe('none');
    expect(sample.backfaceVisibility).toBe('hidden');
  }
}

for (const surface of surfaces) {
  test(`${surface.name} interactive artwork uses the universal stable-hover contract`, async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error?.stack || error)));

    const response = await page.goto(`${BASE_URL}${surface.path}`, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);
    await page.waitForLoadState('networkidle').catch(() => undefined);

    if (surface.minimum > 0) {
      await expect.poll(
        async () => page.locator(INTERACTIVE_MEDIA_SELECTOR).count(),
        { timeout: 15_000, message: `interactive artwork on ${surface.path}` },
      ).toBeGreaterThanOrEqual(surface.minimum);
    }

    const unprotected = await page.locator(INTERACTIVE_MEDIA_SELECTOR).evaluateAll((images) => images
      .filter((image) => getComputedStyle(image).backfaceVisibility !== 'hidden')
      .map((image) => ({
        alt: image.getAttribute('alt') ?? '',
        className: image.className,
        src: image.getAttribute('src') ?? '',
        backfaceVisibility: getComputedStyle(image).backfaceVisibility,
      })));
    expect(unprotected, `interactive artwork without compositor protection on ${surface.path}`).toEqual([]);

    const sampledImages = await getSampledImages(page);
    const finePointer = await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches);

    for (const image of sampledImages) {
      await ensureNativeImageReady(image);

      const initial = await imageSnapshot(image);
      expect(initial.opacity).toBeGreaterThan(0);
      expect(initial.state).not.toBe('failed');
      expect(initial.transitionProperty).not.toContain('all');
      expect(initial.backfaceVisibility).toBe('hidden');
      const samples = await samplePointerInteraction(page, image, finePointer);
      assertStableSamples(initial, samples);

      const compositor = await image.evaluate((node) => {
        const inner = node.closest('.tilt-card-inner');
        const content = inner?.querySelector(':scope > .tilt-card-content');
        const directCard = inner?.querySelector(':scope > .luxury-card');
        return {
          hasTilt: Boolean(inner),
          hasStableContentPlane: Boolean(content),
          hasLegacyDirectCard: Boolean(directCard),
          innerBackface: inner ? getComputedStyle(inner).backfaceVisibility : null,
        };
      });

      if (compositor.hasTilt) {
        expect(compositor.hasStableContentPlane).toBe(true);
        expect(compositor.hasLegacyDirectCard).toBe(false);
        expect(compositor.innerBackface).toBe('hidden');
      }
    }

    expect(errors).toEqual([]);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-${surface.name}.png`),
      fullPage: false,
    });
  });
}
