import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTICLE_URL = `${BASE_URL}/essays/sergei-yesenin-1921-1925`;
const STORAGE_KEY = 'tlp-theme-mode';

function useChromiumCore(testInfo) {
  test.skip(testInfo.project.name !== 'chromium-core', 'theme/contrast certification runs once in Chromium core');
}

async function themeSnapshot(page) {
  return page.evaluate(() => ({
    dataset: document.documentElement.dataset.theme,
    lightClass: document.documentElement.classList.contains('theme-light'),
    colorScheme: getComputedStyle(document.documentElement).colorScheme,
    themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
    colorSchemeMeta: document.querySelector('meta[name="color-scheme"]')?.getAttribute('content'),
    toggles: [...document.querySelectorAll('[data-theme-mode]')].map((node) => node.getAttribute('data-theme-mode')),
  }));
}

async function contrastMeasurements(locator, directTextOnly = false) {
  return locator.evaluateAll((nodes, directTextOnly) => {
    const parse = (value) => {
      const match = value.match(/rgba?\(([^)]+)\)/i);
      if (!match) {
        // Tailwind may serialize computed colors as oklch()/color(). Let the
        // browser convert those to sRGB instead of silently treating them as black.
        if (!CSS.supports('color', value)) throw new Error(`Unsupported computed color: ${value}`);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const context = canvas.getContext('2d');
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
        return { r, g, b, a: a / 255 };
      }
      const parts = match[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
      return { r: parts[0], g: parts[1], b: parts[2], a: Number.isFinite(parts[3]) ? parts[3] : 1 };
    };
    const composite = (front, back) => {
      const alpha = front.a + back.a * (1 - front.a);
      if (alpha <= 0) return { r: 255, g: 255, b: 255, a: 1 };
      return {
        r: (front.r * front.a + back.r * back.a * (1 - front.a)) / alpha,
        g: (front.g * front.a + back.g * back.a * (1 - front.a)) / alpha,
        b: (front.b * front.a + back.b * back.a * (1 - front.a)) / alpha,
        a: alpha,
      };
    };
    const luminance = ({ r, g, b }) => {
      const channel = (raw) => {
        const c = raw / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };

    return nodes.filter((node) => !directTextOnly || (node instanceof HTMLElement
      && [...node.childNodes].some((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim()))).map((node) => {
      let background = { r: 255, g: 255, b: 255, a: 1 };
      const chain = [];
      for (let current = node; current instanceof Element; current = current.parentElement) chain.push(current);
      for (const current of chain.reverse()) {
        const bg = parse(getComputedStyle(current).backgroundColor);
        if (bg.a > 0) background = composite(bg, background);
      }

      const foreground = composite(parse(getComputedStyle(node).color), background);
      const l1 = luminance(foreground);
      const l2 = luminance(background);
      return { text: node.textContent, ratio: (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05) };
    });
  }, directTextOnly);
}

async function contrastRatio(locator) {
  await locator.waitFor({ state: 'attached' });
  const measurements = await contrastMeasurements(locator);
  expect(measurements).toHaveLength(1);
  return measurements[0].ratio;
}


async function nonTextContrast(locator, mode = 'border') {
  return locator.evaluate((node, mode) => {
    const parse = (value) => {
      const match = value.match(/rgba?\(([^)]+)\)/i);
      if (!match) throw new Error(`Unsupported computed color: ${value}`);
      const parts = match[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
      return { r: parts[0], g: parts[1], b: parts[2], a: Number.isFinite(parts[3]) ? parts[3] : 1 };
    };
    const composite = (front, back) => {
      const alpha = front.a + back.a * (1 - front.a);
      if (alpha <= 0) return { r: 255, g: 255, b: 255, a: 1 };
      return {
        r: (front.r * front.a + back.r * back.a * (1 - front.a)) / alpha,
        g: (front.g * front.a + back.g * back.a * (1 - front.a)) / alpha,
        b: (front.b * front.a + back.b * back.a * (1 - front.a)) / alpha,
        a: alpha,
      };
    };
    const luminance = ({ r, g, b }) => {
      const channel = (raw) => {
        const c = raw / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };
    const ratio = (a, b) => {
      const l1 = luminance(a);
      const l2 = luminance(b);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };

    let background = { r: 255, g: 255, b: 255, a: 1 };
    const chain = [];
    for (let current = node; current instanceof Element; current = current.parentElement) chain.push(current);
    for (const current of chain.reverse()) {
      const bg = parse(getComputedStyle(current).backgroundColor);
      if (bg.a > 0) background = composite(bg, background);
    }

    const style = getComputedStyle(node);
    if (mode === 'border') {
      return ratio(composite(parse(style.borderTopColor), background), background);
    }

    const shadowColors = [...style.boxShadow.matchAll(/rgba?\([^)]+\)/gi)].map((match) => parse(match[0]));
    const visibleShadow = shadowColors.findLast((color) => color.a >= 0.5);
    if (visibleShadow) return ratio(composite(visibleShadow, background), background);

    if (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) {
      return ratio(composite(parse(style.outlineColor), background), background);
    }
    return 1;
  }, mode);
}

async function setThemeFromUi(page, mode) {
  const snapshot = await themeSnapshot(page);
  if (snapshot.dataset === mode) return;
  const label = mode === 'light' ? 'Включить светлую тему' : 'Включить темную тему';
  const toggle = page.getByRole('button', { name: label }).filter({ visible: true }).first();
  if (!(await toggle.isVisible().catch(() => false))) {
    // Longform reading mode intentionally hides fixed chrome after deep focus.
    // A real upward scroll restores the chrome; do not force-click hidden UI.
    await page.mouse.move(100, 100);
    await page.mouse.wheel(0, -2500);
    await expect(toggle).toBeVisible({ timeout: 5_000 });
  }
  await toggle.click();
  await expect.poll(async () => (await themeSnapshot(page)).dataset).toBe(mode);
}

test.describe('theme authority and contrast', () => {
  test('persisted light preference owns prepaint and browser chrome before React settles', async ({ page }, testInfo) => {
    useChromiumCore(testInfo);
    await page.addInitScript((key) => localStorage.setItem(key, 'light'), STORAGE_KEY);
    const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);

    const early = await page.evaluate(() => ({
      dataset: document.documentElement.dataset.theme,
      lightClass: document.documentElement.classList.contains('theme-light'),
      colorScheme: document.documentElement.style.colorScheme,
      themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
      colorSchemeMeta: document.querySelector('meta[name="color-scheme"]')?.getAttribute('content'),
    }));
    expect(early).toEqual({
      dataset: 'light',
      lightClass: true,
      colorScheme: 'light',
      themeColor: '#fffaf0',
      colorSchemeMeta: 'light',
    });

    await page.waitForLoadState('networkidle');
    const settled = await themeSnapshot(page);
    expect(settled.dataset).toBe('light');
    expect(settled.lightClass).toBe(true);
    expect(settled.colorScheme).toContain('light');
    expect(settled.themeColor).toBe('#fffaf0');
    expect(settled.colorSchemeMeta).toBe('light');
    expect(settled.toggles.length).toBeGreaterThanOrEqual(2);
    expect(new Set(settled.toggles)).toEqual(new Set(['light']));
  });

  test('same-document toggles and a second tab converge with metadata', async ({ page, context }, testInfo) => {
    useChromiumCore(testInfo);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
    await page.reload({ waitUntil: 'networkidle' });

    const peer = await context.newPage();
    await peer.goto(BASE_URL, { waitUntil: 'networkidle' });
    expect((await themeSnapshot(page)).dataset).toBe('dark');
    expect((await themeSnapshot(peer)).dataset).toBe('dark');

    await setThemeFromUi(page, 'light');
    await expect.poll(async () => (await themeSnapshot(peer)).dataset).toBe('light');

    for (const current of [page, peer]) {
      const state = await themeSnapshot(current);
      expect(state.lightClass).toBe(true);
      expect(state.themeColor).toBe('#fffaf0');
      expect(state.colorSchemeMeta).toBe('light');
      expect(state.toggles.length).toBeGreaterThanOrEqual(2);
      expect(new Set(state.toggles)).toEqual(new Set(['light']));
    }

    await setThemeFromUi(peer, 'dark');
    await expect.poll(async () => (await themeSnapshot(page)).dataset).toBe('dark');
    const dark = await themeSnapshot(page);
    expect(dark.themeColor).toBe('#050810');
    expect(dark.colorSchemeMeta).toBe('dark');
  });


  test('community control boundaries and focus indicators meet non-text contrast in dark/light themes', async ({ page }, testInfo) => {
    useChromiumCore(testInfo);
    const response = await page.goto(ARTICLE_URL, { waitUntil: 'networkidle' });
    expect(response?.status()).toBeLessThan(400);

    const help = page.getByText(/Минимум \d+ символов/).filter({ visible: true }).first();
    await expect(help).toBeVisible({ timeout: 15_000 });
    const panel = help.locator('xpath=ancestor::section[1]');
    const kind = panel.getByRole('button', { name: 'Историческая справка' });
    const textarea = panel.getByPlaceholder('Что особенно точно, спорно, сильно или слабо?');
    await expect(kind).toBeVisible();
    await expect(textarea).toBeVisible();

    for (const mode of ['dark', 'light']) {
      await setThemeFromUi(page, mode);

      expect(await nonTextContrast(kind), `${mode} comment-kind boundary`).toBeGreaterThanOrEqual(3);

      await textarea.click();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await expect(kind).toBeFocused();
      expect(await nonTextContrast(kind, 'focus'), `${mode} comment-kind focus indicator`).toBeGreaterThanOrEqual(3);

      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Shift+Tab');
      await expect(textarea).toBeFocused();
      expect(await nonTextContrast(textarea, 'focus'), `${mode} comment textarea focus indicator`).toBeGreaterThanOrEqual(3);
    }
  });

  test('functional comment text and unselected rating controls meet computed dark/light contrast', async ({ page }, testInfo) => {
    useChromiumCore(testInfo);
    const response = await page.goto(ARTICLE_URL, { waitUntil: 'networkidle' });
    expect(response?.status()).toBeLessThan(400);

    const help = page.getByText(/Минимум \d+ символов/).filter({ visible: true }).first();
    await expect(help).toBeVisible({ timeout: 15_000 });
    const panel = help.locator('xpath=ancestor::section[1]');
    const unselectedKind = panel.getByRole('button', { name: 'Историческая справка' });
    await expect(unselectedKind).toBeVisible();
    const unselectedStar = panel.locator('.rating-star[data-active="false"]').first();
    await expect(unselectedStar).toBeVisible();

    for (const mode of ['dark', 'light']) {
      await setThemeFromUi(page, mode);
      expect(await contrastRatio(help), `${mode} comment help text`).toBeGreaterThanOrEqual(4.5);
      expect(await contrastRatio(unselectedKind), `${mode} unselected comment-kind text`).toBeGreaterThanOrEqual(4.5);
      expect(await contrastRatio(unselectedStar), `${mode} enabled unselected rating star`).toBeGreaterThanOrEqual(3);
    }
  });
});


test.describe('light theme semantic surfaces', () => {
  test('poem feature, command palette and poet body use explicit semantic contracts', async ({ page }, testInfo) => {
    useChromiumCore(testInfo);
    await page.addInitScript((key) => localStorage.setItem(key, 'light'), STORAGE_KEY);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const poemFeature = page.getByText('Стихотворение дня').locator('xpath=ancestor::section[1]');
    await expect(poemFeature).toHaveClass(/theme-poem-feature/);
    const verse = poemFeature.locator('.theme-poem-text');
    await expect(verse).toBeVisible();
    expect(await contrastRatio(verse), 'light poem preview contrast').toBeGreaterThanOrEqual(4.5);

    await page.getByRole('button', { name: 'Открыть поиск', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Поиск по сайту' });
    await expect(dialog).toHaveClass(/theme-modal-surface/);
    const input = page.getByRole('combobox', { name: 'Поисковый запрос' });
    expect(await contrastRatio(input), 'light command input contrast').toBeGreaterThanOrEqual(4.5);
    await page.getByRole('button', { name: 'Закрыть поиск' }).click();

    await page.goto(`${BASE_URL}/poets/fyodor-tyutchev`, { waitUntil: 'networkidle' });
    const themedPage = page.locator('#main-content .theme-page-surface').first();
    await expect(themedPage).toBeVisible();
    const hero = page.locator('#main-content .theme-dark-island').first();
    await expect(hero).toBeVisible();

    const surface = await themedPage.evaluate((element) => {
      const style = getComputedStyle(element);
      return { backgroundColor: style.backgroundColor, color: style.color };
    });
    expect(surface.backgroundColor).toMatch(/rgb\(255, 250, 240\)/);
    expect(surface.color).toMatch(/rgb\(19, 32, 42\)/);
  });

  test('persistent audio chrome remains a deliberate readable dark island in light theme', async ({ page }, testInfo) => {
    useChromiumCore(testInfo);
    await page.addInitScript((key) => localStorage.setItem(key, 'light'), STORAGE_KEY);
    await page.goto(`${BASE_URL}/music`, { waitUntil: 'networkidle' });

    const play = page.getByRole('button', { name: /воспроизвести трек|поставить на паузу/i }).first();
    await play.click();
    await page.locator('a[href="/ratings"]').first().evaluate((link) => link.click());
    await expect(page).toHaveURL(/\/ratings$/);

    const player = page.locator('.global-audio-mini');
    await expect(player).toHaveClass(/theme-dark-island/);
    const title = player.locator('.audio-title');
    await expect(title).toBeVisible();
    expect(await contrastRatio(title), 'light-theme persistent audio title contrast').toBeGreaterThanOrEqual(4.5);
  });

  test('Hall remains an intentional dark island without changing Hall source scope', async ({ page }, testInfo) => {
    useChromiumCore(testInfo);
    await page.addInitScript((key) => localStorage.setItem(key, 'light'), STORAGE_KEY);
    await page.goto(`${BASE_URL}/hall`, { waitUntil: 'networkidle' });

    const hall = page.locator('[data-hall-production-mode]').first();
    await expect(hall).toBeVisible();
    const heading = hall.getByRole('heading', { name: 'Зал Поэтов' });
    await expect(heading).toBeVisible();

    const visual = await hall.evaluate((element) => {
      const style = getComputedStyle(element);
      const headingStyle = getComputedStyle(element.querySelector('h1'));
      return {
        backgroundColor: style.backgroundColor,
        colorScheme: style.colorScheme,
        headingColor: headingStyle.color,
      };
    });

    expect(visual.backgroundColor).toMatch(/rgb\(9, 9, 9\)/);
    expect(visual.colorScheme).toContain('dark');
    expect(visual.headingColor).toMatch(/rgb\(255, 255, 255\)/);
  });
});


for (const theme of ['dark', 'light']) {
  test(`shared footer text and navigation meet contrast in ${theme} theme`, async ({ page }, testInfo) => {
    useChromiumCore(testInfo);
    await page.addInitScript(({ key, theme }) => localStorage.setItem(key, theme), { key: STORAGE_KEY, theme });
    await page.goto(`${BASE_URL}/about`, { waitUntil: 'networkidle' });
    const footer = page.locator('footer');
    await expect(footer).toHaveCount(1);
    await footer.scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);
    const nodes = footer.locator('*');
    const textIndexes = await nodes.evaluateAll((elements) => elements.flatMap((node, index) => (
      node instanceof HTMLElement
      && [...node.childNodes].some((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim())
      // The unchanged gradient logotype is exempt; its descriptive tagline is not.
      && !node.matches('a[href="/"] .neon-blue-gradient') ? [index] : []
    )));
    expect(textIndexes.length).toBeGreaterThanOrEqual(20);
    for (const index of textIndexes) {
      const node = nodes.nth(index);
      expect(await contrastRatio(node), `${theme}: ${await node.textContent()}`).toBeGreaterThanOrEqual(4.5);
    }
    const firstLink = footer.locator('a[href="/poets"]');
    const nextLink = footer.locator('a[href="/hall"]');
    await firstLink.focus();
    await page.keyboard.press('Tab');
    await expect(nextLink).toBeFocused();
    await expect.poll(() => nextLink.evaluate((node) => node.getAnimations().length)).toBe(0);
    expect(await contrastRatio(nextLink), `${theme} focused navigation text`).toBeGreaterThanOrEqual(4.5);
    expect(await nonTextContrast(nextLink, 'focus'), `${theme} keyboard focus indicator`).toBeGreaterThanOrEqual(3);
    await nextLink.evaluate((node) => node.blur());
    await nextLink.hover();
    await expect.poll(() => nextLink.evaluate((node) => node.getAnimations().length)).toBe(0);
    expect(await contrastRatio(nextLink), `${theme} hovered navigation text`).toBeGreaterThanOrEqual(4.5);
  });
}

async function seedContrastState(page, theme) {
  await page.addInitScript((theme) => {
    localStorage.setItem('tlp-theme-mode', theme);
    const targets = [
      { targetType: 'poet', targetId: 'alexander-pushkin', scores: { language: 4, depth: 4, legacy: 4, truth: 4 } },
      { targetType: 'track', targetId: 'pushkin-tucha', scores: { voice: 4, music: 4, text: 4 } },
    ];
    localStorage.setItem('tlp-my-archive:v4', JSON.stringify({ version: 4, updatedAt: Date.now(), operations: [
      { id: 'pushkin-1', favorite: true, addedAt: Date.now(), generation: '1', writerId: 'contrast-fixture' },
    ] }));
    const createdAt = new Date().toISOString();
    localStorage.setItem('tlp-community-feedback:v3', JSON.stringify({
      version: 3, outbox: [], settledOperations: {}, ownRatings: {}, cooldowns: {}, helpfulVotes: {},
      updatedAt: createdAt, lastSyncedAt: null,
      localSnapshot: {
        ratings: targets.map((entry, i) => ({ ...entry, id: `rating-contrast-fixture-${i}`, createdAt })),
        comments: targets.map(({ targetType, targetId }, i) => ({ targetType, targetId,
          id: `comment-contrast-fixture-${i}`, author: 'QA', text: 'Локальная запись для проверки отображения счётчика.',
          kind: 'literary', helpful: 0, createdAt })),
      },
    }));
  }, theme);
}

async function expectReadableCardText(root, state) {
  // One browser task: do not spend a protocol round trip on every glyph parent.
  const measurements = await contrastMeasurements(root.locator('*'), true);
  expect(measurements.length).toBeGreaterThan(10);
  for (const { text, ratio } of measurements) {
    expect(ratio, `${state}: ${text}`).toBeGreaterThanOrEqual(4.5);
  }
}

for (const theme of ['dark', 'light']) {
  for (const route of ['/', '/poets']) {
    test(`poet card contrast on ${route} in ${theme}, including populated feedback`, async ({ page }, testInfo) => {
      useChromiumCore(testInfo);
      await seedContrastState(page, theme);
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
      const card = page.locator('a[href="/poets/alexander-pushkin"]:has(h3)');
      await card.scrollIntoViewIfNeeded();
      await expect(card.getByText('1 мнений', { exact: true })).toBeVisible();
      await expectReadableCardText(card, `${theme} idle`);
      await card.focus();
      await page.keyboard.press('Shift');
      await expect(card).toBeFocused();
      await expect.poll(() => card.locator('h3').evaluate((node) => node.getAnimations().length)).toBe(0);
      await expectReadableCardText(card, `${theme} keyboard focus`);
      expect(await nonTextContrast(card, 'focus')).toBeGreaterThanOrEqual(3);
      await card.evaluate((node) => node.blur());
      await card.hover();
      await expect.poll(() => card.locator('h3').evaluate((node) => node.getAnimations().length)).toBe(0);
      await expectReadableCardText(card, `${theme} hover`);
    });
  }
  for (const route of ['/', '/music', '/archive', '/contrast-missing-route']) {
    test(`section label contrast on ${route} in ${theme}`, async ({ page }, testInfo) => {
      useChromiumCore(testInfo);
      await seedContrastState(page, theme);
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
      const label = page.locator('.section-label').first();
      await label.scrollIntoViewIfNeeded();
      expect(await contrastRatio(label)).toBeGreaterThanOrEqual(4.5);
      if (route === '/music') {
        if (theme === 'light') {
          // Backdrop images/gradients are outside this calculator. Certify the
          // translucent header against its darkest possible backing as well.
          await page.locator('main').evaluate((node) => { node.style.backgroundColor = '#050505'; });
          expect(await contrastRatio(label)).toBeGreaterThanOrEqual(4.5);
          await page.locator('main').evaluate((node) => { node.style.removeProperty('background-color'); });
        }
        const summary = page.getByText('1 мнений', { exact: true });
        await expect(summary).toBeVisible();
        expect(await contrastRatio(summary)).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
  test(`section label contrast in render-error panel in ${theme}`, async ({ page }, testInfo) => {
    useChromiumCore(testInfo);
    await seedContrastState(page, theme);
    // Fail the initial route locally: certify the real boundary's colors,
    // independently of the separate offline/SPA recovery tests.
    await page.route('**/assets/RatingsPage-*.js', (route) => route.fulfill({
      contentType: 'text/javascript', body: 'export default function ContrastFixture(){throw new Error("contrast-fixture")}',
    }));
    await page.goto(`${BASE_URL}/ratings`, { waitUntil: 'networkidle' });
    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible({ timeout: 10_000 });
    expect(await contrastRatio(alert.locator('.section-label'))).toBeGreaterThanOrEqual(4.5);
  });
}
