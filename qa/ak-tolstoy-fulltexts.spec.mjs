import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const works = [
  { id: 'ak-tolstoy-sred-shumnogo-bala-fragment', title: 'Средь шумного бала, случайно',
    lines: 20, opening: 'Средь шумного бала, случайно,', closing: 'Но кажется мне, что люблю!',
    source: 'Средь_шумного_бала' },
  { id: 'ak-tolstoy-kolokolchiki-fragment', title: 'Колокольчики мои',
    lines: 40, opening: 'Колокольчики мои,', closing: 'Звените, звените!',
    source: '1840-е_(ВТ)' },
];

test('А. К. Толстой: полные 20/40 строк, ранняя редакция, старые якоря', async ({ page }, testInfo) => {
  const widths = testInfo.project.name === 'chromium-core' ? [320, 390, 1440] : [390];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${BASE_URL}/poets/aleksey-konstantinovich-tolstoy`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('navigation', { name: 'Навигация по лирике' })).toBeVisible();
    for (const poem of works) {
      const card = page.locator(`#poem-${poem.id}`);
      await expect(card).toBeVisible();
      const heading = card.locator('h3').first();
      await expect(heading).toContainText(poem.title);
      await expect(heading).not.toContainText('фрагмент');
      const canonical = card.locator('[data-poem-canonical]');
      const lines = (await canonical.textContent() || '').split('\n').map(s => s.trim()).filter(Boolean);
      expect(lines.length, `Full poem line count for ${poem.id}`).toBe(poem.lines);
      expect(lines[0]).toBe(poem.opening);
      expect(lines.at(-1)).toBe(poem.closing);
      expect(lines.join('\n')).not.toContain('<...>');
      if (poem.id.includes('kolokolchiki')) {
        expect(lines).toContain('Я прислушаюся к вам,');
        expect(lines).toContain('Новагорода ль вам жаль?');
        expect(lines.join('\n')).not.toContain('Что глядите на меня');
      }
      await expect(card.locator('[data-poem-visual]')).toHaveAttribute('aria-hidden', 'true');
      const source = card.getByRole('link', { name: 'Источник текста' });
      await expect(source).toBeVisible();
      await expect(source).toHaveAttribute('rel', 'noopener noreferrer');
      expect(await source.getAttribute('href')).toContain(poem.source);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    if (testInfo.project.name === 'chromium-core') {
      mkdirSync('qa-artifacts', { recursive: true });
      for (const theme of ['dark', 'light']) {
        await page.evaluate((light) => document.documentElement.classList.toggle('theme-light', light), theme === 'light');
        await page.waitForTimeout(150);
        await page.locator('#poem-ak-tolstoy-kolokolchiki-fragment')
          .screenshot({ path: `qa-artifacts/ak-tolstoy-fulltext-${width}-${theme}.png`, animations: 'disabled' });
      }
    }
  }
});
