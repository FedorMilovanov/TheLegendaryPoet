import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts', 'hover-stability');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const surfaces = [
  { name: 'articles', path: '/articles', image: 'a[href^="/essays/"] .hover-media' },
  { name: 'poets', path: '/poets', image: 'a[href^="/poets/"] .hover-media' },
  { name: 'music', path: '/music', image: '.hover-media' },
];

async function firstVisibleImage(page, selector) {
  const images = page.locator(selector);
  const count = await images.count();
  for (let index = 0; index < count; index += 1) {
    const image = images.nth(index);
    if (await image.isVisible()) return image;
  }
  return null;
}

async function imageSnapshot(image) {
  return image.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      connected: node.isConnected,
      src: node.currentSrc || node.src,
      naturalWidth: node.naturalWidth,
      naturalHeight: node.naturalHeight,
      state: node.dataset.imageState ?? 'native',
      opacity: Number(style.opacity),
      visibility: style.visibility,
      display: style.display,
      transform: style.transform,
      transitionProperty: style.transitionProperty,
    };
  });
}

for (const surface of surfaces) {
  test(`${surface.name} artwork stays loaded and opaque through pointer interaction`, async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error?.stack || error)));

    const response = await page.goto(`${BASE_URL}${surface.path}`, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);

    const image = await firstVisibleImage(page, surface.image);
    expect(image, `visible hover image on ${surface.path}`).not.toBeNull();
    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeVisible();
    await expect.poll(async () => (await imageSnapshot(image)).naturalWidth).toBeGreaterThan(0);

    const initial = await imageSnapshot(image);
    expect(initial.opacity).toBeGreaterThanOrEqual(0.9);
    expect(initial.transitionProperty).not.toContain('all');

    const finePointer = await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches);
    const box = await image.boundingBox();
    expect(box).not.toBeNull();

    const samples = [];
    if (finePointer) {
      const points = [
        [0.18, 0.22],
        [0.50, 0.42],
        [0.82, 0.68],
        [0.36, 0.78],
        [0.64, 0.28],
      ];
      for (const [x, y] of points) {
        await page.mouse.move(box.x + box.width * x, box.y + box.height * y, { steps: 5 });
        await page.waitForTimeout(70);
        samples.push(await imageSnapshot(image));
      }
      await page.mouse.move(1, 1, { steps: 4 });
      await page.waitForTimeout(420);
      samples.push(await imageSnapshot(image));
    } else {
      await page.evaluate(() => window.scrollBy({ top: 120, behavior: 'auto' }));
      await page.waitForTimeout(120);
      samples.push(await imageSnapshot(image));
    }

    for (const sample of samples) {
      expect(sample.connected).toBe(true);
      expect(sample.src).toBe(initial.src);
      expect(sample.naturalWidth).toBe(initial.naturalWidth);
      expect(sample.naturalHeight).toBe(initial.naturalHeight);
      expect(sample.state).not.toBe('failed');
      expect(sample.opacity).toBeGreaterThanOrEqual(0.9);
      expect(sample.visibility).not.toBe('hidden');
      expect(sample.display).not.toBe('none');
    }

    const compositor = await page.evaluate(() => {
      const inner = document.querySelector('.tilt-card-inner');
      const content = inner?.querySelector(':scope > .tilt-card-content');
      const directContent = inner?.querySelector(':scope > .luxury-card');
      return {
        hasTilt: Boolean(inner),
        hasStableContentPlane: Boolean(content),
        hasLegacyDirectCard: Boolean(directContent),
        innerBackface: inner ? getComputedStyle(inner).backfaceVisibility : null,
      };
    });

    if (surface.name !== 'music') {
      expect(compositor.hasTilt).toBe(true);
      expect(compositor.hasStableContentPlane).toBe(true);
      expect(compositor.hasLegacyDirectCard).toBe(false);
      expect(compositor.innerBackface).toBe('hidden');
    }

    expect(errors).toEqual([]);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-${surface.name}.png`),
      fullPage: false,
    });
  });
}
