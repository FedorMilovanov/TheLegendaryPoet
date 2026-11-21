import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

const works = [
  {
    id: 'tsvetaeva-moim-stiham-fragment',
    title: 'Моим стихам, написанным так рано',
    lines: 12,
    opening: 'Моим стихам, написанным так рано,',
    closing: 'Настанет свой черёд.',
    source: 'Моим_стихам,_написанным_так_рано_(Цветаева)',
  },
  {
    id: 'tsvetaeva-mne-nravitsya-fragment',
    title: 'Мне нравится, что Вы больны не мной',
    lines: 24,
    opening: 'Мне нравится, что Вы больны не мной,',
    closing: 'За то, что я больна — увы! — не Вами!',
    source: 'Мне_нравится,_что_Вы_больны_не_мной_(Цветаева)',
  },
];

test('Цветаева: оба фрагмента восстановлены полностью без смены ID', async ({ page }, testInfo) => {
  const widths = testInfo.project.name === 'chromium-core' ? [390, 1440] : [390];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${BASE_URL}/poets/marina-tsvetaeva`, { waitUntil: 'domcontentloaded' });
    const guide = page.getByRole('navigation', { name: 'Навигация по лирике' });
    await expect(guide).toBeVisible();
    for (const poem of works) {
      const card = page.locator(`#poem-${poem.id}`);
      await expect(card).toBeVisible();
      const title = card.locator('h3').first();
      await expect(title).toContainText(poem.title);
      await expect(title).not.toContainText('фрагмент');
      const canonical = card.locator('[data-poem-canonical]');
      const lines = (await canonical.textContent() || '').split('\n').map(s => s.trim()).filter(Boolean);
      expect(lines.length, `Full poem line count for ${poem.id}`).toBe(poem.lines);
      expect(lines[0]).toBe(poem.opening);
      expect(lines.at(-1)).toBe(poem.closing);
      expect(lines.join('\n')).not.toContain('<...>');
      const visual = card.locator('[data-poem-visual]');
      await expect(visual).toHaveAttribute('aria-hidden', 'true');
      const source = card.getByRole('link', { name: 'Источник текста' });
      await expect(source).toBeVisible();
      await expect(source).toHaveAttribute('rel', 'noopener noreferrer');
      expect(await source.getAttribute('href')).toContain(poem.source);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    if (testInfo.project.name === 'chromium-core') {
      mkdirSync('qa-artifacts', { recursive: true });
      for (const theme of ['dark', 'light']) {
        await page.evaluate((light) => {
          document.documentElement.classList.toggle('theme-light', light);
        }, theme === 'light');
        await page.waitForTimeout(200);
        await page.locator('#poem-tsvetaeva-mne-nravitsya-fragment')
          .screenshot({ path: `qa-artifacts/tsvetaeva-fulltext-${width}-${theme}.png`, animations: 'disabled' });
      }
    }
  }
});
