import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const LAST_TRACK_KEY = 'tlp-audio-session:v3:last-track';
const COMPLETED_PREFIX = 'tlp-audio-session:v3:completed:';

async function readRegister(page, key) {
  return page.evaluate((storageKey) => {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  }, key);
}

test('seeking to 97% stays progress-only while native ended owns categorical completion', async ({ page }) => {
  await page.goto(`${BASE_URL}/music`, { waitUntil: 'domcontentloaded' });

  const playControl = page.getByRole('button', {
    name: /воспроизвести трек|поставить на паузу|повторить загрузку аудио/i,
  }).first();
  await expect(playControl).toBeEnabled();
  await playControl.click();

  const audio = page.locator('audio');
  await expect(audio).toHaveCount(1);
  await expect.poll(
    () => audio.evaluate((element) => Number.isFinite(element.duration) ? element.duration : 0),
    { timeout: 20_000 },
  ).toBeGreaterThan(30);

  await audio.evaluate((element) => element.pause());

  await expect.poll(async () => {
    const register = await readRegister(page, LAST_TRACK_KEY);
    return typeof register?.value === 'string' ? register.value : '';
  }).not.toBe('');
  const lastTrack = await readRegister(page, LAST_TRACK_KEY);
  const trackId = lastTrack?.value;
  expect(typeof trackId).toBe('string');

  const completionKey = `${COMPLETED_PREFIX}${trackId}`;
  const initialCompletion = await readRegister(page, completionKey);
  expect(initialCompletion?.value === true).toBe(false);

  await audio.evaluate((element) => {
    element.currentTime = element.duration * 0.97;
    element.dispatchEvent(new Event('timeupdate'));
  });

  await expect.poll(async () => {
    const register = await readRegister(page, completionKey);
    return register?.value === true;
  }).toBe(false);

  await audio.evaluate((element) => {
    element.currentTime = Math.max(0, element.duration - 0.75);
  });

  const resumeControl = page.getByRole('button', {
    name: /воспроизвести трек|продолжить|слушать .* снова/i,
  }).first();
  await expect(resumeControl).toBeEnabled();
  await resumeControl.click();

  await expect.poll(
    () => audio.evaluate((element) => element.ended),
    { timeout: 15_000 },
  ).toBe(true);

  await expect.poll(async () => {
    const register = await readRegister(page, completionKey);
    return register?.value === true;
  }).toBe(true);

  await page.goto(`${BASE_URL}/archive`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Прослушано полностью').first()).toBeVisible();
});

test('playing mini-player keeps state visible but removes persistent pulse under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${BASE_URL}/music`, { waitUntil: 'domcontentloaded' });

  const playControl = page.getByRole('button', {
    name: /воспроизвести трек|поставить на паузу|повторить загрузку аудио/i,
  }).first();
  await expect(playControl).toBeEnabled();
  await playControl.click();

  const miniPlayer = page.getByRole('complementary', { name: 'Текущий музыкальный релиз' });
  await expect(miniPlayer).toBeVisible({ timeout: 20_000 });
  await expect(miniPlayer.getByText('Сейчас звучит')).toBeVisible({ timeout: 20_000 });

  const pulse = miniPlayer.locator('.animate-pulse').first();
  await expect(pulse).toBeVisible();
  await expect.poll(() => pulse.evaluate((node) => getComputedStyle(node).animationName)).toBe('none');

  const audio = page.locator('audio');
  await expect(audio).toHaveCount(1);
  await expect.poll(() => audio.evaluate((element) => !element.paused)).toBe(true);
});
