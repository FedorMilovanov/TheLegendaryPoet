import { expect } from '@playwright/test';

export const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
export const blokId = 'poem-blok-1', blokTitle = 'Ночь, улица, фонарь, аптека';
export const blokPath = '/poets/alexander-blok#' + blokId;
export const biography = page => page.locator('[data-reading-flow="biography"] p');
export const music = page => page.getByRole('heading', { level: 1, name: /становится музыкой/i });
export const search = page => page.getByRole('combobox', { name: 'Поисковый запрос' });
export const y = page => page.evaluate(() => scrollY);

export async function open(page, path, width = 1200) {
  await page.setViewportSize({ width, height: 650 });
  await page.goto(base + path, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main h1').first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
export async function expectFragment(page, id) {
  const target = page.locator(`[id="${id}"]`);
  await expect.poll(() => decodeURIComponent(new URL(page.url()).hash)).toBe('#' + id);
  await expect(target).toBeFocused();
  await expect.poll(() => target.evaluate(n => Math.abs(n.getBoundingClientRect().top - 96))).toBeLessThan(2);
}
export async function choose(page, query, activate) {
  await page.keyboard.press('Control+k');
  const input = search(page);
  await expect(input).toBeFocused();
  await input.fill(query);
  const row = page.getByRole('option', { selected: true });
  await expect(row).toContainText(query, { ignoreCase: true });
  if (activate) await activate(row);
  else await input.press('Enter');
  await expect(input).toBeHidden();
}
export async function expectMusicAt(page, top) {
  await expect(page).toHaveURL(base + '/music');
  await expect(music(page)).toBeVisible(); // not the outgoing route's h1 in AnimatePresence
  await expect(page.locator('#main-content')).toBeFocused();
  await expect.poll(() => y(page)).toBe(top);
}
export async function readMusic(page) {
  await page.evaluate(() => scrollTo({ top: 610, behavior: 'instant' }));
  await expect.poll(() => y(page)).toBe(610);
}

export const paints = (page, count) => page.evaluate(async n => {
  for (let i = 0; i < n; i++) await new Promise(requestAnimationFrame);
}, count);

// Exercise the two feature fallbacks independently; neither substitutes for
// running the same journeys in the actual WebKit projects.
export async function withoutNavigationApi(page) {
  await page.addInitScript(() => Object.defineProperty(window, 'navigation', { value: undefined, configurable: true }));
}
export async function withoutViewTransitions(page) {
  await page.addInitScript(() => { delete Document.prototype.startViewTransition; });
}
