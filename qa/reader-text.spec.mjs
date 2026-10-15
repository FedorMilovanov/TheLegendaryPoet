import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const POET_PATH = '/poets/sergei-yesenin';

function useChromiumCore(testInfo) {
  test.skip(testInfo.project.name !== 'chromium-core', 'reader text certification runs once in Chromium core');
}

test('poem text has an exact selectable canonical layer separate from animated visual text', async ({ page }, testInfo) => {
  useChromiumCore(testInfo);

  const response = await page.goto(`${BASE_URL}${POET_PATH}`, { waitUntil: 'networkidle' });
  expect(response?.status()).toBeLessThan(400);

  const poem = page.locator('[data-poem-text]').first();
  const canonical = poem.locator('[data-poem-canonical]');
  const visual = poem.locator('[data-poem-visual][aria-hidden="true"]');

  await expect(poem).toBeVisible({ timeout: 15_000 });
  await expect(canonical).toBeVisible();
  await expect(visual).toBeVisible();

  const snapshot = await canonical.evaluate((node) => ({
    text: node.textContent ?? '',
    userSelect: getComputedStyle(node).userSelect,
    whiteSpace: getComputedStyle(node).whiteSpace,
    ariaHidden: node.getAttribute('aria-hidden'),
  }));

  expect(snapshot.text.length).toBeGreaterThan(0);
  expect(snapshot.userSelect).not.toBe('none');
  expect(snapshot.whiteSpace).toContain('pre-wrap');
  expect(snapshot.ariaHidden).not.toBe('true');
  await expect(visual).toHaveAttribute('aria-hidden', 'true');

  const selected = await canonical.evaluate((node) => {
    const selection = window.getSelection();
    selection?.removeAllRanges();
    const range = document.createRange();
    range.selectNodeContents(node);
    selection?.addRange(range);
    return selection?.toString() ?? '';
  });

  expect(selected).toBe(snapshot.text);
  expect(selected).toContain('\n');
});

test('kinetic headings expose one readable text layer without naming generic spans', async ({ page }, testInfo) => {
  useChromiumCore(testInfo);
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  const roots = page.locator(':is(span, p, h1, h2, h3):has(> .kinetic-word)');
  await expect(roots).toHaveCount(2);
  const phrases = [
    { text: 'Эпохи', heading: 'Лица Эпохи' },
    { text: 'Трезвая Оценка', heading: 'Вера, Культура и Трезвая Оценка' },
  ];
  for (const [index, phrase] of phrases.entries()) {
    const root = roots.nth(index);
    expect(await root.getAttribute('aria-label')).toBeNull();
    await expect(root.locator(':scope > .sr-only')).toHaveText(phrase.text);
    const words = root.locator(':scope > .kinetic-word');
    expect(await words.count()).toBeGreaterThan(0);
    for (const word of await words.all()) await expect(word).toHaveAttribute('aria-hidden', 'true');
    const heading = page.getByRole('heading', { level: 2, name: phrase.heading, exact: true });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toHaveAccessibleName(phrase.heading);
    // The visual layer must not become a second accessible copy or gain focus.
    await expect(root.locator('button, a, [tabindex]')).toHaveCount(0);
  }
});

// Text-only resize, not native zoom. Keep every destination and the search
// action available; root overflow alone misses clipped fixed-position chrome.
async function dockGeometry(page) {
  return page.locator('.mobile-dock').evaluate((dock) => {
    const rail = dock.querySelector('.dock-rail').getBoundingClientRect();
    const targets = [...dock.querySelectorAll('a, button')];
    const rects = targets.map((node) => node.getBoundingClientRect());
    const failures = [];
    for (const [i, node] of targets.entries()) {
      const rect = rects[i], name = node.getAttribute('aria-label');
      if (rect.width < 44 || rect.height < 44) failures.push(`${name}: small target`);
      if (rect.left < rail.left || rect.right > rail.right || rect.top < 0 || rect.bottom > innerHeight) failures.push(`${name}: outside rail/viewport`);
      const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      if (!hit || !node.contains(hit)) failures.push(`${name}: obscured target`);
      for (const other of rects.slice(i + 1)) {
        if (rect.left < other.right && rect.right > other.left && rect.top < other.bottom && rect.bottom > other.top) failures.push(`${name}: overlapping target`);
      }
      const label = node.querySelector('.dock-label');
      if (label) {
        const range = document.createRange(); range.selectNodeContents(label);
        for (const line of range.getClientRects()) {
          if (line.left < rect.left - 1 || line.right > rect.right + 1 || line.top < rect.top || line.bottom > rect.bottom) failures.push(`${name}: clipped text`);
        }
      }
    }
    const height = Math.max(rail.bottom, ...rects.map(r => r.bottom)) - Math.min(rail.top, ...rects.map(r => r.top));
    const published = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tlp-mobile-dock-clearance'));
    if (!Number.isFinite(published) || published < height - 1 || published > height + 2) failures.push('stale dock clearance');
    return failures;
  });
}

for (const theme of ['dark', 'light']) for (const width of [320, 390]) {
  test.describe(`mobile dock text resize ${theme} ${width}`, () => {
    test.use({ viewport: { width, height: 844 }, colorScheme: theme, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    test('all destinations survive 100→200→100% text with live clearance and keyboard search', async ({ page }, testInfo) => {
      useChromiumCore(testInfo);
      await page.addInitScript(t => localStorage.setItem('tlp-theme-mode', t), theme);
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      const dock = page.getByRole('navigation', { name: 'Мобильная навигация' });
      await expect(dock).toBeVisible();
      for (const font of [16, 32, 16]) {
        await page.evaluate(f => { document.documentElement.style.fontSize = `${f}px`; }, font);
        await expect.poll(() => dockGeometry(page), { message: `${font}px root: complete reachable dock` }).toEqual([]);
        const sizes = await dock.locator('.dock-label').evaluateAll(nodes => nodes.map(n => parseFloat(getComputedStyle(n).fontSize)));
        expect(sizes).toHaveLength(4);
        for (const size of sizes) expect(size).toBeCloseTo(font * 0.6, 1);
      }
      // Exercise the compact layout, rather than returning to 100% for actions.
      await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
      await expect.poll(() => dockGeometry(page)).toEqual([]);
      for (const [name, pathname] of [['Поэты','/poets'],['Рейтинг','/ratings'],['Статьи','/articles'],['Главная','/']]) {
        await dock.getByRole('link', { name, exact: true }).tap();
        await expect.poll(() => new URL(page.url()).pathname).toBe(pathname);
        await expect(dock.getByRole('link', { name, exact: true })).toHaveAttribute('aria-current', 'page');
      }
      await dock.getByRole('link', { name: 'Главная', exact: true }).focus();
      for (const name of ['Поэты', 'Открыть поиск и все разделы', 'Рейтинг', 'Статьи']) {
        await page.keyboard.press('Tab');
        await expect(dock.getByRole(name.startsWith('Открыть') ? 'button' : 'link', { name, exact: true })).toBeFocused();
      }
      const search = dock.getByRole('button', { name: 'Открыть поиск и все разделы' });
      await search.focus(); await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog', { name: 'Поиск по сайту' });
      await expect(dialog).toBeVisible();
      await expect(page.getByRole('combobox', { name: 'Поисковый запрос' })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(search).toBeFocused();
      await expect.poll(() => dockGeometry(page)).toEqual([]);
    });
  });
}
