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

  const expandedPoets = [
      ['alexander-pushkin', 10],
      ['mikhail-lermontov', 11],
      ['sergei-yesenin', 10],
      ['fyodor-tyutchev', 11],
    ];
  // Keep every author, viewport, and editorial assertion, but give each
  // independent visit its own 45-second Playwright budget. In particular,
  // WebKit must not spend the Pushkin/Lermontov/Yesenin budget before Tyutchev.
  for (const [poetId, expectedCount] of expandedPoets) {
    for (const width of [390, 1440]) {
      test(`Expanded classics preserve full canonical contents: ${poetId} at ${width}px`, async ({ page }, testInfo) => {
        test.skip(width === 1440 && testInfo.project.name !== 'chromium-core', 'Desktop layout is covered by chromium-core');
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
        if (poetId === 'mikhail-lermontov') {
          const musicLink = page.locator('#poem-lermontov-10 a[href="/music/lermontov-kogda-volnuetsya-zhelteyushchaya-niva/"]');
          await expect(musicLink).toHaveCount(1);
          await expect(musicLink).toBeVisible();
          await expect(musicLink).toContainText('Когда волнуется желтеющая нива');
        }
        if (poetId === 'alexander-pushkin') {
          // The three legacy fallback poems must now carry an academic text witness and editorial history.
          await expect(page.locator('[data-poem-textual-note]')).toHaveCount(10);
          for (const poemId of ['pushkin-1', 'pushkin-2', 'pushkin-3']) {
            await expect(page.locator('#poem-' + poemId + ' [data-poem-textual-note]')).toBeVisible();
            await expect(page.locator('#poem-' + poemId + ' [data-poem-textual-note] a'))
              .toHaveAttribute('href', 'https://feb-web.ru/feb/pushkin/texts/push17/vol03/y32-b23-.htm?cmd=p');
          }
          // Independently count the canonical verse lines, not just numbers stated in prose notes.
          for (const [poemId, expectedLines] of [['pushkin-1', 30], ['pushkin-2', 8], ['pushkin-3', 21]]) {
            const canonicalText = page.locator('#poem-' + poemId + ' [data-poem-canonical]');
            await expect.poll(() => canonicalText.evaluate((node) => (node.textContent || '')
              .split('\n').filter((line) => line.trim()).length)).toBe(expectedLines);
            await expect(canonicalText).not.toContainText('<...>');
          }
          await expect(page.locator('#poem-pushkin-1 [data-poem-canonical]')).toContainText('Глаголом жги сердца людей');
          await expect(page.locator('#poem-pushkin-2 [data-poem-canonical]')).toContainText('То робостью, то ревностью томим');
          await expect(page.locator('#poem-pushkin-3 [data-poem-canonical]')).toContainText('Exegi monumentum.');
          await expect(page.locator('#poem-pushkin-3 [data-poem-canonical]')).toContainText('Александрийского столпа.');
          await expect(page.locator('#poem-pushkin-3 [data-poem-canonical]')).not.toContainText('Наполеонова столпа');
          await expect(page.locator('#poem-pushkin-1 [data-poem-textual-note]')).toContainText('30/30');
          await expect(page.locator('#poem-pushkin-1 [data-poem-year-note]')).toContainText('1827');
          await expect(page.locator('#poem-pushkin-2 [data-poem-textual-note]')).toContainText('8/8');
          await expect(page.locator('#poem-pushkin-2 [data-poem-textual-note]')).toContainText('1832');
          await expect(page.locator('#poem-pushkin-3 [data-poem-textual-note]')).toContainText('20/20');
          await expect(page.locator('#poem-pushkin-3 [data-poem-textual-note]')).toContainText('Наполеонова столпа');
          await expect(page.locator('#poem-pushkin-3 [data-poem-year-note]')).toContainText('1841');
          await expect(page.locator('#poem-pushkin-4 [data-poem-textual-note]')).toContainText('VERIFIED');
          await expect(page.locator('#poem-pushkin-4 [data-poem-textual-note]')).toContainText('30/30');
          await expect(page.locator('#poem-pushkin-4 [data-poem-textual-note]')).toContainText('PA9–PA10');
          await expect(page.locator('#poem-pushkin-4 [data-poem-textual-note]')).toContainText('Звѣздою Сѣверной');
          await expect(page.locator('#poem-pushkin-4 [data-poem-textual-note] a')).toHaveAttribute('href', 'https://books.google.ru/books?id=t_XmCicRuMYC&pg=PA9');
          await expect(page.locator('#poem-pushkin-9 [data-poem-textual-note]')).toContainText('VERIFIED');
          await expect(page.locator('#poem-pushkin-9 [data-poem-textual-note]')).toContainText('8/8');
          await expect(page.locator('#poem-pushkin-9 [data-poem-textual-note]')).toContainText('PA37');
          await expect(page.locator('#poem-pushkin-9 [data-poem-textual-note]')).toContainText('Стихи въ Альбомъ');
          await expect(page.locator('#poem-pushkin-9 [data-poem-textual-note] a')).toHaveAttribute('href', 'https://books.google.ru/books?id=8aFoAAAAcAAJ&pg=PA37');
          for (const poemId of ['pushkin-1', 'pushkin-2', 'pushkin-3', 'pushkin-4', 'pushkin-9']) {
            const note = page.locator('#poem-' + poemId + ' [data-poem-textual-note]');
            const disclosure = note.locator('details');
            await expect(disclosure).not.toHaveAttribute('open', '');
            await note.locator('summary').click();
            await expect(disclosure).toHaveAttribute('open', '');
            const overflow = await note.evaluate((node) => node.scrollWidth - node.clientWidth);
            expect(overflow, 'Textual note must wrap hashes and long URLs at width ' + width).toBeLessThanOrEqual(1);
            await note.locator('summary').click();
            await expect(disclosure).not.toHaveAttribute('open', '');
          }
          await expect(page.locator('#poem-pushkin-10 [data-poem-textual-note]')).toContainText('VERIFIED');
          await expect(page.locator('#poem-pushkin-10 [data-poem-textual-note]')).toContainText('16/16');
          await expect(page.locator('#poem-pushkin-10 [data-poem-textual-note]')).toContainText('DJVU-страница 28');
          await expect(page.locator('#poem-pushkin-10 [data-poem-textual-note]')).toContainText('ВЪ СИБИРЬ');
          await expect(page.locator('#poem-pushkin-10 [data-poem-textual-note] a')).toHaveAttribute('href', "https://commons.wikimedia.org/wiki/File:%D0%9F%D0%BE%D0%BB%D1%8F%D1%80%D0%BD%D0%B0%D1%8F_%D0%B7%D0%B2%D0%B5%D0%B7%D0%B4%D0%B0_%D0%BD%D0%B0_1856_%D0%9A%D0%BD%D0%B8%D0%B6%D0%BA%D0%B0_2_1856.djvu");
          await expect(page.locator('#poem-pushkin-5 [data-poem-textual-note]')).toContainText('VERIFIED');
          await expect(page.locator('#poem-pushkin-5 [data-poem-textual-note]')).toContainText('36/36');
          await expect(page.locator('#poem-pushkin-5 [data-poem-textual-note]')).toContainText('PDF-страницы 426–428');
          await expect(page.locator('#poem-pushkin-5 [data-poem-textual-note]')).toContainText('день зноя');
          await expect(page.locator('#poem-pushkin-5 [data-poem-textual-note] a')).toHaveAttribute('href', "https://www.shamardanov.ru/severnye-czvety-za-1825-1831-gg-skachat-pdf.html");
          await expect(page.locator('#poem-pushkin-8 [data-poem-textual-note]')).toContainText('VERIFIED');
          await expect(page.locator('#poem-pushkin-8 [data-poem-textual-note]')).toContainText('32/32');
          await expect(page.locator('#poem-pushkin-8 [data-poem-textual-note]')).toContainText('PDF-страницы 313–314');
          await expect(page.locator('#poem-pushkin-8 [data-poem-textual-note]')).toContainText('запоздалой');
          await expect(page.locator('#poem-pushkin-8 [data-poem-textual-note] a')).toHaveAttribute('href', "https://www.shamardanov.ru/severnye-czvety-za-1825-1831-gg-skachat-pdf.html");
          await expect(page.locator('#poem-pushkin-6 [data-poem-textual-note]')).toContainText('VERIFIED');
          await expect(page.locator('#poem-pushkin-6 [data-poem-textual-note]')).toContainText('24/24');
          await expect(page.locator('#poem-pushkin-6 [data-poem-textual-note]')).toContainText('PDF-страницы 368–369');
          await expect(page.locator('#poem-pushkin-6 [data-poem-textual-note]')).toContainText('Душе настало пробужденье');
          await expect(page.locator('#poem-pushkin-6 [data-poem-textual-note] a')).toHaveAttribute('href', "https://commons.wikimedia.org/wiki/File:%D0%A1%D0%B5%D0%B2%D0%B5%D1%80%D0%BD%D1%8B%D0%B5_%D1%86%D0%B2%D0%B5%D1%82%D1%8B_%D0%BD%D0%B0_1827_%D0%B3%D0%BE%D0%B4_1827.pdf");
          const morning = page.locator('#poem-pushkin-4');
          await expect(morning.getByText('Литературный анализ')).toBeVisible();
          await expect(morning.getByText('Духовный подтекст')).toHaveCount(0);
          const analysisGrid = morning.locator('[data-poem-analysis-grid]');
          const actualColumns = await analysisGrid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/u).filter(Boolean).length);
          expect(actualColumns, 'single analysis panel must fill the poem card').toBe(1);
        }
        if (poetId === 'mikhail-lermontov') {
          await expect(page.locator('[data-poem-textual-note]')).toHaveCount(7);
          await expect(page.locator('#poem-lermontov-5 [data-poem-textual-note]')).toContainText('98/98');
          await expect(page.locator('#poem-lermontov-5 [data-poem-textual-note]')).toContainText('бусурманы');
          await expect(page.locator('#poem-lermontov-5 [data-poem-textual-note]')).toContainText('две разные строки одного стихотворения');
          await expect(page.locator('#poem-lermontov-5 [data-poem-textual-note] a')).toHaveAttribute('href', 'https://commons.wikimedia.org/wiki/File:%D0%A1%D0%BE%D0%B2%D1%80%D0%B5%D0%BC%D0%B5%D0%BD%D0%BD%D0%B8%D0%BA_1837_06.pdf');
          await expect(page.locator('#poem-lermontov-11 [data-poem-textual-note]')).toContainText('72/72');
          await expect(page.locator('#poem-lermontov-11 [data-poem-textual-note]')).toContainText('так долго гнали');
          await expect(page.locator('#poem-lermontov-11 [data-poem-textual-note]')).toContainText('Земли чужой закон и нравы');
          await expect(page.locator('#poem-lermontov-11 [data-poem-textual-note]')).toContainText('56 и добавленные 16');
          await expect(page.locator('#poem-lermontov-11 [data-poem-textual-note] a')).toHaveAttribute('href', 'https://commons.wikimedia.org/wiki/File:%D0%9B%D0%B5%D1%80%D0%BC%D0%BE%D0%BD%D1%82%D0%BE%D0%B2_%D0%9C._%D0%AE._%D0%A1%D0%BE%D1%87%D0%B8%D0%BD%D0%B5%D0%BD%D0%B8%D1%8F_(%D0%9F%D0%BE%D0%B4_%D1%80%D0%B5%D0%B4._%D0%9F._%D0%90._%D0%92%D0%B8%D1%81%D0%BA%D0%BE%D0%B2%D0%B0%D1%82%D0%BE%D0%B2%D0%B0_1889-1991)._%D0%A2%D0%BE%D0%BC_1.pdf');
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
          await expect(page.locator('#poem-pushkin-7 [data-poem-textual-note]')).toContainText('VERIFIED');
          await expect(page.locator('#poem-pushkin-7 [data-poem-textual-note]')).toContainText('21/21');
          await expect(page.locator('#poem-pushkin-7 [data-poem-textual-note]')).toContainText('гордой');
          await expect(page.locator('#poem-pushkin-7 [data-poem-textual-note]')).toContainText('Напишет');
          await expect(page.locator('#poem-pushkin-7 [data-poem-textual-note]')).toContainText('PDF-страница 44');
          await expect(page.locator('#poem-pushkin-7 [data-poem-textual-note] a')).toHaveAttribute('href', 'https://commons.wikimedia.org/wiki/File:%D0%A1%D0%BE%D1%87%D0%B8%D0%BD%D0%B5%D0%BD%D0%B8%D1%8F_%D0%9F%D1%83%D1%88%D0%BA%D0%B8%D0%BD%D0%B0_%D0%A2%D0%BE%D0%BC_2_1818-1820_1905.pdf');
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
          const fullTyutchevPoem = page.locator('#poem-tyutchev-5 [data-poem-canonical]');
          await expect.poll(() => fullTyutchevPoem.evaluate((el) => (el.textContent || '').split('\n').filter((line) => line.trim()).length)).toBe(40);
          await expect(fullTyutchevPoem).toContainText('Как в буйной слепоте страстей');
          await expect(fullTyutchevPoem).toContainText('Горючей влагою своей');
          await expect(fullTyutchevPoem).toContainText('Ее волшебный взор, и речи');
          await expect(fullTyutchevPoem).toContainText('Боль, злую боль ожесточенья');
          await expect(fullTyutchevPoem).not.toContainText('<...>');
          await expect(page.locator('#poem-tyutchev-5 [data-poem-excerpt-notice]')).toHaveCount(0);
          await expect(page.locator('#poem-tyutchev-5 [data-poem-textual-note]')).toContainText('40/40');
          await expect(page.locator('#poem-tyutchev-5 [data-poem-textual-note] a')).toHaveAttribute('href', 'https://feb-web.ru/feb/tyutchev/texts/pss06/tu2/tu2-333-.htm?cmd=p');
          await expect(page.locator('#poem-tyutchev-11 [data-poem-year-label]')).toHaveText('1830-е годы');
          await expect(page.locator('a[href="#poem-tyutchev-11"] [data-poem-year-label]')).toHaveText('1830-е годы');
          await expect(page.locator('#poem-tyutchev-11 [data-poem-year-note]')).toContainText('не позднее апреля 1836');
          await expect(page.locator('#poem-tyutchev-11 [data-poem-textual-note]')).toContainText('ЦГАЛИ (505/19, л. 5)');
          await expect(page.locator('#poem-tyutchev-11 [data-poem-textual-note]')).toContainText('между 1834 годом и апрелем 1836');
          await expect(page.locator('#poem-tyutchev-8 [data-poem-textual-note]')).toContainText('VERIFIED');
          await expect(page.locator('#poem-tyutchev-8 [data-poem-textual-note]')).toContainText('4/4');
          await expect(page.locator('#poem-tyutchev-8 [data-poem-textual-note]')).toContainText('РГАЛИ');
          await expect(page.locator('#poem-tyutchev-8 [data-poem-textual-note]')).toContainText('1903');
          await expect(page.locator('#poem-tyutchev-8 [data-poem-textual-note]')).toContainText('НЕ был прочитан');
          await expect(page.locator('#poem-tyutchev-8 [data-poem-textual-note] a')).toHaveAttribute('href', "https://godliteratury.ru/articles/2015/03/10/stroki-dnya-tyutchev-2");
          await expect(page.locator('#poem-tyutchev-6 [data-poem-textual-note]')).toContainText('VERIFIED');
          await expect(page.locator('#poem-tyutchev-6 [data-poem-textual-note]')).toContainText('16/16');
          await expect(page.locator('#poem-tyutchev-6 [data-poem-textual-note]')).toContainText('PDF-страница 202');
          await expect(page.locator('#poem-tyutchev-6 [data-poem-textual-note]')).toContainText('Галатее');
          await expect(page.locator('#poem-tyutchev-6 [data-poem-textual-note] a')).toHaveAttribute('href', "https://commons.wikimedia.org/wiki/File:Sovremennik_1854_03-04.pdf");
          await expect(page.locator('#poem-tyutchev-9 [data-poem-textual-note]')).toContainText('VERIFIED');
          await expect(page.locator('#poem-tyutchev-9 [data-poem-textual-note]')).toContainText('16/16');
          await expect(page.locator('#poem-tyutchev-9 [data-poem-textual-note]')).toContainText('PDF-страница 333');
          await expect(page.locator('#poem-tyutchev-9 [data-poem-textual-note]')).toContainText('Т—');
          await expect(page.locator('#poem-tyutchev-9 [data-poem-textual-note] a')).toHaveAttribute('href', "https://commons.wikimedia.org/wiki/File:%D0%A1%D0%BE%D0%B2%D1%80%D0%B5%D0%BC%D0%B5%D0%BD%D0%BD%D0%B8%D0%BA_1839_14.pdf");
          await expect(page.locator('#poem-tyutchev-11 [data-poem-textual-note]')).toContainText('VERIFIED');
          await expect(page.locator('#poem-tyutchev-11 [data-poem-textual-note]')).toContainText('20/20');
          await expect(page.locator('#poem-tyutchev-11 [data-poem-textual-note]')).toContainText('PDF-страницы 128–129');
          await expect(page.locator('#poem-tyutchev-11 [data-poem-textual-note]')).toContainText('Весна');
          await expect(page.locator('#poem-tyutchev-11 [data-poem-textual-note] a')).toHaveAttribute('href', "https://commons.wikimedia.org/wiki/File:039_tom_Russkiy_arhiv_1879_vip_5-8.pdf");
          await expect(page.locator('#poem-tyutchev-10 [data-poem-textual-note]')).toContainText('VERIFIED');
          await expect(page.locator('#poem-tyutchev-10 [data-poem-textual-note]')).toContainText('12/12');
          await expect(page.locator('#poem-tyutchev-10 [data-poem-textual-note]')).toContainText('PDF-страница 147');
          await expect(page.locator('#poem-tyutchev-10 [data-poem-textual-note]')).toContainText('Край ты Русского народа');
          await expect(page.locator('#poem-tyutchev-10 [data-poem-textual-note] a')).toHaveAttribute('href', "https://commons.wikimedia.org/wiki/File:%D0%A0%D1%83%D1%81%D1%81%D0%BA%D0%B0%D1%8F_%D0%B1%D0%B5%D1%81%D0%B5%D0%B4%D0%B0_1857_%D0%9A%D0%BD%D0%B8%D0%B3%D0%B0_%D1%85%D1%85.pdf");
          await expect(page.locator('#poem-tyutchev-7 [data-poem-textual-note]')).toContainText('VERIFIED');
          await expect(page.locator('#poem-tyutchev-7 [data-poem-textual-note]')).toContainText('12/12');
          await expect(page.locator('#poem-tyutchev-7 [data-poem-textual-note]')).toContainText('страница PDF 7');
          await expect(page.locator('#poem-tyutchev-7 [data-poem-textual-note]')).toContainText('Прозрачный воздух, день хрустальный');
          await expect(page.locator('#poem-tyutchev-7 [data-poem-textual-note] a')).toHaveAttribute('href', "https://commons.wikimedia.org/wiki/File:%D0%A0%D1%83%D1%81%D1%81%D0%BA%D0%B0%D1%8F_%D0%B1%D0%B5%D1%81%D0%B5%D0%B4%D0%B0_1858_%D0%9A%D0%BD%D0%B8%D0%B3%D0%B0_10.pdf");
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
      });
    }
  }

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
