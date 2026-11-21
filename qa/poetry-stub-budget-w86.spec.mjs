import { test, expect } from '@playwright/test';

const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

test('W86 online corpus still delivers complete commentary, provenance and full poems', async ({ page }) => {
  await page.goto(BASE + '/poets/valery-bryusov', { waitUntil: 'domcontentloaded' });
  const card = page.locator('#poem-bryusov-gryadushchie-gunny');
  await expect(card.locator('.poem-card-title')).toContainText('Грядущие гунны');
  await expect(card.getByText('Литературный анализ')).toBeVisible();
  await expect(card.getByText('Духовный подтекст')).toBeVisible();
  await expect(card.locator('[data-poem-textual-note]')).toContainText('141–142');
  const text = await card.locator('[data-poem-canonical]').innerText();
  expect(text.split(/\r?\n/u).filter(s => s.trim()).length).toBe(28);
  await expect(page.getByText('Показана резервная подборка.')).toHaveCount(0);
});

test('W86 failed corpus request: keep original verses and sources, drop only duplicate commentary', async ({ page }) => {
  await page.route('**/data/poets/valery-bryusov.json*', (route) => route.abort('failed'));
  await page.goto(BASE + '/poets/valery-bryusov', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('status').filter({ hasText: 'Не удалось загрузить полный корпус стихов' })).toBeVisible();
  const card = page.locator('#poem-bryusov-gryadushchie-gunny');
  await expect(card.locator('.poem-card-title')).toContainText('Грядущие гунны');
  const text = await card.locator('[data-poem-canonical]').innerText();
  const lines = text.split(/\r?\n/u).filter(s => s.trim());
  expect(lines).toHaveLength(28);
  expect(lines[0]).toBe('Где вы, грядущие гунны,');
  expect(lines[27]).toBe('Встречаю приветственным гимном.');
  await expect(card.getByRole('link', { name: 'Источник текста' })).toHaveAttribute(
    'href', 'https://ru.wikisource.org/wiki/Грядущие_гунны_(Брюсов)/Stephanos,_1906_(ВТ:Ё)',
  );
  await expect(card.locator('[data-poem-textual-note]')).toContainText('141–142');
  await expect(card.locator('[data-poem-excerpt-notice]')).toHaveCount(0);
  await expect(card.getByText('Литературный анализ')).toHaveCount(0);
  await expect(card.getByText('Духовный подтекст')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test('W86 legacy fallback survives failed JSON with stable IDs, text and sources', async ({ page }) => {
  await page.route('**/data/poets/alexander-pushkin.json*', route => route.abort('failed'));
  await page.goto(BASE + '/poets/alexander-pushkin', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('status').filter({ hasText: 'Показана резервная подборка.' })).toBeVisible();
  const cards = page.locator('div[id^="poem-pushkin-"]');
  await expect(cards).toHaveCount(3);
  const first = cards.first();
  await expect(first.locator('[data-poem-canonical]')).not.toBeEmpty();
  await expect(first.getByRole('link', { name: 'Источник текста' })).toBeVisible();
  await expect(first.locator('[data-poem-textual-note]')).toHaveCount(1);
  await expect(first.getByText('Литературный анализ')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
