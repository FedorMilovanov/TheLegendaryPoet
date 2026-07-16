import { test, expect } from '@playwright/test';

/**
 * Strict Hall v3 vestibule suite (Pass 1).
 * Museum DOM hall — structure, a11y, no three.js, curatorial content.
 */
test.describe('Hall museum vestibule', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('hall', { waitUntil: 'networkidle' });
  });

  test('renders temple title and four era wings', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Храм/i);

    await expect(page.locator('#wing-golden')).toBeVisible();
    await expect(page.locator('#wing-silver')).toBeVisible();
    await expect(page.locator('#wing-soviet')).toBeVisible();
    await expect(page.locator('#wing-modern')).toBeVisible();

    // Modern wing is a sealed door — honest, not fake poets
    await expect(page.locator('#wing-modern')).toContainText(/запечатан|куратор/i);
  });

  test('compass has four directions and scrolls to a wing', async ({ page }) => {
    const compass = page.getByRole('navigation', { name: /Направления залов/i });
    await expect(compass).toBeVisible();
    const buttons = compass.getByRole('button');
    await expect(buttons).toHaveCount(4);

    await buttons.nth(1).click(); // Silver
    await expect(page.locator('#wing-silver')).toBeInViewport({ ratio: 0.15 });
  });

  test('golden wing hangs Pushkin with a curated plaque quote', async ({ page }) => {
    const golden = page.locator('#wing-golden');
    await expect(golden.getByRole('link', { name: /Пушкин/i })).toBeVisible();
    await expect(golden).toContainText(/Глаголом жги|Пушкин/i);

    const niches = golden.locator('a.hall-niche');
    await expect(niches).toHaveCount(4);
  });

  test('silver wing has four silver-age poets', async ({ page }) => {
    const silver = page.locator('#wing-silver');
    await expect(silver.locator('a.hall-niche')).toHaveCount(4);
    await expect(silver.getByRole('link', { name: /Ахматова|Блок|Есенин|Гумил/i }).first()).toBeVisible();
  });

  test('niche navigates to poet page', async ({ page }) => {
    await page.locator('#wing-golden').getByRole('link', { name: /Пушкин/i }).click();
    await expect(page).toHaveURL(/\/poets\/alexander-pushkin/);
  });

  test('document title and no WebGL canvas', async ({ page }) => {
    await expect(page).toHaveTitle(/Храм|Зал|LEGENDARY/i);
    await expect(page.locator('canvas')).toHaveCount(0);
  });

  test('keyboard: compass buttons are focusable and activate', async ({ page }) => {
    const first = page
      .getByRole('navigation', { name: /Направления/i })
      .getByRole('button')
      .first();
    await first.focus();
    await expect(first).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#wing-golden')).toBeInViewport({ ratio: 0.1 });
  });

  test('visual regression — atrium above the fold', async ({ page }) => {
    await page.addStyleTag({
      content: `
        .noise-bg, .ambient-glow, [class*="ambient-glow"] { opacity: 0 !important; visibility: hidden !important; }
        * { animation: none !important; transition: none !important; caret-color: transparent !important; }
        .site-header, .mobile-dock, .scroll-top-btn, .palette-fab { display: none !important; }
      `,
    });
    await expect(page.locator('.hall-atrium')).toHaveScreenshot('hall-atrium.png', {
      maxDiffPixelRatio: 0.035,
    });
  });
});
