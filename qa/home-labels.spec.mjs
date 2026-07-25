import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

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
    { timeout: 4_000, message: 'all six label panels should finish their entrance state before geometry is measured' },
  ).toBe(true);

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
