#!/usr/bin/env node

import { chromium } from 'playwright';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const OUTPUT = path.resolve('artifacts/yesenin-pravda-eastview-runtime-network');
const RAW = path.join(OUTPUT, 'raw');
const PAGES = [
  { pageNumber: 1, articleId: '21670570', url: 'https://on-demand.eastview.com/browse/doc/21670570/page-1' },
  { pageNumber: 2, articleId: '21670575', url: 'https://on-demand.eastview.com/browse/doc/21670575/page-2' },
];
const ISSUE_ID = '967207';
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const normalize = (value = '') => value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

function safeName(value) {
  return value.toLowerCase().replace(/https?:\/\//g, '').replace(/[^a-z0-9._-]+/g, '-').replace(/^-|-$/g, '').slice(0, 150) || 'response';
}

function shouldCapture(url, contentType) {
  const parsed = new URL(url);
  if (parsed.hostname !== 'on-demand.eastview.com') return false;
  const type = contentType.toLowerCase();
  return (
    parsed.pathname.startsWith('/api/')
    || parsed.pathname.startsWith('/ajax/')
    || parsed.pathname.includes('/download')
    || parsed.pathname.includes('/fullimage')
    || type.includes('application/json')
    || type.includes('application/pdf')
    || type.startsWith('image/')
  );
}

function summarizeJson(value) {
  const payload = value?.payload ?? null;
  const udb = payload?.udb ?? null;
  const edition = udb?.edition ?? null;
  const issue = edition?.issue ?? null;
  const article = issue?.article ?? null;
  const pages = payload?.pages ?? value?.pages ?? null;
  const stringify = JSON.stringify(value);
  return {
    topLevelKeys: value && typeof value === 'object' ? Object.keys(value).sort() : [],
    hasPayload: Boolean(payload),
    errors: Array.isArray(value?.errors) ? value.errors : [],
    udbId: udb?.id ?? null,
    udbTitle: udb?.title ?? null,
    editionId: edition?.id ?? null,
    issueId: issue?.id ?? null,
    issueTitle: issue?.title ?? null,
    issueOutputYear: issue?.outputYear ?? null,
    articleId: article?.id ?? payload?.article?.id ?? null,
    articleTitle: article?.title ?? payload?.article?.title ?? null,
    articleIssuePage: article?.issuePage ?? payload?.article?.issuePage ?? null,
    articleFormatType: article?.formatType ?? payload?.article?.formatType ?? null,
    subscribed: article?.subscribed ?? payload?.article?.subscribed ?? payload?.subscribed ?? null,
    canViewArticle: article?.canViewArticle ?? payload?.article?.canViewArticle ?? payload?.canViewArticle ?? null,
    showPdf: article?.showPdf ?? payload?.article?.showPdf ?? null,
    firstPdfPage: article?.firstPdfPage ?? payload?.article?.firstPdfPage ?? null,
    permanentUrl: article?.permanentUrl ?? payload?.article?.permanentUrl ?? null,
    pageMapCount: Array.isArray(pages) ? pages.length : pages && typeof pages === 'object' ? Object.keys(pages).length : 0,
    containsTargetIssueId: stringify.includes(ISSUE_ID),
    containsArticle21670570: stringify.includes('21670570'),
    containsArticle21670575: stringify.includes('21670575'),
    containsPdfMarker: /pdf/i.test(stringify),
    containsFullImageMarker: /full.?image/i.test(stringify),
    containsArticleTextMarker: /articleText|cleanText|fullText|bodyText/i.test(stringify),
  };
}

fs.rmSync(OUTPUT, { recursive: true, force: true });
fs.mkdirSync(RAW, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  locale: 'en-US',
  timezoneId: 'Europe/Paris',
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/148.0 Safari/537.36 TheLegendaryPoet-EastView-Network/1.0',
});

const pages = [];
const captured = new Map();
let responseCounter = 0;

for (const target of PAGES) {
  const page = await context.newPage();
  const pageErrors = [];
  const requestFailures = [];
  const responseRefs = [];

  page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));
  page.on('requestfailed', (request) => {
    const url = request.url();
    if (url.includes('eastview.com')) requestFailures.push({ url, errorText: request.failure()?.errorText ?? '' });
  });
  page.on('response', async (response) => {
    try {
      const url = response.url();
      const headers = response.headers();
      const contentType = headers['content-type'] || '';
      if (!shouldCapture(url, contentType)) return;
      const key = `${response.status()}|${url}`;
      if (captured.has(key)) {
        responseRefs.push(captured.get(key).id);
        return;
      }
      const bytes = Buffer.from(await response.body());
      if (bytes.length > 25_000_000) return;
      responseCounter += 1;
      const id = `response-${String(responseCounter).padStart(3, '0')}`;
      const extension = contentType.includes('json') ? 'json' : contentType.includes('pdf') ? 'pdf' : contentType.startsWith('image/') ? 'bin' : 'bin';
      const rawFile = path.join(RAW, `${id}-${safeName(url)}.${extension}`);
      fs.writeFileSync(rawFile, bytes);
      let jsonSummary = null;
      if (contentType.includes('json')) {
        try { jsonSummary = summarizeJson(JSON.parse(bytes.toString('utf8'))); } catch { jsonSummary = { parseError: true }; }
      }
      const record = {
        id,
        url,
        status: response.status(),
        contentType,
        bytes: bytes.length,
        sha256: sha256(bytes),
        requestMethod: response.request().method(),
        resourceType: response.request().resourceType(),
        rawFile: path.relative(OUTPUT, rawFile),
        jsonSummary,
        actualPdfOrImage: contentType.includes('application/pdf') || contentType.startsWith('image/'),
      };
      captured.set(key, record);
      responseRefs.push(id);
    } catch (error) {
      pageErrors.push(`response capture: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  const navigation = await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForTimeout(15_000);
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  const title = await page.title();
  const bodyText = normalize(await page.locator('body').innerText().catch(() => ''));
  const html = await page.content();
  const htmlFile = path.join(RAW, `page-${target.pageNumber}-dom.html`);
  const screenshotFile = path.join(RAW, `page-${target.pageNumber}.png`);
  fs.writeFileSync(htmlFile, html);
  await page.screenshot({ path: screenshotFile, fullPage: true }).catch(() => {});
  pages.push({
    ...target,
    navigationStatus: navigation?.status() ?? 0,
    finalUrl: page.url(),
    title,
    bodyTextBytes: Buffer.byteLength(bodyText),
    bodyTextSha256: sha256(Buffer.from(bodyText)),
    htmlBytes: Buffer.byteLength(html),
    htmlSha256: sha256(Buffer.from(html)),
    pageErrors,
    requestFailures,
    responseRefs: [...new Set(responseRefs)],
    runtimeMarkers: {
      exactIssue: /Pravda.*No\.\s*252|No\.\s*252.*Pravda/i.test(`${title} ${bodyText} ${html}`),
      pageNumber: new RegExp(`Page\\s*${target.pageNumber}`, 'i').test(`${title} ${bodyText} ${html}`),
      loginOrSubscription: /Log in to Subscribed Resources|Subscription Terms|Доступ по подписке/i.test(bodyText),
      newspaperTextVisible: bodyText.length > 2_000,
    },
    rawHtml: path.relative(OUTPUT, htmlFile),
    screenshot: path.relative(OUTPUT, screenshotFile),
  });
  await page.close();
}

await browser.close();

const responses = [...captured.values()];
const articleApi = responses.filter((record) => new URL(record.url).pathname === '/api/article');
const pagesApi = responses.filter((record) => new URL(record.url).pathname === '/api/article/pages');
const actualFacsimile = responses.filter((record) => record.actualPdfOrImage && !/logo|icon|favicon|sprite/i.test(record.url));

const manifest = {
  schema: 'yesenin-pravda-eastview-runtime-network/v1',
  generatedAt: new Date().toISOString(),
  authority: 'East View Information Services',
  target: {
    publication: 'Pravda',
    date: '1921-11-09',
    issueNumber: '252',
    issueId: ISSUE_ID,
    pages: PAGES,
  },
  pages,
  responses,
  result: {
    pagesLoaded: pages.filter((page) => page.navigationStatus === 200).length,
    articleApiResponses: articleApi.length,
    issuePagesApiResponses: pagesApi.length,
    successfulJsonResponses: responses.filter((record) => record.status === 200 && record.contentType.includes('json')).length,
    authorizationFailures: responses.filter((record) => record.status === 401 || record.status === 403).length,
    actualPdfOrNewspaperImageResponses: actualFacsimile.length,
    articlePayloadsContainExactIds: articleApi.every((record) => record.jsonSummary?.containsTargetIssueId && (record.jsonSummary?.containsArticle21670570 || record.jsonSummary?.containsArticle21670575)),
    newspaperTextVisibleInDom: pages.some((page) => page.runtimeMarkers.newspaperTextVisible),
    requestSubmitted: false,
    subscriptionPurchased: false,
    credentialsProvided: false,
    constructedApiRoute: false,
    constructedIssueId: false,
    constructedArticleId: false,
    ocrUsed: false,
    syntheticContentUsed: false,
    productionAuthorized: false,
  },
};

fs.writeFileSync(path.join(OUTPUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(
  path.join(OUTPUT, 'SUMMARY.md'),
  [
    '# East View runtime network evidence',
    '',
    `- Pages loaded: \`${manifest.result.pagesLoaded}/2\``,
    `- /api/article responses: \`${manifest.result.articleApiResponses}\``,
    `- /api/article/pages responses: \`${manifest.result.issuePagesApiResponses}\``,
    `- Successful JSON responses: \`${manifest.result.successfulJsonResponses}\``,
    `- Authorization failures: \`${manifest.result.authorizationFailures}\``,
    `- Actual PDF/newspaper-image responses: \`${manifest.result.actualPdfOrNewspaperImageResponses}\``,
    `- Newspaper text visible in DOM: \`${manifest.result.newspaperTextVisibleInDom}\``,
    '- Constructed API/issue/article IDs: `false`',
    '- Subscription / credentials / request: `false`',
    '',
  ].join('\n'),
);

console.log(JSON.stringify(manifest, null, 2));
if (manifest.result.pagesLoaded !== 2 || manifest.result.articleApiResponses < 2) process.exitCode = 1;
