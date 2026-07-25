#!/usr/bin/env node

import { chromium } from 'playwright';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const OUTPUT = path.resolve('artifacts/yesenin-materialy-rsl-fragment-route');
const RAW = path.join(OUTPUT, 'raw');
const RECORD_URL = 'https://search.rsl.ru/ru/record/01001662767';
const FRAGMENT_URL = 'https://search.rsl.ru/ru/fragment-eorder/rsl01001662767';
const READING_ROOM_URL = 'https://search.rsl.ru/ru/eorder/request?id=01001662767';
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const normalize = (value = '') => value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

function markers(text) {
  const lower = normalize(text).toLowerCase();
  return {
    titleMaterials: lower.includes('материалы к биографии'),
    isbn10: lower.includes('5-86000-007-3') || lower.includes('5860000073'),
    pageTitleFragmentOrder: lower.includes('заказ фрагмента документа'),
    loginRequired: lower.includes('войдите в личный кабинет') || lower.includes('авториз') || lower.includes('вход'),
    readerRegistrationRequired: lower.includes('зарегистр') || lower.includes('читательск') || lower.includes('билет'),
    fragmentServiceText: lower.includes('заказать копию фрагмента') || lower.includes('заказ копии фрагмента'),
    pricePresent: /(?:руб|₽|стоимост|тариф|цена)/u.test(lower),
    pageRangeFieldPresent: /(?:страниц|диапазон|с\.\s*по|page range)/u.test(lower),
    paymentFormPresent: /(?:оплат|payment)/u.test(lower),
  };
}

function extractForms(page) {
  return page.locator('form').evaluateAll((forms) => forms.map((form) => ({
    action: form.action,
    method: form.method,
    fields: [...form.elements].map((field) => ({
      tag: field.tagName.toLowerCase(),
      name: field.getAttribute('name') || '',
      type: field.getAttribute('type') || '',
      value: field.getAttribute('value') || '',
      placeholder: field.getAttribute('placeholder') || '',
    })),
  })));
}

async function capture(context, id, url, referer) {
  const page = await context.newPage();
  const pageErrors = [];
  const requestFailures = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));
  page.on('requestfailed', (request) => requestFailures.push({ url: request.url(), errorText: request.failure()?.errorText || '' }));
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000, referer });
    await page.waitForTimeout(3_000);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    const html = await page.content();
    const text = normalize(await page.locator('body').innerText().catch(() => ''));
    const links = await page.locator('a[href]').evaluateAll((nodes) => nodes.map((node) => ({
      href: node.href,
      text: (node.textContent || '').replace(/\s+/g, ' ').trim(),
    })));
    const forms = await extractForms(page);
    const htmlFile = path.join(RAW, `${id}.html`);
    const screenshotFile = path.join(RAW, `${id}.png`);
    fs.writeFileSync(htmlFile, html);
    await page.screenshot({ path: screenshotFile, fullPage: true }).catch(() => {});
    return {
      id,
      requestedUrl: url,
      finalUrl: page.url(),
      status: response?.status() ?? 0,
      contentType: response?.headers()['content-type'] ?? '',
      htmlBytes: Buffer.byteLength(html),
      htmlSha256: sha256(Buffer.from(html)),
      visibleTextBytes: Buffer.byteLength(text),
      visibleTextSha256: sha256(Buffer.from(text)),
      title: await page.title(),
      markers: markers(`${await page.title()} ${text}`),
      forms,
      literalLinks: links.filter((link) => link.href.startsWith('https://search.rsl.ru/') || link.href.startsWith('https://passport.rusneb.ru/')),
      pageErrors,
      requestFailures,
      rawHtml: path.relative(OUTPUT, htmlFile),
      screenshot: path.relative(OUTPUT, screenshotFile),
    };
  } finally {
    await page.close();
  }
}

fs.rmSync(OUTPUT, { recursive: true, force: true });
fs.mkdirSync(RAW, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  locale: 'ru-RU',
  timezoneId: 'Europe/Paris',
  userAgent: 'TheLegendaryPoet-Research-Materialy-RSL-Fragment/1.0',
});

const record = await capture(context, 'record', RECORD_URL, 'https://search.rsl.ru/ru/search#q=isbn%3A5860000073');
const literalFragmentLink = record.literalLinks.find((link) => link.href === FRAGMENT_URL);
const literalReadingRoomLink = record.literalLinks.find((link) => link.href === READING_ROOM_URL);
const fragment = await capture(context, 'fragment-route', FRAGMENT_URL, RECORD_URL);
const readingRoom = await capture(context, 'reading-room-route', READING_ROOM_URL, RECORD_URL);
await browser.close();

const orderLikeForms = fragment.forms.filter((form) => form.fields.some((field) => /(?:page|pages|fragment|range|price|payment|document|order|страниц|фрагмент|оплат)/iu.test(`${field.name} ${field.type} ${field.placeholder}`)));
const genericSearchForms = fragment.forms.filter((form) => form.fields.some((field) => /(?:q|query|search)/iu.test(`${field.name} ${field.placeholder}`)));

const manifest = {
  schema: 'yesenin-materialy-rsl-fragment-route/v1',
  generatedAt: new Date().toISOString(),
  target: {
    title: 'С. А. Есенин. Материалы к биографии',
    isbn10: '5-86000-007-3',
    recordId: '01001662767',
    targetPrintedPage: 110,
    recordUrl: RECORD_URL,
    fragmentUrl: FRAGMENT_URL,
    readingRoomUrl: READING_ROOM_URL,
  },
  record,
  fragment,
  readingRoom,
  result: {
    exactRecordVerified: record.status === 200 && record.markers.titleMaterials && record.markers.isbn10,
    literalFragmentLinkVerified: Boolean(literalFragmentLink),
    literalReadingRoomLinkVerified: Boolean(literalReadingRoomLink),
    fragmentRouteFetched: fragment.status === 200,
    readingRoomRouteFetched: readingRoom.status === 200,
    fragmentAuthenticationBoundary: fragment.markers.loginRequired || fragment.markers.readerRegistrationRequired,
    readingRoomAuthenticationBoundary: readingRoom.markers.loginRequired || readingRoom.markers.readerRegistrationRequired,
    anonymousOrderFieldsAvailable: orderLikeForms.length > 0,
    genericSearchFormsPresent: genericSearchForms.length > 0,
    targetPage110Loaded: fragment.markers.pageRangeFieldPresent && /(?:^|\D)110(?:\D|$)/u.test(normalize(await (async () => '')())),
    priceLoaded: fragment.markers.pricePresent,
    paymentFormLoaded: fragment.markers.paymentFormPresent,
    requestSubmitted: false,
    personalDataProvided: false,
    paymentAuthorized: false,
    paymentMade: false,
    scanAcquired: false,
    page110Inspected: false,
    viewerOrPdfResolved: false,
    constructedRoute: false,
    ocrUsed: false,
    syntheticContentUsed: false,
    productionAuthorized: false,
  },
};

// The target page number is not present in a submitted document-specific order;
// keep it false regardless of unrelated numeric text in the interface.
manifest.result.targetPage110Loaded = false;

fs.writeFileSync(path.join(OUTPUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(
  path.join(OUTPUT, 'SUMMARY.md'),
  [
    '# RSL Materialy fragment route discovery',
    '',
    `- Exact record verified: \`${manifest.result.exactRecordVerified}\``,
    `- Literal fragment link verified: \`${manifest.result.literalFragmentLinkVerified}\``,
    `- Fragment route fetched: \`${manifest.result.fragmentRouteFetched}\``,
    `- Fragment authentication boundary: \`${manifest.result.fragmentAuthenticationBoundary}\``,
    `- Anonymous order fields available: \`${manifest.result.anonymousOrderFieldsAvailable}\``,
    `- Target page 110 loaded: \`${manifest.result.targetPage110Loaded}\``,
    `- Price/payment form loaded: \`${manifest.result.priceLoaded}/${manifest.result.paymentFormLoaded}\``,
    '- Request/payment/scan/page inspection: `false`',
    '',
  ].join('\n'),
);

console.log(JSON.stringify(manifest, null, 2));
if (!manifest.result.exactRecordVerified || !manifest.result.literalFragmentLinkVerified || !manifest.result.fragmentRouteFetched) process.exitCode = 1;
