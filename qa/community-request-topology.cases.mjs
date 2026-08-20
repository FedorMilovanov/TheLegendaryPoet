const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const COMMUNITY_ORIGIN = 'https://community.test.invalid';
const ARTICLE_ID = 'essay-yesenin-biography-part-two';
const PART_ONE_ID = 'essay-yesenin-biography-part-one';
const PART_ONE_SLUG = 'sergei-yesenin-1895-1921';
const SAME_TIME = '2026-08-05T10:00:00.000Z';
const ACTOR_TOKEN = 'v1.browser-qa-signed-actor-token-that-is-long-enough.signature';

const comments = Array.from({ length: 12 }, (_, index) => ({
  id: `comment-${String(99 - index).padStart(8, '0')}`,
  targetType: 'article',
  targetId: ARTICLE_ID,
  author: `Читатель ${index + 1}`,
  text: `Содержательное адресное наблюдение номер ${index + 1}.`,
  kind: index % 2 ? 'history' : 'literary',
  helpful: index,
  createdAt: index < 3 ? SAME_TIME : new Date(Date.parse(SAME_TIME) - index * 1000).toISOString(),
}));

const integrityComments = Array.from({ length: 12 }, (_, index) => ({
  id: `comment-integrity-${String(index + 1).padStart(8, '0')}`,
  targetType: 'article',
  targetId: ARTICLE_ID,
  author: `Integrity ${index + 1}`,
  text: index === 0
    ? 'Строка первая\nСтрока вторая 😀 <script>globalThis.__communityXss=1</script>'
    : index === 1
      ? `${'а'.repeat(219)}😀${'х'.repeat(20)}`
      : `Проверочный комментарий номер ${index + 1} для сортировки и пагинации.`,
  kind: index % 2 ? 'history' : 'literary',
  helpful: 120 - index,
  createdAt: new Date(Date.parse(SAME_TIME) - index * 1000).toISOString(),
}));

function corsHeaders(extra = {}) {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'content-type': 'application/json',
    ...extra,
  };
}

function parseBody(request) {
  const raw = request.postData();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function requestRecord(request, url) {
  return {
    url,
    method: request.method(),
    body: parseBody(request),
    authorization: request.headers()['authorization'] ?? null,
  };
}

async function installCommunityBackend(page) {
  await page.addInitScript(() => {
    globalThis.__TLP_COMMUNITY_TEST_CONFIG__ = {
      url: 'https://community.test.invalid',
      humanProof: 'turnstile-browser-qa-proof',
    };
  });

  const reads = [];
  const writes = [];
  await page.route(`${COMMUNITY_ORIGIN}/**`, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders() });
      return;
    }

    const url = new URL(request.url());
    const record = requestRecord(request, url);
    const isRead = request.method() === 'GET' || url.pathname === '/v1/summary/batch';
    if (isRead) reads.push(record);
    else writes.push(record);

    if (url.pathname === '/v1/summary' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        headers: corsHeaders(),
        body: JSON.stringify({
          targetType: 'article',
          targetId: ARTICLE_ID,
          ratingCount: 9,
          commentCount: 12,
          overall: 4.4,
          dimensions: { clarity: 4.5, depth: 4.3, fairness: 4.4 },
          distribution: { 4: 5, 5: 4 },
          deviation: 0.35,
        }),
      });
      return;
    }

    if (url.pathname === '/v1/summary/batch' && request.method() === 'POST') {
      const body = record.body && typeof record.body === 'object' ? record.body : {};
      const ids = Array.isArray(body.targetIds) ? body.targetIds : [];
      await route.fulfill({
        status: 200,
        headers: corsHeaders(),
        body: JSON.stringify({
          aggregates: ids.map((id, index) => ({
            targetType: 'poet',
            targetId: id,
            ratingCount: index + 2,
            commentCount: index % 3,
            overall: 4.1 + (index % 4) * 0.1,
            dimensions: { language: 4.4, depth: 4.2, legacy: 4.1, truth: 4.0 },
            distribution: { 4: index + 1, 5: 1 },
            deviation: 0.3,
          })),
        }),
      });
      return;
    }

    if (url.pathname === '/v1/comments' && request.method() === 'GET') {
      const hasCursor = url.searchParams.has('cursorCreatedAt');
      const pageComments = hasCursor ? comments.slice(10) : comments.slice(0, 10);
      const last = pageComments.at(-1);
      await route.fulfill({
        status: 200,
        headers: corsHeaders(),
        body: JSON.stringify({
          comments: pageComments,
          nextCursor: hasCursor || !last ? null : { createdAt: last.createdAt, id: last.id },
        }),
      });
      return;
    }

    if (url.pathname === '/v1/session' && request.method() === 'POST') {
      await route.fulfill({
        status: 200,
        headers: corsHeaders(),
        body: JSON.stringify({
          actorToken: ACTOR_TOKEN,
          expiresAt: Date.now() + 30 * 24 * 60 * 60_000,
        }),
      });
      return;
    }

    if (url.pathname === '/v1/helpful' && request.method() === 'POST') {
      await route.fulfill({
        status: 503,
        headers: corsHeaders(),
        body: JSON.stringify({ ok: false, code: 'offline_write_contract' }),
      });
      return;
    }

    if (['/v1/rating', '/v1/comment'].includes(url.pathname) && request.method() === 'POST') {
      await route.fulfill({ status: 200, headers: corsHeaders(), body: JSON.stringify({ ok: true }) });
      return;
    }

    await route.fulfill({ status: 404, headers: corsHeaders(), body: JSON.stringify({ ok: false, code: 'not_found' }) });
  });
  return { reads, writes };
}

async function installCommunityIntegrityBackend(page, state) {
  await page.addInitScript(() => {
    globalThis.__TLP_COMMUNITY_TEST_CONFIG__ = {
      url: 'https://community.test.invalid',
      humanProof: 'turnstile-browser-qa-proof',
    };
  });

  const reads = [];
  const writes = [];
  await page.route(`${COMMUNITY_ORIGIN}/**`, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders() });
      return;
    }

    const url = new URL(request.url());
    const record = requestRecord(request, url);
    const isRead = request.method() === 'GET' || url.pathname === '/v1/summary/batch';
    if (isRead) reads.push(record);
    else writes.push(record);

    if (url.pathname === '/v1/summary' && request.method() === 'GET') {
      if (state.failReads) {
        await route.fulfill({ status: 503, headers: corsHeaders(), body: JSON.stringify({ ok: false, code: 'read_unavailable' }) });
        return;
      }
      const targetType = url.searchParams.get('targetType') || 'article';
      const targetId = url.searchParams.get('targetId') || ARTICLE_ID;
      await route.fulfill({
        status: 200,
        headers: corsHeaders(),
        body: JSON.stringify({
          targetType,
          targetId,
          ratingCount: 9,
          commentCount: 12,
          overall: 4.4,
          dimensions: targetType === 'article'
            ? { clarity: 4.5, depth: 4.3, fairness: 4.4 }
            : { language: 4.5, depth: 4.3, legacy: 4.4, truth: 4.2 },
          distribution: { 4: 5, 5: 4 },
          deviation: 0.35,
        }),
      });
      return;
    }

    if (url.pathname === '/v1/comments' && request.method() === 'GET') {
      if (state.failReads) {
        await route.fulfill({ status: 503, headers: corsHeaders(), body: JSON.stringify({ ok: false, code: 'read_unavailable' }) });
        return;
      }
      const targetType = url.searchParams.get('targetType') || 'article';
      const targetId = url.searchParams.get('targetId') || ARTICLE_ID;
      const corpus = integrityComments.map((comment) => ({ ...comment, targetType, targetId }));
      const hasCursor = url.searchParams.has('cursorCreatedAt');
      const pageComments = hasCursor ? corpus.slice(10) : corpus.slice(0, 10);
      const last = pageComments.at(-1);
      await route.fulfill({
        status: 200,
        headers: corsHeaders(),
        body: JSON.stringify({
          comments: pageComments,
          nextCursor: hasCursor || !last ? null : { createdAt: last.createdAt, id: last.id },
        }),
      });
      return;
    }

    if (url.pathname === '/v1/session' && request.method() === 'POST') {
      await route.fulfill({
        status: 200,
        headers: corsHeaders(),
        body: JSON.stringify({ actorToken: ACTOR_TOKEN, expiresAt: Date.now() + 30 * 24 * 60 * 60_000 }),
      });
      return;
    }

    if (url.pathname === '/v1/rating' && request.method() === 'POST') {
      if (state.ratingWriteMode === 'rate-limit') {
        await route.fulfill({
          status: 429,
          headers: corsHeaders({ 'retry-after': '60' }),
          body: JSON.stringify({ ok: false, code: 'rate_limited' }),
        });
        return;
      }
      if (state.ratingWriteMode === 'reject') {
        await route.fulfill({ status: 400, headers: corsHeaders(), body: JSON.stringify({ ok: false, code: 'invalid_scores' }) });
        return;
      }
      await route.fulfill({ status: 200, headers: corsHeaders(), body: JSON.stringify({ ok: true }) });
      return;
    }

    if (url.pathname === '/v1/comment' && request.method() === 'POST') {
      await route.fulfill({ status: 200, headers: corsHeaders(), body: JSON.stringify({ ok: true }) });
      return;
    }

    if (url.pathname === '/v1/helpful' && request.method() === 'POST') {
      await route.fulfill({ status: 200, headers: corsHeaders(), body: JSON.stringify({ ok: true }) });
      return;
    }

    await route.fulfill({ status: 404, headers: corsHeaders(), body: JSON.stringify({ ok: false, code: 'not_found' }) });
  });
  return { reads, writes };
}

function readUrls(reads) {
  return reads.map((entry) => decodeURIComponent(entry.url.toString()));
}

function useAllowedProject(test, testInfo, projects) {
  test.skip(!projects.includes(testInfo.project.name), `request topology is assigned to ${projects.join(', ')}`);
}

async function visibleCommunityPanel(page, expect) {
  await expect(page.getByText('9 оценок', { exact: false }).filter({ visible: true }).first()).toBeVisible({ timeout: 15_000 });
  const panel = page
    .getByText('Комментарии', { exact: true })
    .filter({ visible: true })
    .first()
    .locator('xpath=ancestor::section[1]');
  await expect(panel.getByText('Показано 5 из 12', { exact: false })).toBeVisible();
  return panel;
}

async function fillArticleRating(panel) {
  const groups = panel.getByRole('radiogroup');
  const count = await groups.count();
  for (let index = 0; index < count; index += 1) {
    await groups.nth(index).getByRole('radio', { name: '5 из 5' }).click();
  }
  await panel.getByRole('button', { name: /Зафиксировать оценку|Обновить оценку/ }).click();
}

async function pendingOutbox(page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('tlp-community-feedback:v3');
    const state = raw ? JSON.parse(raw) : {};
    return Array.isArray(state.outbox) ? state.outbox : [];
  });
}

export function registerCommunityRequestTopologyTests({
  test,
  expect,
  projects = ['chromium-core'],
}) {
  test.describe('community request topology', () => {
    test('generic startup performs zero community reads', async ({ page }, testInfo) => {
      useAllowedProject(test, testInfo, projects);
      const { reads } = await installCommunityBackend(page);
      const response = await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      expect(response?.status()).toBeLessThan(400);
      await page.waitForTimeout(500);
      expect(reads).toHaveLength(0);
    });

    test('article loads one target summary and cursor-paginated comments only', async ({ page }, testInfo) => {
      useAllowedProject(test, testInfo, projects);
      const { reads } = await installCommunityBackend(page);
      const response = await page.goto(`${BASE_URL}/essays/sergei-yesenin-1921-1925`, { waitUntil: 'networkidle' });
      expect(response?.status()).toBeLessThan(400);
      const communityPanel = await visibleCommunityPanel(page, expect);

      let urls = readUrls(reads);
      const summary = urls.filter((url) => url.includes('/v1/summary?'));
      const commentReads = urls.filter((url) => url.includes('/v1/comments?'));
      expect(summary).toHaveLength(1);
      expect(commentReads).toHaveLength(1);
      expect(summary[0]).toContain('targetType=article');
      expect(summary[0]).toContain(`targetId=${ARTICLE_ID}`);
      expect(commentReads[0]).toContain('targetType=article');
      expect(commentReads[0]).toContain(`targetId=${ARTICLE_ID}`);
      expect(commentReads[0]).toContain('limit=10');
      expect(urls.some((url) => url.includes('tlp_ratings') || url.includes('tlp_comments_public'))).toBe(false);

      await communityPanel.getByRole('button', { name: /Показать ещё/ }).click();
      const loadMoreComments = communityPanel.getByRole('button', { name: 'Загрузить ещё комментарии' });
      await expect(loadMoreComments).toBeVisible();
      await loadMoreComments.click();
      await expect(communityPanel.getByText('Показано 10 из 12', { exact: false })).toBeVisible({ timeout: 10_000 });

      urls = readUrls(reads);
      const paged = urls.filter((url) => url.includes('/v1/comments?'));
      expect(paged).toHaveLength(2);
      expect(paged[1]).toContain('cursorCreatedAt=');
      expect(paged[1]).toContain('cursorId=');
      await communityPanel.getByRole('button', { name: /Показать ещё 2/ }).click();
      await expect(communityPanel.getByText('Показано 12 из 12', { exact: false })).toBeVisible();
      expect(new Set(await communityPanel.locator('[data-community-comment-id]:visible').evaluateAll(
        (nodes) => nodes.map((node) => node.getAttribute('data-community-comment-id')),
      )).size).toBe(12);
    });

    test('remote helpful is signed, optimistic and queued without persisting the public corpus', async ({ page }, testInfo) => {
      useAllowedProject(test, testInfo, projects);
      const { writes } = await installCommunityBackend(page);
      const response = await page.goto(`${BASE_URL}/essays/sergei-yesenin-1921-1925`, { waitUntil: 'networkidle' });
      expect(response?.status()).toBeLessThan(400);
      const communityPanel = await visibleCommunityPanel(page, expect);

      const firstVisibleCard = communityPanel.locator('[data-community-comment-id]:visible').first();
      const commentId = await firstVisibleCard.getAttribute('data-community-comment-id');
      expect(commentId).toMatch(/^comment-/);
      const commentCard = communityPanel.locator(`[data-community-comment-id="${commentId}"]`);
      await commentCard.getByRole('button', { name: /Отметить комментарий полезным/ }).click();
      await expect(commentCard.getByRole('button', { name: /Вы отметили комментарий полезным/ }))
        .toHaveAttribute('aria-pressed', 'true');

      await expect.poll(() => writes.filter((entry) => entry.url.pathname === '/v1/helpful').length).toBe(1);
      expect(writes.filter((entry) => entry.url.pathname === '/v1/session')).toHaveLength(1);
      const sessionWrite = writes.find((entry) => entry.url.pathname === '/v1/session');
      expect(sessionWrite?.body).toEqual({ turnstileToken: 'turnstile-browser-qa-proof' });
      const helpfulWrite = writes.find((entry) => entry.url.pathname === '/v1/helpful');
      expect(helpfulWrite?.authorization).toBe(`Bearer ${ACTOR_TOKEN}`);
      expect(helpfulWrite?.body).toEqual({ commentId });
      expect(JSON.stringify(helpfulWrite?.body)).not.toMatch(/voter|actor|network/i);

      const persisted = await page.evaluate(() => {
        const raw = localStorage.getItem('tlp-community-feedback:v3');
        return raw ? JSON.parse(raw) : null;
      });
      expect(persisted).not.toBeNull();
      expect(persisted.localSnapshot?.comments ?? []).toHaveLength(0);
      expect(persisted.outbox?.some((operation) => operation.kind === 'helpful' && operation.commentId === commentId)).toBe(true);
      expect(Object.values(persisted.helpfulVotes ?? {})).toContain(true);
      const actorSession = await page.evaluate(() => JSON.parse(localStorage.getItem('tlp-community-actor:v1') ?? '{}'));
      expect(actorSession.actorToken).toBe(ACTOR_TOKEN);
      expect(JSON.stringify(persisted)).not.toContain(ACTOR_TOKEN);

      await page.reload({ waitUntil: 'networkidle' });
      const reloadedPanel = await visibleCommunityPanel(page, expect);
      const reloadedCard = reloadedPanel.locator(`[data-community-comment-id="${commentId}"]`);
      await expect(reloadedCard.getByRole('button', { name: /Вы отметили комментарий полезным/ }))
        .toHaveAttribute('aria-pressed', 'true');
      const persistedAfterReload = await page.evaluate(() => JSON.parse(
        localStorage.getItem('tlp-community-feedback:v3') ?? '{}',
      ));
      expect(persistedAfterReload.localSnapshot?.comments ?? []).toHaveLength(0);
      expect(persistedAfterReload.outbox?.some(
        (operation) => operation.kind === 'helpful' && operation.commentId === commentId,
      )).toBe(true);
      expect(writes.filter((entry) => entry.url.pathname === '/v1/session')).toHaveLength(1);
    });

    test('ratings hub uses one aggregate batch and never reads comment bodies', async ({ page }, testInfo) => {
      useAllowedProject(test, testInfo, projects);
      const { reads } = await installCommunityBackend(page);
      const response = await page.goto(`${BASE_URL}/ratings`, { waitUntil: 'networkidle' });
      expect(response?.status()).toBeLessThan(400);
      await expect(page.getByText('Поэты в оценке читателей')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText('Общая база синхронизирована для всех посетителей')).toBeVisible({ timeout: 15_000 });

      expect(reads).toHaveLength(1);
      expect(reads[0].url.pathname).toBe('/v1/summary/batch');
      expect(reads[0].method).toBe('POST');
      expect(reads[0].body?.targetType).toBe('poet');
      expect(Array.isArray(reads[0].body?.targetIds)).toBe(true);
      expect(reads[0].body.targetIds.length).toBeGreaterThan(1);
      expect(reads[0].body.targetIds.length).toBeLessThanOrEqual(100);
      expect(readUrls(reads).some((url) => url.includes('/v1/comments'))).toBe(false);
    });

    test('failed community reads never masquerade as genuine zero or empty state', async ({ page }, testInfo) => {
      useAllowedProject(test, testInfo, projects);
      const state = { failReads: true, ratingWriteMode: 'success' };
      await installCommunityIntegrityBackend(page, state);
      const response = await page.goto(`${BASE_URL}/essays/sergei-yesenin-1921-1925`, { waitUntil: 'networkidle' });
      expect(response?.status()).toBeLessThan(400);

      const panel = page.locator(`[data-community-target="article:${ARTICLE_ID}"]`);
      await expect(panel).toBeVisible({ timeout: 15_000 });
      await expect(panel.getByText('Данные оценок сейчас недоступны')).toBeVisible();
      await expect(panel.getByText('Комментарии сейчас недоступны. Это не означает, что их нет.')).toBeVisible();
      await expect(panel.getByText(/0 оценок/)).toHaveCount(0);
      await expect(panel.getByText('Комментариев пока нет. Можно стать первым внимательным читателем.')).toHaveCount(0);

      state.failReads = false;
      await panel.getByRole('button', { name: 'Повторить' }).click();
      await expect(panel.getByText('9 оценок', { exact: false })).toBeVisible({ timeout: 15_000 });
      await expect(panel.getByText('Показано 5 из 12', { exact: false })).toBeVisible({ timeout: 15_000 });
    });

    test('target navigation resets dirty community editors before closures can bind to the next target', async ({ page }, testInfo) => {
      useAllowedProject(test, testInfo, projects);
      const state = { failReads: false, ratingWriteMode: 'success' };
      await installCommunityIntegrityBackend(page, state);
      await page.goto(`${BASE_URL}/essays/sergei-yesenin-1921-1925`, { waitUntil: 'networkidle' });
      const firstPanel = await visibleCommunityPanel(page, expect);
      await firstPanel.getByPlaceholder('Ваше имя или псевдоним — необязательно').fill('Черновик A');
      await firstPanel.getByPlaceholder('Что особенно точно, спорно, сильно или слабо?').fill('Этот черновик относится только к части II.');
      await firstPanel.getByRole('radiogroup').first().getByRole('radio', { name: '5 из 5' }).click();

      const previous = page.locator(`a[href="/essays/${PART_ONE_SLUG}"]`).last();
      await expect(previous).toBeVisible();
      await previous.click();
      await expect(page).toHaveURL(new RegExp(`/essays/${PART_ONE_SLUG}$`));

      const secondPanel = page.locator(`[data-community-target="article:${PART_ONE_ID}"]`);
      await expect(secondPanel).toBeVisible({ timeout: 15_000 });
      await expect(secondPanel.getByPlaceholder('Ваше имя или псевдоним — необязательно')).toHaveValue('');
      await expect(secondPanel.getByPlaceholder('Что особенно точно, спорно, сильно или слабо?')).toHaveValue('');
      await expect(secondPanel.locator('[role="radio"][aria-checked="true"]')).toHaveCount(0);
    });

    test('loaded-row ordering, text fidelity and live status semantics stay explicit', async ({ page }, testInfo) => {
      useAllowedProject(test, testInfo, projects);
      const state = { failReads: false, ratingWriteMode: 'success' };
      const { reads } = await installCommunityIntegrityBackend(page, state);
      await page.goto(`${BASE_URL}/essays/sergei-yesenin-1921-1925`, { waitUntil: 'networkidle' });
      const panel = await visibleCommunityPanel(page, expect);

      await expect(panel.getByText(/Сортировка и фильтр применяются к уже загруженным комментариям/)).toBeVisible();
      const usefulSort = panel.getByRole('button', { name: 'Полезные' });
      const newestSort = panel.getByRole('button', { name: 'Новые' });
      await expect(usefulSort).toHaveAttribute('aria-pressed', 'true');
      await expect(newestSort).toHaveAttribute('aria-pressed', 'false');
      await newestSort.click();
      await expect(newestSort).toHaveAttribute('aria-pressed', 'true');
      await usefulSort.click();

      const multilineCard = panel.locator('[data-community-comment-id="comment-integrity-00000001"]');
      await expect(multilineCard).toContainText('Строка первая');
      const multilineText = await multilineCard.locator('p').innerText();
      expect(multilineText).toContain('Строка первая\nСтрока вторая 😀 <script>globalThis.__communityXss=1</script>');
      expect(await page.evaluate(() => globalThis.__communityXss)).toBeUndefined();

      const unicodeCard = panel.locator('[data-community-comment-id="comment-integrity-00000002"]');
      const collapsed = await unicodeCard.locator('p').innerText();
      expect(collapsed.endsWith('😀…')).toBe(true);
      expect(collapsed).not.toContain('�');
      await unicodeCard.getByRole('button', { name: 'Читать полностью' }).click();
      await expect(unicodeCard.locator('p')).toContainText(`😀${'х'.repeat(20)}`);
      await expect(unicodeCard.getByRole('button', { name: 'Свернуть' })).toHaveAttribute('aria-expanded', 'true');

      const firstCard = panel.locator('[data-community-comment-id]:visible').first();
      await firstCard.getByRole('button', { name: /Отметить комментарий полезным/ }).click();
      const mutationStatus = panel.locator('[role="status"]').filter({ hasText: 'Спасибо, мнение учтено' });
      await expect(mutationStatus).toBeVisible();
      await expect(mutationStatus).toHaveAttribute('aria-live', 'polite');
      await expect(mutationStatus).toHaveAttribute('aria-atomic', 'true');

      const historyFilter = panel.getByRole('button', { name: /История ·/ });
      await historyFilter.click();
      await expect(historyFilter).toHaveAttribute('aria-pressed', 'true');
      const loadGlobal = panel.getByRole('button', { name: 'Загрузить ещё из общей ленты' });
      await expect(loadGlobal).toBeVisible();
      const before = reads.filter((entry) => entry.url.pathname === '/v1/comments').length;
      await loadGlobal.click();
      await expect.poll(() => reads.filter((entry) => entry.url.pathname === '/v1/comments').length).toBe(before + 1);
      await expect(panel.getByRole('button', { name: 'Показать ещё 1' })).toBeVisible();
    });

    test('cross-tab durable ratings merge without lost work and settled work cannot resurrect', async ({ browser }, testInfo) => {
      test.skip(testInfo.project.name !== 'chromium-core', 'cross-tab settlement contour is certified once on desktop Chromium');
      const context = await browser.newContext();
      const pageA = await context.newPage();
      const pageB = await context.newPage();
      const state = { failReads: false, ratingWriteMode: 'rate-limit' };
      await installCommunityIntegrityBackend(pageA, state);
      await installCommunityIntegrityBackend(pageB, state);

      await Promise.all([
        pageA.goto(`${BASE_URL}/essays/sergei-yesenin-1921-1925`, { waitUntil: 'networkidle' }),
        pageB.goto(`${BASE_URL}/essays/${PART_ONE_SLUG}`, { waitUntil: 'networkidle' }),
      ]);
      const panelA = await visibleCommunityPanel(pageA, expect);
      const panelB = await visibleCommunityPanel(pageB, expect);

      await fillArticleRating(panelA);
      await expect.poll(async () => (await pendingOutbox(pageA)).length).toBe(1);
      await fillArticleRating(panelB);
      await expect.poll(async () => (await pendingOutbox(pageB)).length).toBe(2);
      await expect.poll(async () => (await pendingOutbox(pageA)).length).toBe(2);

      const targetsBeforeAck = (await pendingOutbox(pageA)).map((operation) => operation.entry?.targetId).filter(Boolean).sort();
      expect(targetsBeforeAck).toEqual([ARTICLE_ID, PART_ONE_ID].sort());
      const staleSnapshot = await pageA.evaluate(() => localStorage.getItem('tlp-community-feedback:v3'));
      expect(staleSnapshot).toBeTruthy();

      state.ratingWriteMode = 'success';
      await pageA.evaluate(() => window.dispatchEvent(new Event('online')));
      await expect.poll(async () => (await pendingOutbox(pageA)).length, { timeout: 15_000 }).toBe(0);
      await expect.poll(async () => (await pendingOutbox(pageB)).length, { timeout: 15_000 }).toBe(0);

      const settledBeforeStale = await pageA.evaluate(() => {
        const raw = localStorage.getItem('tlp-community-feedback:v3');
        const persisted = raw ? JSON.parse(raw) : {};
        return Object.keys(persisted.settledOperations ?? {}).length;
      });
      expect(settledBeforeStale).toBeGreaterThanOrEqual(2);

      await pageA.evaluate((raw) => localStorage.setItem('tlp-community-feedback:v3', raw), staleSnapshot);
      await expect.poll(async () => (await pendingOutbox(pageB)).length, { timeout: 10_000 }).toBe(0);
      await expect.poll(async () => (await pendingOutbox(pageA)).length, { timeout: 10_000 }).toBe(0);
      const settledAfterStale = await pageB.evaluate(() => {
        const raw = localStorage.getItem('tlp-community-feedback:v3');
        const persisted = raw ? JSON.parse(raw) : {};
        return Object.keys(persisted.settledOperations ?? {}).length;
      });
      expect(settledAfterStale).toBeGreaterThanOrEqual(2);
      await context.close();
    });
  });
}
