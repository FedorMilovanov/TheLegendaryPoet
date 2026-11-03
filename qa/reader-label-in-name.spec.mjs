import { test, expect } from '@playwright/test';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4186';
const trackIds = [
  'yesenin-ya-ustalym-takim-eshche-ne-byl',
  'pushkin-tucha',
  'blok-rossiya',
];
async function navigate(page, path) {
  const response = await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  expect(response?.status()).toBeLessThan(400);
  await page.locator('#main-content h1').waitFor();
}
function normalize(s) {
  return s.replace(/\s+/g, ' ').trim();
}

test.describe('Visible label included in accessible name', () => {
  for (const viewport of [{width: 1440,height: 900}, {width: 390,height: 844}]) {
    test('all six home portrait links include visible name AND life dates at ' + viewport.width, async ({page}) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({reducedMotion:'reduce'});
      await navigate(page, '/');
      const links = page.locator('a[data-hero-poet-window]');
      await expect(links).toHaveCount(6);
      for (let i = 0; i < 6; i++) {
        const link = links.nth(i);
        const name = normalize(await link.locator('[data-hero-poet-window-name]').innerText());
        const dates = normalize(await link.locator('.hero-poet-window-dates').innerText());
        const label = await link.getAttribute('aria-label');
        expect(name.length).toBeGreaterThan(3);
        expect(dates.length).toBeGreaterThan(3);
        expect(label).toContain(name + ' ' + dates);
        await expect(link).toHaveAccessibleName(label);
        await link.focus();
        await expect(link).toBeFocused();
      }
    });
  }

  for (const path of ['/music', ...trackIds.map(id => '/music/' + id)]) {
    test('volume percent is present in the accessible name and updates: ' + path, async ({page}) => {
      await page.setViewportSize({width: 1440,height: 900});
      await page.emulateMedia({reducedMotion:'reduce'});
      await navigate(page, path);
      const control = page.getByRole('button', {name:/^Настроить громкость/});
      await expect(control).toBeVisible();
      const originalPercent = normalize(await control.innerText());
      expect(originalPercent).toMatch(/^\d+%$/);
      await expect(control).toHaveAccessibleName(new RegExp(originalPercent.replace('%','%')));
      await control.click();
      await expect(control).toHaveAttribute('aria-expanded','true');
      const slider = page.getByRole('slider', {name:'Громкость'});
      await expect(slider).toBeVisible();
      await slider.focus();
      await slider.press('Home');
      await expect.poll(async () => normalize(await control.innerText())).toBe('0%');
      await expect(control).toHaveAccessibleName(/0%/);
      await slider.press('ArrowRight');
      await expect.poll(async () => normalize(await control.innerText())).toBe('2%');
      await expect(control).toHaveAccessibleName(/2%/);
    });
  }
});
