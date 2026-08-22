import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

function useChromiumCore(testInfo) {
  test.skip(testInfo.project.name !== 'chromium-core', 'reader text certification runs once in Chromium core');
}

test('poem text has an exact selectable canonical layer separate from animated visual text', async ({ page }, testInfo) => {
  useChromiumCore(testInfo);

  const response = await page.goto(`${BASE_URL}/poets/esenin`, { waitUntil: 'networkidle' });
  expect(response?.status()).toBeLessThan(400);

  const poem = page.locator('[data-poem-text]').first();
  const canonical = poem.locator('[data-poem-canonical]');
  const visual = poem.locator('[data-poem-visual][aria-hidden="true"]');

  await expect(poem).toBeVisible({ timeout: 15_000 });
  await expect(canonical).toBeVisible();
  await expect(visual).toBeVisible();

  const snapshot = await canonical.evaluate((node) => ({
    text: node.textContent ?? '',
    userSelect: getComputedStyle(node).userSelect,
    whiteSpace: getComputedStyle(node).whiteSpace,
    ariaHidden: node.getAttribute('aria-hidden'),
  }));

  expect(snapshot.text.length).toBeGreaterThan(0);
  expect(snapshot.userSelect).not.toBe('none');
  expect(snapshot.whiteSpace).toContain('pre-wrap');
  expect(snapshot.ariaHidden).not.toBe('true');
  await expect(visual).toHaveAttribute('aria-hidden', 'true');

  const selected = await canonical.evaluate((node) => {
    const selection = window.getSelection();
    selection?.removeAllRanges();
    const range = document.createRange();
    range.selectNodeContents(node);
    selection?.addRange(range);
    return selection?.toString() ?? '';
  });

  expect(selected).toBe(snapshot.text);
  expect(selected).toContain('\n');
});
