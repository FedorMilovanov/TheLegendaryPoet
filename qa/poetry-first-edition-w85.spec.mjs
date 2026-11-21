import { test, expect } from '@playwright/test';

const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const viewports = (name) => name === 'chromium-core' ? [320, 390, 1440] : [390];
const canonicalLines = async (card) =>
  (await card.locator('[data-poem-canonical]').innerText()).split(/\r?\n/u).map(v => v.trim()).filter(Boolean);

test('W85 Gumilev: Giraffe preserves 20 lines, composition/publishing years and original cycle', async ({ page }, info) => {
  for (const width of viewports(info.project.name)) {
    await page.setViewportSize({ width, height:900 });
    await page.goto(BASE + '/poets/nikolay-gumilev', {waitUntil:'domcontentloaded'});
    const card = page.locator('#poem-gumilev-1');
    await expect(card.locator('.poem-card-title')).toContainText('Жираф');
    await expect(card.locator('[data-poem-year-label]')).toContainText('1907 год · редакция 1910 г.');
    await expect(card.locator('[data-poem-year-note]')).toContainText('впервые напечатан');
    const lines = await canonicalLines(card);
    expect(lines).toHaveLength(20);
    expect(lines[0]).toBe('Сегодня, я вижу, особенно грустен твой взгляд,');
    expect(lines[19]).toBe('Изысканный бродит жираф.');
    await expect(card.locator('[data-poem-excerpt-notice]')).toHaveCount(0);
    const note = card.locator('[data-poem-textual-note]');
    await expect(note).toContainText('Озеро Чад');
    await expect(note).toContainText('153–154');
    await expect(note.locator('a[href="https://gumilev.ru/verses/375/var"]')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
});

test('W85 Bryusov: complete seven-quatrain 1906 text, separately attributed epigraph', async ({ page }, info) => {
  for (const width of viewports(info.project.name)) {
    await page.setViewportSize({ width, height:900 });
    await page.goto(BASE + '/poets/valery-bryusov', {waitUntil:'domcontentloaded'});
    const card = page.locator('#poem-bryusov-gryadushchie-gunny');
    await expect(card.locator('.poem-card-title')).toContainText('Грядущие гунны');
    await expect(card.locator('[data-poem-year-label]')).toContainText('1904–1905 · редакция 1906 г.');
    await expect(card.locator('[data-poem-year-note]')).toContainText('1904');
    const lines = await canonicalLines(card);
    expect(lines).toHaveLength(28);
    expect(lines[0]).toBe('Где вы, грядущие гунны,');
    expect(lines[15]).toBe('Вы во всём неповинны, как дети!');
    expect(lines[27]).toBe('Встречаю приветственным гимном.');
    expect(lines.join(' ')).not.toContain('Топчи их рай');
    await expect(card.getByText('Топчи их рай, Аттила.')).toBeVisible();
    await expect(card.getByText('Вячеслав Иванов', {exact:false})).toBeVisible();
    await expect(card.locator('[data-poem-excerpt-notice]')).toHaveCount(0);
    const note = card.locator('[data-poem-textual-note]');
    await expect(note).toContainText('141–142');
    await expect(note.locator('a[href="https://ru.wikisource.org/wiki/Страница:Валерий_Брюсов_-_Стефанос,_1906.pdf/147"]')).toHaveCount(1);
    await expect(card.getByRole('link', {name:'Источник текста'})).toHaveAttribute(
      'href', 'https://ru.wikisource.org/wiki/Грядущие_гунны_(Брюсов)/Stephanos,_1906_(ВТ:Ё)'
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
});
