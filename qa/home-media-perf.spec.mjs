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

test('home hero media issues only two critical derivatives while window load is physically blocked', async ({ page }, testInfo) => {
  let releaseCritical;
  const criticalGate = new Promise((resolve) => { releaseCritical = resolve; });
  const derivativeRequests = [];
  const allPortraitRequests = [];

  page.on('request', (request) => {
    const identity = portraitIdentity(request.url());
    if (!identity) return;

    const record = {
      url: request.url(),
      identity,
      resourceType: request.resourceType(),
    };
    allPortraitRequests.push(record);
    if (isHeroDerivative(identity)) derivativeRequests.push(record);
  });

  await page.route('**/images/*.jpg', async (route) => {
    const identity = portraitIdentity(route.request().url());
    if (isHeroDerivative(identity) && CRITICAL_NAMES.has(identity.poet)) {
      await criticalGate;
    }
    await route.continue();
  });

  try {
    // DOMContentLoaded can complete while the two eager hero responses are held.
    // Because those responses are still outstanding, window.load cannot have
    // completed. The deferred four have no src until the production load + RAF
    // release path runs, so they must be absent from the request set here.
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await expect.poll(
      () => derivativeRequests.length,
      { timeout: 12_000, message: 'exactly two critical hero derivatives should start before window load can complete' },
    ).toBe(2);
    await page.waitForTimeout(250);

    expect(derivativeRequests).toHaveLength(2);
    expect(new Set(derivativeRequests.map((request) => request.identity.poet))).toEqual(CRITICAL_NAMES);
    expect(derivativeRequests.every((request) => request.resourceType === 'image')).toBe(true);
    expect(derivativeRequests.some((request) => DEFERRED_NAMES.has(request.identity.poet))).toBe(false);

    releaseCritical();
    await page.waitForLoadState('load');

    // Production releases the remaining four only from the window.load handler
    // on the next animation frame. Require the complete exact six-poet set after
    // load rather than inferring phase from Playwright event callback ordering.
    await expect.poll(
      () => derivativeRequests.length,
      { timeout: 12_000, message: 'four deferred hero derivatives should start after the critical pair allows window load' },
    ).toBe(6);
    await waitForAllHeroPortraits(page);

    expect(new Set(derivativeRequests.map((request) => request.identity.poet))).toEqual(new Set(HERO_NAMES));
    const deferredRequests = derivativeRequests.filter((request) => DEFERRED_NAMES.has(request.identity.poet));
    expect(deferredRequests).toHaveLength(4);
    expect(new Set(deferredRequests.map((request) => request.identity.poet))).toEqual(DEFERRED_NAMES);
    expect(derivativeRequests.every((request) => request.resourceType === 'image')).toBe(true);

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

    // The fallback src itself is bounded to 320w, preventing a transient
    // full-size fallback while responsive metadata is applied.
    const boundedFallbacks = imageState.map((image) => portraitIdentity(image.src || ''));
    expect(boundedFallbacks.every((candidate) => candidate?.width === 320)).toBe(true);

    const expectedWidth = testInfo.project.name === 'home-desktop' ? 320 : 480;
    expect(derivativeRequests.every((request) => request.identity.width === expectedWidth)).toBe(true);

    const currentCandidates = imageState.map((image) => portraitIdentity(image.currentSrc));
    expect(currentCandidates.every(Boolean)).toBe(true);
    expect(currentCandidates.every((candidate) => candidate.width === expectedWidth)).toBe(true);

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, `${testInfo.project.name}-home-media-perf.json`),
      JSON.stringify({
        project: testInfo.project.name,
        imageState,
        derivativeRequests,
        allPortraitRequests,
      }, null, 2),
    );
  } finally {
    releaseCritical?.();
  }
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
