const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const COMMUNITY_ORIGIN = 'https://community.test.invalid';
const ARTICLE_ID = 'essay-yesenin-biography-part-two';
const SAME_TIME = '2026-08-05T10:00:00.000Z';

const comments = Array.from({ length: 12 }, (_, index) => ({
  id: `comment-${String(99 - index).padStart(8, '0')}`,
  target_type: 'article',
  target_id: ARTICLE_ID,
  author: `Читатель ${index + 1}`,
  text: `Содержательное адресное наблюдение номер ${index + 1}.`,
  kind: index % 2 ? 'history' : 'literary',
  helpful: index,
  created_at: index < 3 ? SAME_TIME : new Date(Date.parse(SAME_TIME) - index * 1000).toISOString(),
}));

function corsHeaders(extra = {}) {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'apikey, authorization, content-type, prefer, range',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'content-type': 'application/json',
    ...extra,
  };
}

async function installCommunityBackend(page) {
  await page.addInitScript(() => {
    globalThis.__TLP_COMMUNITY_TEST_CONFIG__ = {
      url: 'https://community.test.invalid',
      key: 'test-anon-key',
    };
  });
  const reads = [];
  await page.route(`${COMMUNITY_ORIGIN}/**`, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders() });
      return;
    }

    const url = new URL(request.url());
    if (request.method() === 'GET') reads.push(url);

    if (url.pathname.endsWith('/tlp_feedback_summary_public')) {
      if (url.searchParams.get('target_type') === 'eq.poet') {
        const rawIds = url.searchParams.get('target_id') ?? '';
        const ids = [...rawIds.matchAll(/"([a-z0-9-]+)"/g)].map((match) => match[1]);
        await route.fulfill({
          status: 200,
          headers: corsHeaders(),
          body: JSON.stringify(ids.map((id, index) => ({
            target_type: 'poet',
            target_id: id,
            rating_count: index + 2,
            comment_count: index % 3,
            overall: 4.1 + (index % 4) * 0.1,
            dimensions: { language: 4.4, depth: 4.2, legacy: 4.1, truth: 4.0 },
            distribution: { 4: index + 1, 5: 1 },
            deviation: 0.3,
          }))),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        headers: corsHeaders(),
        body: JSON.stringify([{
          target_type: 'article',
          target_id: ARTICLE_ID,
          rating_count: 9,
          comment_count: 12,
          overall: 4.4,
          dimensions: { clarity: 4.5, evidence: 4.4, depth: 4.3, ethics: 4.4 },
          distribution: { 4: 5, 5: 4 },
          deviation: 0.35,
        }]),
      });
      return;
    }

    if (url.pathname.endsWith('/tlp_comments_public')) {
      const hasCursor = url.searchParams.has('or');
      await route.fulfill({
        status: 200,
        headers: corsHeaders(),
        body: JSON.stringify(hasCursor ? comments.slice(10) : comments.slice(0, 11)),
      });
      return;
    }

    await route.fulfill({ status: 404, headers: corsHeaders(), body: '[]' });
  });
  return reads;
}

function readUrls(reads) {
  return reads.map((url) => decodeURIComponent(url.toString()));
}

export function registerCommunityRequestTopologyTests({ test, expect }) {
  test.describe('community request topology', () => {
  test('generic startup performs zero community reads', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-core', 'request topology runs once on Chromium core');
    const reads = await installCommunityBackend(page);
    const response = await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    expect(response?.status()).toBeLessThan(400);
    await page.waitForTimeout(500);
    expect(reads).toHaveLength(0);
  });

  test('article loads one target summary and cursor-paginated comments only', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-core', 'request topology runs once on Chromium core');
    const reads = await installCommunityBackend(page);
    const response = await page.goto(`${BASE_URL}/essays/sergei-yesenin-1921-1925`, { waitUntil: 'networkidle' });
    expect(response?.status()).toBeLessThan(400);

    await expect(page.getByText('9 оценок', { exact: false }).filter({ visible: true }).first()).toBeVisible({ timeout: 15_000 });
    const communityPanel = page
      .getByText('Комментарии', { exact: true })
      .filter({ visible: true })
      .first()
      .locator('xpath=ancestor::section[1]');
    await expect(communityPanel.getByText('Показано 5 из 12', { exact: false })).toBeVisible();

    let urls = readUrls(reads);
    const summary = urls.filter((url) => url.includes('/tlp_feedback_summary_public'));
    const commentReads = urls.filter((url) => url.includes('/tlp_comments_public'));
    expect(summary).toHaveLength(1);
    expect(commentReads).toHaveLength(1);
    expect(summary[0]).toContain('target_type=eq.article');
    expect(summary[0]).toContain(`target_id=eq.${ARTICLE_ID}`);
    expect(commentReads[0]).toContain('target_type=eq.article');
    expect(commentReads[0]).toContain(`target_id=eq.${ARTICLE_ID}`);
    expect(commentReads[0]).toContain('order=created_at.desc,id.desc');
    expect(commentReads[0]).toContain('limit=11');
    expect(urls.some((url) => url.includes('/tlp_ratings_public'))).toBe(false);

    await communityPanel.getByRole('button', { name: /Показать ещё/ }).click();
    const loadMoreComments = communityPanel.getByRole('button', { name: 'Загрузить ещё комментарии' });
    await expect(loadMoreComments).toBeVisible();
    await loadMoreComments.click();
    await expect(communityPanel.getByText('Показано 10 из 12', { exact: false })).toBeVisible({ timeout: 10_000 });

    urls = readUrls(reads);
    const paged = urls.filter((url) => url.includes('/tlp_comments_public'));
    expect(paged).toHaveLength(2);
    expect(paged[1]).toContain('or=(created_at.lt.');
    expect(paged[1]).toContain('created_at.eq.');
    expect(paged[1]).toContain('id.lt.');
    await communityPanel.getByRole('button', { name: /Показать ещё 2/ }).click();
    await expect(communityPanel.getByText('Показано 12 из 12', { exact: false })).toBeVisible();
    expect(new Set(await communityPanel.locator('[data-community-comment-id]:visible').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-community-comment-id')))).size).toBe(12);
  });

  test('ratings hub reads aggregate poet rows and never comment bodies', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-core', 'request topology runs once on Chromium core');
    const reads = await installCommunityBackend(page);
    const response = await page.goto(`${BASE_URL}/ratings`, { waitUntil: 'networkidle' });
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByText('Поэты в оценке читателей')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Общая база синхронизирована для всех посетителей')).toBeVisible({ timeout: 15_000 });

    const urls = readUrls(reads);
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain('/tlp_feedback_summary_public');
    expect(urls[0]).toContain('target_type=eq.poet');
    expect(urls[0]).toContain('target_id=in.(');
    expect(urls[0]).not.toContain('/tlp_comments_public');
    expect(urls[0]).not.toContain('/tlp_ratings_public');
  });
  });
}
