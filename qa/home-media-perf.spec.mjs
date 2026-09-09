import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
const HERO_NAMES = ['yesenin', 'lermontov', 'pushkin', 'tyutchev', 'mayakovsky', 'fet'];
const CRITICAL_NAMES = new Set(['yesenin', 'lermontov']);
const DEFERRED_NAMES = new Set(['pushkin', 'tyutchev', 'mayakovsky', 'fet']);
const PORTRAIT_PATTERN = /\/images\/(yesenin|lermontov|pushkin|tyutchev|mayakovsky|fet)(?:-(320|480))?\.jpg(?:\?|$)/;

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

function portraitIdentity(url) {
  const match = PORTRAIT_PATTERN.exec(url);
  if (!match) return null;
  return { poet: match[1], width: match[2] ? Number(match[2]) : 1000 };
}

function isHeroDerivative(identity) {
  return Boolean(identity && identity.width !== 1000);
}

async function waitForAllHeroPortraits(page) {
  const images = page.locator('[data-hero-poet-window] img');
  await expect(images).toHaveCount(6, { timeout: 20_000 });
  await expect.poll(
    () => images.evaluateAll((nodes) => nodes.every((image) => (
      image.getAttribute('data-hero-portrait-released') === 'true'
      && image.complete
      && image.naturalWidth > 0
      && image.naturalHeight > 0
    ))),
    { timeout: 20_000, message: 'all six responsive hero portraits should release and decode' },
  ).toBe(true);
}

test('home hero media keeps two critical requests before load and uses bounded responsive candidates', async ({ page }, testInfo) => {
  let loadObserved = false;
  const heroDerivativeRequests = [];
  const allPortraitRequests = [];

  page.on('request', (request) => {
    const identity = portraitIdentity(request.url());
    if (!identity) return;

    const record = {
      url: request.url(),
      identity,
      phase: loadObserved ? 'post-load' : 'pre-load',
      resourceType: request.resourceType(),
    };
    allPortraitRequests.push(record);
    if (isHeroDerivative(identity)) heroDerivativeRequests.push(record);
  });
  page.once('load', () => {
    loadObserved = true;
  });

  await page.goto(BASE_URL, { waitUntil: 'load' });
  await waitForAllHeroPortraits(page);

  const images = page.locator('[data-hero-poet-window] img');
  const imageState = await images.evaluateAll((nodes) => nodes.map((image) => ({
    loading: image.getAttribute('loading'),
    fetchPriority: image.getAttribute('fetchpriority'),
    critical: image.getAttribute('data-hero-portrait-critical'),
    released: image.getAttribute('data-hero-portrait-released'),
    src: image.getAttribute('src'),
    currentSrc: image.currentSrc,
    srcSet: image.getAttribute('srcset'),
    sizes: image.getAttribute('sizes'),
  })));

  expect(imageState.slice(0, 2).every((image) => (
    image.loading === 'eager'
    && image.fetchPriority === 'high'
    && image.critical === 'true'
    && image.released === 'true'
  ))).toBe(true);
  expect(imageState.slice(2).every((image) => (
    image.loading === 'lazy'
    && image.fetchPriority === 'low'
    && image.critical === 'false'
    && image.released === 'true'
  ))).toBe(true);
  expect(imageState.every((image) => image.srcSet?.includes(' 320w') && image.srcSet?.includes(' 480w') && image.srcSet?.includes(' 1000w'))).toBe(true);
  expect(imageState.every((image) => Boolean(image.sizes))).toBe(true);

  // The fallback `src` itself is bounded to 320w. This prevents a transient
  // full-size request while the browser parses responsive metadata. The six
  // derivative URLs are unique to the hero surface, so Playwright protocol
  // request events provide cross-browser network evidence without depending on
  // optional Resource Timing exposure (which Linux WebKit may omit).
  const boundedFallbacks = imageState.map((image) => portraitIdentity(image.src || ''));
  expect(boundedFallbacks.every((candidate) => candidate?.width === 320)).toBe(true);

  expect(heroDerivativeRequests).toHaveLength(6);
  expect(new Set(heroDerivativeRequests.map((request) => request.identity.poet))).toEqual(new Set(HERO_NAMES));
  expect(heroDerivativeRequests.every((request) => request.resourceType === 'image')).toBe(true);

  const preLoad = heroDerivativeRequests.filter((request) => request.phase === 'pre-load');
  const postLoad = heroDerivativeRequests.filter((request) => request.phase === 'post-load');
  expect(preLoad).toHaveLength(2);
  expect(new Set(preLoad.map((request) => request.identity.poet))).toEqual(CRITICAL_NAMES);
  expect(postLoad).toHaveLength(4);
  expect(new Set(postLoad.map((request) => request.identity.poet))).toEqual(DEFERRED_NAMES);

  const expectedWidth = testInfo.project.name === 'home-desktop' ? 320 : 480;
  expect(heroDerivativeRequests.every((request) => request.identity.width === expectedWidth)).toBe(true);

  const currentCandidates = imageState.map((image) => portraitIdentity(image.currentSrc));
  expect(currentCandidates.every(Boolean)).toBe(true);
  expect(currentCandidates.every((candidate) => candidate.width === expectedWidth)).toBe(true);

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, `${testInfo.project.name}-home-media-perf.json`),
    JSON.stringify({
      project: testInfo.project.name,
      imageState,
      heroDerivativeRequests,
      allPortraitRequests,
    }, null, 2),
  );
});

test('home hero media preserves portrait geometry while deferred images release', async ({ page }, testInfo) => {
  let releaseDeferred;
  const gate = new Promise((resolve) => { releaseDeferred = resolve; });
  const held = [];

  await page.route('**/images/*.jpg', async (route) => {
    const identity = portraitIdentity(route.request().url());
    if (isHeroDerivative(identity) && DEFERRED_NAMES.has(identity.poet)) {
      held.push({ url: route.request().url(), identity });
      await gate;
    }
    await route.continue();
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'load' });
    await expect(page.locator('[data-hero-poet-window]')).toHaveCount(6, { timeout: 20_000 });
    await expect.poll(() => held.length, { timeout: 12_000, message: 'all four deferred hero derivatives should start only after load' }).toBe(4);
    expect(new Set(held.map((request) => request.identity.poet))).toEqual(DEFERRED_NAMES);

    const before = await page.locator('[data-hero-poet-window-surface]').evaluateAll((nodes) => nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }));

    releaseDeferred();
    await waitForAllHeroPortraits(page);

    const after = await page.locator('[data-hero-poet-window-surface]').evaluateAll((nodes) => nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }));

    expect(after).toHaveLength(before.length);
    for (let index = 0; index < before.length; index += 1) {
      expect(Math.abs(after[index].x - before[index].x)).toBeLessThanOrEqual(1);
      expect(Math.abs(after[index].y - before[index].y)).toBeLessThanOrEqual(1);
      expect(Math.abs(after[index].width - before[index].width)).toBeLessThanOrEqual(1);
      expect(Math.abs(after[index].height - before[index].height)).toBeLessThanOrEqual(1);
    }

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, `${testInfo.project.name}-home-media-layout.json`),
      JSON.stringify({ project: testInfo.project.name, held, before, after }, null, 2),
    );
  } finally {
    releaseDeferred?.();
  }
});
