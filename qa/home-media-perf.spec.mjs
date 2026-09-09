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

test('home hero media releases deferred portraits only after the browser load boundary', async ({ page }, testInfo) => {
  const derivativeRequests = [];
  const allPortraitRequests = [];

  await page.addInitScript(() => {
    const portraitPattern = /\/images\/(yesenin|lermontov|pushkin|tyutchev|mayakovsky|fet)(?:-(?:320|480))?\.jpg(?:\?|$)/;
    const timeline = {
      loadAt: null,
      releases: {},
    };
    window.__tlpHeroReleaseQa = timeline;

    const recordDeferredRelease = (candidate) => {
      if (!(candidate instanceof HTMLImageElement)) return;
      if (candidate.getAttribute('data-hero-portrait-critical') !== 'false') return;
      if (candidate.getAttribute('data-hero-portrait-released') !== 'true') return;

      const source = candidate.getAttribute('src') || candidate.currentSrc || '';
      const match = portraitPattern.exec(source);
      const poet = match?.[1];
      if (!poet || timeline.releases[poet]) return;

      timeline.releases[poet] = {
        at: performance.now(),
        loadAtWhenReleased: timeline.loadAt,
        src: source,
      };
    };

    const inspectNode = (node) => {
      if (!(node instanceof Element)) return;
      if (node instanceof HTMLImageElement) recordDeferredRelease(node);
      for (const image of node.querySelectorAll('img[data-hero-portrait-released="true"]')) {
        recordDeferredRelease(image);
      }
    };

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          recordDeferredRelease(mutation.target);
          continue;
        }
        for (const node of mutation.addedNodes) inspectNode(node);
      }
    });

    observer.observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-hero-portrait-released', 'src'],
    });

    window.addEventListener('load', () => {
      timeline.loadAt = performance.now();
      for (const image of document.querySelectorAll('img[data-hero-portrait-released="true"]')) {
        recordDeferredRelease(image);
      }
    }, { once: true });
  });

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

  await page.goto(BASE_URL, { waitUntil: 'load' });
  await waitForAllHeroPortraits(page);

  const releaseTimeline = await page.evaluate(() => window.__tlpHeroReleaseQa);
  expect(typeof releaseTimeline?.loadAt).toBe('number');
  expect(Number.isFinite(releaseTimeline.loadAt)).toBe(true);
  expect(new Set(Object.keys(releaseTimeline.releases))).toEqual(DEFERRED_NAMES);

  for (const poet of DEFERRED_NAMES) {
    const release = releaseTimeline.releases[poet];
    expect(release).toBeTruthy();
    expect(typeof release.loadAtWhenReleased).toBe('number');
    expect(Number.isFinite(release.loadAtWhenReleased)).toBe(true);
    expect(release.at).toBeGreaterThanOrEqual(release.loadAtWhenReleased);
    expect(release.at).toBeGreaterThanOrEqual(releaseTimeline.loadAt);
  }

  expect(derivativeRequests).toHaveLength(6);
  expect(new Set(derivativeRequests.map((request) => request.identity.poet))).toEqual(new Set(HERO_NAMES));
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
      releaseTimeline,
      imageState,
      derivativeRequests,
      allPortraitRequests,
    }, null, 2),
  );
});

test('home hero media preserves layout geometry while deferred images release', async ({ page }, testInfo) => {
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

  const readLayoutBoxes = async () => page.locator('[data-hero-poet-window-surface]').evaluateAll((nodes) => nodes.map((node) => {
    let x = 0;
    let y = 0;
    let current = node;
    while (current instanceof HTMLElement) {
      x += current.offsetLeft;
      y += current.offsetTop;
      current = current.offsetParent;
    }
    return {
      x,
      y,
      width: node.offsetWidth,
      height: node.offsetHeight,
    };
  }));

  try {
    await page.goto(BASE_URL, { waitUntil: 'load' });
    await expect(page.locator('[data-hero-poet-window]')).toHaveCount(6, { timeout: 20_000 });
    await expect.poll(() => held.length, { timeout: 12_000, message: 'all four deferred hero derivatives should start only after load' }).toBe(4);
    expect(new Set(held.map((request) => request.identity.poet))).toEqual(DEFERRED_NAMES);

    const before = await readLayoutBoxes();

    releaseDeferred();
    await waitForAllHeroPortraits(page);

    const after = await readLayoutBoxes();

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
