import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

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
