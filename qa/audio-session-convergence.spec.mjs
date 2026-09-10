import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const LEGACY_SESSION_KEY = 'tlp-audio-session:v2';
const LAST_TRACK_KEY = 'tlp-audio-session:v3:last-track';
const POSITION_PREFIX = 'tlp-audio-session:v3:position:';

async function readRegister(page, key) {
  return page.evaluate((storageKey) => {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  }, key);
}

test('audio session converges across two live pages without whole-snapshot lost updates', async ({ browser }) => {
  const context = await browser.newContext();
  const pageA = await context.newPage();
  const pageB = await context.newPage();

  try {
    await Promise.all([
      pageA.goto(`${BASE_URL}/music`, { waitUntil: 'domcontentloaded' }),
      pageB.goto(`${BASE_URL}/archive`, { waitUntil: 'domcontentloaded' }),
    ]);

    await expect.poll(() => pageA.evaluate((key) => window.localStorage.getItem(key), LEGACY_SESSION_KEY)).toBeNull();

    const playControl = pageA.getByRole('button', {
      name: /воспроизвести трек|поставить на паузу|повторить загрузку аудио/i,
    }).first();
    await expect(playControl).toBeEnabled();
    await playControl.click();

    const audioA = pageA.locator('audio');
    const audioB = pageB.locator('audio');
    await expect(audioA).toHaveCount(1);
    await expect(audioB).toHaveCount(1);
    await expect.poll(
      () => audioA.evaluate((element) => Number.isFinite(element.duration) ? element.duration : 0),
      { timeout: 20_000 },
    ).toBeGreaterThan(30);

    await audioA.evaluate((element) => element.pause());

    const trackId = await expect.poll(async () => {
      const register = await readRegister(pageA, LAST_TRACK_KEY);
      return typeof register?.value === 'string' ? register.value : '';
    }).not.toBe('');

    const resolvedTrackId = await readRegister(pageA, LAST_TRACK_KEY).then((register) => register?.value);
    expect(typeof resolvedTrackId).toBe('string');

    await audioA.evaluate((element) => {
      const target = Math.min(24, Math.max(9, element.duration * 0.15));
      element.currentTime = target;
      element.dispatchEvent(new Event('timeupdate'));
    });

    const positionKey = `${POSITION_PREFIX}${resolvedTrackId}`;
    await expect.poll(async () => {
      const register = await readRegister(pageB, positionKey);
      return Number(register?.value ?? 0);
    }).toBeGreaterThanOrEqual(8);

    // Page B is already mounted on /archive. Seeing the listening entry appear
    // without navigation/reload proves the provider subscribed to session-register events.
    await expect(pageB.getByText(/Продолжить с \d+:/).first()).toBeVisible({ timeout: 10_000 });

    const immersiveButton = pageA.getByRole('button', { name: 'Открыть режим погружения' });
    await expect(immersiveButton).toBeVisible();
    await immersiveButton.click();

    const volume = pageA.getByRole('slider', { name: 'Громкость' });
    await expect(volume).toBeVisible();
    await volume.evaluate((element) => {
      element.value = '0.36';
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await expect.poll(() => audioB.evaluate((element) => element.volume)).toBeCloseTo(0.36, 2);

    const mute = pageA.getByRole('button', { name: 'Выключить звук' });
    await expect(mute).toBeVisible();
    await mute.click();
    await expect.poll(() => audioB.evaluate((element) => element.muted)).toBe(true);

    await audioA.evaluate((element) => {
      element.currentTime = Math.max(0, element.duration - 0.75);
    });
    const resume = pageA.getByRole('button', { name: 'Воспроизвести' });
    await expect(resume).toBeEnabled();
    await resume.click();

    await expect.poll(
      () => audioA.evaluate((element) => element.ended),
      { timeout: 15_000 },
    ).toBe(true);

    // Completion is a separate per-track register; the already-open archive
    // must converge from progress to categorical completion without a reload.
    await expect(pageB.getByText('Прослушано полностью').first()).toBeVisible({ timeout: 10_000 });
    await expect.poll(() => pageB.evaluate((key) => window.localStorage.getItem(key), LEGACY_SESSION_KEY)).toBeNull();
  } finally {
    await context.close();
  }
});
