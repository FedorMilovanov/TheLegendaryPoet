import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts', 'reader-journeys');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function waitForRoute(page) {
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
  await page.waitForTimeout(500);
}

function attachRuntimeDiagnostics(page) {
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/Failed to load resource/i.test(text)) return;
    consoleErrors.push(text);
  });
  return { pageErrors, consoleErrors };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test.describe('reader outcome journeys', () => {
  test.use({ locale: 'ru-RU', timezoneId: 'Europe/Paris', colorScheme: 'dark' });

  test('saved poem travels through archive search and returns to the exact poem', async ({ page }, testInfo) => {
    const runtime = attachRuntimeDiagnostics(page);
    await page.goto(`${BASE_URL}/poets/sergei-yesenin`, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);

    const addButton = page.getByRole('button', { name: /^Добавить «.+» в архив$/ }).first();
    await addButton.scrollIntoViewIfNeeded();
    const discoveredPoemCard = addButton.locator('xpath=ancestor::*[starts-with(@id,"poem-")][1]');
    const poemCardId = await discoveredPoemCard.getAttribute('id');
    const title = (await discoveredPoemCard.locator('h3').first().innerText()).replace(/[«»]/g, '').trim();
    expect(poemCardId).toMatch(/^poem-/);
    expect(title.length).toBeGreaterThan(1);

    // Freeze the card identity before clicking. A locator chained from the
    // “Добавить” button becomes empty as soon as the accessible name changes
    // to “Убрать”, even though the same card remains mounted and updates
    // correctly. The stable id proves the exact reader outcome instead.
    const poemCard = page.locator(`#${poemCardId}`);
    await expect(poemCard).toBeVisible();
    await addButton.click();
    const savedButton = poemCard.getByRole('button', { name: /^Убрать «.+» из архива$/ });
    await expect(savedButton).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('status').filter({ hasText: 'Добавлено в архив' })).toBeVisible();

    await page.goto(`${BASE_URL}/archive`, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);
    await expect(page.getByRole('heading', { level: 1, name: /Мой Архив/i })).toBeVisible();

    const exactHref = `/poets/sergei-yesenin#${poemCardId}`;
    const archivedLink = page.locator(`a[href="${exactHref}"]`);
    await expect(archivedLink).toBeVisible();

    const search = page.getByRole('searchbox', { name: 'Поиск по сохранённым стихам' });
    await search.fill(title);
    await expect(archivedLink).toBeVisible();
    const sortByRating = page.getByRole('button', { name: 'По рейтингу' });
    await sortByRating.click();
    await expect(sortByRating).toHaveAttribute('aria-pressed', 'true');

    await archivedLink.click();
    await expect(page).toHaveURL(new RegExp(`${escapeRegExp(exactHref)}$`));
    await waitForRoute(page);
    const restoredCard = page.locator(`#${poemCardId}`);
    await restoredCard.scrollIntoViewIfNeeded();
    await expect(restoredCard).toBeVisible();
    await expect(restoredCard.getByRole('button', { name: /^Убрать «.+» из архива$/ })).toHaveAttribute('aria-pressed', 'true');

    await page.screenshot({ path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-archive-roundtrip.png`), fullPage: false });
    expect(runtime.pageErrors).toEqual([]);
    expect(runtime.consoleErrors).toEqual([]);
  });

  test('blocked archive storage reports failure without dishonest success state', async ({ page }, testInfo) => {
    const runtime = attachRuntimeDiagnostics(page);
    await page.addInitScript((storageKey) => {
      const original = Storage.prototype.setItem;
      Object.defineProperty(Storage.prototype, 'setItem', {
        configurable: true,
        value(key, value) {
          if (key === storageKey) throw new DOMException('Archive storage blocked', 'QuotaExceededError');
          return original.call(this, key, value);
        },
      });
    }, 'tlp-my-archive:v3');

    await page.goto(`${BASE_URL}/poets/sergei-yesenin`, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);
    const addButton = page.getByRole('button', { name: /^Добавить «.+» в архив$/ }).first();
    await addButton.scrollIntoViewIfNeeded();
    await addButton.click();

    await expect(page.getByRole('status').filter({ hasText: 'Не удалось изменить архив' })).toBeVisible();
    await expect(addButton).toHaveAttribute('aria-pressed', 'false');
    await expect(addButton).toHaveAccessibleName(/^Добавить «.+» в архив$/);
    const persisted = await page.evaluate(() => window.localStorage.getItem('tlp-my-archive:v3'));
    expect(persisted).toBeNull();

    await page.screenshot({ path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-blocked-storage-honesty.png`), fullPage: false });
    expect(runtime.pageErrors).toEqual([]);
    expect(runtime.consoleErrors).toEqual([]);
  });
});

test.describe('reduced-motion longform reader journey', () => {
  test.use({ locale: 'ru-RU', timezoneId: 'Europe/Paris', colorScheme: 'dark', reducedMotion: 'reduce' });

  test('citation focus reveals its source and keeps the longform readable', async ({ page }, testInfo) => {
    const runtime = attachRuntimeDiagnostics(page);
    await page.goto(`${BASE_URL}/essays/yesenin-duncan-first-meeting-documents`, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('.reading-progress')).toBeVisible();
    expect(await page.locator('.essay-body p').count()).toBeGreaterThan(8);

    const citation = page.getByRole('link', { name: /^Источник \d+:/ }).first();
    await citation.scrollIntoViewIfNeeded();
    await citation.focus();
    await expect(citation).toBeFocused();
    await expect(citation.getByRole('tooltip')).toBeVisible();
    const href = await citation.getAttribute('href');
    expect(href).toMatch(/^#source-/);

    await citation.press('Enter');
    await expect(page).toHaveURL(new RegExp(`${escapeRegExp(href)}$`));
    const source = page.locator(`[id="${href.slice(1)}"]`);
    await expect(source).toBeVisible();

    const primaryFilter = page.getByRole('button', { name: /Первичные/ });
    await primaryFilter.click();
    await expect(primaryFilter).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#sources li').first()).toBeVisible();

    const overflow = await page.evaluate(() => Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-longform-source.png`), fullPage: false });
    expect(runtime.pageErrors).toEqual([]);
    expect(runtime.consoleErrors).toEqual([]);
  });
});