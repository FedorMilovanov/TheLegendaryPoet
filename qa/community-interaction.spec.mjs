import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

test.use({
  viewport: { width: 1440, height: 1000 },
  locale: 'ru-RU',
  timezoneId: 'Europe/Paris',
  colorScheme: 'dark',
});

test('scoped poet rating, comment and helpful state survive reload', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));

  await page.goto(`${BASE_URL}/poets/alexander-pushkin`, { waitUntil: 'domcontentloaded' });
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });

  const panelHeading = page.getByRole('heading', { name: 'Оценка: Александр Пушкин' });
  const panel = panelHeading.locator('xpath=ancestor::section[1]');
  await expect(panel).toBeVisible();

  const groups = panel.getByRole('radiogroup');
  await expect(groups).toHaveCount(4);
  for (let index = 0; index < 4; index += 1) {
    const group = groups.nth(index);
    await group.getByRole('radio').first().focus();
    await page.keyboard.press('End');
    await expect(group.getByRole('radio').last()).toBeChecked();
  }

  const ratingButton = panel.getByRole('button', { name: /зафиксировать оценку|обновить оценку/i });
  await expect(ratingButton).toBeEnabled();
  await ratingButton.click();
  await expect(panel.getByText(/ваш голос уже учтён|оценка сохранена|оценка обновлена/i).first()).toBeVisible();

  const author = panel.getByPlaceholder('Ваше имя или псевдоним — необязательно');
  const comment = panel.getByPlaceholder('Что особенно точно, спорно, сильно или слабо?');
  const commentText = `Ручной QA ${Date.now()}: проверка сохранения комментария и клавиатурной отправки.`;
  await author.fill('Ручной QA');
  await comment.fill(commentText);
  await comment.press('Control+Enter');
  await expect(comment).toHaveValue('');
  await expect(panel.getByText(commentText)).toBeVisible();

  const commentArticle = panel.locator('article').filter({ hasText: commentText });
  const helpful = commentArticle.getByRole('button', { name: /отметить комментарий полезным/i });
  await helpful.click();
  await expect(commentArticle.getByRole('button', { name: /вы отметили комментарий полезным/i })).toBeDisabled();

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
  const restoredPanel = page.getByRole('heading', { name: 'Оценка: Александр Пушкин' }).locator('xpath=ancestor::section[1]');
  await expect(restoredPanel.getByText(commentText)).toBeVisible();
  const restoredComment = restoredPanel.locator('article').filter({ hasText: commentText });
  await expect(restoredComment.getByRole('button', { name: /вы отметили комментарий полезным/i })).toBeDisabled();
  await expect(restoredPanel.getByRole('button', { name: /обновить оценку/i })).toBeVisible();

  await restoredPanel.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop-community-persisted.png') });
  expect(pageErrors).toEqual([]);
});
