import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = process.env.OUT_DIR || 'artifacts/yesenin-feb-page-witnesses-76';
const USER_AGENT = 'TheLegendaryPoet research verification/1.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)';
const LIST_URL = 'https://feb-web.ru/feb/esenin/chronics/el2/el2-spis.htm?cmd=p';
const CONTENTS_URL = 'https://feb-web.ru/feb/esenin/chronics/el2/el2-449-.htm?cmd=p';
const MAX_ROUTE_CANDIDATES = 24;

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function scoreText(value) {
  const text = value.toLowerCase();
  let score = 0;
  if (text.includes('сирен')) score += 100;
  if (text.includes('деклараци')) score += 30;
  if (/(^|\D)621(\D|$)/.test(text)) score += 20;
  if (text.includes('4—5') || text.includes('4-5')) score += 10;
  return score;
}

async function inspectPage(page, url) {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForTimeout(1600);
  const finalUrl = page.url();
  const title = await page.title();
  const bodyText = String(await page.evaluate(() =>
    document.body?.innerText || document.documentElement?.innerText || '',
  )).replace(/\r/g, '');
  const anchors = await page.locator('a[href]').evaluateAll((items) => items.map((anchor, index) => ({
    index,
    href: anchor.href,
    text: (anchor.textContent || '').replace(/\s+/g, ' ').trim(),
    parentText: (anchor.parentElement?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 1200),
    grandparentText: (anchor.parentElement?.parentElement?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 1600),
  })));
  const images = await page.locator('img').evaluateAll((items) => items.map((image, index) => ({
    index,
    src: image.src,
    currentSrc: image.currentSrc,
    alt: image.alt || '',
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    parentText: (image.parentElement?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 1000),
  })));
  return {
    requestedUrl: url,
    finalUrl,
    status: response?.status() ?? null,
    contentType: response?.headers()['content-type'] || null,
    title,
    bodyHasSirena: bodyText.toLowerCase().includes('сирен'),
    bodyHas621: /(^|\D)621(\D|$)/m.test(bodyText),
    anchors,
    images,
  };
}

async function probeUrl(context, url, referer) {
  const result = { url };
  try {
    const response = await context.request.get(url, {
      timeout: 90_000,
      headers: { 'User-Agent': USER_AGENT, Referer: referer },
    });
    const bytes = await response.body();
    result.status = response.status();
    result.finalUrl = response.url();
    result.contentType = response.headers()['content-type'] || null;
    result.byteSize = bytes.length;
    result.sha256 = sha256(bytes);
    if (response.ok() && result.contentType?.startsWith('image/') && bytes.length > 0) {
      const ext = result.contentType.includes('png') ? '.png'
        : result.contentType.includes('gif') ? '.gif'
          : result.contentType.includes('webp') ? '.webp'
            : '.jpg';
      const filename = `sirena-candidate-${result.sha256.slice(0, 16)}${ext}`;
      await writeFile(path.join(OUT_DIR, filename), bytes);
      result.savedAs = filename;
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  }
  return result;
}

await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  userAgent: USER_AGENT,
  viewport: { width: 1440, height: 1100 },
  locale: 'ru-RU',
});
const page = await context.newPage();

const report = {
  generatedAt: new Date().toISOString(),
  purpose: 'Discover the exact FEB route/asset for the Sirena no. 4–5 cover on printed page 621',
  sourcePages: [],
  rankedRoutes: [],
  inspectedRoutes: [],
  probes: [],
  technicalErrors: [],
};

try {
  for (const sourceUrl of [LIST_URL, CONTENTS_URL]) {
    try {
      const inspected = await inspectPage(page, sourceUrl);
      report.sourcePages.push(inspected);
    } catch (error) {
      report.technicalErrors.push({
        url: sourceUrl,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const rankedMap = new Map();
  for (const source of report.sourcePages) {
    for (const anchor of source.anchors) {
      const contextText = `${anchor.text} ${anchor.parentText} ${anchor.grandparentText}`;
      const score = scoreText(contextText);
      if (score <= 0 || !/^https?:/i.test(anchor.href)) continue;
      const existing = rankedMap.get(anchor.href);
      if (!existing || score > existing.score) {
        rankedMap.set(anchor.href, {
          href: anchor.href,
          score,
          text: anchor.text,
          context: contextText.slice(0, 2000),
          discoveredOn: source.finalUrl,
        });
      }
    }
    for (const image of source.images) {
      const imageUrl = image.currentSrc || image.src;
      const score = scoreText(`${image.alt} ${image.parentText} ${imageUrl}`);
      if (score <= 0 || !/^https?:/i.test(imageUrl)) continue;
      const existing = rankedMap.get(imageUrl);
      if (!existing || score > existing.score) {
        rankedMap.set(imageUrl, {
          href: imageUrl,
          score,
          text: image.alt,
          context: image.parentText,
          discoveredOn: source.finalUrl,
        });
      }
    }
  }

  report.rankedRoutes = [...rankedMap.values()]
    .sort((a, b) => b.score - a.score || a.href.localeCompare(b.href))
    .slice(0, MAX_ROUTE_CANDIDATES);

  for (const route of report.rankedRoutes) {
    if (/\.(?:jpe?g|png|gif|webp)(?:\?|$)/i.test(route.href)) {
      report.probes.push(await probeUrl(context, route.href, route.discoveredOn));
      continue;
    }
    try {
      const inspected = await inspectPage(page, route.href);
      const exactImages = inspected.images.filter((image) => {
        const imageUrl = image.currentSrc || image.src;
        return /\/pictures\/el2-621/i.test(imageUrl)
          || scoreText(`${image.alt} ${image.parentText}`) >= 100;
      });
      report.inspectedRoutes.push({
        route,
        requestedUrl: inspected.requestedUrl,
        finalUrl: inspected.finalUrl,
        status: inspected.status,
        title: inspected.title,
        bodyHasSirena: inspected.bodyHasSirena,
        bodyHas621: inspected.bodyHas621,
        exactImages,
      });
      for (const image of exactImages) {
        const imageUrl = image.currentSrc || image.src;
        if (/^https?:/i.test(imageUrl)) {
          report.probes.push(await probeUrl(context, imageUrl, inspected.finalUrl));
        }
      }
    } catch (error) {
      report.technicalErrors.push({
        url: route.href,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
} finally {
  await browser.close();
}

const successfulImages = report.probes.filter((probe) => probe.savedAs);
report.summary = {
  sourcePageCount: report.sourcePages.length,
  rankedRouteCount: report.rankedRoutes.length,
  inspectedRouteCount: report.inspectedRoutes.length,
  probeCount: report.probes.length,
  successfulImageCount: successfulImages.length,
  technicalErrorCount: report.technicalErrors.length,
  classification: successfulImages.length > 0
    ? 'SIRENA-PAGE621-IMAGE-CANDIDATES-ACQUIRED-ROLE-REVIEW'
    : report.rankedRoutes.length > 0
      ? 'SIRENA-ROUTES-IDENTIFIED-BYTES-NOT-ACQUIRED'
      : 'SIRENA-ROUTE-NOT-IDENTIFIED',
};

await writeFile(
  path.join(OUT_DIR, 'sirena-discovery.json'),
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8',
);
console.log(JSON.stringify(report.summary, null, 2));

if (report.technicalErrors.length > 0 && report.sourcePages.length === 0) {
  process.exitCode = 1;
}
