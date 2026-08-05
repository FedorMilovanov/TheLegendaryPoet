const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const COMMUNITY_ORIGIN = 'https://community.test.invalid';

function json(route, value, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(value),
  });
}

function queryValue(url, name) {
  const raw = url.searchParams.get(name) ?? '';
  return raw.startsWith('eq.') ? raw.slice(3) : raw;
}

async function installBackend(page, requests) {
  await page.addInitScript(({ url, key }) => {
    window.__TLP_COMMUNITY_TEST_CONFIG__ = { url, key };
  }, { url: COMMUNITY_ORIGIN, key: 'hardening-test-key' });

  await page.route(`${COMMUNITY_ORIGIN}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    requests.push({ method: request.method(), url: url.toString() });

    if (request.method() !== 'GET') return json(route, null, 204);

    if (url.pathname.endsWith('/tlp_feedback_summary_public')) {
      const targetType = queryValue(url, 'target_type');
      const targetId = queryValue(url, 'target_id');
      return json(route, [{
        target_type: targetType,
        target_id: targetId,
        rating_count: 3,
        comment_count: 1,
        overall: 4.5,
        deviation: 0.2,
        dimensions: { language: 4.5 },
        distribution: { 4: 1, 5: 2 },
      }]);
    }

    if (url.pathname.endsWith('/tlp_comments_public')) return json(route, []);
    if (url.pathname.endsWith('/tlp_ratings_public')) return json(route, []);
    return json(route, []);
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
      const initialPoemReads = requests.filter(({ method, url }) => (
        method === 'GET'
        && new URL(url).searchParams.get('target_type') === 'eq.poem'
      ));
      expect(initialPoemReads, 'poem panels and quick navigation must stay remote-passive before activation').toEqual([]);

      const first = activators.first();
      const activationTarget = await first.getAttribute('data-community-activate-target');
      expect(activationTarget).toMatch(/^poem:[a-z0-9][a-z0-9-]+$/i);
      const targetId = activationTarget.split(':')[1];

      await first.click();
      await expect.poll(() => requests.filter(({ method, url }) => {
        if (method !== 'GET') return false;
        const parsed = new URL(url);
        return parsed.searchParams.get('target_type') === 'eq.poem'
          && parsed.searchParams.get('target_id') === `eq.${targetId}`;
      }).length).toBe(2);

      const poemReads = requests.filter(({ method, url }) => (
        method === 'GET'
        && new URL(url).searchParams.get('target_type') === 'eq.poem'
      ));
      expect(poemReads).toHaveLength(2);
      expect(poemReads.every(({ url }) => new URL(url).searchParams.get('target_id') === `eq.${targetId}`)).toBe(true);
      expect(poemReads.filter(({ url }) => new URL(url).pathname.endsWith('/tlp_feedback_summary_public'))).toHaveLength(1);
      expect(poemReads.filter(({ url }) => new URL(url).pathname.endsWith('/tlp_comments_public'))).toHaveLength(1);
    });
  });
}
