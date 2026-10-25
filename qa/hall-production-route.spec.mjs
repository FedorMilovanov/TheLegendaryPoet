import { test, expect } from '@playwright/test';
import { registerMediaContract } from './media-contract.mjs';

registerMediaContract(test);

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const DOCUMENTARY_REQUEST = /(?:pushkin|kiprensky|onegin|manuscript|autograph).*(?:\.jpe?g|\.png|\.webp|\.avif|\.pdf|\.glb|\.gltf)(?:$|[?#])/i;

async function openHall(page) {
  await page.goto(`${BASE_URL}/hall`, { waitUntil: 'domcontentloaded' });
  const root = page.locator('[data-hall-production-mode]');
  await expect(root).toBeVisible();
  await expect.poll(async () => root.getAttribute('data-hall-production-mode'), { timeout: 20_000 }).not.toBe('loading');
  return root;
}

test('production Hall uses bounded H3 guided WebGL runtime in Chromium/Android', async ({ page }, testInfo) => {
  const documentaryRequests = [];
  page.on('request', (request) => {
    if (DOCUMENTARY_REQUEST.test(request.url())) documentaryRequests.push(request.url());
  });

  const root = await openHall(page);
  const mode = await root.getAttribute('data-hall-production-mode');
  if (testInfo.project.name === 'iphone-safari') {
    expect(['webgl', 'fallback']).toContain(mode);
  } else {
    expect(mode).toBe('webgl');
    await expect(page.locator('[data-hall-production-canvas="true"]')).toBeVisible();
  }

  await expect(page.getByText('Hall v3 · H3 / R1 / L0 / UV0')).toBeVisible();
  if (mode === 'webgl') {
    await expect(page.getByText(/свободного FPS-перемещения/)).toBeVisible();
    await expect(page.getByText(/Точка маршрута: entryReveal/)).toBeVisible();
    await page.getByRole('button', { name: 'Дальше' }).click();
    await expect(page.getByText(/Точка маршрута: orientation/)).toBeVisible();
    await page.getByRole('button', { name: 'Назад' }).click();
    await expect(page.getByText(/Точка маршрута: entryReveal/)).toBeVisible();
  } else {
    await expect(page.getByText('Доступная версия зала')).toBeVisible();
  }
  expect(documentaryRequests, `rights-pending documentary requests escaped into production Hall: ${documentaryRequests.join(', ')}`).toEqual([]);
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
  await expect(page.getByText('3D недоступен: webgl-context-lost', { exact: true })).toBeAttached();
});

for (const [name, width, height, isMobile, colorScheme] of [
  ['desktop', 1440, 1000, false, 'dark'],
  ['phone', 390, 844, true, 'light'],
  ['compact phone', 320, 568, true, 'dark'],
  ['tablet', 768, 1024, true, 'light'],
]) for (const fallback of [false, true]) {
  test.describe(`Hall shell geometry — ${name}, ${fallback ? 'fallback' : 'WebGL'}`, () => {
    test.use({ viewport: { width, height }, isMobile, hasTouch: isMobile, colorScheme, contextOptions: { reducedMotion: 'reduce' } });
    test('title panel and route controls are not covered by persistent chrome', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'chromium-core', 'explicit viewport matrix; existing Hall tests still certify mobile engines');
      await page.addInitScript(({ colorScheme, fallback }) => {
        localStorage.setItem('tlp-theme-mode', colorScheme);
        if (fallback) {
          Object.defineProperty(window, 'WebGLRenderingContext', { configurable: true, value: undefined });
          Object.defineProperty(window, 'WebGL2RenderingContext', { configurable: true, value: undefined });
        }
      }, { colorScheme, fallback });
      const root = await openHall(page);
      await expect(root).toHaveAttribute('data-hall-production-mode', fallback ? 'fallback' : 'webgl');
      await page.evaluate(() => document.fonts.ready);
      const geometry = await root.evaluate((element) => {
        const heading = element.querySelector('h1');
        const panel = heading.parentElement.getBoundingClientRect();
        const rect = heading.getBoundingClientRect();
        const header = document.querySelector('.site-header').getBoundingClientRect();
        return { panelTop: panel.top, headerBottom: header.bottom,
          hit: heading.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)) };
      });
      expect(geometry.panelTop, 'the whole title panel must start below the fixed header').toBeGreaterThanOrEqual(geometry.headerBottom);
      expect(geometry.hit, 'heading hit-test must not land in the header').toBe(true);
      if (!fallback) {
        const next = page.getByRole('button', { name: 'Дальше', exact: true });
        // Short screens keep readable intrinsic content and allow normal scrolling.
        if (height < 650) await next.evaluate((button) => button.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await expect(next).toBeInViewport();
        expect(await next.evaluate((button) => {
          const rect = button.getBoundingClientRect();
          return button.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
        }), 'route control must not sit under the mobile dock').toBe(true);
        await next.click();
        await expect(page.getByText(/Точка маршрута: orientation/)).toBeVisible();
      }
    });
  });
}
