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

async function contrastRatio(locator) {
  return locator.evaluate((node) => {
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
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  });
}

async function setThemeFromUi(page, mode) {
  const snapshot = await themeSnapshot(page);
  if (snapshot.dataset === mode) return;
  const label = mode === 'light' ? 'Включить светлую тему' : 'Включить темную тему';
  await page.getByRole('button', { name: label }).filter({ visible: true }).first().click();
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
