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
    await expect(citation.getByRole('tooltip')).toBeVisible();

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
