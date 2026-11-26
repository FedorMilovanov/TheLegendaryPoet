import { test, expect } from '@playwright/test';
import { contrastMeasurements } from './contrast-helpers.mjs';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const examples = [
  ['mikhail-lermontov', 'three-photo'],
  ['afanasy-fet', 'two-photo'],
  ['nikolay-gumilev', 'one-photo'],
];

for (const theme of ['dark', 'light']) {
  for (const [id, variant] of examples) {
    test('memory places responsive evidence ' + variant + ' ' + theme, async ({ page }, info) => {
      test.setTimeout(90_000);
      await page.addInitScript((value) => localStorage.setItem('tlp-theme-mode', value), theme);
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: width >= 768 ? 1000 : 844 });
        await page.goto(base + '/poets/' + id, { waitUntil: 'domcontentloaded' });
        const root = page.locator('#memory-places');
        const exhibit = root.locator('article');
        await expect(exhibit).toBeVisible();
        await expect.poll(() => page.locator('html').getAttribute('data-theme')).toBe(theme);
        await page.locator('a[href="#memory-places"]').click();
        await expect.poll(() => new URL(page.url()).hash).toBe('#memory-places');
        await expect(root.locator('h2')).toHaveText('Места памяти');
        const heroOrder = await exhibit.evaluate(node => {
          const heading = node.querySelector('.memory-heading').getBoundingClientRect();
          const photo = node.querySelector('.memory-photo').getBoundingClientRect();
          const lead = node.querySelector('.memory-lead').getBoundingClientRect();
          return heading.bottom <= photo.top + 1 && photo.bottom <= lead.top + 1;
        });
        expect(heroOrder).toBe(true);
        // Keep the editorial reading order the same in DOM and narrow viewports:
        // history, supporting image, then the separate detail with its explanation.
        const narrative = await exhibit.evaluate(node => {
          const story = node.querySelector('.memory-story');
          const timeline = story.querySelector('.memory-timeline');
          const media = story.querySelector('.memory-story-media');
          const detail = node.querySelector('.memory-detail');
          return {
            historyFirst: !media || Boolean(timeline.compareDocumentPosition(media) & Node.DOCUMENT_POSITION_FOLLOWING),
            detailSeparate: !detail || Boolean(story.compareDocumentPosition(detail) & Node.DOCUMENT_POSITION_FOLLOWING),
            detailHasCaption: !detail || Boolean(detail.querySelector('.memory-detail-copy .memory-note')),
          };
        });
        expect(narrative).toEqual({ historyFirst: true, detailSeparate: true, detailHasCaption: true });
        const images = exhibit.locator('img');
        for (const img of await images.all()) {
          await img.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
          await expect.poll(() => img.evaluate(node => node.complete && node.naturalWidth > 0)).toBe(true);
        }
        const layout = await exhibit.evaluate(node => {
          const bounds = node.getBoundingClientRect();
          const cs = getComputedStyle(node);
          const inner = node.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
          const story = node.querySelector('.memory-story');
          const facts = node.querySelector('.memory-facts');
          const count = el => getComputedStyle(el).gridTemplateColumns.split(/\s+/).length;
          return {
            inner,
            hasPhoto: story.dataset.hasPhoto === 'true',
            story: count(story),
            facts: count(facts),
            overflow: [...node.querySelectorAll('figure, img, ol, dl, details, aside, figcaption')].some(el => {
              const r = el.getBoundingClientRect();
              return r.left < bounds.left - 1 || r.right > bounds.right + 1 || el.scrollWidth > el.clientWidth + 2;
            }),
            viewportOverflow: bounds.left < -1 || bounds.right > innerWidth + 1,
          };
        });
        expect(layout.overflow, JSON.stringify(layout)).toBe(false);
        expect(layout.viewportOverflow, JSON.stringify(layout)).toBe(false);
        expect(layout.story).toBe(layout.hasPhoto && layout.inner >= 624 ? 2 : 1);
        expect(layout.facts).toBe(layout.inner >= 448 ? 3 : 1);
        const summary = exhibit.locator('summary');
        await summary.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await summary.click();
        await expect(exhibit.locator('details')).toHaveAttribute('open', '');
        const readings = await contrastMeasurements(exhibit.locator('p,h3,h4,dt,dd,blockquote span,figcaption a,summary,details a'), true);
        for (const {text,ratio} of readings) expect(ratio, text).toBeGreaterThanOrEqual(4.5);
        await exhibit.locator('h3').evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        if (process.env.QA_CAPTURE_MEMORY === '1') await page.screenshot({ path: info.outputPath(width + '-hero.png'), animations: 'disabled' });
        await exhibit.locator('.memory-story').evaluate(node => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        if (process.env.QA_CAPTURE_MEMORY === '1') await page.screenshot({ path: info.outputPath(width + '-story.png'), animations: 'disabled' });
      }
    });
  }
}
