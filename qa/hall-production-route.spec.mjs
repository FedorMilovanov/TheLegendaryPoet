import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

async function openHall(page) {
  await page.goto(`${BASE_URL}/hall`, { waitUntil: 'domcontentloaded' });
  const root = page.locator('[data-hall-production-mode]');
  await expect(root).toBeVisible();
  await expect.poll(async () => root.getAttribute('data-hall-production-mode'), { timeout: 20_000 }).not.toBe('loading');
  return root;
}

test('production Hall uses bounded H3 guided WebGL runtime in Chromium/Android', async ({ page }, testInfo) => {
  const root = await openHall(page);
  const mode = await root.getAttribute('data-hall-production-mode');
  if (testInfo.project.name === 'iphone-safari') {
    expect(['webgl', 'fallback']).toContain(mode);
  } else {
    expect(mode).toBe('webgl');
    await expect(page.locator('[data-hall-production-canvas="true"]')).toBeVisible();
  }

  await expect(page.getByText('Hall v3 · H3 / R1 / L0 / UV0')).toBeVisible();
  await expect(page.getByText(/свободного FPS-перемещения/)).toBeVisible();

  if (mode === 'webgl') {
    await expect(page.getByText(/Точка маршрута: entryReveal/)).toBeVisible();
    await page.getByRole('button', { name: 'Дальше' }).click();
    await expect(page.getByText(/Точка маршрута: orientation/)).toBeVisible();
    await page.getByRole('button', { name: 'Назад' }).click();
    await expect(page.getByText(/Точка маршрута: entryReveal/)).toBeVisible();
  }
});

test('production Hall provides semantic fallback when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'WebGLRenderingContext', { configurable: true, value: undefined });
    Object.defineProperty(window, 'WebGL2RenderingContext', { configurable: true, value: undefined });
  });
  const root = await openHall(page);
  await expect(root).toHaveAttribute('data-hall-production-mode', 'fallback');
  await expect(page.getByText('Доступная версия зала')).toBeVisible();
  await expect(page.getByText(/вход → ориентация → переход → подход к Пушкину → просмотр → выход/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Дальше' })).toHaveCount(0);
});

test('production Hall uses deterministic camera cuts with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const root = await openHall(page);
  if ((await root.getAttribute('data-hall-production-mode')) !== 'webgl') return;
  await page.getByRole('button', { name: 'Дальше' }).click();
  await expect(page.getByText(/Точка маршрута: orientation/)).toBeVisible();
});

test('production Hall falls back after a real WebGL context loss when extension is available', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'iphone-safari', 'WEBGL_lose_context is certified on Chromium production runtime');
  const root = await openHall(page);
  await expect(root).toHaveAttribute('data-hall-production-mode', 'webgl');
  const lost = await page.evaluate(() => {
    const canvas = document.querySelector('[data-hall-production-canvas="true"]');
    if (!(canvas instanceof HTMLCanvasElement)) return false;
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const extension = gl?.getExtension('WEBGL_lose_context');
    if (!extension) return false;
    extension.loseContext();
    return true;
  });
  test.skip(!lost, 'WEBGL_lose_context extension is unavailable on this runner');
  await expect(root).toHaveAttribute('data-hall-production-mode', 'fallback', { timeout: 10_000 });
  await expect(page.getByText(/webgl-context-lost/)).toBeVisible();
});
