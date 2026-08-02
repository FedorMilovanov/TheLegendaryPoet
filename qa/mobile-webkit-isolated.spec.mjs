import { test, expect } from '@playwright/test';
import path from 'node:path';
import {
  ARTIFACT_DIR,
  attachRuntimeDiagnostics,
  chooseRepresentativeLandmark,
  collectDiagnostics,
  effectiveOpacity,
  expectCleanRuntime,
  expectDiagnostics,
  expectDockInsideViewport,
  gotoRoute,
  scrollLocatorIntoViewport,
  writeArtifact,
} from './mobile-webkit-isolated.helpers.mjs';

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

test('WebKit home route keeps all principal sections, lazy content and mobile chrome stable', async ({ page }, testInfo) => {
  onlySafari(testInfo, 'isolated WebKit equivalent of generic and premium home scroll audits');
  const runtime = attachRuntimeDiagnostics(page);
  await gotoRoute(page, '/');

  const targets = [
    ['Поэтов в базе', page.getByText('Поэтов в базе', { exact: true })],
    ['Стихотворение дня', page.getByText('Стихотворение дня', { exact: true })],
    ['Избранные авторы', page.getByText('Избранные авторы', { exact: true })],
    ['Вера, культура и', page.getByText('Вера, культура и', { exact: false }).last()],
  ];
  const visited = [];
  for (const [label, target] of targets) {
    await scrollLocatorIntoViewport(page, target, label);
    await page.waitForTimeout(520);
    expect(await effectiveOpacity(target), `${label} should reveal after bounded WebKit scrolling`).toBeGreaterThan(0.9);
    visited.push(label);
  }

  const lowerDiagnostics = await collectDiagnostics(page);
  await gotoRoute(page, '/');
  await expectDockInsideViewport(page);
  const topDiagnostics = await collectDiagnostics(page);
  writeArtifact('iphone-safari-home-principal-sections.json', {
    project: testInfo.project.name,
    visited,
    runtime,
    lowerDiagnostics,
    topDiagnostics,
  });
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'iphone-safari-home-principal-sections.png'),
    fullPage: false,
  });

  expect(visited).toEqual(['Поэтов в базе', 'Стихотворение дня', 'Избранные авторы', 'Вера, культура и']);
  expect(lowerDiagnostics.pathname).toBe('/');
  expect(topDiagnostics.pathname).toBe('/');
  expectDiagnostics(lowerDiagnostics);
  expectDiagnostics(topDiagnostics, { requireTopChrome: true });
  expectCleanRuntime(runtime);
});

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
