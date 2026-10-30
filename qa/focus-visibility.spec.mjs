import { test, expect } from '@playwright/test';
import { registerMediaContract } from './media-contract.mjs';

// WCAG 2.4.7, measured the way a reader meets it: real keyboard traversal, not
// a programmatic focus() call. Chromium only applies :focus-visible after key
// input, so an element focused by script looks identical unfocused — a probe
// built that way reports 138 false failures on this site and proves nothing.

registerMediaContract(test);

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

const ROUTES = [
  '/',
  '/ratings',
  '/articles',
  '/essays/brik-case',
  '/poets/sergei-yesenin',
  '/music',
  '/archive',
];

const CELLS = [
  { key: 'desktop-light', viewport: { width: 1440, height: 1000 }, theme: 'light' },
  { key: 'desktop-dark', viewport: { width: 1440, height: 1000 }, theme: 'dark' },
];

/** Elements a reader can reach with Tab, in the order Tab reaches them. */
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Long enough to leave the longest route behind: the Brik essay carries 127
// focusable controls, so a 70-step walk would have quietly covered half a page
// and still been able to report "clean".
const MAX_TABS = 170;

test.describe('every keyboard-focusable control shows the reader where focus is', () => {
  for (const cell of CELLS) {
    test.describe(cell.key, () => {
      test.use({
        viewport: cell.viewport,
        colorScheme: cell.theme === 'dark' ? 'dark' : 'light',
        contextOptions: { reducedMotion: 'reduce' },
        locale: 'ru-RU',
        timezoneId: 'Europe/Paris',
      });

      test('a rating group is one Tab stop and arrows move inside it', async ({ page }) => {
        await page.goto(`${BASE_URL}/poets/sergei-yesenin`, { waitUntil: 'domcontentloaded' });
        await page.locator('#main-content, main, body').first().waitFor({ state: 'visible', timeout: 20_000 });

        const group = page.locator('[role="radiogroup"]').filter({ has: page.locator('.rating-star-button') }).first();
        await expect(group).toBeVisible();
        await group.scrollIntoViewIfNeeded();

        // Roving tabindex: the group costs the reader one Tab stop, not five.
        const stars = group.locator('.rating-star-button');
        await expect(stars).toHaveCount(5);
        const stops = await group.evaluate((element) => [...element.querySelectorAll('.rating-star-button')]
          .filter((star) => star.tabIndex >= 0).length);
        expect(stops, 'a rating group exposes exactly one Tab stop').toBe(1);

        const readState = () => group.evaluate((element) => {
          const starsInGroup = [...element.querySelectorAll('.rating-star-button')];
          const focused = starsInGroup.indexOf(document.activeElement);
          return {
            focused,
            focusedChecked: focused >= 0 ? starsInGroup[focused].getAttribute('aria-checked') === 'true' : false,
            stops: starsInGroup.filter((star) => star.tabIndex >= 0).length,
            inside: element.contains(document.activeElement),
          };
        });

        await stars.first().focus();
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(200);
        const first = await readState();
        expect(first.focused, 'ArrowRight moves focus one star to the right').toBe(1);
        expect(first.focusedChecked, 'an arrow key selects the star it lands on').toBe(true);
        expect(first.inside, 'focus stays in the group after an arrow key').toBe(true);
        expect(first.stops, 'the group is still one Tab stop after moving').toBe(1);

        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(200);
        const second = await readState();
        expect(second.focused, 'arrows keep moving through the group').toBe(2);
        expect(second.stops, 'roving tabindex is maintained').toBe(1);
      });

      for (const route of ROUTES) {
        test(`${route} leaves no focused control unmarked`, async ({ page }, testInfo) => {
          await page.addInitScript((value) => {
            try { window.localStorage.setItem('tlp-theme-mode', value); } catch { /* storage blocked */ }
          }, cell.theme);

          await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
          await page.locator('#main-content, main, body').first().waitFor({ state: 'visible', timeout: 20_000 });
          await page.waitForTimeout(600);

          // Each control carries its own unfocused look, so the comparison is
          // per element and survives hover treatments and reveal animations.
          // One snapshot, so the count and the walk cannot drift apart on a page
          // that re-renders. Rating stars are a roving-tabindex radiogroup: only
          // the active star is a Tab stop and arrows move inside the group, so
          // the negative-tabindex siblings are not missing stops, they are the
          // pattern working.
          const { expected } = await page.evaluate((selector) => {
            const baseline = new Map();
            let reachable = 0;
            [...document.querySelectorAll(selector)].forEach((element, index) => {
              const rectangle = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              baseline.set(index, [
                style.outlineStyle,
                style.outlineWidth,
                style.outlineColor,
                style.boxShadow,
                style.borderTopColor,
                style.backgroundColor,
                style.color,
              ].join('|'));
              element.dataset.focusProbe = String(index);
              if (element.tabIndex >= 0 && rectangle.width > 1 && rectangle.height > 1) reachable += 1;
            });
            window.__focusBaseline = [...baseline.entries()];
            return { expected: reachable };
          }, FOCUSABLE);

          const visited = [];
          let previousIndex = null;

          for (let step = 0; step < MAX_TABS; step += 1) {
            await page.keyboard.press('Tab');
            // eslint-disable-next-line no-await-in-loop
            const row = await page.evaluate(() => {
              const element = document.activeElement;
              if (!element || element === document.body) return null;
              const style = getComputedStyle(element);
              const rectangle = element.getBoundingClientRect();
              const index = Number(element.dataset.focusProbe);
              const current = [
                style.outlineStyle,
                style.outlineWidth,
                style.outlineColor,
                style.boxShadow,
                style.borderTopColor,
                style.backgroundColor,
                style.color,
              ].join('|');
              const baseline = (window.__focusBaseline ?? []).find(([key]) => key === index)?.[1];
              return {
                index,
                tag: element.tagName.toLowerCase(),
                label: (element.getAttribute('aria-label') || element.textContent || '').trim().slice(0, 48),
                className: String(element.className).slice(0, 80),
                width: Math.round(rectangle.width),
                height: Math.round(rectangle.height),
                marked: baseline === undefined ? null : baseline !== current,
                outline: `${style.outlineStyle} ${style.outlineWidth}`,
                shadow: style.boxShadow === 'none' ? 'none' : 'present',
              };
            });

            if (!row) break;
            if (row.index === previousIndex) break; // focus cycled back
            previousIndex = row.index;
            visited.push(row);
          }

          // A traversal that stopped early is a coverage failure, not a pass:
          // the page's own focusable count is the yardstick, with 10% slack for
          // controls Tab legitimately groups or skips.
          const floor = Math.floor(expected * 0.9);
          expect(
            visited.length,
            `${route}: Tab reached ${visited.length} of ${expected} laid-out focusable controls`,
          ).toBeGreaterThanOrEqual(floor);

          const unmarked = visited.filter((row) => row.marked === false);
          expect(
            unmarked.map((row) => `<${row.tag}> "${row.label}" (${row.width}x${row.height}) cls="${row.className}" outline=${row.outline} shadow=${row.shadow}`),
            `${route}: focused controls with no visible focus indicator`,
          ).toEqual([]);

          await testInfo.attach('focus-traversal.json', {
            body: JSON.stringify({ route, cell: cell.key, expected, visited: visited.length, controls: visited }, null, 2),
            contentType: 'application/json',
          });
        });
      }
    });
  }
});
