import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

async function expectReaderDefaults(page) {
  await expect(page.getByRole('button', { name: 'Индекс читателей' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('checkbox', { name: 'Только с голосами' })).not.toBeChecked();
}

test.describe('ratings canonical URL state', () => {
  test('direct load sanitizes and Back/Forward rehydrates every filter control', async ({ page }) => {
    const direct = `${BASE_URL}/ratings?q=${encodeURIComponent('Есенин')}&sort=invalid&tag=invalid&rated=0&junk=1`;
    await page.goto(direct, { waitUntil: 'domcontentloaded' });

    const search = page.getByRole('searchbox', { name: 'Найти поэта в рейтинге' });
    const editorial = page.getByRole('button', { name: 'Оценка редакции' });
    const reader = page.getByRole('button', { name: 'Индекс читателей' });
    const ratedOnly = page.getByRole('checkbox', { name: 'Только с голосами' });

    await expect(search).toHaveValue('Есенин');
    await expect(page).toHaveURL(`${BASE_URL}/ratings?q=${encodeURIComponent('Есенин')}`);
    await expectReaderDefaults(page);
    await expect(page.getByText(/Найдено:/)).toContainText('1');

    await editorial.click();
    await expect(editorial).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(/q=.*&sort=editorial/);

    await ratedOnly.check();
    await expect(ratedOnly).toBeChecked();
    await expect(page).toHaveURL(/rated=1/);

    await page.goBack();
    await expect(search).toHaveValue('Есенин');
    await expect(editorial).toHaveAttribute('aria-pressed', 'true');
    await expect(ratedOnly).not.toBeChecked();
    await expect(page).not.toHaveURL(/rated=1/);

    await page.goBack();
    await expect(search).toHaveValue('Есенин');
    await expect(reader).toHaveAttribute('aria-pressed', 'true');
    await expect(page).not.toHaveURL(/sort=/);

    await page.goForward();
    await expect(editorial).toHaveAttribute('aria-pressed', 'true');
    await expect(search).toHaveValue('Есенин');

    await page.getByRole('button', { name: /сбросить/i }).click();
    await expect(page).toHaveURL(`${BASE_URL}/ratings`);
    await expect(search).toHaveValue('');
    await expectReaderDefaults(page);

    await page.goBack();
    await expect(search).toHaveValue('Есенин');
    await expect(editorial).toHaveAttribute('aria-pressed', 'true');
    await expect(ratedOnly).not.toBeChecked();
  });
});
