const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const COMMUNITY_ORIGIN = 'https://community.test.invalid';
const ARTICLE_ID = 'essay-yesenin-biography-part-two';
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
  });
}
