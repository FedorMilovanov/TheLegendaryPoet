import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

async function openEssay(page, slug, hash = '') {
  const response = await page.goto(BASE_URL + '/essays/' + slug + hash, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  if (response) expect(response.status()).toBeLessThan(400);
  await expect(page.locator('.essay-body > div').first()).toBeAttached();
}

async function expectVisibleFragment(page, hash) {
  const top = await page.evaluate((id) => document.getElementById(id)?.getBoundingClientRect().top ?? -9999, decodeURIComponent(hash.slice(1)));
  expect(decodeURIComponent(new URL(page.url()).hash)).toBe(hash);
  expect(top).toBeGreaterThan(80);
  expect(top).toBeLessThan(170);
}

test.describe('native fragment navigation and stable geometry', () => {
  test('section anchors settle after real image layout and keep native history', async ({ page }) => {
    await openEssay(page, 'sergei-yesenin-1921-1925');
    const target = page.locator('aside nav a[href^="#sec-"]').nth(2);
    const hash = await target.getAttribute('href');
    expect(hash).toMatch(/^#sec-/);
    if ((page.viewportSize()?.width ?? 1280) < 768) {
      await page.evaluate(() => window.scrollTo(0, 2400));
      await expect(page.locator('html')).toHaveClass(/chrome-hidden/);
      await page.locator('.section-chip button[popovertarget]').click();
      await expect(page.locator('#essay-toc-popover')).toBeVisible();
      await page.locator('#essay-toc-popover button').nth(2).click();
    } else {
      await target.focus();
      await page.keyboard.press('Enter');
    }
    // Assert settled painted geometry after the normal 780 ms reveal, not a transient jump.
    await page.waitForTimeout(1050);
    await expectVisibleFragment(page, hash);
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/#sec-/);
    await page.goForward({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/#sec-/);
  });

  test('same citation reopens its filtered source without a synthetic hash change', async ({ page }) => {
    await openEssay(page, 'brik-case');
    const citation = page.locator('.essay-body a[href^="#source-"]').first();
    await expect(citation).toBeVisible();
    const hash = await citation.getAttribute('href');
    const source = page.locator('[id="' + hash.slice(1) + '"]');
    await citation.click();
    await expect(source).toBeVisible();
    const historyBefore = await page.evaluate(() => history.length);
    await page.locator('#sources button').filter({ hasText: 'Архивы' }).first().click();
    await expect(source).toBeHidden();
    await citation.focus();
    await page.keyboard.press('Enter');
    await expect(source).toBeVisible();
    expect(decodeURIComponent(new URL(page.url()).hash)).toBe(hash);
    expect(await page.evaluate(() => history.length)).toBe(historyBefore);
  });

  test('malformed source fragments do not break the article or subsequent citations', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await openEssay(page, 'brik-case', '#source-%');
    const citation = page.locator('.essay-body a[href^="#source-"]').first();
    await expect(citation).toBeVisible();
    await expect(page.locator('#sources')).toBeVisible();
    const hash = await citation.getAttribute('href');
    const source = page.locator('[id="' + hash.slice(1) + '"]');
    await citation.click();
    await expect(page).toHaveURL(url => url.hash === hash);
    await expect(source).toBeVisible();

    // Exercise the already-mounted hashchange handler as well as cold entry.
    await page.evaluate(() => new Promise(resolve => {
      window.addEventListener('hashchange', () => resolve(), { once: true });
      window.location.hash = '#source-%E0%A4%A';
    }));
    await expect(page.locator('#sources')).toBeVisible();
    await citation.click();
    await expect(page).toHaveURL(url => url.hash === hash);
    await expect(source).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('fresh source and section deep links expose their published targets', async ({ page }) => {
    await openEssay(page, 'brik-case');
    const section = await page.locator('aside nav a[href^="#sec-"]').first().getAttribute('href');
    const citation = await page.locator('.essay-body a[href^="#source-"]').first().getAttribute('href');
    await openEssay(page, 'brik-case', section);
    await page.waitForTimeout(1000);
    await expectVisibleFragment(page, section);
    await openEssay(page, 'brik-case', citation);
    await expect(page.locator('[id="' + citation.slice(1) + '"]')).toBeVisible();
    expect(decodeURIComponent(new URL(page.url()).hash)).toBe(citation);
  });
});

test('share selection rejects private or stale ranges and preserves later reader selection', async ({ page }) => {
  await page.addInitScript(() => {
    window.__shareWrites = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: value => {
        window.__shareWrites.push(value);
        return new Promise(resolve => { window.__finishShareWrite = resolve; });
      },
    } });
  });
  await page.goto(BASE_URL + '/poets/alexander-blok', { waitUntil: 'domcontentloaded' });
  const intro = page.locator('.poet-bio-intro');
  const scope = intro.locator('..');
  const community = scope.locator('[data-community-target]').first();
  const verse = scope.locator('[data-poem-canonical]').first();
  const chip = scope.locator('.share-line-chip');
  await expect(intro).toBeVisible();
  await expect(community).toBeAttached();
  await expect(verse).toBeAttached();
  const select = locator => locator.evaluate(node => {
    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = document.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });

  await select(intro);
  await expect(chip).toBeVisible();
  // Change to community content and click the old chip in the same task.
  await chip.evaluate(node => {
    const region = node.parentElement.querySelector('[data-community-target]');
    const range = document.createRange();
    range.selectNodeContents(region);
    const selection = document.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    node.click();
    document.dispatchEvent(new Event('selectionchange'));
  });
  await expect(chip).toHaveCount(0);
  expect(await page.evaluate(() => window.__shareWrites)).toEqual([]);

  await select(intro);
  await expect(chip).toBeVisible();
  await scope.evaluate(node => {
    const range = document.createRange();
    range.setStartBefore(node.querySelector('.poet-bio-intro'));
    range.setEndAfter(node.querySelector('[data-poem-canonical]'));
    const selection = document.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await expect(chip).toHaveCount(0);

  await select(intro);
  await expect(chip).toBeVisible();
  await chip.evaluate(node => node.click());
  expect(await page.evaluate(() => window.__shareWrites.length)).toBe(1);
  const bio = scope.locator('.poetry-text > p').first();
  await select(bio);
  const selected = await page.evaluate(() => document.getSelection().toString());
  expect(selected.trim()).not.toBe('');
  await page.evaluate(() => window.__finishShareWrite());
  // Exercise the existing 1400ms feedback lifetime, not a navigation delay.
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => document.getSelection().toString())).toBe(selected);
  await expect(chip).toHaveText('Ссылка на строку');
});

test('shared poem link retains its published anchor and reports clipboard rejection', async ({ page }) => {
  await page.addInitScript(() => {
    window.__shareWrites = [];
    window.__rejectShare = false;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: value => {
        if (window.__rejectShare) return Promise.reject(new Error('Clipboard denied'));
        window.__shareWrites.push(value);
        return Promise.resolve();
      },
    } });
  });
  await page.goto(BASE_URL + '/poets/alexander-blok', { waitUntil: 'domcontentloaded' });
  const verse = page.locator('[data-poem-canonical]').first();
  const word = verse.locator('[data-poem-canonical-word]').first();
  await word.scrollIntoViewIfNeeded();
  const id = await verse.evaluate(node => node.closest('[id^="poem-"]').id);
  await word.evaluate(node => {
    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = document.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
  const chip = page.locator('.share-line-chip');
  await expect(chip).toBeVisible();
  await chip.evaluate(node => node.click());
  await expect(chip).toHaveText('Скопировано');
  const shared = await page.evaluate(() => window.__shareWrites[0]);
  expect(new URL(shared).hash).toContain('#' + id + ':~:text=');
  await page.evaluate(() => { window.__rejectShare = true; });
  await chip.evaluate(node => node.click());
  await expect(chip).toHaveText('Не удалось скопировать');
  // Simulate a recipient without text-fragment highlighting, using the
  // ordinary anchor retained in the same copied URL.
  await page.goto(shared.split(':~:')[0], { waitUntil: 'domcontentloaded' });
  const target = page.locator('[id="' + id + '"]');
  await expect(target).toBeVisible();
  await expect.poll(() => target.evaluate(node => node.getBoundingClientRect().top)).toBeGreaterThan(70);
  await expect.poll(() => target.evaluate(node => node.getBoundingClientRect().top)).toBeLessThan(180);
});
