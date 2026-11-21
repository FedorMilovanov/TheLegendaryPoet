
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const works = [
  {
    "id": "nekrasov-vcherashniy-den-fragment",
    "title": "Вчерашний день, часу в шестом",
    "lines": 8,
    "first": "Вчерашний день, часу в шестом",
    "last": "Сестра твоя родная!»",
    "source": "/ss15/vol01/poems/0030.html"
  },
  {
    "id": "nekrasov-vnimaya-uzhasam-fragment",
    "title": "Внимая ужасам войны",
    "lines": 17,
    "first": "Внимая ужасам войны,",
    "last": "Своих поникнувших ветвей…",
    "source": "/ss15/vol02/poems/0178.html"
  }
];

// Real production JSON, not the intentionally abridged lightweight card registry.
// Verify original deep links survive, full text is canonical, and all 17 lines
// fit in the actual Reader without a mobile horizontal scroll.
test('Nekrasov full academic poems keep stable fragment IDs and exact line boundaries', async ({ page }, testInfo) => {
  const widths = testInfo.project.name === 'chromium-core' ? [320, 390, 1440] : [390];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${BASE_URL}/poets/nikolay-nekrasov`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('navigation', { name: 'Навигация по лирике' })).toBeVisible();

    for (const poem of works) {
      const card = page.locator(`#poem-${poem.id}`);
      await expect(card).toBeVisible();
      const title = card.locator('h3').first();
      await expect(title).toContainText(poem.title);
      await expect(title).not.toContainText('фрагмент');
      const canonical = card.locator('[data-poem-canonical]');
      await expect(canonical).toBeVisible();
      const lines = (await canonical.textContent() || '').split('\n').map(x => x.trim()).filter(Boolean);
      expect(lines.length, `Line count for ${poem.id}`).toBe(poem.lines);
      expect(lines[0]).toBe(poem.first);
      expect(lines.at(-1)).toBe(poem.last);
      expect(lines.join('\n')).not.toContain('<...>');
      const visual = card.locator('[data-poem-visual]');
      await expect(visual).toHaveAttribute('aria-hidden', 'true');
      const source = card.getByRole('link', { name: 'Источник текста' });
      await expect(source).toBeVisible();
      await expect(source).toHaveAttribute('rel', 'noopener noreferrer');
      expect(await source.getAttribute('href')).toContain(poem.source);
      await card.scrollIntoViewIfNeeded();
      const box = await card.boundingBox();
      expect(box, 'Poem card should have a painted box').not.toBeNull();
      expect(box.x >= -2 && box.x + box.width <= width + 2, `Poem card horizontally clipped at ${width}`).toBe(true);
    }

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow, `Page overflows viewport by ${overflow}px at ${width}px`).toBeLessThanOrEqual(1);

    if (testInfo.project.name === 'chromium-core' && width !== 320) {
      mkdirSync('qa-artifacts', { recursive: true });
      for (const theme of ['dark','light']) {
        await page.evaluate(light => {
          document.documentElement.classList.toggle('theme-light', light);
        }, theme === 'light');
        await page.waitForTimeout(200);
        // A real viewport shot proves the first visible verse line: stitched
        // tall element screenshots may omit it transiently during layout motion.
        const firstVisualLine = page.locator('#poem-nekrasov-vnimaya-uzhasam-fragment [data-poem-visual] > div').first();
        await firstVisualLine.scrollIntoViewIfNeeded();
        await page.evaluate(() => window.scrollBy(0, -110));
        await page.screenshot({
          path: `qa-artifacts/nekrasov-viewport-start-${width}-${theme}.png`,
          animations: 'disabled',
        });
        await page.locator('#poem-nekrasov-vnimaya-uzhasam-fragment').screenshot({
          path: `qa-artifacts/nekrasov-fulltext-${width}-${theme}.png`,
          animations: 'disabled',
          // Element screenshots stitch a long card across multiple viewport
          // positions. Fixed global navigation would otherwise be captured
          // halfway through the poem, even though the underlying text is fine.
          style: '.site-header, .mobile-dock, .scroll-top-btn, [data-custom-cursor-dot], [data-custom-cursor-ring] { visibility: hidden !important; }',
        });
      }
    }
  }
});
