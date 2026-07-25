import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

test('persistent ambient depth stays static, filter-free and compositor-idle', async ({ page }, testInfo) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });

  const backdrop = page.locator('[data-ambient-backdrop]');
  const fields = page.locator('[data-ambient-field]');
  await expect(backdrop).toHaveCount(1);
  await expect(fields).toHaveCount(3);
  await expect(page.locator('.ambient-glow')).toHaveCount(0);

  const facts = await fields.evaluateAll((nodes) => nodes.map((node) => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return {
      kind: node.getAttribute('data-ambient-field'),
      animationName: style.animationName,
      filter: style.filter,
      backdropFilter: style.backdropFilter,
      willChange: style.willChange,
      backgroundImage: style.backgroundImage,
      position: style.position,
      width: rect.width,
      height: rect.height,
    };
  }));

  for (const field of facts) {
    expect(field.animationName, `${field.kind} ambient field must not animate forever`).toBe('none');
    expect(field.filter, `${field.kind} ambient field must not allocate a blur filter`).toBe('none');
    expect(field.backdropFilter, `${field.kind} ambient field must not blur the page behind it`).toBe('none');
    expect(field.willChange, `${field.kind} ambient field must not reserve a permanent compositor layer`).not.toContain('transform');
    expect(field.backgroundImage, `${field.kind} ambient field must preserve soft radial depth`).toContain('radial-gradient');
    expect(field.position).toBe('absolute');
    expect(field.width).toBeGreaterThan(120);
    expect(field.height).toBeGreaterThan(120);
  }

  const overflow = await page.evaluate(() => Math.max(
    document.body.scrollWidth,
    document.documentElement.scrollWidth,
  ) - document.documentElement.clientWidth);

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, `${testInfo.project.name}-home-ambient-performance.json`),
    JSON.stringify({ project: testInfo.project.name, fields: facts, overflow, pageErrors }, null, 2),
  );
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-home-static-ambient.png`),
    fullPage: false,
  });

  expect(overflow).toBeLessThanOrEqual(2);
  expect(pageErrors).toEqual([]);
});
