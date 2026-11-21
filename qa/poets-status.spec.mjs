import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

// Clean component screenshots suppress only fixed chrome and animated cursor.
// The real mobile dock is checked separately without screenshot masking.
const READING_INDEX_CAPTURE_STYLE = `
.mobile-dock, .scroll-top-btn,
[data-custom-cursor-dot], [data-custom-cursor-ring], .cursor-trail { visibility: hidden !important; }
`;

async function assertReachableBeyondDock(entry) {
  await entry.scrollIntoViewIfNeeded();
  const state = await entry.evaluate((node) => {
    const link = node.getBoundingClientRect();
    const dock = document.querySelector('.mobile-dock');
    const box = dock?.getBoundingClientRect();
    const visible = dock && box && getComputedStyle(dock).display !== 'none'
      && box.bottom > 0 && box.top < innerHeight;
    return { linkTop: link.top, linkBottom: link.bottom, dockTop: visible ? box.top : null,
      clear: !visible || link.bottom < box.top - 2 || link.top > box.bottom + 2 };
  });
  expect(state.clear, `Focused contents entry obscured by the mobile dock: ${JSON.stringify(state)}`).toBe(true);
}

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
  test('Blok contents preserve eight linked works and responsive two-column navigation', async ({ page }, testInfo) => {
    const widths = testInfo.project.name === 'chromium-core' ? [390, 1440] : [390];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${BASE_URL}/poets/alexander-blok`, { waitUntil: 'domcontentloaded' });

      const guide = page.getByRole('navigation', { name: 'Навигация по лирике' });
      const cards = page.locator('[id^="poem-blok-"]');
      await expect(cards).toHaveCount(8);
      // Both layers must agree on word indices, including NBSP before the
      // dash in «Скифы»; otherwise hover/focus affects the wrong visual word.
      for (let i = 0; i < 8; i += 1) {
        const card = cards.nth(i);
        const canonicalWords = await card.locator('[data-poem-canonical-word]').count();
        expect(canonicalWords, `canonical words in Blok poem ${i + 1}`).toBeGreaterThan(0);
        await expect(card.locator('[data-poem-visual] > div > span')).toHaveCount(canonicalWords);
      }
      await expect(guide).toBeVisible();
      await expect(guide.getByRole('heading', { name: 'Навигация по лирике' })).toHaveCSS('color', 'rgb(234, 211, 148)');
      // Capture evidence before later assertions or the full browser matrix can
      // interrupt the run. The same four screenshots remain in the core QA.
      if (testInfo.project.name === 'chromium-core') {
        mkdirSync('qa-artifacts', { recursive: true });
        await page.evaluate(() => document.fonts.ready);
        await guide.screenshot({ path: `qa-artifacts/blok-reading-index-${width}-dark.png`, style: READING_INDEX_CAPTURE_STYLE });
        await page.evaluate(() => document.documentElement.classList.add('theme-light'));
        await guide.screenshot({ path: `qa-artifacts/blok-reading-index-${width}-light.png`, style: READING_INDEX_CAPTURE_STYLE });
        await page.evaluate(() => document.documentElement.classList.remove('theme-light'));
      }
      await expect(guide).toHaveAttribute('id', 'blok-contents');
      const earlyLink = page.getByRole('link', { name: 'К оглавлению стихов' });
      await expect(earlyLink).toHaveAttribute('href', '#blok-contents');
      await earlyLink.click();
      await expect(page).toHaveURL(/#blok-contents$/);

      const anchors = guide.locator('a[href^="#poem-blok-"]');
      await expect(anchors).toHaveCount(8);
      await expect(guide).toHaveClass(/poet-reading-index/);
      await expect(guide.locator('ol > li')).toHaveCount(8);
      await expect(guide.locator('[data-poem-cycle]')).toHaveCount(7);
      await expect(guide.locator('[data-poem-cycle]').first()).toHaveText('Пляски смерти · II');
      await expect(guide.locator('[data-poem-cycle]').first()).toHaveCSS('font-size', '12px');
      await expect(anchors.first()).toHaveCSS('display', 'grid');
      await expect(anchors.first()).not.toHaveClass(/theme-elevated-surface/);
      await expect(anchors.first()).toHaveCSS('border-color', 'rgba(212, 175, 55, 0.22)');
      await expect(anchors.last()).toHaveAttribute('href', '#poem-blok-8');
      await expect(cards.locator('a', { hasText: 'Источник текста' })).toHaveCount(8);
      await expect(cards.locator('a[href^="/music/blok-"]')).toHaveCount(8);

      const columnCount = await guide.locator('.grid').first().evaluate((element) =>
        getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/u).filter(Boolean).length,
      );
      expect(columnCount).toBe(width >= 640 ? 2 : 1);

      const box = await guide.boundingBox();
      expect(box).not.toBeNull();
      expect(box.width).toBeLessThanOrEqual(width);
      const overflow = await guide.evaluate((node) => node.scrollWidth - node.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      await anchors.last().focus();
      await expect(anchors.last()).toBeFocused();
      if (width < 768) await assertReachableBeyondDock(anchors.last());

      if (testInfo.project.name === 'chromium-core') {
        mkdirSync('qa-artifacts', { recursive: true });
        await guide.screenshot({ path: `qa-artifacts/blok-reading-index-${width}-dark.png`, style: READING_INDEX_CAPTURE_STYLE });
        await page.evaluate(() => document.documentElement.classList.add('theme-light'));
        await expect(guide.getByRole('heading', { name: 'Навигация по лирике' })).toHaveCSS('color', 'rgb(119, 86, 23)');
        await expect(anchors.first()).toHaveCSS('border-color', 'rgba(119, 86, 23, 0.3)');
        const firstCard = cards.first();
        const analysisSurface = firstCard.getByText('Литературный анализ').locator('xpath=..');
        await expect(analysisSurface).toHaveCSS('background-color', 'rgb(244, 236, 219)');
        const archiveButton = firstCard.getByRole('button', { name: /Добавить .* в архив/ });
        await expect(archiveButton).toHaveCSS('background-color', 'rgb(244, 236, 219)');
        await guide.screenshot({ path: `qa-artifacts/blok-reading-index-${width}-light.png`, style: READING_INDEX_CAPTURE_STYLE });
        await page.evaluate(() => document.documentElement.classList.remove('theme-light'));
      }
    }
  });


  test('Pushkin, Lermontov and Yesenin use the shared contents on both layouts', async ({ page }, testInfo) => {
    const widths = testInfo.project.name === 'chromium-core' ? [390, 1440] : [390];
    for (const poetId of ['alexander-pushkin', 'mikhail-lermontov', 'sergei-yesenin']) {
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${BASE_URL}/poets/${poetId}`, { waitUntil: 'domcontentloaded' });
        const nav = page.getByRole('navigation', { name: 'Навигация по лирике' });
        const entries = nav.locator('ol > li > a[href^="#poem-"]');
        const cards = page.locator('div[id^="poem-"]');
        await expect(nav).toBeVisible();
        await expect(nav).toHaveClass(/poet-reading-index/);
        const count = await cards.count();
        expect(count).toBeGreaterThan(1);
        await expect(entries).toHaveCount(count);
        await expect(nav).toHaveAttribute('id', 'poem-contents');
        const jump = page.getByRole('link', { name: 'К оглавлению стихов' });
        await expect(jump).toHaveAttribute('href', '#poem-contents');
        const columns = await nav.locator('ol').evaluate((node) => getComputedStyle(node).gridTemplateColumns.trim().split(/\s+/u).filter(Boolean).length);
        expect(columns).toBe(width >= 640 ? 2 : 1);
        expect(await nav.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
        await jump.click();
        await expect(page).toHaveURL(/#poem-contents$/);
        await entries.last().focus();
        await expect(entries.last()).toBeFocused();
        if (width < 768) await assertReachableBeyondDock(entries.last());
        if (testInfo.project.name === 'chromium-core') {
          mkdirSync('qa-artifacts', { recursive: true });
          await page.evaluate(() => document.fonts.ready);
          await nav.screenshot({
            path: `qa-artifacts/poet-reading-index-${poetId}-${width}-dark.png`,
            style: READING_INDEX_CAPTURE_STYLE,
          });
          await page.evaluate(() => document.documentElement.classList.add('theme-light'));
          await expect(nav.getByRole('heading', { name: 'Навигация по лирике' })).toHaveCSS('color', 'rgb(119, 86, 23)');
          await nav.screenshot({
            path: `qa-artifacts/poet-reading-index-${poetId}-${width}-light.png`,
            style: READING_INDEX_CAPTURE_STYLE,
          });
          const analysis = cards.first().getByText('Литературный анализ');
          if (await analysis.count()) await expect(analysis.locator('xpath=..')).toHaveCSS('background-color', 'rgb(244, 236, 219)');
          await page.evaluate(() => document.documentElement.classList.remove('theme-light'));
        }
      }
    }
  });

  test('Bryusov 1913 full-text editions preserve 12 and 20 lines without clipping', async ({ page }, testInfo) => {
    const widths = testInfo.project.name === 'chromium-core' ? [390, 1440] : [390];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(BASE_URL + '/poets/valery-bryusov', { waitUntil: 'domcontentloaded' });
      const cases = [
        ['bryusov-yunomu-poetu-fragment', 'Юному поэту', 12, 'Юноша бледный со взором горящим,', 'Зная, что в мире оставлю поэта.'],
        ['bryusov-tvorchestvo-fragment', 'Творчество', 20, 'Тень несозданных созданий', 'На эмалевой стене.'],
      ];
      const nav = page.getByRole('navigation', { name: 'Навигация по лирике' });
      await expect(nav.locator('a[href^="#poem-bryusov-"]')).toHaveCount(2);
      for (const [id, title, lines, first, last] of cases) {
        const card = page.locator('#poem-' + id);
        await expect(card).toBeVisible();
        await expect(card.locator('h3')).toContainText(title);
        await expect(card.locator('h3')).not.toContainText('фрагмент');
        const text = await card.locator('[data-poem-canonical]').textContent();
        const verseLines = text.split('\n').filter((line) => line.trim().length > 0);
        expect(verseLines).toHaveLength(lines);
        expect(verseLines[0]).toBe(first);
        expect(verseLines.at(-1)).toBe(last);
        await expect(card.locator('a', { hasText: 'Источник текста' })).toHaveAttribute('href', /ru\.wikisource\.org/);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      if (testInfo.project.name === 'chromium-core') {
        mkdirSync('qa-artifacts', { recursive: true });
        await page.evaluate(() => document.fonts.ready);
        const card = page.locator('#poem-bryusov-yunomu-poetu-fragment');
        await card.screenshot({ path: 'qa-artifacts/bryusov-fulltext-' + width + '-dark.png', style: READING_INDEX_CAPTURE_STYLE });
        await page.evaluate(() => document.documentElement.classList.add('theme-light'));
        await card.screenshot({ path: 'qa-artifacts/bryusov-fulltext-' + width + '-light.png', style: READING_INDEX_CAPTURE_STYLE });
        await page.evaluate(() => document.documentElement.classList.remove('theme-light'));
      }
    }
  });

  test('shared chrome stays accessible after same-page poetry fragment navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/poets/alexander-pushkin`, { waitUntil: 'domcontentloaded' });
    const dock = page.locator('.mobile-dock');
    await expect(dock).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 700));
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('chrome-hidden'))).toBe(true);
    await expect(dock).toHaveAttribute('aria-hidden', 'true');
    const last = page.getByRole('navigation', { name: 'Навигация по лирике' }).locator('a[href^="#poem-"]').last();
    await last.click();
    await expect(page).toHaveURL(/#poem-/);
    await expect.poll(() => page.evaluate(() => {
      const hidden = document.documentElement.classList.contains('chrome-hidden');
      const mobileDock = document.querySelector('.mobile-dock');
      return !!mobileDock && mobileDock.inert === hidden && (mobileDock.getAttribute('aria-hidden') === 'true') === hidden;
    })).toBe(true);
  });

});
