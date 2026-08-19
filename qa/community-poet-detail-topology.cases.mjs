const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const COMMUNITY_ORIGIN = 'https://community.test.invalid';

function json(route, value, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(value),
  });
}

function isPoemRead(record, targetId = null) {
  if (record.method !== 'GET') return false;
  const url = new URL(record.url);
  if (!['/v1/summary', '/v1/comments'].includes(url.pathname)) return false;
  if (url.searchParams.get('targetType') !== 'poem') return false;
  return targetId === null || url.searchParams.get('targetId') === targetId;
}

async function installBackend(page, requests) {
  await page.addInitScript(({ url }) => {
    window.__TLP_COMMUNITY_TEST_CONFIG__ = {
      url,
      humanProof: 'turnstile-poet-detail-proof',
    };
  }, { url: COMMUNITY_ORIGIN });

  await page.route(`${COMMUNITY_ORIGIN}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    requests.push({ method: request.method(), url: url.toString() });

    if (request.method() === 'OPTIONS') return json(route, null, 204);
    if (request.method() !== 'GET') return json(route, { ok: false }, 405);

    if (url.pathname === '/v1/summary') {
      const targetType = url.searchParams.get('targetType');
      const targetId = url.searchParams.get('targetId');
      if (!targetType || !targetId) return json(route, { ok: false }, 400);
      return json(route, {
        targetType,
        targetId,
        ratingCount: 3,
        commentCount: 1,
        overall: 4.5,
        deviation: 0.2,
        dimensions: targetType === 'poem'
          ? { beauty: 4.6, form: 4.4, impact: 4.5 }
          : { language: 4.6, depth: 4.4, legacy: 4.5, truth: 4.5 },
        distribution: { 4: 1, 5: 2 },
      });
    }

    if (url.pathname === '/v1/comments') {
      return json(route, { comments: [], nextCursor: null });
    }

    return json(route, { ok: false }, 404);
  });
}

export function registerCommunityPoetDetailTopologyTests({ test, expect }) {
  test.describe('community poet-detail request topology', () => {
    test('inactive poem panels make zero remote reads and one activation stays target-scoped', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'chromium-core', 'one deterministic browser proves request topology');

      const requests = [];
      await installBackend(page, requests);
      await page.goto(`${BASE_URL}/poets/sergei-yesenin`, { waitUntil: 'domcontentloaded' });
      await page.locator('#main-content').waitFor({ state: 'visible' });

      const activators = page.locator('[data-community-activate-target^="poem:"]');
      await expect(activators.first()).toBeVisible({ timeout: 15_000 });
      expect(await activators.count()).toBeGreaterThanOrEqual(3);

      await page.waitForTimeout(500);
      expect(
        requests.filter((record) => isPoemRead(record)),
        'poem panels and quick navigation must stay remote-passive before activation',
      ).toEqual([]);

      const first = activators.first();
      const activationTarget = await first.getAttribute('data-community-activate-target');
      expect(activationTarget).toMatch(/^poem:[a-z0-9][a-z0-9-]+$/i);
      const targetId = activationTarget.split(':')[1];

      await first.click();
      await expect.poll(() => requests.filter((record) => isPoemRead(record, targetId)).length).toBe(2);

      const poemReads = requests.filter((record) => isPoemRead(record));
      expect(poemReads).toHaveLength(2);
      expect(poemReads.every((record) => new URL(record.url).searchParams.get('targetId') === targetId)).toBe(true);
      expect(poemReads.filter((record) => new URL(record.url).pathname === '/v1/summary')).toHaveLength(1);
      expect(poemReads.filter((record) => new URL(record.url).pathname === '/v1/comments')).toHaveLength(1);
      expect(poemReads.some((record) => /tlp_feedback|tlp_comments_public|\/rest\/v1\//.test(record.url))).toBe(false);
    });
  });
}
