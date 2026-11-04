import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const sitemap = readFileSync('public/sitemap.xml', 'utf8');
const contract = JSON.parse(readFileSync('src/routes/route-contract.json', 'utf8'));
const canonical = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((match) => new URL(match[1]).pathname);
const utility = contract.routes.filter((route) => route.audit === 'utility')
  .map((route) => route.path);
const routes = [...new Set([...canonical, ...utility])];

// Explicit text-owner identity is stable across the repair, unlike CSS
// `truncate` or `line-clamp` markers which the fix deliberately removes.
const OWNER_SOURCES = {
  "essay-title": "src/components/essay/EssayCard.tsx",
  "essay-subtitle": "src/components/essay/EssayCard.tsx",
  "essay-excerpt": "src/components/essay/EssayCard.tsx",
  "announcement-title": "src/components/music/TrackAnnouncementCard.tsx",
  "announcement-description": "src/components/music/TrackAnnouncementCard.tsx",
  "release-title": "src/components/music/TrackReleaseCard.tsx",
  "release-description": "src/components/music/TrackReleaseCard.tsx",
  "kindred-name": "src/components/poet-detail/KindredSpirits.tsx",
  "kindred-note": "src/components/poet-detail/KindredSpirits.tsx",
  "breadcrumb-current": "src/components/seo/Breadcrumbs.tsx",
  "rating-desktop-name": "src/pages/RatingsPage.tsx",
  "rating-desktop-tags": "src/pages/RatingsPage.tsx",
  "rating-mobile-name": "src/pages/RatingsPage.tsx",
  "rating-mobile-tags": "src/pages/RatingsPage.tsx"
};
const LIVE_OWNERS = new Set([
  'essay-title', 'essay-excerpt', 'kindred-name',
  'breadcrumb-current', 'rating-desktop-name', 'rating-desktop-tags',
  'rating-mobile-name', 'rating-mobile-tags',
]);

test('every corrected text owner stays registered in the permanent census', () => {
  for (const [owner, file] of Object.entries(OWNER_SOURCES)) {
    const content = readFileSync(file, 'utf8');
    expect(content.includes(`data-text-spacing-owner="${owner}"`),
      `${owner} disappeared from ${file}; the visual census may no longer test this repair`).toBe(true);
  }
});

const spacingOverride = `
  *, *::before, *::after {
    line-height: 1.5 !important;
    letter-spacing: 0.12em !important;
    word-spacing: 0.16em !important;
  }
  p { margin-bottom: 2em !important; }
`;

const capture = () => {
  const all = [...document.body.querySelectorAll('*')];
  const elements = {};
  for (let index = 0; index < all.length; index += 1) {
    const node = all[index];
    const text = node.textContent?.trim();
    if (!text || text.length < 3) continue;
    const style = getComputedStyle(node);
    const className = node.className?.toString?.() || '';
    const owner = node.getAttribute('data-text-spacing-owner');
    if (!(owner || style.textOverflow === 'ellipsis'
      || Number.parseInt(style.webkitLineClamp, 10) > 0
      || /(?:^|\s)(?:truncate|line-clamp-[\w-]+)(?:\s|$)/.test(className))) continue;
    const bounds = node.getBoundingClientRect();
    if (bounds.width < 2 || bounds.height < 2 || style.visibility === 'hidden'
      || style.display === 'none' || Number(style.opacity) < 0.05
      || node.closest('[aria-hidden="true"]')) continue;
    elements[index] = {
      tag: node.tagName,
      owner,
      className: className.slice(0, 130),
      text: text.slice(0, 90),
      clipped: node.scrollWidth > node.clientWidth + 1.3
        || node.scrollHeight > node.clientHeight + 1.3,
    };
  }
  return {
    elements,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
};

test('WCAG text spacing retains visible text on all published routes at desktop/mobile widths', async ({ page }) => {
  test.setTimeout(270_000);
  const failures = [];
  let loads = 0;
  let inspected = 0;
  const auditedOwners = new Set();
  const ownerClips = [];
  for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const route of routes) {
      const response = await page.goto(BASE_URL + route, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), route).toBeLessThan(400);
      await expect(page.locator('main#main-content h1')).toBeAttached();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(170);
      const before = await page.evaluate(capture);
      await page.addStyleTag({ content: spacingOverride });
      await page.waitForTimeout(120);
      const after = await page.evaluate(capture);
      const newlyClipped = Object.entries(after.elements)
        .filter(([key, node]) => node.clipped && !before.elements[key]?.clipped)
        .map(([key, node]) => ({ key, ...node }));
      const newOverflow = after.overflow > 1 && before.overflow <= 1;
      if (newlyClipped.length || newOverflow) failures.push({
        route, viewport: viewport.width,
        newlyClipped, beforeOverflow: before.overflow, afterOverflow: after.overflow,
      });
      for (const owner of Object.values(after.elements)) {
        if (!owner.owner) continue;
        auditedOwners.add(owner.owner);
        if (owner.clipped) {
          ownerClips.push({ route, viewport: viewport.width, owner: owner.owner,
            text: owner.text, className: owner.className });
        }
      }
      inspected += Object.keys(after.elements).length;
      loads += 1;
    }
  }
  expect(routes.length, 'sitemap and utility routes must be audited').toBeGreaterThanOrEqual(33);
  expect(loads).toBe(routes.length * 2);
  expect(inspected, 'live text-owner and legacy clip census must not be empty').toBeGreaterThan(10);
  const missing = [...LIVE_OWNERS].filter((owner) => !auditedOwners.has(owner));
  expect(missing, 'previously repaired owners must actually be visible on canonical routes').toEqual([]);
  expect(ownerClips, 'no registered repaired text owner may still be clipped under WCAG overrides').toEqual([]);
  expect(failures, 'no newly clipped visible text or new horizontal overflow under WCAG 1.4.12 overrides').toEqual([]);
});
