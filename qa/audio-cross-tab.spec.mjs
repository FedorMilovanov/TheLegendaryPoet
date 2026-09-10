import { test, expect } from '@playwright/test';
import { registerArchiveCrossTabTests } from './archive-cross-tab.cases.mjs';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const COORDINATION_STORAGE_KEY = 'tlp-audio-coordination:v1';
const LEGACY_SESSION_KEY = 'tlp-audio-session:v2';
const LAST_TRACK_KEY = 'tlp-audio-session:v3:last-track';
const POSITION_PREFIX = 'tlp-audio-session:v3:position:';

async function openMusicPage(context) {
  const page = await context.newPage();
  const response = await page.goto(`${BASE_URL}/music`, { waitUntil: 'domcontentloaded' });
  expect(response).not.toBeNull();
  expect(response.status()).toBeLessThan(400);
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
  const play = page.getByRole('button', { name: /воспроизвести трек|поставить на паузу|повторить загрузку аудио/i }).first();
  await expect(play).toBeEnabled();
  return { page, play };
}

async function expectPlaying(page, expected) {
  await expect.poll(
    () => page.locator('audio').evaluate((audio) => Boolean(audio.currentSrc) && !audio.paused),
    { timeout: 12_000 },
  ).toBe(expected);
}

async function readRegister(page, key) {
  return page.evaluate((storageKey) => {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  }, key);
}

async function exerciseSequentialHandoff(context) {
  const first = await openMusicPage(context);
  const second = await openMusicPage(context);

  try {
    await first.play.click();
    await expectPlaying(first.page, true);

    await second.play.click();
    await expectPlaying(second.page, true);
    await expectPlaying(first.page, false);

    await first.play.click();
    await expectPlaying(first.page, true);
    await expectPlaying(second.page, false);

    const activeCount = await Promise.all([
      first.page.locator('audio').evaluate((audio) => Number(Boolean(audio.currentSrc) && !audio.paused)),
      second.page.locator('audio').evaluate((audio) => Number(Boolean(audio.currentSrc) && !audio.paused)),
    ]).then((values) => values.reduce((sum, value) => sum + value, 0));
    expect(activeCount).toBe(1);
  } finally {
    await first.page.close();
    await second.page.close();
  }
}

test('cross-tab playback hands off to the later real player through BroadcastChannel arbitration', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-core', 'cross-tab arbitration runs once on the desktop Chromium core profile');
  const context = await browser.newContext({ locale: 'ru-RU', timezoneId: 'Europe/Paris', colorScheme: 'dark' });
  try {
    await exerciseSequentialHandoff(context);
  } finally {
    await context.close();
  }
});

test('cross-tab playback uses the same arbitration through the storage-event fallback', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-core', 'storage fallback arbitration runs once on the desktop Chromium core profile');
  const context = await browser.newContext({ locale: 'ru-RU', timezoneId: 'Europe/Paris', colorScheme: 'dark' });
  await context.addInitScript(() => {
    Object.defineProperty(window, 'BroadcastChannel', {
      configurable: true,
      value: undefined,
    });
  });
  try {
    await exerciseSequentialHandoff(context);
  } finally {
    await context.close();
  }
});

test('unsafe finite storage claims are delivered but cannot pause or poison a healthy player', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-core', 'precision-boundary storage witness runs once on desktop Chromium');
  const context = await browser.newContext({ locale: 'ru-RU', timezoneId: 'Europe/Paris', colorScheme: 'dark' });
  const first = await openMusicPage(context);
  const second = await openMusicPage(context);

  try {
    await first.play.click();
    await expectPlaying(first.page, true);

    // Arm an independent observer after normal startup traffic. The assertion
    // below waits until the same storage event that reaches the application has
    // completed dispatch, preventing a false green that checks playback before
    // the malformed claim is actually delivered.
    await first.page.evaluate((key) => {
      window.__tlpAudioPrecisionStorageSeen = false;
      const onStorage = (event) => {
        if (event.key !== key) return;
        window.__tlpAudioPrecisionStorageSeen = true;
        window.removeEventListener('storage', onStorage);
      };
      window.addEventListener('storage', onStorage);
    }, COORDINATION_STORAGE_KEY);

    await second.page.evaluate((key) => {
      localStorage.setItem(key, JSON.stringify({
        type: 'playing',
        instanceId: 'precision-poison-peer',
        trackId: 'precision-poison-track',
        timestamp: 2 ** 53,
      }));
    }, COORDINATION_STORAGE_KEY);

    await expect.poll(
      () => first.page.evaluate(() => window.__tlpAudioPrecisionStorageSeen === true),
      { timeout: 5_000 },
    ).toBe(true);
    await expectPlaying(first.page, true);

    // The ignored malformed write must not poison later legitimate arbitration.
    await second.play.click();
    await expectPlaying(second.page, true);
    await expectPlaying(first.page, false);
  } finally {
    await first.page.close();
    await second.page.close();
    await context.close();
  }
});

test('audio session registers converge across two live pages without aggregate lost updates', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-core', 'session convergence runs once on the desktop Chromium core profile');
  const context = await browser.newContext({ locale: 'ru-RU', timezoneId: 'Europe/Paris', colorScheme: 'dark' });
  const pageA = await context.newPage();
  const pageB = await context.newPage();

  try {
    await Promise.all([
      pageA.goto(`${BASE_URL}/music`, { waitUntil: 'domcontentloaded' }),
      pageB.goto(`${BASE_URL}/archive`, { waitUntil: 'domcontentloaded' }),
    ]);
    await pageA.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
    await pageB.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });

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

    await expect.poll(async () => {
      const register = await readRegister(pageA, LAST_TRACK_KEY);
      return typeof register?.value === 'string' ? register.value : '';
    }).not.toBe('');
    const lastTrack = await readRegister(pageA, LAST_TRACK_KEY);
    const trackId = lastTrack?.value;
    expect(typeof trackId).toBe('string');

    await audioA.evaluate((element) => {
      const target = Math.min(24, Math.max(9, element.duration * 0.15));
      element.currentTime = target;
      element.dispatchEvent(new Event('timeupdate'));
    });

    const positionKey = `${POSITION_PREFIX}${trackId}`;
    await expect.poll(async () => {
      const register = await readRegister(pageB, positionKey);
      return Number(register?.value ?? 0);
    }).toBeGreaterThanOrEqual(8);

    // Page B was already mounted before page A mutated the session. The archive
    // entry appearing without reload proves the provider observes session events.
    await expect(pageB.getByText(/Продолжить с \d+:/).first()).toBeVisible({ timeout: 10_000 });

    const immersiveButton = pageA.getByRole('button', { name: 'Открыть режим погружения' });
    await expect(immersiveButton).toBeVisible();
    await immersiveButton.click();

    // Use a real keyboard interaction on the range input. Home drives volume to
    // zero through React's normal onChange path, which also sets muted=true.
    const immersiveDialog = pageA.getByRole('dialog');
    await expect(immersiveDialog).toBeVisible();
    const volume = immersiveDialog.getByRole('slider', { name: 'Громкость' });
    await expect(volume).toBeVisible();
    await volume.focus();
    await volume.press('Home');
    await expect.poll(() => audioB.evaluate((element) => element.volume)).toBe(0);
    await expect.poll(() => audioB.evaluate((element) => element.muted)).toBe(true);

    const unmute = immersiveDialog.getByRole('button', { name: 'Включить звук' });
    await expect(unmute).toBeVisible();
    await unmute.click();
    await expect.poll(() => audioB.evaluate((element) => element.volume)).toBeCloseTo(0.75, 2);
    await expect.poll(() => audioB.evaluate((element) => element.muted)).toBe(false);

    await audioA.evaluate((element) => {
      element.currentTime = Math.max(0, element.duration - 0.75);
    });
    const resume = immersiveDialog.getByRole('button', { name: 'Воспроизвести' });
    await expect(resume).toBeEnabled();
    await resume.click();
    await expect.poll(
      () => audioA.evaluate((element) => element.ended),
      { timeout: 15_000 },
    ).toBe(true);

    // Completion is a separate per-track register. The already-open archive
    // must converge from progress to categorical completion without a reload.
    await expect(pageB.getByText('Прослушано полностью').first()).toBeVisible({ timeout: 10_000 });
    await expect.poll(() => pageB.evaluate((key) => window.localStorage.getItem(key), LEGACY_SESSION_KEY)).toBeNull();
  } finally {
    await context.close();
  }
});

registerArchiveCrossTabTests();
