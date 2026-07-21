import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const base = 'http://127.0.0.1:4173';
const viewports = [
  { name: 'phone-360', width: 360, height: 800 },
  { name: 'phone-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 1000 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
];
const routes = [
  '/', '/hall', '/poets', '/articles', '/music', '/about', '/archive',
  '/poets/sergei-yesenin', '/poets/vladimir-mayakovsky',
  '/poets/alexander-pushkin', '/poets/mikhail-lermontov',
  '/poets/alexander-blok', '/poets/nikolay-gumilev',
  '/poets/anna-akhmatova', '/poets/boris-pasternak',
  '/poets/fyodor-tyutchev', '/poets/afanasy-fet',
  '/essays/yesenin-kutezhi', '/essays/mayakovsky-gromovoy', '/essays/brik-case',
  '/audit-not-found',
];
const screenshotRoutes = new Set([
  '/', '/hall', '/poets', '/articles', '/music', '/about', '/archive',
  '/poets/sergei-yesenin', '/poets/vladimir-mayakovsky',
  '/essays/yesenin-kutezhi', '/essays/mayakovsky-gromovoy', '/essays/brik-case',
]);
const longRoutes = new Set([
  '/poets/sergei-yesenin', '/poets/vladimir-mayakovsky',
  '/essays/yesenin-kutezhi', '/essays/mayakovsky-gromovoy', '/essays/brik-case',
  '/articles',
]);

await fs.mkdir('responsive-audit/screenshots', { recursive: true });
const report = { generatedAt: new Date().toISOString(), base, viewports: [], fatalErrors: [] };
const slug = route => route === '/' ? 'home' : route.replace(/^\//, '').replaceAll('/', '--').replace(/[^a-z0-9_-]/gi, '-');
const writeReport = async () => fs.writeFile('responsive-audit/audit-report.json', JSON.stringify(report, null, 2));

let browser;
try {
  browser = await chromium.launch({ headless: true });
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      colorScheme: 'dark',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const result = { ...viewport, pages: [], interactions: [] };

    for (const route of routes) {
      const item = {
        route,
        status: null,
        navigationError: null,
        consoleErrors: [],
        pageErrors: [],
        failedRequests: [],
        badResponses: [],
        screenshotErrors: [],
        metrics: null,
      };
      const onConsole = m => { if (m.type() === 'error') item.consoleErrors.push(m.text()); };
      const onPageError = e => item.pageErrors.push(String(e));
      const onFailed = r => item.failedRequests.push({ url: r.url(), error: r.failure()?.errorText || 'unknown' });
      const onResponse = r => { if (r.status() >= 400) item.badResponses.push({ url: r.url(), status: r.status() }); };
      page.on('console', onConsole);
      page.on('pageerror', onPageError);
      page.on('requestfailed', onFailed);
      page.on('response', onResponse);

      try {
        const response = await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        item.status = response?.status() ?? null;
        await page.waitForTimeout(1000);
        await page.addStyleTag({ content: '*,*::before,*::after{animation-duration:.001ms!important;animation-delay:0ms!important;transition-duration:.001ms!important;scroll-behavior:auto!important;caret-color:transparent!important}' });
        await page.waitForTimeout(100);

        item.metrics = await page.evaluate(() => {
          const visible = el => {
            const s = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) !== 0 && r.width > 0 && r.height > 0;
          };
          const label = el => {
            const cls = typeof el.className === 'string' ? el.className.split(/\s+/).slice(0, 5).join('.') : '';
            const text = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 90);
            return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''}${text ? ' :: ' + text : ''}`;
          };
          const ignored = el => {
            const cls = typeof el.className === 'string' ? el.className : '';
            return el.getAttribute('aria-hidden') === 'true' || /ambient|noise-bg|backdrop|page-wipe|custom-cursor|particle/i.test(cls);
          };
          const documentWidth = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0);
          const offscreen = [];
          for (const el of document.querySelectorAll('body *')) {
            if (ignored(el) || !visible(el)) continue;
            const r = el.getBoundingClientRect();
            if (r.right > innerWidth + 2 || r.left < -2) {
              offscreen.push({ element: label(el), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) });
              if (offscreen.length >= 40) break;
            }
          }
          const brokenImages = [...document.images].filter(img => visible(img) && img.complete && img.naturalWidth === 0).map(img => ({ src: img.currentSrc || img.src, alt: img.alt }));
          const clippedText = [...document.querySelectorAll('h1,h2,h3,p,blockquote,pre,code')]
            .filter(visible).filter(el => el.scrollWidth > el.clientWidth + 2).slice(0, 25)
            .map(el => ({ element: label(el), clientWidth: el.clientWidth, scrollWidth: el.scrollWidth }));
          const smallTargets = [...document.querySelectorAll('button,header a,nav a,[role="button"]')]
            .filter(visible).map(el => ({ el, r: el.getBoundingClientRect() }))
            .filter(({ r }) => r.width < 36 || r.height < 36).slice(0, 30)
            .map(({ el, r }) => ({ element: label(el), width: Math.round(r.width), height: Math.round(r.height) }));
          const header = document.querySelector('.site-header');
          const firstHeading = document.querySelector('h1');
          const dock = document.querySelector('.mobile-dock');
          const headerNav = document.querySelector('.header-nav');
          const footer = document.querySelector('footer');
          const headerRect = header && visible(header) ? header.getBoundingClientRect() : null;
          const headingRect = firstHeading && visible(firstHeading) ? firstHeading.getBoundingClientRect() : null;
          return {
            title: document.title,
            pathname: location.pathname,
            viewport: { width: innerWidth, height: innerHeight },
            documentWidth,
            documentHeight: Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0),
            horizontalOverflow: Math.max(0, documentWidth - innerWidth),
            offscreen,
            brokenImages,
            clippedText,
            smallTargets,
            bodyTextLength: (document.body?.innerText || '').trim().length,
            h1: [...document.querySelectorAll('h1')].filter(visible).map(el => (el.textContent || '').trim()),
            mobileDockVisible: !!dock && visible(dock),
            headerNavVisible: !!headerNav && visible(headerNav),
            mainPresent: !!document.querySelector('#main-content'),
            footerPresent: !!footer,
            headingBehindHeader: !!(headerRect && headingRect && headingRect.top < headerRect.bottom - 2),
          };
        });

        if (screenshotRoutes.has(route)) {
          const baseName = `responsive-audit/screenshots/${viewport.name}--${slug(route)}`;
          try { await page.screenshot({ path: `${baseName}--top.jpg`, type: 'jpeg', quality: 76 }); }
          catch (e) { item.screenshotErrors.push(`top: ${String(e)}`); }
          if (longRoutes.has(route)) {
            try {
              await page.evaluate(() => scrollTo(0, Math.max(0, (document.documentElement.scrollHeight - innerHeight) / 2)));
              await page.waitForTimeout(200);
              await page.screenshot({ path: `${baseName}--middle.jpg`, type: 'jpeg', quality: 76 });
            } catch (e) { item.screenshotErrors.push(`middle: ${String(e)}`); }
            try {
              await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
              await page.waitForTimeout(200);
              await page.screenshot({ path: `${baseName}--bottom.jpg`, type: 'jpeg', quality: 76 });
            } catch (e) { item.screenshotErrors.push(`bottom: ${String(e)}`); }
          }
        }
      } catch (e) {
        item.navigationError = String(e);
      } finally {
        page.off('console', onConsole);
        page.off('pageerror', onPageError);
        page.off('requestfailed', onFailed);
        page.off('response', onResponse);
      }
      result.pages.push(item);
    }

    try {
      await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(900);
      const buttons = page.getByRole('button', { name: /открыть поиск/i });
      let clicked = false;
      for (let i = 0; i < await buttons.count(); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) { await button.click(); clicked = true; break; }
      }
      await page.waitForTimeout(300);
      const dialogs = page.locator('[role="dialog"],[aria-modal="true"]');
      let dialogVisible = false;
      for (let i = 0; i < await dialogs.count(); i++) {
        if (await dialogs.nth(i).isVisible()) { dialogVisible = true; break; }
      }
      result.interactions.push({ name: 'open-search', passed: clicked && dialogVisible, clicked, dialogVisible });
      if (dialogVisible) {
        await page.screenshot({ path: `responsive-audit/screenshots/${viewport.name}--search-open.jpg`, type: 'jpeg', quality: 78 });
        await page.keyboard.press('Escape');
      }
    } catch (e) { result.interactions.push({ name: 'open-search', passed: false, error: String(e) }); }

    if (viewport.width < 768) {
      try {
        await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(800);
        await page.getByRole('navigation', { name: 'Мобильная навигация' }).getByRole('link', { name: 'Статьи' }).click();
        await page.waitForTimeout(600);
        result.interactions.push({ name: 'mobile-dock-navigation', passed: page.url().includes('/articles'), url: page.url() });
      } catch (e) { result.interactions.push({ name: 'mobile-dock-navigation', passed: false, error: String(e) }); }
    }

    report.viewports.push(result);
    await writeReport();
    await context.close();
  }
} catch (e) {
  report.fatalErrors.push(String(e));
} finally {
  if (browser) await browser.close().catch(() => {});
}

const flat = report.viewports.flatMap(v => v.pages.map(p => ({ viewport: v.name, ...p })));
report.summary = {
  pagesAudited: flat.length,
  navigationErrors: flat.filter(p => p.navigationError).map(p => ({ viewport: p.viewport, route: p.route, error: p.navigationError })),
  horizontalOverflowPages: flat.filter(p => (p.metrics?.horizontalOverflow || 0) > 2).map(p => ({ viewport: p.viewport, route: p.route, pixels: p.metrics.horizontalOverflow })),
  pagesWithOffscreenElements: flat.filter(p => (p.metrics?.offscreen?.length || 0) > 0).map(p => ({ viewport: p.viewport, route: p.route, offenders: p.metrics.offscreen.slice(0, 8) })),
  pagesWithBrokenImages: flat.filter(p => (p.metrics?.brokenImages?.length || 0) > 0).map(p => ({ viewport: p.viewport, route: p.route, images: p.metrics.brokenImages })),
  pagesWithClippedText: flat.filter(p => (p.metrics?.clippedText?.length || 0) > 0).map(p => ({ viewport: p.viewport, route: p.route, elements: p.metrics.clippedText })),
  pagesWithSmallTargets: flat.filter(p => (p.metrics?.smallTargets?.length || 0) > 0).map(p => ({ viewport: p.viewport, route: p.route, targets: p.metrics.smallTargets.slice(0, 10) })),
  consoleErrorPages: flat.filter(p => p.consoleErrors.length).map(p => ({ viewport: p.viewport, route: p.route, errors: [...new Set(p.consoleErrors)].slice(0, 8) })),
  pageErrorPages: flat.filter(p => p.pageErrors.length).map(p => ({ viewport: p.viewport, route: p.route, errors: [...new Set(p.pageErrors)].slice(0, 8) })),
  badResponsePages: flat.filter(p => p.badResponses.length).map(p => ({ viewport: p.viewport, route: p.route, responses: p.badResponses.slice(0, 12) })),
  screenshotErrors: flat.filter(p => p.screenshotErrors.length).map(p => ({ viewport: p.viewport, route: p.route, errors: p.screenshotErrors })),
  chromeMismatches: flat.filter(p => p.metrics && ((p.metrics.viewport.width < 768 && (!p.metrics.mobileDockVisible || p.metrics.headerNavVisible)) || (p.metrics.viewport.width >= 768 && (p.metrics.mobileDockVisible || !p.metrics.headerNavVisible)))).map(p => ({ viewport: p.viewport, route: p.route, dock: p.metrics.mobileDockVisible, headerNav: p.metrics.headerNavVisible })),
  headingsBehindHeader: flat.filter(p => p.metrics?.headingBehindHeader).map(p => ({ viewport: p.viewport, route: p.route })),
  failedInteractions: report.viewports.flatMap(v => v.interactions.filter(i => !i.passed).map(i => ({ viewport: v.name, ...i }))),
  fatalErrors: report.fatalErrors,
};
await writeReport();
const s = report.summary;
const md = [
  '# Responsive audit summary', '',
  `Pages audited: ${s.pagesAudited}`,
  `Navigation errors: ${s.navigationErrors.length}`,
  `Horizontal overflow: ${s.horizontalOverflowPages.length}`,
  `Offscreen-element pages: ${s.pagesWithOffscreenElements.length}`,
  `Broken visible image pages: ${s.pagesWithBrokenImages.length}`,
  `Clipped-text pages: ${s.pagesWithClippedText.length}`,
  `Small-target pages: ${s.pagesWithSmallTargets.length}`,
  `Console-error pages: ${s.consoleErrorPages.length}`,
  `Runtime-error pages: ${s.pageErrorPages.length}`,
  `HTTP-error pages: ${s.badResponsePages.length}`,
  `Responsive chrome mismatches: ${s.chromeMismatches.length}`,
  `Headings behind header: ${s.headingsBehindHeader.length}`,
  `Failed interactions: ${s.failedInteractions.length}`,
  `Screenshot errors: ${s.screenshotErrors.length}`,
  `Fatal errors: ${s.fatalErrors.length}`,
  '', '## Machine findings', '```json', JSON.stringify(s, null, 2), '```',
].join('\n');
await fs.writeFile('responsive-audit/audit-summary.md', md);
console.log(md);
