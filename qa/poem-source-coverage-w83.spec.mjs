import { test, expect } from '@playwright/test';

// The asserted URLs are independent of the canonical TS data. A source field
// that merely echoes itself must not make this browser contract green.
const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const editions = {
  'vladimir-mayakovsky': [
    ['mayak-1', 'https://ru.wikisource.org/wiki/Облако_в_штанах_(Маяковский)', true],
    ['mayak-2', 'https://ru.wikisource.org/wiki/Послушайте!_(Маяковский)', false],
    ['mayak-3', 'https://ru.wikisource.org/wiki/Лиличка!_(Маяковский)', true],
  ],
  'boris-pasternak': [
    ['pasternak-2', 'https://rvb.ru/20vek/silver-age/1910-e/09/093-boris-pasternak.html', false],
    ['pasternak-3', 'https://www.b-pasternak.ru/vse-stixotvoreniya/1-gamlet', false],
    ['pasternak-4', 'https://www.culture.ru/poems/14024/zimnyaya-noch', true],
  ],
  'afanasy-fet': [
    ['fet-1', 'https://rvb.ru/19vek/fet/bp/text/221.html', false],
    ['fet-2', 'https://rvb.ru/19vek/fet/bp/text/285.html', false],
    ['fet-3', 'https://rvb.ru/19vek/fet/bp/text/174.html', false],
  ],
  'nikolay-gumilev': [
    ['gumilev-1', 'https://ru.wikisource.org/wiki/Жираф_(Гумилёв)', false],
    ['gumilev-2', 'https://ru.wikisource.org/wiki/На_полярных_морях_и_на_южных_(Гумилёв)', false],
    ['gumilev-3', 'https://ru.wikisource.org/wiki/Слово_(Гумилёв)', true],
    ['gumilev-4', 'https://ru.wikisource.org/wiki/Шестое_чувство_(Гумилёв)', false],
  ],
  'anna-akhmatova': [
    ['akhmatova-1', 'https://www.culture.ru/poems/10174/rekviem', true],
    ['akhmatova-2', 'https://ru.wikisource.org/wiki/Сжала_руки_под_темной_вуалью_(Ахматова)', false],
    ['akhmatova-3', 'https://www.culture.ru/poems/8905/muzhestvo', false],
  ],
};

for (const [author, works] of Object.entries(editions)) {
  test('W83 individual source links and honest excerpt notices: ' + author, async ({ page }, info) => {
    const widths = info.project.name === 'chromium-core' ? [390, 1440] : [390];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(BASE_URL + '/poets/' + author, { waitUntil: 'domcontentloaded' });
      for (const [id, url, isExcerpt] of works) {
        const card = page.locator('#poem-' + id);
        await expect(card).toBeVisible();
        const link = card.getByRole('link', { name: 'Источник текста' });
        await expect(link).toHaveAttribute('href', url);
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', /noopener/);
        const marker = card.locator('[data-poem-excerpt-notice]');
        if (isExcerpt) {
          await expect(marker).toBeVisible();
          await expect(marker).toContainText('не его полный текст');
        } else {
          await expect(marker).toHaveCount(0);
        }
      }
      if (author === 'anna-akhmatova') {
        await expect(page.locator('#poem-akhmatova-1 .poem-card-title')).toContainText('фрагмент «Посвящения»');
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    }
  });
}
