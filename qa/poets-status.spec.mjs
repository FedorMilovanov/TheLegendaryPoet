import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { contrastRatio } from './contrast-helpers.mjs';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

// Clean component screenshots suppress fixed chrome and animated cursor:
 // a stitched mobile nav screenshot must not have its 3rd row occluded by
 // the live sticky header. Runtime dock/header behavior is tested separately.
const READING_INDEX_CAPTURE_STYLE = `
.site-header, .mobile-dock, .scroll-top-btn,
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
  test('Blok contents preserve eleven works and five Kulikovo parts and responsive two-column navigation', async ({ page }, testInfo) => {
    const widths = testInfo.project.name === 'chromium-core' ? [390, 1440] : [390];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${BASE_URL}/poets/alexander-blok`, { waitUntil: 'domcontentloaded' });

      const guide = page.getByRole('navigation', { name: 'Навигация по лирике' });
      const cards = page.locator('[id^="poem-blok-"]');
      await expect(cards).toHaveCount(11);
      // Both layers must agree on word indices, including NBSP before the
      // dash in «Скифы»; otherwise hover/focus affects the wrong visual word.
      for (let i = 0; i < 11; i += 1) {
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
      await expect(anchors).toHaveCount(11);
      await expect(guide).toHaveClass(/poet-reading-index/);
      await expect(guide.locator('ol > li')).toHaveCount(11);
      await expect(guide.locator('[data-poem-cycle]')).toHaveCount(10);
      await expect(guide.locator('[data-poem-cycle]').first()).toHaveText('Пляски смерти · II');
      await expect(guide.locator('[data-poem-cycle]').first()).toHaveCSS('font-size', '12px');
      if (width === 390) await expect(guide.locator('[data-poem-cycle]').first()).toBeVisible();
      await expect(anchors.first()).toHaveCSS('display', 'grid');
      await expect(anchors.first()).not.toHaveClass(/theme-elevated-surface/);
      await expect(anchors.first()).toHaveCSS('border-color', 'rgba(212, 175, 55, 0.22)');
      await expect(anchors.last()).toHaveAttribute('href', '#poem-blok-8');
      await expect(cards.locator('a', { hasText: 'Источник текста' })).toHaveCount(11);
      await expect(cards.locator('a[href^="/music/blok-"]')).toHaveCount(8);
      // Literary cycle I–V remains consecutive while only two parts have linked music.
      const kulikovoIds = ['blok-6', 'blok-7', 'blok-9', 'blok-10', 'blok-11'];
      for (const [offset, id] of kulikovoIds.entries()) {
        await expect(anchors.nth(5 + offset)).toHaveAttribute('href', `#poem-${id}`);
      }
      await expect(page.locator('#poem-blok-9')).toContainText('В ночь, когда Мамай залег с ордою');
      await expect(page.locator('#poem-blok-10')).toContainText('Опять с вековою тоскою');
      await expect(page.locator('#poem-blok-11')).toContainText('Вл. Соловьев');
      const finalCard = page.locator('#poem-blok-11');
      const epigraph = finalCard.locator('[data-poem-epigraph]');
      await expect(epigraph).toBeVisible();
      await expect(epigraph).toHaveAttribute('aria-label', 'Эпиграф к стихотворению');
      await expect(epigraph.locator('blockquote')).toHaveText('И мглою бед неотразимых Грядущий день заволокло.');
      await expect(epigraph.locator('figcaption')).toContainText('Вл. Соловьев');
      const canonical = finalCard.locator('[data-poem-canonical]');
      const canonicalText = await canonical.textContent();
      expect(canonicalText.split('\n').filter((line) => line.trim().length > 0)).toHaveLength(16);
      await expect(canonical).not.toContainText('Вл. Соловьев');
      await expect(canonical).not.toContainText('И мглою бед неотразимых');
      await expect(canonical).toContainText('Опять над полем Куликовым');
      expect(await epigraph.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
      if (testInfo.project.name === 'chromium-core') {
        mkdirSync('qa-artifacts', { recursive: true });
        await page.evaluate(() => document.fonts.ready);
        await epigraph.screenshot({
          path: `qa-artifacts/blok-epigraph-${width}-dark.png`,
          style: READING_INDEX_CAPTURE_STYLE,
        });
        await page.evaluate(() => document.documentElement.classList.add('theme-light'));
        await epigraph.screenshot({
          path: `qa-artifacts/blok-epigraph-${width}-light.png`,
          style: READING_INDEX_CAPTURE_STYLE,
        });
        await page.evaluate(() => document.documentElement.classList.remove('theme-light'));
      }
      await expect(page.locator('#poem-blok-11')).toContainText('Теперь твой час настал. — Молись!');

      const columnCount = await guide.locator('.grid').first().evaluate((element) =>
        getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/u).filter(Boolean).length,
      );
      expect(columnCount).toBe(width >= 360 ? 2 : 1);

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
          await expect(page.locator('[data-poem-textual-note]')).toHaveCount(11);
          for (const [number, count, critical] of [
            [1, 12, 'Теснится ль в сердце грусть:'],
            [2, 28, 'И правды чистыя ученья:'],
            [3, 12, 'И мачта гнется и скрыпит...'],
            [4, 20, 'Ночь тиха. Пустыня внемлет Богу,'],
          ]) {
            const id = 'lermontov-' + number;
            const canonicalText = page.locator('#poem-' + id + ' [data-poem-canonical]');
            await expect.poll(() => canonicalText.evaluate((node) =>
              (node.textContent || '').split('\n').filter((line) => line.trim()).length
            )).toBe(count);
            await expect(canonicalText).toContainText(critical);
            await expect(canonicalText).not.toContainText('<...>');
            const note = page.locator('#poem-' + id + ' [data-poem-textual-note]');
            await expect(note).toContainText(count + '/' + count);
            await expect(page.locator('#poem-' + id + ' [data-poem-year-note]')).toBeVisible();
            await expect(page.locator('#poem-' + id + ' a[href^="https://rvb.ru/19vek/lermontov/ss4/vol1/poems/"]')).toHaveCount(1);
            await expect(note.locator('a[href^="https://rvb.ru/19vek/lermontov/ss4/vol1/notes/"]')).toHaveCount(1);
            const disclosure = note.locator('details');
            await note.locator('summary').click();
            await expect(disclosure).toHaveAttribute('open', '');
            expect(await note.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
            await note.locator('summary').click();
            await expect(disclosure).not.toHaveAttribute('open', '');
          }
          await expect(page.locator('#poem-lermontov-2 [data-poem-textual-note]')).toContainText('чистой правды');
          await expect(page.locator('#poem-lermontov-3 [data-poem-textual-note]')).toContainText('17 лет');
          await expect(page.locator('#poem-lermontov-4 [data-poem-canonical]')).toContainText('в сияньи голубом');
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
          for (const [number, expectedLines, critical, sourceUrl, noteUrl] of [[1,20,"Жизнь моя! иль ты приснилась мне?","https://rvb.ru/20vek/esenin/pss7/vol1/poems/096.html","https://rvb.ru/20vek/esenin/pss7/vol1/notes/096.html"],[2,36,"Не волнуй того, что не сбылось,—","https://rvb.ru/20vek/esenin/pss7/vol1/poems/104.html","https://rvb.ru/20vek/esenin/pss7/vol1/notes/104.html"],[3,20,"Звонно чахнут тополя.","https://rvb.ru/20vek/esenin/pss7/vol1/poems/028.html","https://rvb.ru/20vek/esenin/pss7/vol1/notes/028.html"]]) {
            const card = page.locator('#poem-yesenin-' + number);
            const canonical = card.locator('[data-poem-canonical]');
            await expect.poll(() => canonical.evaluate((node) =>
              (node.textContent || '').split('\n').filter((line) => line.trim()).length
            )).toBe(expectedLines);
            await expect(canonical).toContainText(critical);
            await expect(card.locator('[data-poem-textual-note]')).toContainText(expectedLines + '/' + expectedLines);
            await expect(card.locator('[data-poem-year-note]')).toBeVisible();
            await expect(card.locator('[data-poem-textual-note] a')).toHaveAttribute('href', noteUrl);
            await expect(card.locator('a[href="' + sourceUrl + '"]')).toHaveCount(1);
          }
          await expect(page.locator('#poem-yesenin-3 [data-poem-textual-note]')).toContainText('Кротко чахнут тополя');
          await expect(page.locator('#poem-yesenin-1 [data-poem-textual-note]')).toContainText('Сергею Клычкову');
          await expect(page.locator('#poem-yesenin-8 [data-poem-year-note]')).toContainText('авторская датировка');
          await expect(page.getByRole('heading', { name: 'Источники и редакции текстов' })).toBeVisible();
          await expect(page.getByRole('link', { name: /Летопись жизни и творчества\. Том 5, книга 1/ })).toBeVisible();
          await expect(page.locator('[data-poem-textual-note]')).toHaveCount(10);
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
          await expect(page.locator('[data-poem-textual-note] a')).toHaveCount(10);
        }
        if (poetId === 'fyodor-tyutchev') {
          await expect(page.locator('[data-poem-textual-note]')).toHaveCount(11);
          for (const [number, expectedLines, sourceUrl, noteUrl] of [[1,18,"https://rvb.ru/19vek/tyutchev/bp/poems/073.html","https://rvb.ru/19vek/tyutchev/bp/notes/notes.html"],[2,12,"https://feb-web.ru/feb/tyutchev/texts/pss06/tu2/tu2-040-.htm?cmd=p","https://feb-web.ru/feb/tyutchev/texts/pss06/tu2/tu2-333-.htm?cmd=p"],[3,4,"https://rvb.ru/19vek/tyutchev/bp/poems/292.html","https://rvb.ru/19vek/tyutchev/bp/notes/notes.html"],[4,20,"https://feb-web.ru/feb/tyutchev/texts/pss06/tu2/tu2-219-.htm?cmd=p","https://rvb.ru/19vek/tyutchev/bp/notes/notes.html"]]) {
            const card = page.locator('#poem-tyutchev-' + number);
            const canonical = card.locator('[data-poem-canonical]');
            await expect.poll(() => canonical.evaluate((node) =>
              (node.textContent || '').split('\n').filter((line) => line.trim()).length
            )).toBe(expectedLines);
            await expect(card.locator('[data-poem-year-note]')).toBeVisible();
            await expect(card.locator('[data-poem-textual-note]')).toContainText(expectedLines + '/' + expectedLines);
            await expect(card.locator('[data-poem-textual-note] a')).toHaveAttribute('href', noteUrl);
            await expect(card.locator('a[href="' + sourceUrl + '"]')).toHaveCount(1);
          }
          await expect(page.locator('#poem-tyutchev-1 [data-poem-year-label]')).toContainText('конец 1820-х');
          await expect(entries.filter({hasText: 'Silentium!'}).locator('[data-poem-year-label]')).toContainText('конец 1820-х');
          await expect(page.locator('#poem-tyutchev-4 [data-poem-canonical]')).toContainText('Я встретил вас — и все былое');
          await expect(page.locator('#poem-tyutchev-4 [data-poem-canonical]')).toContainText('И что-то встрепенется в нас');
          await expect(page.locator('#poem-tyutchev-4 [data-poem-textual-note]')).toContainText('Клотильду Ботмер');
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
        expect(columns).toBe(width >= 360 ? 2 : 1);
        expect(await nav.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
        await jump.click();
        await expect(page).toHaveURL(/#poem-contents$/);
        // Hash navigation moves focus onto the section after two frames.
        // Verify it settled before explicitly focusing an entry; otherwise
        // the scheduled focus and this assertion race one another.
        await expect(nav).toBeFocused();
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


  test('mobile twenty-work contents remains a compact, fully addressable index', async ({ page }, testInfo) => {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${BASE_URL}/poets/fyodor-tyutchev`, { waitUntil: 'domcontentloaded' });
      const nav = page.getByRole('navigation', { name: 'Навигация по лирике' });
      const entries = nav.locator('ol > li > a[href^="#poem-"]');
      await expect(entries).toHaveCount(11);
      // Stress only the layout, without fabricating published poems in source.
      await nav.evaluate((node) => {
        const list = node.querySelector('ol');
        const originals = Array.from(list.children);
        for (let index = 0; index < 9; index += 1) {
          const clone = originals[index].cloneNode(true);
          clone.querySelector('a').setAttribute('href', `#poem-layout-only-${index}`);
          list.appendChild(clone);
        }
      });
      await expect(nav.locator('ol > li')).toHaveCount(20);
      const historicalDate = nav.locator('ol > li').first().locator('[data-poem-year-label]');
      await expect(historicalDate).toHaveCSS('white-space', 'normal');
      await expect(historicalDate).toContainText('конец 1820-х — начало 1830-х гг.');
      const geometry = await nav.evaluate((node) => {
        const columns = getComputedStyle(node.querySelector('ol')).gridTemplateColumns.trim().split(/\\s+/u).length;
        const links = Array.from(node.querySelectorAll('ol > li > a'));
        const years = Array.from(node.querySelectorAll('[data-poem-year-note]'));
        return {
          height: node.getBoundingClientRect().height,
          width: node.getBoundingClientRect().width,
          scrollOverflow: node.scrollWidth - node.clientWidth,
          documentOverflow: document.documentElement.scrollWidth - innerWidth,
          columns,
          minTouchHeight: Math.min(...links.map((link) => link.getBoundingClientRect().height)),
          minTitleFontSize: Math.min(...links.map((link) => parseFloat(getComputedStyle(link.firstElementChild).fontSize))),
          sourceNotesVisuallyHidden: years.every((note) => getComputedStyle(note).position === 'absolute'),
        };
      });
      expect(geometry.columns).toBe(width >= 360 ? 2 : 1);
      expect(geometry.minTouchHeight).toBeGreaterThanOrEqual(44);
      expect(geometry.minTitleFontSize).toBeGreaterThanOrEqual(14);
      expect(geometry.sourceNotesVisuallyHidden).toBe(true);
      expect(geometry.scrollOverflow).toBeLessThanOrEqual(1);
      expect(geometry.documentOverflow).toBeLessThanOrEqual(1);
      if (width === 390) expect(geometry.height, '20 works must not recreate a multi-screen card stack').toBeLessThan(1100);
      await nav.locator('ol > li > a').last().focus();
      await expect(nav.locator('ol > li > a').last()).toBeFocused();
      if (width === 390 && testInfo.project.name === 'chromium-core') {
        mkdirSync('qa-artifacts', { recursive: true });
        await page.evaluate(() => document.fonts.ready);
        await nav.screenshot({ path: 'qa-artifacts/poet-reading-index-20-390-dark.png', style: READING_INDEX_CAPTURE_STYLE });
        await page.evaluate(() => document.documentElement.classList.add('theme-light'));
        await nav.screenshot({ path: 'qa-artifacts/poet-reading-index-20-390-light.png', style: READING_INDEX_CAPTURE_STYLE });
      }
    }
  });

  test('Blok epigraph reserves its reading space before the lazy chunk arrives', async ({ page }) => {
    // Use one navigation per isolated Playwright page: later visits can reuse
    // the already-fetched dynamic module and bypass the intentional route gate.
    const widths = [390];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      let unblockChunk = () => {};
      const chunkGate = new Promise((resolve) => { unblockChunk = resolve; });
      let intercepted = 0;
      await page.route('**/assets/PoemEpigraph-*.js', async (route) => {
        intercepted += 1;
        await chunkGate;
        await route.continue();
      });
      try {
        await page.goto(`${BASE_URL}/poets/alexander-blok#poem-blok-11`, { waitUntil: 'domcontentloaded' });
        const card = page.locator('#poem-blok-11');
        const body = card.locator('[data-poem-text]');
        await expect(body).toBeVisible();
        await expect.poll(() => intercepted, { timeout: 10_000 }).toBe(1);
        const relativeTop = () => body.evaluate((node) => {
          const card = node.closest('#poem-blok-11');
          return node.getBoundingClientRect().top - card.getBoundingClientRect().top;
        });
        const before = await relativeTop();
        await expect(card.locator('[data-poem-epigraph]')).toHaveCount(0);
        unblockChunk();
        await expect(card.locator('[data-poem-epigraph]')).toBeVisible();
        const after = await relativeTop();
        expect(Math.abs(after - before), `delayed epigraph shifted Blok verse at ${width}px`).toBeLessThanOrEqual(2);
      } finally {
        unblockChunk();
        await page.unroute('**/assets/PoemEpigraph-*.js');
      }
    }
  });

  test('Blok supplementary poem titles remain globally searchable with exact deep links', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    // Exercise the real control: a synthetic window event on DOMContentLoaded
    // can precede CommandPalette's effect subscription in mobile WebKit.
    const mobileSearch = page.getByRole('button', { name: 'Открыть поиск и все разделы' });
    const desktopSearch = page.getByRole('button', { name: 'Открыть поиск — Ctrl K' });
    if (await mobileSearch.isVisible()) {
      await mobileSearch.click();
    } else {
      await desktopSearch.click();
    }
    const input = page.getByRole('combobox', { name: 'Поисковый запрос' });
    await expect(input).toBeVisible();
    for (const [query, title] of [
      ['В ночь, когда Мамай', 'На поле Куликовом — III'],
      ['Опять с вековою тоскою', 'На поле Куликовом — IV'],
      ['Опять над полем Куликовым', 'На поле Куликовом — V'],
    ]) {
      await input.fill(query);
      await expect(page.getByRole('option').filter({ hasText: title })).toBeVisible();
    }
    const result = page.getByRole('option').filter({ hasText: 'На поле Куликовом — V' });
    await result.click();
    await expect(page).toHaveURL(/\/poets\/alexander-blok#poem-blok-11$/);
    await expect(page.locator('#poem-blok-11')).toBeVisible();
  });

  test('Bryusov 1906/1913 full-text editions preserve 12, 20 and 28 lines without clipping', async ({ page }, testInfo) => {
    const widths = testInfo.project.name === 'chromium-core' ? [390, 1440] : [390];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(BASE_URL + '/poets/valery-bryusov', { waitUntil: 'domcontentloaded' });
      const cases = [
        ['bryusov-yunomu-poetu-fragment', 'Юному поэту', 12, 'Юноша бледный со взором горящим,', 'Зная, что в мире оставлю поэта.'],
        ['bryusov-tvorchestvo-fragment', 'Творчество', 20, 'Тень несозданных созданий', 'На эмалевой стене.'],
        ['bryusov-gryadushchie-gunny', 'Грядущие гунны', 28, 'Где вы, грядущие гунны,', 'Встречаю приветственным гимном.'],
      ];
      const nav = page.getByRole('navigation', { name: 'Навигация по лирике' });
      await expect(nav.locator('a[href^="#poem-bryusov-"]')).toHaveCount(cases.length);
      for (const [id, title, lines, first, last] of cases) {
        const card = page.locator('#poem-' + id);
        await expect(card).toBeVisible();
        const poemHeading = card.getByRole('heading', { level: 3, name: `«${title}»`, exact: true });
        await expect(poemHeading).toBeVisible();
        await expect(poemHeading).not.toContainText('фрагмент');
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

test('poet dossier outbound links retain readable CTA contrast in both themes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/poets/alexander-pushkin`, { waitUntil: 'domcontentloaded' });
  const dossier = page.locator('aside[aria-label="Навигация и сведения о поэте"]');
  for (const theme of ['dark', 'light']) {
    await page.evaluate((value) => localStorage.setItem('tlp-theme-mode', value), theme);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
    for (const name of ['Канал YouTube', 'Смотреть Rutube']) {
      const link = dossier.getByRole('link', { name });
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener noreferrer/);
      const label = link.locator('span.relative');
      const ratio = await contrastRatio(label);
      expect(ratio, `${theme} ${name} must meet 4.5:1 for small text`).toBeGreaterThanOrEqual(4.5);
      const fontSize = await label.evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
      expect(fontSize, `${theme} ${name} must not use tiny 10px lettering`).toBeGreaterThanOrEqual(12);
      const overflow = await link.evaluate((node) => node.scrollWidth - node.clientWidth);
      expect(overflow, `${theme} ${name} must fit in 390px dossier`).toBeLessThanOrEqual(1);
    }
  }
});
