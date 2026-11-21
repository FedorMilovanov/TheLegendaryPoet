import { test, expect } from '@playwright/test';

const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

test('W84 Gumilev Captains I: original 1910 edition restores eight lines', async ({ page }, info) => {
  const widths = info.project.name === 'chromium-core' ? [320, 390, 1440] : [390];
  for (const width of widths) {
    await page.setViewportSize({width, height: 900});
    await page.goto(BASE + '/poets/nikolay-gumilev', {waitUntil: 'domcontentloaded'});
    const card = page.locator('#poem-gumilev-2');
    await expect(card.locator('.poem-card-title')).toContainText('Капитаны (I)');
    await expect(card.getByRole('link', {name: 'Источник текста'})).toHaveAttribute(
      'href', 'https://ru.wikisource.org/wiki/На_полярных_морях_и_на_южных_(Гумилёв)',
    );
    const raw = await card.locator('[data-poem-canonical]').innerText();
    const lines = raw.split(/\r?\n/u).map(s => s.trim()).filter(Boolean);
    expect(lines.length, 'The first installment in the 1910 book contains 32 non-empty lines').toBe(32);
    expect(lines[0]).toBe('На полярных морях и на южных,');
    expect(lines[23]).toBe('Ни один не свернёт паруса.');
    expect(lines[24]).toBe('Разве трусам даны эти руки,');
    expect(lines[31]).toBe('Охранительный свет маяков?');
    await expect(card.locator('[data-poem-excerpt-notice]')).toHaveCount(0);
    const note = card.locator('[data-poem-textual-note]');
    await expect(note).toHaveCount(1);
    await expect(note).toContainText('80–81');
    await expect(note.locator('a[href="https://www.prlib.ru/item/1312480"]')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
});

test('W84 Akhmatova Vecher 1912: 12 lines and first-edition source retained', async ({ page }, info) => {
  const widths = info.project.name === 'chromium-core' ? [320, 390, 1440] : [390];
  for (const width of widths) {
    await page.setViewportSize({width, height:900});
    await page.goto(BASE + '/poets/anna-akhmatova', {waitUntil:'domcontentloaded'});
    const card = page.locator('#poem-akhmatova-2');
    await expect(card.locator('.poem-card-title')).toContainText('Сжала руки');
    const raw = await card.locator('[data-poem-canonical]').innerText();
    const lines = raw.split(/\r?\n/u).map(s => s.trim()).filter(Boolean);
    expect(lines.length).toBe(12);
    expect(lines[0]).toContain('Сжала руки под тёмной вуалью');
    expect(lines[11]).toBe('И сказал мне: «Не стой на ветру».');
    await expect(card.locator('[data-poem-excerpt-notice]')).toHaveCount(0);
    const note = card.locator('[data-poem-textual-note]');
    await expect(note).toContainText('1912');
    await expect(note).toContainText('странице 19');
    await expect(note.locator('a[href="https://ru.wikisource.org/wiki/Файл:Akhmatova_Vecher_1912.pdf?page=19"]')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
});

test('W84 Mayakovsky: the unproved 1929 visa refusal is not asserted as fact', async ({ page }) => {
  await page.goto(BASE + '/poets/vladimir-mayakovsky', {waitUntil:'domcontentloaded'});
  // Route-level lazy hydration may show the generic shell initially.
  await expect(page.locator('#poem-mayak-1')).toBeVisible();
  const source = page.locator('a[href="https://imwerden.de/pdf/yangfeldt_lyubov_eto_serdtse_vsego_1991__ocr.pdf"]');
  await expect(source).toBeVisible();
  const testimonyCard = source.locator('xpath=ancestor::div[contains(@class,"theme-elevated-surface")]').first();
  const editorial = (await testimonyCard.innerText()).replace(/\s+/gu, ' ');
  expect(editorial).toMatch(/ни заявления поэта о выдаче заграничного паспорта/u);
  expect(editorial).toContain('вероятную гипотезу');
  expect(editorial).not.toContain('отказ в визе для поездки к Т. Яковлевой');
});