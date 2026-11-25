import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

test('Yesenin winter poem: canonical lines, illustrated audio route and no narrow-screen clipping', async ({ page, request }, testInfo) => {
  const widths = testInfo.project.name === 'chromium-core' ? [320, 390, 1440] : [390];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(BASE_URL + '/poets/sergei-yesenin/', { waitUntil: 'domcontentloaded' });
    const poem = page.locator('#poem-yesenin-poet-zima-aukaet');
    await expect(poem).toBeVisible();
    const text = await poem.locator('[data-poem-canonical]').textContent();
    const stanzas = text.trim().split(/\n\s*\n/);
    expect(stanzas.map(s => s.split('\n').filter(Boolean).length)).toEqual([6, 6, 6, 6]);
    expect(text).toContain('Поет зима — аукает,');
    expect(text.trim().endsWith('Красавица весна.')).toBe(true);
    await expect(page.locator('#poem-yesenin-3')).toBeVisible();
    const track = poem.locator('a[href="/music/yesenin-steel-blizzard/"]');
    await expect(track).toHaveCount(1);
    await track.scrollIntoViewIfNeeded();
    await expect(track).toBeVisible();
    await track.locator('img').evaluate(img => img.decode());
    expect(await track.evaluate(e => [...e.querySelectorAll('p, div, img')].every(x => x.clientWidth === 0 || x.scrollWidth <= x.clientWidth + 1))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await track.click();
    await expect(page).toHaveURL(/\/music\/yesenin-steel-blizzard\/?$/);
  }
  const range = await request.get(BASE_URL + '/audio/yesenin-steel-blizzard.tlp-2026.mp3', { headers: { Range: 'bytes=0-1023' } });
  expect(range.status()).toBe(206);
  expect((await range.body()).length).toBe(1024);
});

