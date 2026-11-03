import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const sitemap = fs.readFileSync('public/sitemap.xml', 'utf8');
const contract = JSON.parse(fs.readFileSync('src/routes/route-contract.json', 'utf8'));
const canonicalRoutes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((match) => new URL(match[1]).pathname);
const utilityRoutes = contract.routes.filter((route) => route.audit === 'utility')
  .map((route) => route.path);
const routes = [...new Set([...canonicalRoutes, ...utilityRoutes])];

test('every published and utility route has a continuous visible heading outline', async ({ page }) => {
  const failures = [];
  for (const route of routes) {
    const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
    expect(response?.status(), route).toBeLessThan(400);
    await expect(page.locator('main#main-content h1')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);

    // Check painted DOM headings rather than string-scanning JSX. Semantic
    // heading levels must be continuous on every route, even with shared cards.
    const violations = await page.evaluate(() => {
      const visible = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"][aria-level]')]
        .filter((node) => {
          const style = getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        });
      let precedingLevel = 0;
      const jumps = [];
      for (const heading of visible) {
        const level = Number(heading.getAttribute('aria-level') || heading.tagName.slice(1));
        if (level > precedingLevel + 1) {
          jumps.push({ previous: precedingLevel, actual: level, text: heading.textContent?.trim().slice(0, 100) });
        }
        precedingLevel = level;
      }
      return jumps;
    });
    if (violations.length) failures.push({ route, violations });
  }
  expect(routes.length, 'canonical sitemap + utility route inventory').toBeGreaterThanOrEqual(33);
  expect(failures, 'the complete visible heading hierarchy must not skip levels').toEqual([]);
});
