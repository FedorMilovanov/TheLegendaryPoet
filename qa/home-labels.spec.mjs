import { test, expect } from '@playwright/test';
import { registerMediaContract } from './media-contract.mjs';
import fs from 'node:fs';
import path from 'node:path';

registerMediaContract(test);

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
const EXPECTED_NAMES = [
  'Сергей Есенин',
  'Михаил Лермонтов',
  'Александр Пушкин',
  'Фёдор Тютчев',
  'Владимир Маяковский',
  'Афанасий Фет',
];

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function effectiveOpacity(locator) {
  return locator.evaluate((node) => {
    let opacity = 1;
    let current = node;
    while (current && current !== document.documentElement) {
      opacity *= Number.parseFloat(getComputedStyle(current).opacity || '1');
      current = current.parentElement;
    }
    return opacity;
  });
}

test('premium poet labels preserve every full name without ellipsis or clipping', async ({ page }, testInfo) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });

  const windows = page.locator('[data-hero-poet-window]');
  const names = page.locator('[data-hero-poet-window-name]');
  await expect(windows).toHaveCount(6);
  await expect(names).toHaveCount(6);

  await expect.poll(
    () => windows.locator('img').evaluateAll((images) => images.every(
      (image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0,
    )),
    { timeout: 12_000, message: 'all premium portraits should decode before label geometry is measured' },
  ).toBe(true);

  if (testInfo.project.name === 'home-desktop') {
    // Desktop intentionally reveals one label at a time on hover/focus. Exercise
    // every card through that real interaction instead of demanding six hover
    // states simultaneously, which the product never promises.
    for (let index = 0; index < EXPECTED_NAMES.length; index += 1) {
      await windows.nth(index).hover();
      await expect.poll(
        () => effectiveOpacity(names.nth(index)),
        { timeout: 4_000, message: `${EXPECTED_NAMES[index]} should become readable on desktop hover` },
      ).toBeGreaterThan(0.85);
    }
  } else {
    await expect.poll(
      () => names.evaluateAll((nodes) => nodes.every((node) => {
        let opacity = 1;
        let current = node;
        while (current && current !== document.documentElement) {
          opacity *= Number.parseFloat(getComputedStyle(current).opacity || '1');
          current = current.parentElement;
        }
        return opacity > 0.85;
      })),
      { timeout: 4_000, message: 'all six touch label panels should finish their entrance state before geometry is measured' },
    ).toBe(true);
  }

  const facts = await names.evaluateAll((nodes) => nodes.map((node) => {
    const style = getComputedStyle(node);
    const range = document.createRange();
    range.selectNodeContents(node);
    const lineRects = [...range.getClientRects()].filter((rect) => rect.width > 0.5 && rect.height > 0.5);
    return {
      text: node.textContent?.trim() || '',
      textOverflow: style.textOverflow,
      whiteSpace: style.whiteSpace,
      overflowX: node.scrollWidth - node.clientWidth,
      overflowY: node.scrollHeight - node.clientHeight,
      lineCount: lineRects.length,
      clientWidth: node.clientWidth,
      clientHeight: node.clientHeight,
      scrollWidth: node.scrollWidth,
      scrollHeight: node.scrollHeight,
    };
  }));

  expect(facts.map((fact) => fact.text)).toEqual(EXPECTED_NAMES);
  for (const fact of facts) {
    expect(fact.textOverflow, `${fact.text} must not use ellipsis`).not.toBe('ellipsis');
    expect(fact.whiteSpace, `${fact.text} must be allowed to wrap`).not.toBe('nowrap');
    expect(fact.overflowX, `${fact.text} overflows horizontally`).toBeLessThanOrEqual(1);
    expect(fact.overflowY, `${fact.text} is vertically clipped`).toBeLessThanOrEqual(1);
    expect(fact.lineCount, `${fact.text} should occupy one or two balanced lines`).toBeGreaterThanOrEqual(1);
    expect(fact.lineCount, `${fact.text} should occupy one or two balanced lines`).toBeLessThanOrEqual(2);
  }
  expect(pageErrors).toEqual([]);

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, `${testInfo.project.name}-home-full-poet-labels.json`),
    JSON.stringify({ project: testInfo.project.name, names: facts, pageErrors }, null, 2),
  );
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-home-full-poet-labels.png`),
    fullPage: false,
  });
});

for (const [width, colorScheme] of [[320, 'dark'], [390, 'light'], [768, 'dark'], [1440, 'light']]) {
  for (const textScale of [1, 2]) test.describe(`caption reflow ${width}px, ${textScale * 100}% text`, () => {
    test.use({ viewport: { width, height: 1000 }, colorScheme, contextOptions: { reducedMotion: 'reduce' }, isMobile: width < 500, hasTouch: width < 500 });
    test('all names and dates scale without losing text or links', async ({ page }) => {
      await page.addInitScript((theme) => localStorage.setItem('tlp-theme-mode', theme), colorScheme);
      await page.goto(BASE_URL);
      const windows = page.locator('[data-hero-poet-window]');
      await expect(windows).toHaveCount(6);
      await page.evaluate(() => document.fonts.ready);
      // Text-only resize fixture, NOT pinch zoom or a browser-zoom certificate.
      const before = await page.locator('[data-hero-poet-window-name]').first().evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
      await page.evaluate((scale) => { document.documentElement.style.fontSize = `${16 * scale}px`; }, textScale);
      await page.keyboard.press('Tab');
      const facts = [];
      for (const window of await windows.all()) {
        await window.scrollIntoViewIfNeeded();
        await window.focus();
        await expect.poll(() => effectiveOpacity(window.locator('[data-hero-poet-window-name]'))).toBeGreaterThan(0.85);
        const text = await window.locator('.hero-poet-window-label-panel > div').evaluateAll((nodes) => nodes.map((node) => {
          const viewport = node.closest('.hero-poet-window-viewport').getBoundingClientRect();
          const range = document.createRange(); range.selectNodeContents(node);
          const lines = [...range.getClientRects()].filter((rect) => rect.width > 0);
          return { text: node.textContent, fontSize: parseFloat(getComputedStyle(node).fontSize),
            overflowX: node.scrollWidth - node.clientWidth,
            clipped: lines.some((line) => line.left < viewport.left - 1 || line.right > viewport.right + 1 || line.top < viewport.top - 1 || line.bottom > viewport.bottom + 1) };
        }));
        facts.push(text);
        expect.soft(text[0].fontSize, 'name respects the requested text scale').toBeCloseTo(before * textScale, 1);
        expect.soft(text[0].fontSize, 'local design floor, not a WCAG font-size rule').toBeGreaterThanOrEqual(12 * textScale);
        expect.soft(text[1].fontSize).toBeGreaterThanOrEqual(10 * textScale);
        for (const fact of text) {
          expect.soft(fact.overflowX, fact.text).toBeLessThanOrEqual(1);
          expect.soft(fact.clipped, fact.text).toBe(false);
        }
      }
      expect(facts.map(([name]) => name.text)).toEqual(EXPECTED_NAMES);
      const last = windows.last();
      await last.click();
      await expect(page).toHaveURL(/\/poets\/afanasy-fet\/?$/);
      await expect(page.locator('main h1')).toContainText('Афанасий Фет');
    });
  });
}
