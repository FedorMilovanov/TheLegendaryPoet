import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

test.describe('poets result status accessibility', () => {
  test('result changes use one stable polite status without stealing search focus', async ({ page }) => {
    await page.goto(`${BASE_URL}/poets`, { waitUntil: 'domcontentloaded' });

    const search = page.getByRole('textbox', { name: 'Поиск поэтов' });
    const status = page.locator('#main-content').getByRole('status');

    await expect(search).toBeVisible();
    await expect(status).toHaveCount(1);
    await expect(status).toHaveAttribute('aria-live', 'polite');
    await expect(status).toHaveAttribute('aria-atomic', 'true');
    await expect(status).toContainText(/Найдено гениев\s+\d+/);

    await search.focus();
    await search.fill('Есенин');
    await expect(status).toContainText(/Найдено гениев\s+1\b/);
    await expect(search).toBeFocused();

    await search.fill('нет-такого-поэта-qa');
    await expect(status).toContainText(/Найдено гениев\s+0\b/);
    await expect(page.getByText('Архивы молчат...')).toBeVisible();
    await expect(search).toBeFocused();

    await search.fill('');
    await expect(status).not.toContainText(/Найдено гениев\s+0\b/);
    await expect(search).toBeFocused();
  });

  test('persistent rating pulse stops under reduced motion without hiding its state', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(`${BASE_URL}/poets`, { waitUntil: 'domcontentloaded' });

    const pulse = page.locator('#main-content .animate-pulse').first();
    await expect(pulse).toBeVisible();
    await expect.poll(() => pulse.evaluate((node) => getComputedStyle(node).animationName)).not.toBe('none');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(() => pulse.evaluate((node) => getComputedStyle(node).animationName)).toBe('none');
    await expect(pulse).toBeVisible();
    await expect(pulse.locator('xpath=..')).toContainText(/\d+(?:[.,]\d+)?/);
  });
});
