import { test, expect } from '@playwright/test';
import path from 'node:path';
import {
  ARTIFACT_DIR,
  attachRuntimeDiagnostics,
  chooseRepresentativeLandmark,
  collectDiagnostics,
  expectCleanRuntime,
  expectDiagnostics,
  expectDockInsideViewport,
  gotoRoute,
  scrollLocatorIntoViewport,
  writeArtifact,
} from './mobile-webkit-isolated.helpers.mjs';

const HOME_SECTIONS = [
  { slug: 'poet-count', label: 'Поэтов в базе', exact: true },
  { slug: 'poem-of-day', label: 'Стихотворение дня', exact: true },
  { slug: 'featured-poets', label: 'Избранные авторы', exact: true, verifyChromeReset: true },
  { slug: 'faith-culture', label: 'Вера, культура и', exact: false },
];

const ROUTES = [
  ['poets', '/poets'],
  ['ratings', '/ratings'],
  ['articles', '/articles'],
  ['music', '/music'],
  ['archive', '/archive'],
  ['about', '/about'],
  ['not-found', '/mobile-platform-route-that-does-not-exist'],
];

function onlySafari(testInfo, reason) {
  test.skip(testInfo.project.name !== 'iphone-safari', reason);
}

async function locateHomeRevealSurface(page, { slug, label, exact }) {
  const target = exact
    ? page.getByText(label, { exact: true }).first()
    : page.getByText(label, { exact: false }).last();
  await target.waitFor({ state: 'attached', timeout: 20_000 });

  const marked = await target.evaluate((node, key) => {
    let current = node;
    let animatedSurface = null;
    while (current && current.id !== 'main-content') {
      const inlineStyle = current.getAttribute('style') || '';
      if (/(?:^|;)\s*(?:opacity|filter|transform)\s*:/.test(inlineStyle)) {
        animatedSurface = current;
        break;
      }
      current = current.parentElement;
    }
    const surface = animatedSurface || node.closest('section') || node;
    if (!(surface instanceof HTMLElement)) return false;
    surface.dataset.qaHomeRevealSurface = key;
    if (node instanceof HTMLElement) node.dataset.qaHomeRevealLabel = key;
    return true;
  }, slug);
  expect(marked, `${label} reveal surface should be discoverable`).toBe(true);

  return {
    target: page.locator(`[data-qa-home-reveal-label="${slug}"]`),
    surface: page.locator(`[data-qa-home-reveal-surface="${slug}"]`),
  };
}

async function inspectRevealSurface(surface) {
  return surface.evaluate((node) => {
    let effectiveOpacity = 1;
    let current = node;
    while (current && current !== document.documentElement) {
      effectiveOpacity *= Number.parseFloat(getComputedStyle(current).opacity || '1');
      current = current.parentElement;
    }
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    const filter = style.filter || 'none';
    const blurMatch = /blur\(([-\d.]+)px\)/.exec(filter);
    const blurPx = blurMatch ? Math.abs(Number.parseFloat(blurMatch[1])) : 0;
    return {
      effectiveOpacity,
      filter,
      blurPx,
      intersectsViewport: rect.width > 2 && rect.height > 2 && rect.bottom > 0 && rect.top < window.innerHeight,
      width: rect.width,
      height: rect.height,
    };
  });
}

async function waitForStableRevealSurface(surface, label) {
  let stableSamples = 0;
  let visual = null;
  await expect.poll(
    async () => {
      visual = await inspectRevealSurface(surface);
      const ready = visual.intersectsViewport
        && visual.width > 2
        && visual.height > 2
        && visual.effectiveOpacity > 0.9
        && visual.blurPx <= 0.05;
      stableSamples = ready ? stableSamples + 1 : 0;
      return stableSamples;
    },
    {
      timeout: 8_000,
      intervals: [120, 180, 240, 320],
      message: `${label} reveal surface should remain visually final for three samples`,
    },
  ).toBeGreaterThanOrEqual(3);
  return visual;
}

for (const section of HOME_SECTIONS) {
  test(`WebKit home principal section ${section.slug} reveals in a fresh context`, async ({ page }, testInfo) => {
    onlySafari(testInfo, 'one native WebKit home scroll per fresh page/context');
    const runtime = attachRuntimeDiagnostics(page);
    await gotoRoute(page, '/');
    const { target, surface } = await locateHomeRevealSurface(page, section);

    // One protocol-level locator scroll per fresh context drives WebKit's real
    // IntersectionObserver without recreating the previous cumulative stress.
    // The assertion targets the Framer Motion reveal surface, not its inner text.
    await surface.scrollIntoViewIfNeeded();
    await expect(surface).toBeInViewport();
    const visual = await waitForStableRevealSurface(surface, section.label);

    const diagnostics = await collectDiagnostics(page);
    let topDiagnostics = null;
    if (section.verifyChromeReset) {
      await gotoRoute(page, '/');
      await expectDockInsideViewport(page);
      topDiagnostics = await collectDiagnostics(page);
    }
    writeArtifact(`iphone-safari-home-${section.slug}.json`, {
      project: testInfo.project.name,
      section,
      visual,
      diagnostics,
      topDiagnostics,
      runtime,
    });
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `iphone-safari-home-${section.slug}.png`),
      fullPage: false,
    });

    expect(visual).not.toBeNull();
    await expect(target).toBeVisible();
    expect(diagnostics.pathname).toBe('/');
    expectDiagnostics(diagnostics);
    if (topDiagnostics) expectDiagnostics(topDiagnostics, { requireTopChrome: true });
    expectCleanRuntime(runtime);
  });
}

for (const [name, route] of ROUTES) {
  test(`WebKit ${name} route keeps one representative lazy landmark and runtime stable`, async ({ page }, testInfo) => {
    onlySafari(testInfo, 'isolated WebKit route probe');
    const runtime = attachRuntimeDiagnostics(page);
    await gotoRoute(page, route);
    const landmark = await chooseRepresentativeLandmark(page);
    await scrollLocatorIntoViewport(page, landmark, `${name} representative landmark`);
    const lowerDiagnostics = await collectDiagnostics(page);

    // A navigation reset is safer in Linux WebKit than a second sequence of
    // upward scroll commands, while the lower landmark has already been proved.
    await gotoRoute(page, route);
    await expectDockInsideViewport(page);
    const topDiagnostics = await collectDiagnostics(page);
    writeArtifact(`iphone-safari-${name}-isolated-route.json`, {
      project: testInfo.project.name,
      name,
      route,
      runtime,
      lowerDiagnostics,
      topDiagnostics,
    });
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `iphone-safari-${name}-isolated-route.png`),
      fullPage: false,
    });

    expectDiagnostics(lowerDiagnostics);
    expectDiagnostics(topDiagnostics, { requireTopChrome: true });
    expectCleanRuntime(runtime);
  });
}

test('WebKit home dock, search sheet and tap targets remain usable in a fresh context', async ({ page }, testInfo) => {
  onlySafari(testInfo, 'isolated replacement for the generic Safari dock/search test');
  const runtime = attachRuntimeDiagnostics(page);
  await gotoRoute(page, '/');
  await expectDockInsideViewport(page);

  const dock = page.locator('.mobile-dock');
  const tapTargets = await dock.locator('a, button').evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return {
      name: element.getAttribute('aria-label') || element.textContent?.trim() || element.tagName,
      width: rect.width,
      height: rect.height,
    };
  }));
  expect(tapTargets.length).toBeGreaterThanOrEqual(4);
  for (const target of tapTargets) {
    expect(target.width, `${target.name} touch width`).toBeGreaterThanOrEqual(44);
    expect(target.height, `${target.name} touch height`).toBeGreaterThanOrEqual(44);
  }

  const searchButtons = page.getByRole('button', { name: /поиск/i });
  expect(await searchButtons.count()).toBeGreaterThan(0);
  await searchButtons.last().tap();
  const dialog = page.getByRole('dialog', { name: 'Поиск по сайту' });
  const input = page.getByRole('combobox', { name: 'Поисковый запрос' });
  await expect(dialog).toBeVisible();
  await expect(input).toBeFocused();
  await input.fill('Есенин');
  await expect(page.getByRole('listbox', { name: 'Результаты поиска' })).toBeVisible();

  const focusedState = await page.evaluate(() => ({
    activeTag: document.activeElement?.tagName,
    scrollLocked: getComputedStyle(document.body).overflow === 'hidden',
    modalOpen: Boolean(window.__TLP_MODAL_OPEN),
    visualViewportHeight: window.visualViewport?.height ?? null,
  }));
  expect(focusedState.activeTag).toBe('INPUT');
  expect(focusedState.scrollLocked).toBe(true);
  expect(focusedState.modalOpen).toBe(true);
  expect(focusedState.visualViewportHeight).not.toBeNull();

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'iphone-safari-search-sheet-isolated.png'),
    fullPage: false,
  });
  await page.getByRole('button', { name: 'Закрыть поиск' }).tap();
  await expect(dialog).toBeHidden();
  await expect.poll(() => page.evaluate(() => Boolean(window.__TLP_MODAL_OPEN))).toBe(false);
  expectCleanRuntime(runtime);
});
