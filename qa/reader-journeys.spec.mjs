import { test, expect } from '@playwright/test';
import { registerMediaContract } from './media-contract.mjs';
import { contrastMeasurements, contrastRatio } from './contrast-helpers.mjs';
import fs from 'node:fs';
import path from 'node:path';

registerMediaContract(test);

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARCHIVE_STORAGE_KEY = 'tlp-my-archive:v4';
const ARTIFACT_DIR = path.resolve('qa-artifacts', 'reader-journeys');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function waitForRoute(page) {
  const main = page.locator('#main-content');
  await main.waitFor({ state: 'visible', timeout: 20_000 });
  await expect(main.locator('[aria-busy="true"]:visible')).toHaveCount(0);
  await expect(main.locator('h1, [role="heading"][aria-level="1"]').first()).toBeVisible();
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
}

function attachRuntimeDiagnostics(page) {
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/Failed to load resource/i.test(text)) return;
    consoleErrors.push(text);
  });
  return { pageErrors, consoleErrors };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test.describe('reader outcome journeys', () => {
  test.use({ locale: 'ru-RU', timezoneId: 'Europe/Paris', colorScheme: 'dark' });

  test('saved poem travels through archive search and returns to the exact poem', async ({ page }, testInfo) => {
    const runtime = attachRuntimeDiagnostics(page);
    await page.goto(`${BASE_URL}/poets/sergei-yesenin`, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);

    const addButton = page.getByRole('button', { name: /^Добавить «.+» в архив$/ }).first();
    await addButton.scrollIntoViewIfNeeded();
    const discoveredPoemCard = addButton.locator('xpath=ancestor::*[starts-with(@id,"poem-")][1]');
    const poemCardId = await discoveredPoemCard.getAttribute('id');
    const title = (await discoveredPoemCard.locator('h3').first().innerText()).replace(/[«»]/g, '').trim();
    expect(poemCardId).toMatch(/^poem-/);
    expect(title.length).toBeGreaterThan(1);

    // Freeze the card identity before clicking. A locator chained from the
    // “Добавить” button becomes empty as soon as the accessible name changes
    // to “Убрать”, even though the same card remains mounted and updates
    // correctly. The stable id proves the exact reader outcome instead.
    const poemCard = page.locator(`#${poemCardId}`);
    await expect(poemCard).toBeVisible();
    await addButton.click();
    const savedButton = poemCard.getByRole('button', { name: /^Убрать «.+» из архива$/ });
    await expect(savedButton).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('status').filter({ hasText: 'Добавлено в архив' })).toBeVisible();

    await page.goto(`${BASE_URL}/archive`, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);
    await expect(page.getByRole('heading', { level: 1, name: /Мой Архив/i })).toBeVisible();

    const exactHref = `/poets/sergei-yesenin#${poemCardId}`;
    const archivedLink = page.locator(`a[href="${exactHref}"]`);
    await expect(archivedLink).toBeVisible();

    const search = page.getByRole('searchbox', { name: 'Поиск по сохранённым стихам' });
    await search.fill(title);
    await expect(archivedLink).toBeVisible();
    const sortByRating = page.getByRole('button', { name: 'По рейтингу' });
    await sortByRating.click();
    await expect(sortByRating).toHaveAttribute('aria-pressed', 'true');

    await archivedLink.click();
    await expect(page).toHaveURL(new RegExp(`${escapeRegExp(exactHref)}$`));
    await waitForRoute(page);
    const restoredCard = page.locator(`#${poemCardId}`);
    await restoredCard.scrollIntoViewIfNeeded();
    await expect(restoredCard).toBeVisible();
    await expect(restoredCard.getByRole('button', { name: /^Убрать «.+» из архива$/ })).toHaveAttribute('aria-pressed', 'true');

    await page.screenshot({ path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-archive-roundtrip.png`), fullPage: false });
    expect(runtime.pageErrors).toEqual([]);
    expect(runtime.consoleErrors).toEqual([]);
  });

  test('blocked archive storage reports failure without dishonest success state', async ({ page }, testInfo) => {
    const runtime = attachRuntimeDiagnostics(page);
    await page.addInitScript((storageKey) => {
      const original = Storage.prototype.setItem;
      Object.defineProperty(Storage.prototype, 'setItem', {
        configurable: true,
        value(key, value) {
          if (key === storageKey) throw new DOMException('Archive storage blocked', 'QuotaExceededError');
          return original.call(this, key, value);
        },
      });
    }, ARCHIVE_STORAGE_KEY);

    await page.goto(`${BASE_URL}/poets/sergei-yesenin`, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);
    const addButton = page.getByRole('button', { name: /^Добавить «.+» в архив$/ }).first();
    await addButton.scrollIntoViewIfNeeded();
    await addButton.click();

    await expect(page.getByRole('status').filter({ hasText: 'Не удалось изменить архив' })).toBeVisible();
    await expect(addButton).toHaveAttribute('aria-pressed', 'false');
    await expect(addButton).toHaveAccessibleName(/^Добавить «.+» в архив$/);
    const persisted = await page.evaluate((storageKey) => window.localStorage.getItem(storageKey), ARCHIVE_STORAGE_KEY);
    expect(persisted).toBeNull();

    await page.screenshot({ path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-blocked-storage-honesty.png`), fullPage: false });
    expect(runtime.pageErrors).toEqual([]);
    expect(runtime.consoleErrors).toEqual([]);
  });

  test('blocked archive removal keeps the poem visible and explains the unchanged state', async ({ page }, testInfo) => {
    const runtime = attachRuntimeDiagnostics(page);
    await page.goto(`${BASE_URL}/poets/sergei-yesenin`, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);

    const addButton = page.getByRole('button', { name: /^Добавить «.+» в архив$/ }).first();
    await addButton.scrollIntoViewIfNeeded();
    const poemCard = addButton.locator('xpath=ancestor::*[starts-with(@id,"poem-")][1]');
    const title = (await poemCard.locator('h3').first().innerText()).replace(/[«»]/g, '').trim();
    await addButton.click();
    await expect(page.getByRole('status').filter({ hasText: 'Добавлено в архив' })).toBeVisible();

    await page.goto(`${BASE_URL}/archive`, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);
    const removeButton = page.getByRole('button', { name: new RegExp(`^Удалить «${escapeRegExp(title)}» из архива$`) });
    await expect(removeButton).toBeVisible();

    await page.evaluate((storageKey) => {
      const original = Storage.prototype.setItem;
      Object.defineProperty(Storage.prototype, 'setItem', {
        configurable: true,
        value(key, value) {
          if (key === storageKey) throw new DOMException('Archive storage blocked', 'QuotaExceededError');
          return original.call(this, key, value);
        },
      });
    }, ARCHIVE_STORAGE_KEY);

    await removeButton.click();
    await expect(removeButton).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: /Не удалось удалить стихотворение.+список не изменён/ })).toBeVisible();
    const persisted = await page.evaluate((storageKey) => window.localStorage.getItem(storageKey), ARCHIVE_STORAGE_KEY);
    const snapshot = JSON.parse(persisted || '{}');
    expect(snapshot.operations?.some((operation) => operation?.favorite === true)).toBe(true);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-blocked-removal-honesty.png`), fullPage: false });
    expect(runtime.pageErrors).toEqual([]);
    expect(runtime.consoleErrors).toEqual([]);
  });
});

test.describe('reduced-motion longform reader journey', () => {
  test.use({ locale: 'ru-RU', timezoneId: 'Europe/Paris', colorScheme: 'dark', contextOptions: { reducedMotion: 'reduce' } });

  test('reading progress is bounded to the article instead of the post-article tail', async ({ page }, testInfo) => {
    const runtime = attachRuntimeDiagnostics(page);
    await page.goto(`${BASE_URL}/essays/yesenin-duncan-first-meeting-documents`, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);

    const progress = page.getByRole('progressbar', { name: 'Прогресс чтения статьи' });
    const article = page.locator('#main-content article').first();
    await expect(progress).toBeVisible();
    await expect(article).toBeVisible();

    const geometry = await article.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const articleTop = window.scrollY + rect.top;
      const articleBottom = window.scrollY + rect.bottom;
      const articleEndScroll = Math.max(articleTop, articleBottom - window.innerHeight);
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      return {
        articleTop,
        articleBottom,
        articleEndScroll,
        maxScroll,
        postArticleTail: maxScroll - articleEndScroll,
      };
    });

    expect(geometry.articleEndScroll).toBeGreaterThan(geometry.articleTop + 500);
    expect(geometry.postArticleTail).toBeGreaterThan(120);

    await page.evaluate(() => {
      window.__tlpReaderNativeScrollEvents = 0;
      window.addEventListener('scroll', () => {
        window.__tlpReaderNativeScrollEvents += 1;
      }, { passive: true });
    });

    const readProgress = async () => Number(await progress.getAttribute('aria-valuenow'));
    const readScrollTop = async () => page.evaluate(() => Math.round(window.scrollY));
    const readScrollEvents = async () => page.evaluate(() => window.__tlpReaderNativeScrollEvents || 0);
    const scrollTo = async (top) => {
      const target = Math.round(top);
      const eventsBefore = await readScrollEvents();
      await page.evaluate((nextTop) => {
        window.scrollTo({ top: nextTop, left: 0, behavior: 'auto' });
      }, target);
      await expect.poll(
        readScrollTop,
        { timeout: 5_000, message: `physical reader scroll should reach ${target}px before progress is asserted` },
      ).toBeCloseTo(target, 0);
      await expect.poll(
        readScrollEvents,
        { timeout: 5_000, message: `native reader scroll event should be delivered after reaching ${target}px` },
      ).toBeGreaterThan(eventsBefore);
      await page.evaluate(() => new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }));
    };

    await scrollTo(geometry.articleTop);
    await expect.poll(readProgress).toBeLessThanOrEqual(1);

    const midpoint = geometry.articleTop + (geometry.articleEndScroll - geometry.articleTop) / 2;
    await scrollTo(midpoint);
    await expect.poll(readProgress).toBeGreaterThanOrEqual(48);
    await expect.poll(readProgress).toBeLessThanOrEqual(52);

    await scrollTo(geometry.articleEndScroll);
    await expect.poll(readProgress).toBe(100);

    const tailScroll = Math.min(geometry.maxScroll, geometry.articleEndScroll + Math.max(120, geometry.postArticleTail / 2));
    expect(tailScroll).toBeGreaterThan(geometry.articleEndScroll + 100);
    await scrollTo(tailScroll);
    await expect.poll(readProgress).toBe(100);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-article-bounded-progress.png`), fullPage: false });
    expect(runtime.pageErrors).toEqual([]);
    expect(runtime.consoleErrors).toEqual([]);
  });

  test('citation focus reveals its source and keeps the longform readable', async ({ page }, testInfo) => {
    const runtime = attachRuntimeDiagnostics(page);
    await page.goto(`${BASE_URL}/essays/yesenin-duncan-first-meeting-documents`, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('.reading-progress')).toBeVisible();
    expect(await page.locator('.essay-body p').count()).toBeGreaterThan(8);

    const citationCandidates = page.locator('#main-content a[href^="#source-"]');
    await expect(citationCandidates.first()).toBeVisible();
    const href = await citationCandidates.first().getAttribute('href');
    expect(href).toMatch(/^#source-/);

    // Reveal can replace the first inline citation while scrolling on a slower
    // mobile compositor. Reacquire the exact href after scroll instead of
    // focusing the role locator that discovered the previous DOM node.
    const citation = page.locator(`#main-content a[href="${href}"]`).first();
    await citation.scrollIntoViewIfNeeded();
    await expect(citation).toBeAttached();
    await expect(citation).toBeVisible();
    await citation.focus();
    await expect(citation).toBeFocused();
    await expect(citation.locator('xpath=..').getByRole('tooltip')).toBeVisible();

    await citation.press('Enter');
    await expect(page).toHaveURL(new RegExp(`${escapeRegExp(href)}$`));
    const source = page.locator(`[id="${href.slice(1)}"]`);
    await expect(source).toBeVisible();

    const primaryFilter = page.getByRole('button', { name: /Первичные/ });
    await primaryFilter.click();
    await expect(primaryFilter).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#sources li').first()).toBeVisible();

    const overflow = await page.evaluate(() => Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-longform-source.png`), fullPage: false });
    expect(runtime.pageErrors).toEqual([]);
    expect(runtime.consoleErrors).toEqual([]);
  });
});

for (const theme of ['dark', 'light']) {
  for (const reducedMotion of ['reduce', 'no-preference']) {
    test.describe(`image viewer viewport ${theme} ${reducedMotion}`, () => {
      test.use({ colorScheme: theme, contextOptions: { reducedMotion } });
      test('viewer escapes article containment while nested search remains above it', async ({ page }) => {
        const runtime = attachRuntimeDiagnostics(page);
        // A known decodable local fixture isolates geometry from Wikimedia
        // egress. This is not verification/replacement of production image bytes.
        const fixture = fs.readFileSync(path.resolve('public/images/essays/yesenin/yesenin-part-1-editorial.webp'));
        const fixtureRequests = [];
        const failedImageRequests = [];
        page.on('requestfailed', (request) => {
          if (/wikimedia\.org/.test(request.url())) {
            failedImageRequests.push({ url: request.url(), error: request.failure()?.errorText });
          }
        });
        await page.route(/^https:\/\/[^/]+\.wikimedia\.org\//, async (route) => {
          fixtureRequests.push(route.request().url());
          await route.fulfill({ contentType: 'image/webp', body: fixture });
        });
        await page.addInitScript((theme) => localStorage.setItem('tlp-theme-mode', theme), theme);
        await page.goto(`${BASE_URL}/essays/sergei-yesenin-1921-1925`, { waitUntil: 'domcontentloaded' });
        await waitForRoute(page);
        const opener = page.locator('.essay-body figure button[aria-haspopup="dialog"]').first();
        await opener.scrollIntoViewIfNeeded();
        await opener.focus();
        try {
          await expect(opener).toBeInViewport();
          await expect.poll(() => opener.locator('img').evaluate((node) => node.naturalWidth)).toBeGreaterThan(0);
        } catch (error) {
          // Preserve the assertion/timeout. Native CI annotations must expose
          // whether this is routing, decoding, or lazy-image visibility; signed
          // artifact/log delivery is not always reachable from the repair lane.
          const image = await opener.locator('img').evaluate((node) => ({
            scrollY: window.scrollY, viewportHeight: innerHeight,
            src: node.src, currentSrc: node.currentSrc, complete: node.complete,
            naturalWidth: node.naturalWidth, loading: node.loading,
            state: node.dataset.imageState,
            rect: node.getBoundingClientRect().toJSON(),
            ancestors: [node, node.parentElement, node.closest('figure')].map((element) => {
              const css = getComputedStyle(element);
              return { tag: element.tagName, contentVisibility: css.contentVisibility,
                visibility: css.visibility, opacity: css.opacity, transform: css.transform };
            }),
          }));
          const independentDecode = await page.evaluate(async (base64) => {
            const probe = new Image();
            probe.src = `data:image/webp;base64,${base64}`;
            return Promise.race([
              probe.decode().then(() => ({ width: probe.naturalWidth }), (error) => ({ error: String(error) })),
              new Promise((resolve) => setTimeout(() => resolve({ error: 'diagnostic decode pending after 2s' }), 2_000)),
            ]);
          }, fixture.toString('base64'));
          throw new Error(`${error.message}\nImage fixture diagnostics: ${JSON.stringify({
            fixtureBytes: fixture.length, fixtureRequests, failedImageRequests, image, independentDecode,
          })}`, { cause: error });
        }
        await opener.press('Enter');
        const dialog = page.getByRole('dialog').filter({ has: page.getByRole('button', { name: 'Закрыть изображение' }) });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole('button', { name: 'Закрыть изображение' })).toBeFocused();
        await expect.poll(() => dialog.evaluate((node) => {
          const rect = node.getBoundingClientRect();
          return [rect.left, rect.top, rect.right - innerWidth, rect.bottom - innerHeight].map(Math.round);
        }), { timeout: 5_000, message: 'image dialog must cover the actual viewport, not its transformed article block' }).toEqual([0, 0, 0, 0]);
        const scrollY = await page.evaluate(() => Math.abs(Number.parseFloat(document.body.style.top || '0')));

        const viewerLayer = await dialog.evaluate((node) => Number(getComputedStyle(node).zIndex));
        await page.keyboard.press('Control+K');
        const search = page.getByRole('dialog', { name: 'Поиск по сайту' });
        await expect(search).toBeVisible();
        const input = search.getByRole('combobox', { name: 'Поисковый запрос' });
        await expect(input).toBeFocused();
        const searchLayer = await search.evaluate((node) => {
          for (let current = node; current; current = current.parentElement) {
            const z = getComputedStyle(current).zIndex;
            if (z !== 'auto') return Number(z);
          }
          return 0;
        });
        expect(searchLayer, 'nested search must paint above the body-level image dialog').toBeGreaterThan(viewerLayer);
        await expect.poll(() => input.evaluate((node) => {
          const r = node.getBoundingClientRect();
          return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === node;
        })).toBe(true);
        await page.keyboard.press('Escape');
        await expect(search).toBeHidden();
        await expect(dialog.getByRole('button', { name: 'Закрыть изображение' })).toBeFocused();
        // A true viewport backdrop must also receive clicks/taps outside the
        // article, rather than letting those reach header/dock controls.
        if (await page.evaluate(() => matchMedia('(pointer: coarse)').matches)) await page.touchscreen.tap(4, 4);
        else await page.mouse.click(4, 4);
        await expect(dialog).toBeHidden();
        await expect(opener).toBeFocused();
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(scrollY, 0);
        await expect.poll(() => page.evaluate(() => window.__TLP_OVERLAY_DEBUG?.depth)).toBe(0);
        expect(runtime.pageErrors).toEqual([]);
        expect(runtime.consoleErrors).toEqual([]);
      });
    });
  }
}

// This contract is deliberately local-only. It does not certify Worker/D1 or
// human Turnstile; the default QA build must expose its real local-mode status.
for (const theme of ['dark', 'light']) test.describe(`local community durability ${theme}`, () => {
  test.use({ colorScheme: theme, contextOptions: { reducedMotion: 'reduce' } });
  const text = 'Unicode QA 👨‍👩‍👧‍👦 е́  два пробела.\nВторая строка\tс табом и <b>не HTML</b>.';
  const storageKey = 'tlp-community-feedback:v3';
  const target = '[data-community-target="poet:alexander-pushkin"]';

  async function openLocalPanel(page) {
    await page.addInitScript(t => localStorage.setItem('tlp-theme-mode', t), theme);
    await page.goto(`${BASE_URL}/poets/alexander-pushkin`, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);
    const panel = page.locator(target);
    await expect(panel.getByText('Локальный режим: ответы сохраняются только в этом браузере.', { exact: true })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    return panel;
  }

  test('local Unicode comment survives reload without a duplicate or interpreted markup', async ({ page }, testInfo) => {
    const runtime = attachRuntimeDiagnostics(page);
    const writes = [];
    page.on('request', request => {
      if (request.method() === 'POST' && /\/v1\/(?:session|comments?|ratings?|helpful)(?:[/?]|$)/.test(request.url())) writes.push(request.url());
    });
    const panel = await openLocalPanel(page);
    await panel.getByPlaceholder('Ваше имя или псевдоним — необязательно').fill('Локальный QA');
    const editor = panel.getByPlaceholder('Что особенно точно, спорно, сильно или слабо?');
    await editor.fill(text);
    await editor.press('Control+Enter');
    await expect(editor).toHaveValue('');
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);
    expect(saved.outbox).toEqual([]);
    expect(saved.localSnapshot.comments).toHaveLength(1);
    const entry = saved.localSnapshot.comments[0];
    expect(entry).toMatchObject({ text, author: 'Локальный QA', targetType: 'poet', targetId: 'alexander-pushkin' });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForRoute(page);
    const cards = page.locator(target).locator('[data-community-comment-id]');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toHaveAttribute('data-community-comment-id', entry.id);
    const paint = await cards.locator('p').evaluate(node => ({ text: node.textContent, whiteSpace: getComputedStyle(node).whiteSpace, htmlElements: node.children.length }));
    expect(paint).toEqual({ text, whiteSpace: 'pre-wrap', htmlElements: 0 });
    const ink = await cards.locator('p').evaluate(node => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--tlp-island-muted, var(--tlp-text-muted))';
      node.append(probe);
      const expected = getComputedStyle(probe).color;
      probe.remove();
      const style = getComputedStyle(node);
      return { color: style.color, fill: style.webkitTextFillColor, expected };
    });
    expect(ink.color, 'comment prose must own opaque theme-aware ink').toBe(ink.expected);
    expect(ink.fill, 'actual text fill must follow comment ink').toBe(ink.expected);
    expect(await contrastRatio(cards.locator('p')), 'rendered comment body contrast').toBeGreaterThanOrEqual(4.5);
    const cardText = await contrastMeasurements(cards.locator('div[title], time, span, button, p'), true);
    expect(cardText.length).toBeGreaterThanOrEqual(5);
    for (const { text: label, ratio } of cardText) {
      expect(ratio, `persisted comment metadata: ${label}`).toBeGreaterThanOrEqual(4.5);
    }
    const reloaded = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);
    expect(reloaded.localSnapshot.comments).toEqual([entry]);
    expect(reloaded.outbox).toEqual([]);
    expect(writes).toEqual([]);
    expect(runtime.pageErrors).toEqual([]);
    expect(runtime.consoleErrors).toEqual([]);
    await cards.first().screenshot({ path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-${theme}-local-comment.png`) });
  });

  test('failed local persistence keeps the draft and never reports a saved comment', async ({ page }) => {
    const runtime = attachRuntimeDiagnostics(page);
    await page.addInitScript(key => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (name, value) {
        if (this === localStorage && name === key) throw new DOMException('QA storage quota', 'QuotaExceededError');
        return original.call(this, name, value);
      };
    }, storageKey);
    const panel = await openLocalPanel(page);
    const editor = panel.getByPlaceholder('Что особенно точно, спорно, сильно или слабо?');
    await editor.fill(text);
    await expect(panel.getByRole('button', { name: 'Добавить комментарий', exact: true })).toBeEnabled();
    // The toast lasts 2.6s. Observe its real accessible DOM message before the
    // action, so a delayed browser round-trip cannot miss an already-gone alert.
    await panel.evaluate(node => {
      window.__qaLocalMessages = [];
      new MutationObserver(() => {
        for (const message of node.querySelectorAll('[role=alert], [role=status]')) {
          window.__qaLocalMessages.push(message.textContent);
        }
      }).observe(node, { childList: true, subtree: true, characterData: true });
    });
    await editor.press('Control+Enter');
    await expect.poll(() => page.evaluate(() => window.__qaLocalMessages)).toContain('Не удалось сохранить: локальное хранилище или очередь недоступны');
    expect(await page.evaluate(() => window.__qaLocalMessages)).not.toContain('Комментарий добавлен');
    await expect(editor).toHaveValue(text);
    await expect(panel.locator('[data-community-comment-id]')).toHaveCount(0);
    expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
    expect(runtime.pageErrors).toEqual([]);
    expect(runtime.consoleErrors).toEqual([]);
  });
});

test.describe('animated modal exit lifetime', () => {
  for (const surface of ['immersive-player', 'essay-image-lightbox']) {
    for (const reduced of [false, true]) {
      test(`${surface} retains focus and background ownership until exit ends; reduced=${reduced}`, async ({ page }, testInfo) => {
        await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
        const runtime = attachRuntimeDiagnostics(page);
        const touch = testInfo.project.name === 'android-pixel7' || testInfo.project.name === 'iphone-safari';
        let opener;
        if (surface === 'immersive-player') {
          await page.goto(`${BASE_URL}/music`, {waitUntil:'domcontentloaded'});
          await waitForRoute(page);
          opener = page.getByRole('button',{name:'Погружение'}).first();
        } else {
          await page.goto(`${BASE_URL}/essays/yesenin-duncan-first-meeting-documents`, {waitUntil:'domcontentloaded'});
          await waitForRoute(page);
          opener = page.getByRole('button',{name:/^Увеличить изображение:/}).first();
        }
        await opener.scrollIntoViewIfNeeded();
        await opener.focus();
        if (touch) await opener.tap(); else await opener.click();

        const dialog = page.locator('[role="dialog"][aria-modal="true"]').first();
        await expect(dialog).toBeVisible();
        await expect.poll(() => page.evaluate(() => window.__TLP_OVERLAY_DEBUG?.topLabel)).toBe(surface);
        await expect.poll(() => dialog.evaluate(node => node.contains(document.activeElement))).toBe(true);

        // Natural exit must begin from an already painted, settled entrance.
        // Visibility/focus alone does not establish opacity: the separate
        // interrupted-entrance regression below covers closing mid-entry.
        // Browser-local rAF observation avoids Node/WebKit round-trip sleeps.
        const entrance = await dialog.evaluate(node => new Promise((resolve, reject) => {
          const started = performance.now();
          let frame = 0;
          let previous = started;
          let samples = 0;
          let maxGap = 0;
          let stable = 0;
          let last = null;
          const finish = () => {
            cancelAnimationFrame(frame);
            clearTimeout(deadline);
          };
          const deadline = setTimeout(() => {
            finish();
            reject(new Error('Natural exit entrance never became paint-ready: ' + JSON.stringify({
              samples, maxGap, elapsed: performance.now() - started, last,
            })));
          }, 5000);
          const observe = () => {
            const now = performance.now();
            maxGap = Math.max(maxGap, now - previous);
            previous = now;
            samples++;
            const opacity = Number(getComputedStyle(node).opacity);
            const runningOpacity = node.getAnimations().filter(animation =>
              (animation.pending || animation.playState === 'running') &&
              animation.effect?.getKeyframes().some(keyframe => keyframe.opacity !== undefined));
            last = { opacity, activeOpacityAnimations: runningOpacity.length,
              visibility: document.visibilityState, connected: node.isConnected };
            stable = node.isConnected && document.visibilityState === 'visible' &&
              opacity >= 0.99 && runningOpacity.length === 0 ? stable + 1 : 0;
            if (stable >= 3) {
              finish();
              resolve({ samples, maxGap, elapsed: now - started, last });
            } else frame = requestAnimationFrame(observe);
          };
          frame = requestAnimationFrame(observe);
        }));
        console.log('NATURAL_ENTRANCE_READY', JSON.stringify({ surface, reduced, entrance }));

        await page.evaluate(() => {
          window.__tlpExitProof = [];
          window.__tlpExitDone = false;
          // The sampler must survive a delayed keyboard round-trip on WebKit.
          // Its old 180-frame cap expired before Escape on a busy CI runner,
          // even though the actual modal later closed correctly. Observe the
          // concrete portal node until unmount; keep the original five-second
          // close gate and every focus/inert/scroll assertion unchanged.
          const dialogNode = document.querySelector('[role="dialog"][aria-modal="true"]');
          if (!dialogNode?.isConnected || !dialogNode.parentNode) {
            throw new Error('Cannot certify exit: modal detached before observer registration');
          }
          // The detector and the assertion share one DOM-unmount event. A
          // repeated Node->WebKit RPC poll can race WebKit's animation/event
          // delivery under CI load even when the modal is still correct.
          const trace = window.__tlpExitTiming = {
            installed: performance.now(), keydown: null, unmounted: null,
            visibility: document.visibilityState, animations: [],
          };
          const onEscape = event => {
            if (event.key === 'Escape' && trace.keydown === null) trace.keydown = performance.now();
          };
          window.addEventListener('keydown', onEscape, { capture: true });
          // Observe the actual native animation without pausing, extending or
          // replacing its completion channels. Keep the natural frame gate.
          const animate = dialogNode.animate.bind(dialogNode);
          dialogNode.animate = (...args) => {
            const animation = animate(...args);
            const entry = {
              started: performance.now(), duration: animation.effect?.getComputedTiming().duration,
              keyframes: animation.effect?.getKeyframes().map(frame => ({ opacity: frame.opacity, offset: frame.offset })),
              finishEvent: null, finished: null, cancelled: null,
            };
            trace.animations.push(entry);
            animation.addEventListener('finish', () => { entry.finishEvent = performance.now(); }, { once: true });
            void animation.finished.then(
              () => { entry.finished = performance.now(); },
              () => { entry.cancelled = performance.now(); },
            );
            return animation;
          };
          let resolveUnmount;
          window.__tlpExitCompletion = new Promise((resolve) => {
            resolveUnmount = resolve;
          });
          const finishUnmount = () => {
            if (window.__tlpExitDone) return;
            window.__tlpExitDone = true;
            trace.unmounted = performance.now();
            observer.disconnect();
            window.removeEventListener('keydown', onEscape, { capture: true });
            resolveUnmount();
          };
          const observer = new MutationObserver(() => {
            if (!dialogNode.isConnected) finishUnmount();
          });
          observer.observe(dialogNode.parentNode, { childList: true });
          const record = () => {
            if (window.__tlpExitDone) return;
            if (!dialogNode.isConnected) {
              finishUnmount();
              return;
            }
            const root = document.getElementById('root');
            window.__tlpExitProof.push({
              t: performance.now(),
              opacity: getComputedStyle(dialogNode).opacity,
              visibility: document.visibilityState,
              depth:window.__TLP_OVERLAY_DEBUG?.depth,
              inert:root?.inert,
              hidden:root?.getAttribute('aria-hidden'),
              position:document.body.style.position,
              focusInside:dialogNode.contains(document.activeElement),
            });
            requestAnimationFrame(record);
          };
          record();
        });
        const escapeCountBefore = await page.evaluate(() => window.__TLP_OVERLAY_DEBUG?.escapeCount);
        await page.keyboard.press('Escape');
        await page.evaluate(async () => {
          // Use a browser-local event promise, not repeated protocol polling.
          // The same five-second bound remains and a failure includes the
          // actual overlay stack, Escape reception and animation state.
          let timeout;
          try {
            await Promise.race([
              window.__tlpExitCompletion,
              new Promise((_, reject) => {
                timeout = window.setTimeout(() => {
                  const node = document.querySelector('[role="dialog"][aria-modal="true"]');
                  reject(new Error('Modal failed to unmount after Escape: ' + JSON.stringify({
                    overlay: window.__TLP_OVERLAY_DEBUG,
                    connected: node?.isConnected,
                    focusTag: document.activeElement?.tagName,
                    samples: window.__tlpExitProof?.length,
                    frames: window.__tlpExitProof?.slice(-2),
                    timing: window.__tlpExitTiming,
                  })));
                }, 5000);
              }),
            ]);
          } finally {
            window.clearTimeout(timeout);
          }
        });
        const escapeCountAfter = await page.evaluate(() => window.__TLP_OVERLAY_DEBUG?.escapeCount);
        expect(escapeCountAfter, 'Escape must be received by the topmost dialog').toBeGreaterThan(escapeCountBefore);
        const evidence = await page.evaluate(() => ({
          frames: window.__tlpExitProof,
          timing: window.__tlpExitTiming,
        }));
        const { frames, timing } = evidence;
        const gaps = frames.slice(1).map((frame, index) => frame.t - frames[index].t);
        console.log('NATURAL_EXIT_TIMING', JSON.stringify({
          surface, reduced, timing, sampleCount: frames.length,
          maxSampleGap: Math.max(0, ...gaps),
          first: frames.slice(0, 3), last: frames.slice(-3),
        }));
        expect(frames.length, 'exit must have connected frames with a live lease').toBeGreaterThan(2);
        expect(frames.filter(f => f.depth !== 1 || f.inert !== true || f.hidden !== 'true' || f.position !== 'fixed' || !f.focusInside),
          'no frame may expose focus or unlock a still-painted modal').toEqual([]);
        await expect.poll(() => page.evaluate(() => window.__TLP_OVERLAY_DEBUG?.depth), {timeout:2000}).toBe(0);
        await expect.poll(() => page.evaluate(() => document.getElementById('root')?.inert)).toBe(false);
        // Tap does not guarantee keyboard focus on a button (notably WebKit).
        // The frame-by-frame isolation assertion above remains unconditional.
        if (touch) await expect(opener).toBeVisible();
        else await expect(opener).toBeFocused();
        expect(runtime.pageErrors).toEqual([]);
      });
    }
  }
});

for (const interruption of ['cancel', 'hidden']) {
  test(`immersive native exit interruption releases the actual dialog and overlay lease: ${interruption}`, async ({ page }) => {
    const runtime = attachRuntimeDiagnostics(page);
    await page.goto(`${BASE_URL}/music`, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);
    const opener = page.getByRole('button', { name: 'Погружение' }).first();
    await opener.scrollIntoViewIfNeeded();
    await opener.focus();
    // This test certifies keyboard focus restoration; touch opening is covered separately.
    await expect(opener).toBeFocused();
    await opener.press('Enter');
    const dialog = page.locator('[role="dialog"][aria-labelledby="immersive-track-title"]');
    await expect(dialog).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__TLP_OVERLAY_DEBUG?.topLabel)).toBe('immersive-player');

    await dialog.evaluate(node => {
      const animate = node.animate.bind(node);
      node.animate = (...args) => {
        const animation = animate(...args);
        const frames = args[0];
        if (Array.isArray(frames) && typeof frames[0]?.opacity === 'number' && frames[1]?.opacity === 0) {
          animation.pause();
          window.__qaInterruptedExit = animation;
        }
        return animation;
      };
    });
    const close = dialog.getByRole('button', { name: 'Выйти' });
    await close.press('Enter');
    await expect.poll(() => page.evaluate(() => Boolean(window.__qaInterruptedExit))).toBe(true);
    await expect(dialog).toBeAttached();
    await expect.poll(() => page.evaluate(() => window.__TLP_OVERLAY_DEBUG?.topLabel)).toBe('immersive-player');
    await page.evaluate(kind => {
      if (kind === 'cancel') window.__qaInterruptedExit.cancel();
      else {
        // Inject the visibility transition; the animation and portal are real.
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
        document.dispatchEvent(new Event('visibilitychange'));
      }
    }, interruption);
    await expect(dialog).toHaveCount(0, { timeout: 5000 });
    await expect.poll(() => page.evaluate(() => window.__TLP_OVERLAY_DEBUG?.depth)).toBe(0);
    await expect.poll(() => page.evaluate(() => document.getElementById('root').inert)).toBe(false);
    await expect(opener).toBeFocused();
    expect(runtime.pageErrors).toEqual([]);
  });
}

for (const interruption of ['cancel', 'hidden']) {
  test(`touch activation interrupted native exit releases the actual dialog and overlay lease: ${interruption}`, async ({ page, hasTouch }) => {
    test.skip(!hasTouch, 'Touch activation requires a touch-enabled project');
    const runtime = attachRuntimeDiagnostics(page);
    await page.goto(`${BASE_URL}/music`, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);
    const opener = page.getByRole('button', { name: 'Погружение' }).first();
    await opener.scrollIntoViewIfNeeded();
    await opener.focus();
    // Observe the browser focus state before the modal opens.
    await expect(opener).toBeFocused();
    await opener.evaluate(node => {
      window.__qaTouchFocus = [];
      for (const type of ['pointerdown', 'focusout', 'click']) {
        node.addEventListener(type, () => window.__qaTouchFocus.push({
          type, active: document.activeElement?.tagName, opener: document.activeElement === node
        }), { capture: true });
      }
    });
    await opener.tap();
    const dialog = page.locator('[role="dialog"][aria-labelledby="immersive-track-title"]');
    await expect(dialog).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__TLP_OVERLAY_DEBUG?.topLabel)).toBe('immersive-player');

    await dialog.evaluate(node => {
      const animate = node.animate.bind(node);
      node.animate = (...args) => {
        const animation = animate(...args);
        const frames = args[0];
        if (Array.isArray(frames) && typeof frames[0]?.opacity === 'number' && frames[1]?.opacity === 0) {
          animation.pause();
          window.__qaInterruptedExit = animation;
        }
        return animation;
      };
    });
    const close = dialog.getByRole('button', { name: 'Выйти' });
    await close.tap();
    await expect.poll(() => page.evaluate(() => Boolean(window.__qaInterruptedExit))).toBe(true);
    await expect(dialog).toBeAttached();
    await expect.poll(() => page.evaluate(() => window.__TLP_OVERLAY_DEBUG?.topLabel)).toBe('immersive-player');
    await page.evaluate(kind => {
      if (kind === 'cancel') window.__qaInterruptedExit.cancel();
      else {
        // Inject the visibility transition; the animation and portal are real.
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
        document.dispatchEvent(new Event('visibilitychange'));
      }
    }, interruption);
    await expect(dialog).toHaveCount(0, { timeout: 5000 });
    await expect.poll(() => page.evaluate(() => window.__TLP_OVERLAY_DEBUG?.depth)).toBe(0);
    await expect.poll(() => page.evaluate(() => document.getElementById('root').inert)).toBe(false);
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[inert], [aria-hidden="true"]')))).toBe(false);
    console.log('TOUCH_FOCUS', JSON.stringify(await page.evaluate(() => ({ events: window.__qaTouchFocus, final: document.activeElement?.tagName }))));
    expect(runtime.pageErrors).toEqual([]);
  });
}

test('mini player restores the explicit immersive invoker after native exit', async ({ page, hasTouch }) => {
  await page.goto(`${BASE_URL}/music`, { waitUntil: 'domcontentloaded' });
  await waitForRoute(page);
  const featured = page.getByRole('button', { name: 'Погружение' }).first();
  await featured.click();
  const dialog = page.locator('[role="dialog"][aria-labelledby="immersive-track-title"]');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Выйти' }).click();
  await expect(dialog).toHaveCount(0);
  const mini = page.locator('.global-audio-mini').getByRole('button', { name: 'Открыть режим погружения' });
  await expect(mini).toBeVisible();
  if (hasTouch) await mini.tap(); else await mini.click();
  await expect(dialog).toBeVisible();
  await expect.poll(() => dialog.evaluate(node => node.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__TLP_OVERLAY_DEBUG?.depth)).toBe(0);
  await expect(mini).toBeFocused();
});
test('new reader focus survives dialog cleanup', async ({ page }) => {
  await page.goto(`${BASE_URL}/music`, { waitUntil: 'domcontentloaded' });
  await waitForRoute(page);
  const opener = page.getByRole('button', { name: 'Погружение' }).first();
  await opener.press('Enter');
  const dialog = page.locator('[role="dialog"][aria-labelledby="immersive-track-title"]');
  await expect(dialog).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.getElementById('root').inert)).toBe(true);
  await page.evaluate(() => {
    const root = document.getElementById('root');
    const destination = document.getElementById('main-content');
    window.__qaNewFocus = new Promise(resolve => {
      const observer = new MutationObserver(() => {
        if (root.inert) return;
        observer.disconnect();
        destination.focus({ preventScroll: true });
        const received = document.activeElement === destination;
        requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() =>
          resolve({ received, retained: document.activeElement === destination }))));
      });
      observer.observe(root, { attributes: true, attributeFilter: ['inert'] });
    });
  });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  const proof = await page.evaluate(() => window.__qaNewFocus);
  expect(proof).toEqual({ received: true, retained: true });
  await expect(page.locator('#main-content')).toBeFocused();
});
test('stable overlay isolation does not flicker during player updates', async ({ page }) => {
  await page.goto(`${BASE_URL}/music`, { waitUntil: 'domcontentloaded' });
  await waitForRoute(page);
  await page.getByRole('button', { name: 'Погружение' }).first().click();
  const dialog = page.locator('[role="dialog"][aria-labelledby="immersive-track-title"]');
  await expect(dialog).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.getElementById('root').inert)).toBe(true);
  const mute = dialog.getByRole('button', { name: /Включить звук|Выключить звук/ });
  await mute.focus();
  await expect(mute).toBeFocused();
  await page.evaluate(() => {
    window.__qaIsolationChanges = [];
    const root = document.getElementById('root');
    const observer = new MutationObserver(records => {
      window.__qaIsolationChanges.push(...records.map(record => ({ name: record.attributeName, old: record.oldValue })));
    });
    observer.observe(root, { attributes: true, attributeFilter: ['inert', 'aria-hidden'], attributeOldValue: true });
  });
  const initial = await mute.getAttribute('aria-label');
  await mute.press('Enter');
  await expect(mute).not.toHaveAttribute('aria-label', initial);
  await mute.press('Enter');
  await expect(mute).toHaveAttribute('aria-label', initial);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect(mute).toBeFocused();
  expect(await page.evaluate(() => window.__qaIsolationChanges)).toEqual([]);
  await expect.poll(() => page.evaluate(() => document.getElementById('root').inert)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.getElementById('root').inert)).toBe(false);
});

test('immersive exit survives lost native completion without early overlay release', async ({ page }) => {
  await page.goto(`${BASE_URL}/music`, { waitUntil: 'domcontentloaded' });
  await waitForRoute(page);
  const opener = page.getByRole('button', { name: 'Погружение' }).first();
  await opener.press('Enter');
  const dialog = page.locator('[role="dialog"][aria-labelledby="immersive-track-title"]');
  await expect(dialog).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__TLP_OVERLAY_DEBUG?.topLabel)).toBe('immersive-player');
  await dialog.evaluate(node => {
    const nativeAnimate = node.animate.bind(node);
    node.animate = (...args) => {
      const animation = nativeAnimate(...args);
      if (!Array.isArray(args[0]) || args[0][1]?.opacity !== 0) return animation;
      animation.pause();
      Object.defineProperty(animation, 'finished', { configurable: true, value: new Promise(() => {}) });
      const finish = animation.finish.bind(animation);
      window.__qaStalledNativeExit = { start: performance.now(), forced: null };
      animation.finish = () => {
        window.__qaStalledNativeExit.forced = {
          elapsed: performance.now() - window.__qaStalledNativeExit.start,
          connected: node.isConnected,
          opacity: getComputedStyle(node).opacity,
          depth: window.__TLP_OVERLAY_DEBUG?.depth,
          inert: document.getElementById('root').inert,
        };
        finish();
      };
      return animation;
    };
  });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0, { timeout: 5000 });
  const proof = await page.evaluate(() => window.__qaStalledNativeExit?.forced);
  expect(proof).toBeTruthy();
  expect(proof.elapsed).toBeGreaterThanOrEqual(1750);
  expect(proof).toMatchObject({ connected: true, opacity: '0', depth: 1, inert: true });
  await expect.poll(() => page.evaluate(() => window.__TLP_OVERLAY_DEBUG?.depth)).toBe(0);
  await expect.poll(() => page.evaluate(() => document.getElementById('root').inert)).toBe(false);
  await expect(opener).toBeFocused();
});

test('immersive root reverses one native entrance without competing opacity writers', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Element.prototype.animate;
    window.__qaRootFade = { entrance: null, exit: null };
    Element.prototype.animate = function (...args) {
      const animation = original.apply(this, args);
      if (this.getAttribute('aria-labelledby') !== 'immersive-track-title' || !Array.isArray(args[0])) return animation;
      const frames = args[0];
      if (frames[0]?.opacity === 0 && frames[1]?.opacity === 1) {
        animation.pause();
        animation.currentTime = 180;
        window.__qaRootFade.entrance = animation;
      } else if (frames[1]?.opacity === 0) {
        window.__qaRootFade.exit = {
          from: frames[0]?.opacity,
          oldState: window.__qaRootFade.entrance?.playState,
          active: this.getAnimations().filter(item => item.playState !== 'idle').length,
          duration: animation.effect?.getComputedTiming().duration,
        };
      }
      return animation;
    };
  });
  await page.goto(`${BASE_URL}/music`, { waitUntil: 'domcontentloaded' });
  await waitForRoute(page);
  const opener = page.getByRole('button', { name: 'Погружение' }).first();
  await opener.press('Enter');
  const dialog = page.locator('[role="dialog"][aria-labelledby="immersive-track-title"]');
  await expect(dialog).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(window.__qaRootFade.entrance))).toBe(true);
  await expect.poll(() => dialog.evaluate(node => node.contains(document.activeElement))).toBe(true);
  const opacity = await dialog.evaluate(node => Number(getComputedStyle(node).opacity));
  expect(opacity).toBeGreaterThan(0);
  expect(opacity).toBeLessThan(1);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0, { timeout: 5000 });
  const proof = await page.evaluate(() => window.__qaRootFade.exit);
  expect(proof).toBeTruthy();
  expect(proof.from).toBeCloseTo(opacity, 3);
  expect(proof).toMatchObject({ oldState: 'idle', active: 1, duration: 450 });
  await expect.poll(() => page.evaluate(() => window.__TLP_OVERLAY_DEBUG?.depth)).toBe(0);
  await expect(opener).toBeFocused();
});
