import { test, expect } from '@playwright/test';

const API_PATH = '/community-api/rest/v1/';
const timestamp = '2026-08-05T12:00:00.000Z';

function commentRow(number) {
  return {
    id: `comment-100-${String(number).padStart(2, '0')}`,
    target_type: 'poet',
    target_id: 'alexander-pushkin',
    author: 'Читатель',
    text: `Комментарий для проверки курсора номер ${number}.`,
    kind: 'literary',
    helpful: number % 4,
    created_at: timestamp,
  };
}

async function installCommunityApi(page, requests) {
  await page.route(`**${API_PATH}**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const body = request.postData() ? JSON.parse(request.postData()) : null;
    requests.push({ url: request.url(), path: url.pathname, method: request.method(), body });

    if (url.pathname.endsWith('/tlp_community_targets_public')) {
      const isLeaderboard = url.searchParams.get('target_type') === 'eq.poet'
        && !url.searchParams.has('target_id');
      const rows = isLeaderboard
        ? [
            { target_type: 'poet', target_id: 'alexander-pushkin', rating_count: 12, comment_count: 21, overall: 4.6, dimensions: { language: 4.8, depth: 4.5, legacy: 4.7, truth: 4.4 }, distribution: { 1: 0, 2: 0, 3: 1, 4: 4, 5: 7 }, deviation: 0.42 },
            { target_type: 'poet', target_id: 'sergei-yesenin', rating_count: 8, comment_count: 9, overall: 4.4, dimensions: { language: 4.7, depth: 4.6, legacy: 4.2, truth: 4.1 }, distribution: { 1: 0, 2: 0, 3: 1, 4: 3, 5: 4 }, deviation: 0.58 },
          ]
        : [{ target_type: 'poet', target_id: 'alexander-pushkin', rating_count: 12, comment_count: 21, overall: 4.6, dimensions: { language: 4.8, depth: 4.5, legacy: 4.7, truth: 4.4 }, distribution: { 1: 0, 2: 0, 3: 1, 4: 4, 5: 7 }, deviation: 0.42 }];
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rows) });
      return;
    }

    if (url.pathname.endsWith('/rpc/tlp_fetch_comments_page')) {
      const beforeId = body?.p_before_id ?? null;
      const first = Array.from({ length: 11 }, (_, index) => commentRow(21 - index));
      const second = Array.from({ length: 11 }, (_, index) => commentRow(11 - index));
      const rows = beforeId ? second : first;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rows) });
      return;
    }

    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
}

test('generic startup performs zero community reads', async ({ page }) => {
  const requests = [];
  await installCommunityApi(page, requests);
  await page.goto('/');
  await expect(page.locator('main')).not.toHaveAttribute('aria-label', 'Загрузка страницы');
  await page.waitForTimeout(500);
  expect(requests).toEqual([]);
});

test('detail target shares one aggregate request and uses stable cursor comments', async ({ page }) => {
  const requests = [];
  await installCommunityApi(page, requests);
  await page.goto('/poets/alexander-pushkin');

  await expect(page.getByText('12 оценок', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('Комментарии · 21')).toBeVisible();

  const aggregateReads = requests.filter((item) => item.path.endsWith('/tlp_community_targets_public'));
  const commentReads = requests.filter((item) => item.path.endsWith('/rpc/tlp_fetch_comments_page'));
  expect(aggregateReads).toHaveLength(1);
  expect(commentReads).toHaveLength(1);
  expect(aggregateReads[0].url).toContain('target_type=eq.poet');
  expect(aggregateReads[0].url).toContain('target_id=eq.alexander-pushkin');
  expect(requests.some((item) => item.path.endsWith('/tlp_ratings_public'))).toBe(false);
  expect(requests.some((item) => item.path.endsWith('/tlp_comments_public'))).toBe(false);

  await page.getByRole('button', { name: /Показать ещё/ }).click();
  await page.getByRole('button', { name: /Показать ещё/ }).click();
  await expect.poll(() => requests.filter((item) => item.path.endsWith('/rpc/tlp_fetch_comments_page')).length).toBe(2);

  const nextPage = requests.filter((item) => item.path.endsWith('/rpc/tlp_fetch_comments_page'))[1];
  expect(nextPage.body.p_before_created_at).toBe(timestamp);
  expect(nextPage.body.p_before_id).toBe('comment-100-12');
  expect(nextPage.body.p_limit).toBe(11);
});

test('ratings route reads aggregates only and never downloads comment bodies', async ({ page }) => {
  const requests = [];
  await installCommunityApi(page, requests);
  await page.goto('/ratings');

  await expect(page.getByRole('heading', { name: /Поэты/ })).toBeVisible();
  await expect(page.getByText('20', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('30', { exact: true }).first()).toBeVisible();

  const aggregateReads = requests.filter((item) => item.path.endsWith('/tlp_community_targets_public'));
  expect(aggregateReads).toHaveLength(1);
  expect(aggregateReads[0].url).toContain('target_type=eq.poet');
  expect(aggregateReads[0].url).not.toContain('target_id=');
  expect(requests.some((item) => item.path.endsWith('/tlp_ratings_public'))).toBe(false);
  expect(requests.some((item) => item.path.endsWith('/tlp_comments_public'))).toBe(false);
  expect(requests.some((item) => item.path.includes('/rpc/tlp_fetch_comments_page'))).toBe(false);
});
