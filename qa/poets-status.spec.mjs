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


  test('failed full-corpus request openly labels the legacy fallback', async ({ page }) => {
    await page.route('**/data/poets/alexander-pushkin.json*', (route) => route.abort('failed'));
    await page.goto(`${BASE_URL}/poets/alexander-pushkin`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('status').filter({ hasText: 'Не удалось загрузить полный корпус стихов' })).toBeVisible();
    const nav = page.getByRole('navigation', { name: 'Навигация по лирике' });
    await expect(nav.locator('ol > li > a[href^="#poem-"]')).toHaveCount(3);
    await expect(page.locator('div[id^="poem-pushkin-"]')).toHaveCount(3);
    await expect(page.getByText('Показана резервная подборка.')).toBeVisible();
  });

  test('Four expanded classics hydrate full canonical contents on both layouts', async ({ page }, testInfo) => {
    const widths = testInfo.project.name === 'chromium-core' ? [390, 1440] : [390];
    const expandedPoets = [
      ['alexander-pushkin', 10],
      ['mikhail-lermontov', 11],
      ['sergei-yesenin', 10],
      ['fyodor-tyutchev', 11],
    ];
    for (const [poetId, expectedCount] of expandedPoets) {
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${BASE_URL}/poets/${poetId}`, { waitUntil: 'domcontentloaded' });
        const nav = page.getByRole('navigation', { name: 'Навигация по лирике' });
        const entries = nav.locator('ol > li > a[href^="#poem-"]');
        const cards = page.locator('div[id^="poem-"]');
        await expect(nav).toBeVisible();
        await expect(nav).toHaveClass(/poet-reading-index/);
        // The small runtime fallback holds only legacy works. Require the
        // full route-specific JSON to hydrate before testing navigation.
        await expect(cards).toHaveCount(expectedCount);
        await expect(entries).toHaveCount(expectedCount);
        if (poetId === 'alexander-pushkin') {
          const morning = page.locator('#poem-pushkin-4');
          await expect(morning.getByText('Литературный анализ')).toBeVisible();
          await expect(morning.getByText('Духовный подтекст')).toHaveCount(0);
          const analysisGrid = morning.locator('[data-poem-analysis-grid]');
          const actualColumns = await analysisGrid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/u).filter(Boolean).length);
          expect(actualColumns, 'single analysis panel must fill the poem card').toBe(1);
        }
        if (poetId === 'mikhail-lermontov') {
          await expect(page.locator('[data-poem-textual-note]')).toHaveCount(5);
          await expect(page.locator('#poem-lermontov-6 [data-poem-textual-note]')).toContainText('26/26');
          await expect(page.locator('#poem-lermontov-6 [data-poem-textual-note] a')).toHaveAttribute('href', 'https://djvu.online/jpg1/X/C/3/XC3Xv3h3tt4Ak/070.webp');
          await expect(page.locator('#poem-lermontov-7 [data-poem-textual-note]')).toContainText('44/44');
          await expect(page.locator('#poem-lermontov-7 [data-poem-textual-note]')).toContainText('угловых скобок');
          await expect(page.locator('#poem-lermontov-7 [data-poem-textual-note] a')).toHaveAttribute('href', 'https://djvu.online/jpg1/X/C/3/XC3Xv3h3tt4Ak/033.webp');
          await expect(page.locator('#poem-lermontov-8 [data-poem-textual-note]')).toContainText('12/12');
          await expect(page.locator('#poem-lermontov-8 [data-poem-textual-note] a')).toHaveAttribute('href', 'https://djvu.online/jpg1/X/C/3/XC3Xv3h3tt4Ak/060.webp');
          await expect(page.locator('#poem-lermontov-9 [data-poem-textual-note]')).toContainText('8/8');
          await expect(page.locator('#poem-lermontov-9 [data-poem-textual-note] a')).toHaveAttribute('href', 'https://djvu.online/jpg1/X/C/3/XC3Xv3h3tt4Ak/077.webp');
          await expect(page.locator('#poem-lermontov-10 [data-poem-textual-note]')).toContainText('16/16');
          await expect(page.locator('#poem-lermontov-10 [data-poem-textual-note]')).toContainText('«бога»');
          await expect(page.locator('#poem-lermontov-10 [data-poem-textual-note] a')).toHaveAttribute('href', 'https://djvu.online/jpg1/X/C/3/XC3Xv3h3tt4Ak/021.webp');
        }
        if (poetId === 'mikhail-lermontov' && width >= 640) {
          const panels = page.locator('#poem-lermontov-5 [data-poem-analysis-grid]');
          const actualColumns = await panels.evaluate((element) => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/u).filter(Boolean).length);
          expect(actualColumns, 'genuine biblical commentary still uses two panels').toBe(2);
        }
        if (poetId === 'alexander-pushkin') {
          await expect(page.locator('#poem-pushkin-7 [data-poem-year-note]')).toContainText('традиционная датировка');
          await expect(entries.filter({ hasText: 'К Чаадаеву' }).locator('[data-poem-year-note]')).toContainText('обсуждается 1820');
        }
        if (poetId === 'sergei-yesenin') {
          await expect(page.locator('#poem-yesenin-8 [data-poem-year-note]')).toContainText('авторская датировка');
          await expect(page.getByRole('heading', { name: 'Источники и редакции текстов' })).toBeVisible();
          await expect(page.getByRole('link', { name: /Летопись жизни и творчества\. Том 5, книга 1/ })).toBeVisible();
          await expect(page.locator('[data-poem-textual-note]')).toHaveCount(7);
          await expect(page.locator('#poem-yesenin-8 [data-poem-textual-note]')).toContainText('Песня о собаке');
          await expect(page.locator('#poem-yesenin-6 [data-poem-textual-note]')).toContainText('16/16');
          await expect(page.locator('#poem-yesenin-6 [data-poem-textual-note]')).toContainText('вернусь!');
          await expect(page.locator('#poem-yesenin-6 [data-poem-textual-note] a')).toHaveAttribute('href', 'https://djvu.online/jpg2/v/z/2/vz2dupX7YPiEG/138.webp');
          await expect(page.locator('#poem-yesenin-8 [data-poem-textual-note]')).toContainText('28/28');
          await expect(page.locator('#poem-yesenin-8 [data-poem-textual-note]')).toContainText('OCR');
          await expect(page.locator('#poem-yesenin-8 [data-poem-textual-note] a')).toHaveAttribute('href', 'https://djvu.online/file/vz2dupX7YPiEG');
          await expect(page.locator('#poem-yesenin-4 [data-poem-textual-note]')).toContainText('24/24');
          await expect(page.locator('#poem-yesenin-4 [data-poem-textual-note]')).toContainText('вновь покинет дом');
          await expect(page.locator('#poem-yesenin-4 [data-poem-textual-note] a')).toHaveAttribute('href', 'https://magzdb.ru/num/4105742');
          await expect(page.locator('#poem-yesenin-5 [data-poem-textual-note]')).toContainText('25/25');
          await expect(page.locator('#poem-yesenin-5 [data-poem-textual-note]')).toContainText('Потому, что');
          await expect(page.locator('#poem-yesenin-5 [data-poem-textual-note] a')).toHaveAttribute('href', 'https://djvu.online/jpg2/v/z/2/vz2dupX7YPiEG/231.webp');
          await expect(page.locator('#poem-yesenin-7 [data-poem-textual-note]')).toContainText('14/14');
          await expect(page.locator('#poem-yesenin-7 [data-poem-textual-note] a')).toHaveAttribute('href', 'https://djvu.online/jpg1/M/i/m/MimaUmviIKL2g/247.webp');
          await expect(page.locator('#poem-yesenin-10 [data-poem-textual-note]')).toContainText('99/99');
          await expect(page.locator('#poem-yesenin-10 [data-poem-textual-note]')).toContainText('Но зрело знающий работу');
          await expect(page.locator('#poem-yesenin-10 [data-poem-textual-note] a')).toHaveAttribute('href', 'https://djvu.online/jpg1/M/i/m/MimaUmviIKL2g/174.webp');
          await expect(page.locator('#poem-yesenin-10 [data-poem-textual-note]')).toContainText('Незрело знающий работу');
          await expect(page.locator('#poem-yesenin-9 [data-poem-year-note]')).toContainText('Мирка');
          await expect(page.locator('#poem-yesenin-9 [data-poem-textual-note]')).toContainText('все 16 стиховых строк');
          await expect(page.locator('#poem-yesenin-9 [data-poem-textual-note]')).toContainText('без запятой');
          await expect(page.locator('#poem-yesenin-9 [data-poem-textual-note]')).toContainText('С. Кошечкин');
          await expect(page.locator('#poem-yesenin-9 [data-poem-textual-note] a')).toHaveAttribute('href', 'https://sytin-and-esenin.ru/images/blocks/2.23.24.jpg');
          await expect(page.locator('[data-poem-textual-note] a')).toHaveCount(7);
        }
        if (poetId === 'fyodor-tyutchev') {
          const storm = page.locator('#poem-tyutchev-6');
          await expect(storm).toContainText('1828');
          await expect(storm).toContainText('редакция 1854 г.');
          await expect(entries.filter({ hasText: 'Весенняя гроза' })).toContainText('редакция 1854 г.');
        }
        if (poetId === 'sergei-yesenin') {
          await expect(entries.filter({ hasText: 'Шаганэ' }).locator('[data-poem-cycle]')).toHaveText('Персидские мотивы');
          const letterText = page.locator('#poem-yesenin-10 [data-poem-canonical]');
          await expect.poll(() => letterText.evaluate((element) => element.textContent.includes('Что я в сплошном дыму,\nВ разворочённом бурей быте'))).toBe(true);
        }
        // Canonical titles may already include guillemets. Card headings must not double them.
        for (const title of await cards.locator('h3').allTextContents()) {
          expect(title).not.toMatch(/««|»»/u);
        }
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
