import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTICLE_URL = `${BASE_URL}/essays/sergei-yesenin-1921-1925`;
const STORAGE_KEY = 'tlp-theme-mode';

function useChromiumCore(testInfo) {
  test.skip(testInfo.project.name !== 'chromium-core', 'theme/contrast certification runs once in Chromium core');
}

// Layout can still settle after scrolling a long, content-visibility essay.
// Deliver the pointer only after two rendered frames, then prove real CSS hover.
async function hoverCitation(page, link) {
  await link.evaluate((node) => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect(link).toBeInViewport({ ratio: 1 });
  await link.hover();
  await expect.poll(() => link.evaluate((node) => node.matches(':hover'))).toBe(true);
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
      if (!match) {
        // Tailwind's dark modal backgrounds can serialize as OKLab. Use the
        // same real browser conversion as text checks; never skip the ratio.
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

    await page.getByRole('button', { name: 'Открыть поиск — Ctrl K', exact: true }).click();
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

// Bound the portrait's translucent gradient over black AND white image pixels.
// Unlike the ordinary surface helper, include gradient alpha and label opacity.
async function heroCaptionContrasts(panel) {
  return panel.evaluate((panel) => {
    const context = document.createElement('canvas').getContext('2d');
    const rgba = (css) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = css;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
      return [r, g, b, a / 255];
    };
    const mix = (front, back, alpha = front[3]) => front.slice(0, 3).map((c, i) => c * alpha + back[i] * (1 - alpha));
    const luminance = (rgb) => rgb.map((c) => c / 255).map((c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
      .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
    const gradient = getComputedStyle(panel).backgroundImage;
    const stops = gradient.match(/rgba?\([^)]+\)/g);
    if (!stops || stops.length !== 2) throw new Error(`Update the caption paint model for ${gradient}`);
    const opacity = Number(getComputedStyle(panel.parentElement).opacity);
    return [...panel.children].map((node) => {
      const color = rgba(getComputedStyle(node).color);
      const ratios = stops.flatMap((stop) => [0, 255].map((channel) => {
        const image = [channel, channel, channel];
        const surface = mix(rgba(stop), image);
        const background = mix(surface, image, opacity);
        const foreground = mix(mix(color, surface), image, opacity);
        const a = luminance(foreground), b = luminance(background);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      }));
      return { text: node.textContent, ratio: Math.min(...ratios) };
    });
  });
}

for (const theme of ['dark', 'light']) for (const mobile of [false, true]) {
  test.describe(`hero caption ${theme}, ${mobile ? 'touch' : 'keyboard'}`, () => {
    test.use({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
      isMobile: mobile, hasTouch: mobile, colorScheme: theme, reducedMotion: 'reduce' });
    test('names and dates remain readable over the portrait', async ({ page }, testInfo) => {
      useChromiumCore(testInfo);
      await page.addInitScript((theme) => localStorage.setItem('tlp-theme-mode', theme), theme);
      await page.goto(BASE_URL);
      const shells = page.locator('[data-hero-poet-window-shell]');
      await expect(shells).toHaveCount(6);
      await page.evaluate(() => document.fonts.ready);
      if (!mobile) await page.keyboard.press('Tab');
      for (const shell of await shells.all()) {
        if (!mobile) await shell.locator('a').focus();
        const panel = shell.locator('.hero-poet-window-label-panel');
        await expect(shell.locator('[data-hero-poet-window-label]')).toHaveCSS('opacity', mobile ? '0.96' : '1');
        for (const { text, ratio } of await heroCaptionContrasts(panel)) {
          expect.soft(ratio, `${theme} ${text}: worst-case portrait backdrop`).toBeGreaterThanOrEqual(4.5);
        }
      }
    });
  });
}

for (const theme of ['dark', 'light']) for (const slug of [
  'simonov-syn-artillerista-realnaya-istoriya',
  'galina-benislavskaya-yesenin-manuscripts-publishing-archive',
]) test.describe(`source library ${theme} ${slug}`, () => {
  test.use({ viewport: theme === 'light' ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
    colorScheme: theme, isMobile: theme === 'light', hasTouch: theme === 'light', reducedMotion: 'reduce' });
  test('bibliography text and controls remain readable through expansion and filtering', async ({ page }, testInfo) => {
    useChromiumCore(testInfo);
    await page.addInitScript((theme) => localStorage.setItem('tlp-theme-mode', theme), theme);
    await page.goto(`${BASE_URL}/essays/${slug}`);
    const sources = page.locator('#sources');
    await expect(sources).toBeVisible();
    // This surface is ordinary themed reading UI, not an immersive dark island.
    // An unmodelled gradient would invalidate the computed contrast helper.
    expect(await sources.evaluate((node) => getComputedStyle(node).backgroundImage)).toBe('none');
    await expectReadableCardText(sources, `${theme} collapsed bibliography`);
    await sources.getByRole('button', { name: /Показать ещё/ }).click();
    await expect(sources.locator('li[id^="source-"]')).toHaveCount(slug.startsWith('simonov') ? 21 : 13);
    await expectReadableCardText(sources, `${theme} expanded, including sources without URLs`);
    const primary = sources.getByRole('button', { name: /^Первичные/ });
    const count = Number((await primary.textContent()).match(/\d+/)[0]);
    await primary.click();
    await expect(primary).toHaveAttribute('aria-pressed', 'true');
    await expect(sources.locator('li[id^="source-"]')).toHaveCount(Math.min(count, 16));
    await expectReadableCardText(sources, `${theme} primary filter`);
    await page.keyboard.press('Tab');
    await primary.focus();
    expect(await nonTextContrast(primary, 'focus')).toBeGreaterThanOrEqual(3);
    await expectReadableCardText(sources, `${theme} keyboard focus`);
    await primary.blur();
    await primary.hover();
    expect(await contrastRatio(primary.locator('span').filter({ hasText: 'Первичные' }).last())).toBeGreaterThanOrEqual(4.5);
  });
});

// The dock can overlay arbitrary page images. Bound both ends of its glass
// gradient over black/white, and include the active pill painted under text.
async function dockTextContrasts(dock) {
  return dock.evaluate((dock) => {
    const context = document.createElement('canvas').getContext('2d');
    const rgba = css => {
      if (!CSS.supports('color', css)) throw new Error(`Unsupported dock color: ${css}`);
      context.clearRect(0, 0, 1, 1); context.fillStyle = css; context.fillRect(0, 0, 1, 1);
      const [r,g,b,a] = context.getImageData(0, 0, 1, 1).data;
      return [r,g,b,a/255];
    };
    const stops = node => {
      const gradient = getComputedStyle(node).backgroundImage;
      const colors = gradient.match(/rgba?\([^)]+\)/g);
      if (!colors || colors.length !== 2) throw new Error(`Update dock paint model: ${gradient}`);
      return colors.map(rgba);
    };
    const mix = (front, back) => front.slice(0,3).map((c,i) => c * front[3] + back[i] * (1-front[3]));
    const lum = rgb => rgb.map(c => c/255).map(c => c<=0.04045 ? c/12.92 : ((c+0.055)/1.055)**2.4)
      .reduce((v,c,i) => v+c*[0.2126,0.7152,0.0722][i],0);
    const backgrounds = stops(dock.querySelector('.dock-rail')).flatMap(stop => [0,255].map(c => mix(stop,[c,c,c])));
    return [...dock.querySelectorAll('.dock-label')].map(label => {
      const pill = label.parentElement.querySelector('.dock-pill');
      const surfaces = pill ? backgrounds.flatMap(bg => stops(pill).map(stop => mix(stop,bg))) : backgrounds;
      const color = rgba(getComputedStyle(label).color);
      return {text:label.textContent,ratio:Math.min(...surfaces.map(bg => {
        const a=lum(mix(color,bg)), b=lum(bg);return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
      }))};
    });
  });
}

for (const theme of ['dark','light']) test.describe(`mobile dock contrast ${theme}`, () => {
  test.use({viewport:{width:320,height:844},colorScheme:theme,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  test('all four labels contrast with the glass rail and active pill at 100/200%', async ({page},testInfo) => {
    useChromiumCore(testInfo);
    await page.addInitScript(t => localStorage.setItem('tlp-theme-mode',t),theme);
    await page.goto(BASE_URL,{waitUntil:'networkidle'});
    const dock = page.locator('.mobile-dock');
    await expect.poll(() => dock.locator('.dock-rail').evaluate(n => getComputedStyle(n).opacity)).toBe('1');
    for (const font of [16,32]) {
      await page.evaluate(f => {document.documentElement.style.fontSize=`${f}px`;},font);
      const values = await dockTextContrasts(dock);
      expect(values).toHaveLength(4);
      for (const value of values) expect(value.ratio,`${theme} ${font}px ${value.text}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

for (const theme of ['dark', 'light']) {
  for (const mobile of [false, true]) {
    test.describe(`ordinary essay prose ${theme} ${mobile ? 'mobile' : 'desktop'}`, () => {
      test.use({ colorScheme: theme, reducedMotion: 'reduce', viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: mobile });
      test('every ordinary essay paragraph meets normal-text contrast', async ({ page }, testInfo) => {
        useChromiumCore(testInfo);
        await page.addInitScript(({ key, theme }) => localStorage.setItem(key, theme), { key: STORAGE_KEY, theme });
        for (const slug of ['sergei-yesenin-1921-1925', 'vykhozhu-odin-ya-na-dorogu-lermontov']) {
          await page.goto(`${BASE_URL}/essays/${slug}`, { waitUntil: 'networkidle' });
          const paragraphs = page.locator('.essay-body p.mb-6.text-lg');
          await expect(paragraphs.first()).toBeVisible();
          await page.evaluate(() => document.fonts.ready);
          expect((await themeSnapshot(page)).dataset).toBe(theme);
          const measurements = await contrastMeasurements(paragraphs);
          expect(measurements.length).toBeGreaterThan(10);
          for (const measurement of measurements) {
            expect(measurement.ratio, `${slug}: ${measurement.text.slice(0, 100)}`).toBeGreaterThanOrEqual(4.5);
          }
        }
      });
    });
  }
}

for (const theme of ['dark', 'light']) {
  for (const mobile of [false, true]) {
    test.describe(`inline citation contrast ${theme} ${mobile ? 'mobile' : 'desktop'}`, () => {
      test.use({ colorScheme: theme, reducedMotion: 'reduce', viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: mobile });
      test('source numbers and focused tooltip remain readable and resolve to a card', async ({ page }, testInfo) => {
        useChromiumCore(testInfo);
        await page.addInitScript(({ key, theme }) => localStorage.setItem(key, theme), { key: STORAGE_KEY, theme });
        await page.goto(ARTICLE_URL, { waitUntil: 'networkidle' });
        const citations = page.locator('.essay-body sup > a[href^="#source-"]');
        await expect(citations.first()).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        const measurements = await contrastMeasurements(citations, true);
        expect(measurements.length).toBeGreaterThan(100);
        for (const item of measurements) expect(item.ratio, item.text).toBeGreaterThanOrEqual(4.5);
        const first = citations.first();
        await hoverCitation(page, first);
        await expect.poll(() => first.evaluate((node) => getComputedStyle(node).color))
          .toBe(theme === 'dark' ? 'rgb(212, 175, 55)' : 'rgb(122, 77, 0)');
        expect(await contrastRatio(first)).toBeGreaterThanOrEqual(4.5);
        await page.mouse.move(0, 0);
        await first.focus();
        await expect(first).toBeFocused();
        await expect(first).toHaveCSS('outline-style', 'solid');
        await expect(first).toHaveCSS('outline-width', '2px');
        const tooltip = first.getByRole('tooltip');
        await expect.poll(() => tooltip.evaluate((node) => Number(getComputedStyle(node).opacity))).toBe(1);
        expect(await contrastRatio(tooltip)).toBeGreaterThanOrEqual(4.5);
        expect(await contrastRatio(first)).toBeGreaterThanOrEqual(4.5);
        const href = await first.getAttribute('href');
        expect(await first.getAttribute('aria-label')).toMatch(/^Источник \d+:/);
        await first.press('Enter');
        await expect.poll(() => new URL(page.url()).hash).toBe(href);
        await expect(page.locator(href)).toBeVisible();
        await expect.poll(() => citations.evaluateAll((nodes) => nodes.every((node) =>
          document.getElementById(node.getAttribute('href').slice(1)),
        ))).toBe(true);
      });
    });
  }
}

async function expectCitationTooltipContained(page, tooltip) {
  await expect.poll(() => tooltip.evaluate((node) => Number(getComputedStyle(node).opacity))).toBe(1);
  // Resize/visualViewport events are asynchronous; wait for the real layout to settle.
  await expect.poll(async () => {
    const rect = await tooltip.boundingBox();
    return rect && rect.x >= 7 && rect.x + rect.width <= page.viewportSize().width - 7;
  }).toBe(true);
  const bounds = await tooltip.boundingBox();
  expect(bounds).not.toBeNull();
  const viewport = page.viewportSize();
  expect(bounds.x).toBeGreaterThanOrEqual(7);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width - 7);
  expect(await tooltip.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
}

for (const theme of ['dark', 'light']) {
  for (const width of [320, 390, 1440]) {
    test.describe(`citation tooltip ${theme} ${width}px`, () => {
      test.use({ colorScheme: theme, reducedMotion: 'reduce', viewport: { width, height: 844 }, isMobile: width < 600, hasTouch: width < 600 });
      test('source labels fit the viewport during focus, hover and resize', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium-core', 'bounded Chromium positioning regression');
        await page.addInitScript((mode) => localStorage.setItem('tlp-theme-mode', mode), theme);
        await page.goto(`${BASE_URL}/essays/sergei-yesenin-1921-1925`, { waitUntil: 'networkidle' });
        const citations = page.locator('.essay-body sup > a[href^="#source-"]');
        await expect(citations.first()).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        for (let i = 0; i < 12; i++) {
          const link = citations.nth(i);
          await link.evaluate((node) => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
          await link.focus();
          await expectCitationTooltipContained(page, link.getByRole('tooltip'));
        }
        const first = citations.first();
        await first.evaluate((node) => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await first.focus();
        await expectCitationTooltipContained(page, first.getByRole('tooltip'));
        if (width >= 600) {
          await first.evaluate((node) => node.blur());
          await hoverCitation(page, first);
          await expectCitationTooltipContained(page, first.getByRole('tooltip'));
          await page.mouse.move(0, 0);
          await first.focus();
        }
        await page.setViewportSize({ width: width < 600 ? 844 : 320, height: 600 });
        await first.evaluate((node) => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await expectCitationTooltipContained(page, first.getByRole('tooltip'));
        const href = await first.getAttribute('href');
        await first.press('Enter');
        await expect.poll(() => new URL(page.url()).hash).toBe(href);
        await expect(page.locator(href)).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
      });
    });
  }
}

for (const theme of ['dark', 'light']) {
  for (const mobile of [false, true]) {
    test.describe(`breadcrumb contrast ${theme} ${mobile ? 'mobile' : 'desktop'}`, () => {
      test.use({ colorScheme: theme, reducedMotion: 'reduce', viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: mobile });
      test('shared navigation text, hover and keyboard focus remain readable', async ({ page }, testInfo) => {
        useChromiumCore(testInfo);
        await page.addInitScript((theme) => localStorage.setItem('tlp-theme-mode', theme), theme);
        for (const route of ['/privacy', '/essays/sergei-yesenin-1921-1925']) {
          await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
          const nav = page.getByRole('navigation', { name: 'Хлебные крошки' });
          await expect(nav).toBeVisible();
          const text = await contrastMeasurements(nav.locator('a, [aria-current="page"]'));
          expect(text.length).toBeGreaterThanOrEqual(2);
          for (const item of text) expect(item.ratio, item.text).toBeGreaterThanOrEqual(4.5);
          const link = nav.getByRole('link').first();
          await link.hover();
          expect(await contrastRatio(link)).toBeGreaterThanOrEqual(4.5);
          await page.mouse.move(0, 0);
          await link.focus();
          await expect(link).toBeFocused();
          expect(await contrastRatio(link)).toBeGreaterThanOrEqual(4.5);
          expect(await nonTextContrast(link, 'focus')).toBeGreaterThanOrEqual(3);
          await link.press('Enter');
          await expect.poll(() => new URL(page.url()).pathname).toBe('/');
        }
      });
    });
  }
}

for (const theme of ['dark', 'light']) {
  test(`header landmark and visible search label have accessible names in ${theme}`, async ({ page }, testInfo) => {
    useChromiumCore(testInfo);
    await page.addInitScript((theme) => localStorage.setItem('tlp-theme-mode', theme), theme);
    await page.goto(ARTICLE_URL, { waitUntil: 'networkidle' });
    await expect(page.locator('.header-nav')).toHaveAccessibleName('Основная навигация');
    const search = page.getByRole('button', { name: /^Открыть поиск/ }).filter({ visible: true }).first();
    await expect(search.locator('.header-search-label')).toHaveText('Ctrl K');
    await expect(search).toHaveAccessibleName('Открыть поиск — Ctrl K');
    await search.click();
    const dialog = page.getByRole('dialog', { name: 'Поиск по сайту' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('combobox', { name: 'Поисковый запрос' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(search).toBeFocused();
  });
}

for (const theme of ['dark', 'light']) {
  for (const mobile of [false, true]) {
    test.describe(`failed essay image ${theme} ${mobile ? 'mobile' : 'desktop'}`, () => {
      test.use({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: mobile });
      test('visible error label is readable and named, with working keyboard lightbox', async ({ page }, testInfo) => {
        useChromiumCore(testInfo);
        await page.addInitScript((theme) => localStorage.setItem('tlp-theme-mode', theme), theme);
        await page.route('**/*', (route) => route.request().resourceType() === 'image' ? route.abort('failed') : route.continue());
        await page.goto(ARTICLE_URL, { waitUntil: 'networkidle' });
        const opener = page.locator('.essay-body figure button[aria-haspopup="dialog"]').first();
        await opener.scrollIntoViewIfNeeded();
        await expect(opener.locator('img')).toHaveAttribute('data-image-state', 'error');
        const fallback = opener.getByText('Изображение временно недоступно', { exact: true });
        await expect(fallback).toBeVisible();
        await expect(opener).toHaveAccessibleName(/Изображение временно недоступно/);
        await expect(opener).toHaveAccessibleName(/^Увеличить изображение:/);
        expect(await contrastRatio(fallback)).toBeGreaterThanOrEqual(4.5);
        await opener.focus();
        await opener.press('Enter');
        const dialog = page.getByRole('dialog').filter({ has: page.getByRole('button', { name: 'Закрыть изображение' }) });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole('button', { name: 'Закрыть изображение' })).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await expect(opener).toBeFocused();
      });
    });
  }
}

for (const theme of ['dark', 'light']) {
  for (const mobile of [false, true]) {
    test.describe(`essay image metadata ${theme} ${mobile ? 'mobile' : 'desktop'}`, () => {
      test.use({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: mobile, reducedMotion: 'reduce' });
      test('captions, credits and source links stay readable inline and in the dark lightbox', async ({ page }, testInfo) => {
        useChromiumCore(testInfo);
        await page.addInitScript((theme) => localStorage.setItem('tlp-theme-mode', theme), theme);
        for (const slug of ['sergei-yesenin-1921-1925', 'brik-case']) {
          await page.goto(`${BASE_URL}/essays/${slug}`, { waitUntil: 'networkidle' });
          const figures = page.locator('.essay-body figure').filter({ has: page.locator('button[aria-haspopup="dialog"]') });
          const captions = figures.locator('figcaption');
          expect(await captions.count()).toBeGreaterThan(2);
          const text = await contrastMeasurements(captions.locator('span, a'), true);
          expect(text.length).toBeGreaterThan(8);
          for (const item of text) expect(item.ratio, `${slug}: ${item.text}`).toBeGreaterThanOrEqual(4.5);
          const source = captions.getByRole('link', { name: 'Источник', exact: true }).first();
          await expect(source).toHaveAttribute('href', /^https:\/\//);
          await expect(source).toHaveAttribute('target', '_blank');
          await source.hover();
          expect(await contrastRatio(source)).toBeGreaterThanOrEqual(4.5);
          await page.mouse.move(0, 0);
          await source.focus();
          await expect(source).toBeFocused();
          expect(await contrastRatio(source)).toBeGreaterThanOrEqual(4.5);
          expect(await nonTextContrast(source, 'focus')).toBeGreaterThanOrEqual(3);

          const opener = figures.getByRole('button', { name: /^Увеличить изображение:/ }).first();
          await opener.focus();
          await opener.press('Enter');
          const dialog = page.getByRole('dialog').filter({ has: page.getByRole('button', { name: 'Закрыть изображение' }) });
          await expect(dialog).toBeVisible();
          const caption = dialog.locator('p[id]');
          await expect(caption).toBeVisible();
          const modalText = await contrastMeasurements(caption.locator('xpath=.|.//*'), true);
          expect(modalText.length).toBeGreaterThanOrEqual(2);
          for (const item of modalText) expect(item.ratio, `lightbox: ${item.text}`).toBeGreaterThanOrEqual(4.5);
          const modalSource = dialog.getByRole('link', { name: 'Источник', exact: true });
          expect(await contrastRatio(modalSource)).toBeGreaterThanOrEqual(4.5);
          await modalSource.focus();
          expect(await nonTextContrast(modalSource, 'focus')).toBeGreaterThanOrEqual(3);
          await page.keyboard.press('Escape');
          await expect(dialog).toBeHidden();
          await expect(opener).toBeFocused();
        }
      });
    });
  }
}

for (const theme of ['dark', 'light']) {
  for (const mobile of [false, true]) {
    test.describe(`essay shell metadata ${theme} ${mobile ? 'mobile' : 'desktop'}`, () => {
      test.use({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: mobile, reducedMotion: 'reduce' });
      test('hero metadata, table of contents and series navigation keep readable text and working anchors', async ({ page }, testInfo) => {
        useChromiumCore(testInfo);
        await page.addInitScript((theme) => localStorage.setItem('tlp-theme-mode', theme), theme);
        for (const slug of ['sergei-yesenin-1921-1925', 'sergei-yesenin-1895-1921']) {
          await page.goto(`${BASE_URL}/essays/${slug}`, { waitUntil: 'networkidle' });
          const hero = page.locator('main header');
          await expect(hero.locator('h1')).toBeVisible();
          const metadata = await contrastMeasurements(hero.locator('h1, p, .mb-5, .mt-7 > span, .mt-6 > span, .bottom-4 span, .bottom-4 a'), true);
          expect(metadata.length).toBeGreaterThan(5);
          for (const item of metadata) expect(item.ratio, `hero ${slug}: ${item.text}`).toBeGreaterThanOrEqual(4.5);
          const series = page.getByRole('navigation', { name: 'Навигация по серии' });
          await expect(series).toBeVisible();
          const seriesText = await contrastMeasurements(series.locator('div, span'), true);
          expect(seriesText.length).toBeGreaterThanOrEqual(3);
          for (const item of seriesText) expect(item.ratio, `series ${slug}: ${item.text}`).toBeGreaterThanOrEqual(4.5);
          const seriesLink = series.getByRole('link').first();
          await seriesLink.focus();
          await expect(seriesLink).toBeFocused();
          await expect(seriesLink).toHaveAttribute('href', /^\/essays\//);
          await expect.poll(() => nonTextContrast(seriesLink, 'focus')).toBeGreaterThanOrEqual(3);
          if (!mobile) {
            const toc = page.locator('aside nav');
            const tocText = await contrastMeasurements(toc.locator('div, a, span'), true);
            expect(tocText.length).toBeGreaterThan(5);
            for (const item of tocText) expect(item.ratio, `toc ${slug}: ${item.text}`).toBeGreaterThanOrEqual(4.5);
            const source = page.locator('aside a[href="#sources"]');
            for (const item of await contrastMeasurements(source.locator('span'), true)) expect(item.ratio, item.text).toBeGreaterThanOrEqual(4.5);
            for (const link of [toc.getByRole('link').first(), source, page.locator('aside a[href^="/poets/"]')]) {
              await link.focus();
              await expect(link).toBeFocused();
              await expect.poll(() => nonTextContrast(link, 'focus')).toBeGreaterThanOrEqual(3);
              for (const item of await contrastMeasurements(link.locator('xpath=.|.//*'), true)) expect(item.ratio, item.text).toBeGreaterThanOrEqual(4.5);
              await link.hover();
              for (const item of await contrastMeasurements(link.locator('xpath=.|.//*'), true)) expect(item.ratio, item.text).toBeGreaterThanOrEqual(4.5);
            }
            const first = toc.getByRole('link').first();
            const target = await first.getAttribute('href');
            await first.click();
            await expect(page.locator(target)).toBeInViewport();
          }
          expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
        }
      });
    });
  }
}

// Residual reader metadata and catalog controls: test actual rendered colors,
// not class names, on both themes and explicit desktop/mobile viewports.
for (const mobile of [false, true]) {
  test.describe(`residual metadata ${mobile ? 'mobile' : 'desktop'}`, () => {
    test.use({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
      isMobile: mobile,
      reducedMotion: 'reduce',
    });
    for (const theme of ['dark', 'light']) {
      for (const route of ['/essays/brik-case', '/articles']) {
        test(`${theme} ${route} metadata retains AA contrast`, async ({ page }, testInfo) => {
          useChromiumCore(testInfo);
          await page.addInitScript(({ key, theme }) => {
            localStorage.setItem(key, theme);
            localStorage.setItem('tlp:analytics-consent:v1', 'denied');
          }, { key: STORAGE_KEY, theme });
          const errors = [];
          page.on('pageerror', error => errors.push(error.message));
          const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
          expect(response.status()).toBeLessThan(400);
          await page.evaluate(() => document.fonts.ready);
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
          const selectors = route === '/articles'
            ? ['main button[aria-pressed="false"]', 'main .theme-poet-accent']
            : [
              '[data-essay-block="epigraph"] p',
              '[data-essay-block="voice"] > div:first-child',
              '[data-essay-block="voice"] .border-t span',
              '[data-essay-block="voice"] a',
              '[data-essay-block="pullquote"] cite',
              '[data-essay-block="poem"] figcaption > span',
              '[data-essay-block="poem"] > p',
              '[data-essay-block="note"] > div:first-child',
            ];
          for (const selector of selectors) {
            const targets = page.locator(selector);
            expect(await targets.count(), selector).toBeGreaterThan(0);
            // Reveal content-visibility ancestors and wait for reveal painting
            // before measuring: offscreen styles alone are not visual evidence.
            for (const target of await targets.all()) {
              await target.scrollIntoViewIfNeeded();
              await expect(target).toBeVisible();
              await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
              for (const measurement of await contrastMeasurements(target)) {
                expect(measurement.ratio, measurement.text).toBeGreaterThanOrEqual(4.5);
              }
            }
          }
          expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
          expect(errors).toEqual([]);
        });
      }
    }
  });
}

// A dark poem palette stays dark even when the surrounding reader is light.
// Measure the actual published variant and a default poem on the same route.
for (const mobile of [false, true]) {
  test.describe(`poem palette ${mobile ? 'mobile' : 'desktop'}`, () => {
    test.use({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
      isMobile: mobile, reducedMotion: 'reduce',
    });
    for (const theme of ['dark', 'light']) {
      test(`${theme} preserves poem ink and metadata on their own surfaces`, async ({ page }, testInfo) => {
        useChromiumCore(testInfo);
        await page.addInitScript(({ key, theme }) => {
          localStorage.setItem(key, theme);
          localStorage.setItem('tlp:analytics-consent:v1', 'denied');
        }, { key: STORAGE_KEY, theme });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`${BASE_URL}/essays/yesenin-kutezhi`, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        const blood = page.locator('[data-essay-block="poem"]').filter({ hasText: 'написано кровью' });
        await expect(blood).toHaveCount(1);
        const ordinary = page.locator('[data-essay-block="poem"]').filter({ hasNotText: 'написано кровью' }).first();
        await expect(ordinary).toBeAttached();
        for (const readingTheme of [theme, theme === 'dark' ? 'light' : 'dark']) {
          await setThemeFromUi(page, readingTheme);
          for (const poem of [blood, ordinary]) {
            await poem.scrollIntoViewIfNeeded();
            await expect(poem).toBeVisible();
            for (const selector of ['figcaption > span', '.poetry-text', ':scope > p']) {
              const parts = poem.locator(selector);
              expect(await parts.count()).toBeGreaterThan(0);
              for (const measurement of await contrastMeasurements(parts)) {
                expect(measurement.ratio, `${readingTheme}: ${measurement.text}`).toBeGreaterThanOrEqual(4.5);
              }
            }
          }
          // Preserve the special dark treatment through both theme changes.
          const darkEmphasis = blood.locator('.gold-gradient');
          expect(await darkEmphasis.count()).toBeGreaterThan(0);
          for (const target of await darkEmphasis.all()) {
            expect(await target.evaluate(node => getComputedStyle(node).backgroundImage)).toContain('gradient(');
          }
          if (readingTheme === 'light') {
            await ordinary.scrollIntoViewIfNeeded();
            const emphasis = ordinary.locator('.gold-gradient').or(page.locator('main h2[id] > .gold-gradient').first());
            expect(await emphasis.count()).toBeGreaterThan(0);
            for (const target of await emphasis.all()) {
              // A transparent gradient is not covered by its inherited `color`.
              // Ordinary light-page emphasis uses opaque semantic ink instead.
              const paint = await target.evaluate(node => {
                const style = getComputedStyle(node);
                return { fill: style.webkitTextFillColor, color: style.color, background: style.backgroundImage };
              });
              expect(paint.background).toBe('none');
              expect(paint.fill).toBe(paint.color);
              expect(await contrastRatio(target)).toBeGreaterThanOrEqual(4.5);
            }
          }
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
        expect(errors).toEqual([]);
      });
    }
  });
}

// Gradient-backed editorial blocks are intentionally dark reader surfaces,
// not partly transparent fragments of the surrounding page theme.
for (const mobile of [false, true]) {
  test.describe(`editorial surfaces ${mobile ? 'mobile' : 'desktop'}`, () => {
    test.use({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
      isMobile: mobile, reducedMotion: 'reduce',
    });
    for (const theme of ['dark', 'light']) {
      for (const kind of ['reflection', 'myth']) {
        test(`${theme} ${kind} retains its own opaque dark surface`, async ({ page }, testInfo) => {
          useChromiumCore(testInfo);
          await page.addInitScript(({ key, theme }) => {
            localStorage.setItem(key, theme);
            localStorage.setItem('tlp:analytics-consent:v1', 'denied');
          }, { key: STORAGE_KEY, theme });
          const slug = kind === 'reflection' ? 'brik-case' : 'sergei-yesenin-1921-1925';
          await page.goto(`${BASE_URL}/essays/${slug}`, { waitUntil: 'networkidle' });
          await page.evaluate(() => document.fonts.ready);
          const surface = page.locator('aside').filter({
            hasText: kind === 'reflection' ? 'Свобода без верности' : 'Проверка мифа',
          }).first();
          await surface.scrollIntoViewIfNeeded();
          await expect(surface).toBeVisible();
          const paint = await surface.evaluate(node => {
            const style = getComputedStyle(node);
            return { scheme: style.colorScheme, base: style.backgroundColor };
          });
          expect(paint.scheme).toBe('dark');
          // Explicit opaque backing is required even at translucent gradient stops.
          expect(paint.base).toBe('rgb(5, 5, 5)');
          const text = surface.locator('p, span, div.font-bold').filter({ visible: true });
          expect(await text.count()).toBeGreaterThan(0);
          for (const measurement of await contrastMeasurements(text, true)) {
            expect(measurement.ratio, measurement.text).toBeGreaterThanOrEqual(4.5);
          }
        });
      }
    }
  });
}
