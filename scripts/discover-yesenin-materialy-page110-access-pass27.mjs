import { chromium } from 'playwright';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const OUTPUT = path.resolve(process.env.YESENIN_MATERIALY_ACCESS_OUTPUT || 'artifacts/yesenin-materialy-page110-access-pass27');
const RAW = path.join(OUTPUT, 'raw');
const EXPECTED = {
  title: 'С.А. Есенин : материалы к биографии',
  isbn10: '5860000073',
  isbn13: '9785860000070',
  ncid: 'BA22825504',
  oclc: '29957297',
  targetPage: 110,
};

const targets = [
  {
    id: 'CINII-EXACT',
    kind: 'exact-institutional-catalog',
    url: 'https://ci.nii.ac.jp/ncid/BA22825504',
    wait: 'domcontentloaded',
  },
  {
    id: 'PROMETEUS-HOLDING',
    kind: 'institutional-library-bibliography-holding',
    url: 'https://www.prometeus.nsc.ru/biblio/cards/esenin.ssi',
    wait: 'domcontentloaded',
  },
  {
    id: 'MEMORIAL-LIBRARY-CATALOG',
    kind: 'institutional-library-catalog-index',
    url: 'https://lib.memo.ru/letter/%D1%81',
    wait: 'domcontentloaded',
  },
  {
    id: 'RSL-ISBN-SEARCH',
    kind: 'official-rsl-client-search',
    url: 'https://search.rsl.ru/ru/search#q=isbn%3A5860000073',
    wait: 'networkidle',
  },
  {
    id: 'RSL-TITLE-SEARCH',
    kind: 'official-rsl-client-search',
    url: 'https://search.rsl.ru/ru/search#q=%22%D0%A1.%D0%90.%20%D0%95%D1%81%D0%B5%D0%BD%D0%B8%D0%BD%20%D0%BC%D0%B0%D1%82%D0%B5%D1%80%D0%B8%D0%B0%D0%BB%D1%8B%20%D0%BA%20%D0%B1%D0%B8%D0%BE%D0%B3%D1%80%D0%B0%D1%84%D0%B8%D0%B8%22',
    wait: 'networkidle',
  },
  {
    id: 'NEB-ISBN-SEARCH',
    kind: 'official-neb-client-search',
    url: 'https://rusneb.ru/search/?q=5860000073',
    wait: 'networkidle',
  },
  {
    id: 'NEB-TITLE-SEARCH',
    kind: 'official-neb-client-search',
    url: 'https://rusneb.ru/search/?q=%D0%A1.%20%D0%90.%20%D0%95%D1%81%D0%B5%D0%BD%D0%B8%D0%BD%20%D0%BC%D0%B0%D1%82%D0%B5%D1%80%D0%B8%D0%B0%D0%BB%D1%8B%20%D0%BA%20%D0%B1%D0%B8%D0%BE%D0%B3%D1%80%D0%B0%D1%84%D0%B8%D0%B8',
    wait: 'networkidle',
  },
];

function normalize(value = '') {
  return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function safeName(id, suffix) {
  return `${id.toLowerCase().replace(/[^a-z0-9-]+/g, '-')}.${suffix}`;
}

function exactIdentity(text) {
  const lower = normalize(text).toLowerCase();
  return {
    esenin: lower.includes('есенин'),
    materialsTitle: lower.includes('материалы к биографии'),
    isbn10: lower.includes(EXPECTED.isbn10) || lower.includes('5-86000-007-3'),
    isbn13: lower.includes(EXPECTED.isbn13) || lower.includes('978-5-86000-007-0'),
    ncid: lower.includes(EXPECTED.ncid.toLowerCase()),
    oclc: lower.includes(EXPECTED.oclc),
    page110Literal: /(?:^|\D)110(?:\D|$)/u.test(lower),
  };
}

function accessMarkers(text) {
  const lower = normalize(text).toLowerCase();
  return {
    fullText: /(полный текст|full text|читать онлайн|read online)/u.test(lower),
    digitalCopy: /(электронн(?:ая|ой) копи|digital copy|pdf)/u.test(lower),
    fragmentOrder: /(заказать копию фрагмента|заказ фрагмента|electronic document delivery|электронная доставка)/u.test(lower),
    readingRoomOnly: /(только в.*читальн|электронн.*читальн.*зал|reading room)/u.test(lower),
    physicalHolding: /(шифр хранения|available at|библиотек|holding)/u.test(lower),
    loginRequired: /(вход|авториз|личн.*кабинет|reader card|читательск.*билет)/u.test(lower),
  };
}

function isOfficialCandidate(url) {
  return (
    /^https:\/\/search\.rsl\.ru\/ru\/record\//u.test(url)
    || /^https:\/\/rusneb\.ru\/catalog\//u.test(url)
    || /^https:\/\/rusneb\.ru\/item\//u.test(url)
  );
}

async function capturePage(page, target, index) {
  const response = await page.goto(target.url, { waitUntil: target.wait, timeout: 90_000 }).catch(() => null);
  await page.waitForTimeout(target.kind.includes('client-search') ? 4_000 : 800);
  const html = await page.content();
  const text = normalize(await page.locator('body').innerText().catch(() => ''));
  const links = await page.locator('a[href]').evaluateAll((nodes) => nodes.map((node) => ({
    href: node.href,
    text: (node.textContent || '').replace(/\s+/g, ' ').trim(),
  })));
  const screenshot = path.join(RAW, safeName(`${String(index).padStart(2, '0')}-${target.id}`, 'png'));
  await page.screenshot({ path: screenshot, fullPage: true }).catch(() => {});
  const htmlPath = path.join(RAW, safeName(`${String(index).padStart(2, '0')}-${target.id}`, 'html'));
  fs.writeFileSync(htmlPath, html);
  return {
    id: target.id,
    kind: target.kind,
    requestedUrl: target.url,
    finalUrl: page.url(),
    status: response?.status() ?? 0,
    contentType: response?.headers()['content-type'] ?? '',
    htmlBytes: Buffer.byteLength(html),
    htmlSha256: sha256(html),
    visibleTextBytes: Buffer.byteLength(text),
    visibleTextSha256: sha256(text),
    identity: exactIdentity(text),
    access: accessMarkers(text),
    literalLinks: links,
    candidateLinks: links.filter((link) => isOfficialCandidate(link.href)),
    rawHtml: path.relative(OUTPUT, htmlPath),
    screenshot: path.relative(OUTPUT, screenshot),
  };
}

async function inspectCandidate(context, link, index) {
  const page = await context.newPage();
  try {
    const response = await page.goto(link.href, { waitUntil: 'networkidle', timeout: 90_000 }).catch(() => null);
    await page.waitForTimeout(2_500);
    const html = await page.content();
    const text = normalize(await page.locator('body').innerText().catch(() => ''));
    const identity = exactIdentity(text);
    const access = accessMarkers(text);
    const literalLinks = await page.locator('a[href]').evaluateAll((nodes) => nodes.map((node) => ({
      href: node.href,
      text: (node.textContent || '').replace(/\s+/g, ' ').trim(),
    })));
    const htmlPath = path.join(RAW, safeName(`candidate-${String(index).padStart(2, '0')}`, 'html'));
    const screenshot = path.join(RAW, safeName(`candidate-${String(index).padStart(2, '0')}`, 'png'));
    fs.writeFileSync(htmlPath, html);
    await page.screenshot({ path: screenshot, fullPage: true }).catch(() => {});
    return {
      sourceLinkText: link.text,
      requestedUrl: link.href,
      finalUrl: page.url(),
      status: response?.status() ?? 0,
      contentType: response?.headers()['content-type'] ?? '',
      htmlBytes: Buffer.byteLength(html),
      htmlSha256: sha256(html),
      visibleTextBytes: Buffer.byteLength(text),
      visibleTextSha256: sha256(text),
      identity,
      access,
      exactIdentityPassed: identity.esenin && identity.materialsTitle && (identity.isbn10 || identity.isbn13 || identity.ncid || identity.oclc),
      page110Inspected: false,
      fullBookAcquired: false,
      literalLinks,
      rawHtml: path.relative(OUTPUT, htmlPath),
      screenshot: path.relative(OUTPUT, screenshot),
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
  userAgent: 'TheLegendaryPoet-Research-Materialy-Page110/1.0',
});

const surfaces = [];
for (let index = 0; index < targets.length; index += 1) {
  const page = await context.newPage();
  try {
    surfaces.push(await capturePage(page, targets[index], index + 1));
  } finally {
    await page.close();
  }
}

const uniqueCandidates = new Map();
for (const surface of surfaces) {
  for (const link of surface.candidateLinks) {
    uniqueCandidates.set(link.href, link);
  }
}

const candidates = [];
let candidateIndex = 0;
for (const link of uniqueCandidates.values()) {
  candidateIndex += 1;
  candidates.push(await inspectCandidate(context, link, candidateIndex));
}
await browser.close();

const cinii = surfaces.find((surface) => surface.id === 'CINII-EXACT');
const acceptedCandidates = candidates.filter((candidate) => candidate.exactIdentityPassed);
const exactFullTextCandidates = acceptedCandidates.filter((candidate) => candidate.access.fullText || candidate.access.digitalCopy);
const fragmentCandidates = acceptedCandidates.filter((candidate) => candidate.access.fragmentOrder);

const manifest = {
  schema: 'yesenin-materialy-page110-access-discovery-pass27/v1',
  generatedAt: new Date().toISOString(),
  target: EXPECTED,
  previousFebBoundary: {
    diagnosticPullRequest: 129,
    resolution: 'bibliographic-description-only-copy-required',
    literalPageRouteFound: false,
    pdfOrViewerFound: false,
    printedPage110Inspected: false,
  },
  surfaces,
  candidates,
  result: {
    exactCiNiiIdentityVerified: Boolean(cinii?.identity.esenin && cinii?.identity.materialsTitle && cinii?.identity.ncid),
    literalOfficialCandidateCount: uniqueCandidates.size,
    acceptedExactOfficialCandidateCount: acceptedCandidates.length,
    exactFullTextCandidateCount: exactFullTextCandidates.length,
    exactFragmentOrderCandidateCount: fragmentCandidates.length,
    legalDigitalFullTextFound: exactFullTextCandidates.length > 0,
    page110LiteralOnAcceptedCard: acceptedCandidates.some((candidate) => candidate.identity.page110Literal),
    page110Inspected: false,
    fullBookAcquired: false,
    requestSubmitted: false,
    personalDataProvided: false,
    paymentAuthorized: false,
    paymentMade: false,
    scanAcquired: false,
    recordIdConstructed: false,
    viewerIdConstructed: false,
    pdfRouteConstructed: false,
    neighboringIdArithmeticUsed: false,
    ocrUsed: false,
    syntheticContentUsed: false,
    productionAuthorized: false,
    articlePublished: false,
  },
};

fs.writeFileSync(path.join(OUTPUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(
  path.join(OUTPUT, 'SUMMARY.md'),
  [
    '# Materials to Biography page 110 access discovery pass 27',
    '',
    `- Exact CiNii identity verified: \`${manifest.result.exactCiNiiIdentityVerified}\``,
    `- Literal official candidate links: \`${manifest.result.literalOfficialCandidateCount}\``,
    `- Accepted exact official cards: \`${manifest.result.acceptedExactOfficialCandidateCount}\``,
    `- Exact full-text candidates: \`${manifest.result.exactFullTextCandidateCount}\``,
    `- Exact fragment-order candidates: \`${manifest.result.exactFragmentOrderCandidateCount}\``,
    `- Legal digital full text found: \`${manifest.result.legalDigitalFullTextFound}\``,
    '- Printed page 110 inspected: `false`',
    '- Request/payment/scan: `false`',
    '- Constructed identifiers: `false`',
    '',
  ].join('\n'),
);

console.log(JSON.stringify(manifest, null, 2));
if (!manifest.result.exactCiNiiIdentityVerified) process.exitCode = 1;
