import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = process.env.OUT_DIR || 'artifacts/yesenin-feb-page-witnesses-76';
const USER_AGENT = 'TheLegendaryPoet research verification/1.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)';
const LIST_URL = 'https://feb-web.ru/feb/esenin/chronics/el2/el2-spis.htm?cmd=p';
const CONTENTS_URL = 'https://feb-web.ru/feb/esenin/chronics/el2/el2-449-.htm?cmd=p';
const MAX_ROUTE_CANDIDATES = 24;
const CLICK_SETTLE_MS = 2500;

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

function isInterestingUrl(value) {
  return /feb-web\.ru|\.(?:jpe?g|png|gif|webp|tiff?|pdf)(?:\?|$)/i.test(value || '');
}

function attributesToObject(attributes) {
  return Object.fromEntries(attributes.map(({ name, value }) => [name, value]));
}

async function inspectPage(page, url) {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForTimeout(1600);
  const finalUrl = page.url();
  const title = await page.title();
  const bodyText = String(await page.evaluate(() =>
    document.body?.innerText || document.documentElement?.innerText || '',
  )).replace(/\r/g, '');
  const anchors = await page.locator('a[href], a[onclick]').evaluateAll((items) => items.map((anchor, index) => ({
    index,
    rawHref: anchor.getAttribute('href'),
    href: anchor.href || '',
    onclick: anchor.getAttribute('onclick'),
    target: anchor.getAttribute('target'),
    text: (anchor.textContent || '').replace(/\s+/g, ' ').trim(),
    attributes: Array.from(anchor.attributes).map((attribute) => ({ name: attribute.name, value: attribute.value })),
    outerHTML: anchor.outerHTML.slice(0, 5000),
    parentText: (anchor.parentElement?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 1200),
    parentHTML: (anchor.parentElement?.outerHTML || '').slice(0, 7000),
    grandparentText: (anchor.parentElement?.parentElement?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 1600),
    grandparentHTML: (anchor.parentElement?.parentElement?.outerHTML || '').slice(0, 9000),
  })));
  const images = await page.locator('img').evaluateAll((items) => items.map((image, index) => ({
    index,
    src: image.src,
    currentSrc: image.currentSrc,
    alt: image.alt || '',
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    attributes: Array.from(image.attributes).map((attribute) => ({ name: attribute.name, value: attribute.value })),
    outerHTML: image.outerHTML.slice(0, 5000),
    parentText: (image.parentElement?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 1000),
  })));
  return {
    requestedUrl: url,
    finalUrl,
    status: response?.status() ?? null,
    contentType: response?.headers()['content-type'] || null,
    title,
    bodyText,
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

async function inspectExactSirenaClick(context, sourcePage) {
  const clickPage = await context.newPage();
  const network = [];
  const popups = [];
  const dialogs = [];
  const newPages = [];
  let captureActive = false;

  const onRequest = (request) => {
    if (!captureActive || !isInterestingUrl(request.url())) return;
    network.push({
      phase: 'request',
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
    });
  };
  const onResponse = (response) => {
    if (!captureActive || !isInterestingUrl(response.url())) return;
    network.push({
      phase: 'response',
      url: response.url(),
      status: response.status(),
      contentType: response.headers()['content-type'] || null,
      resourceType: response.request().resourceType(),
    });
  };
  context.on('request', onRequest);
  context.on('response', onResponse);
  context.on('page', (createdPage) => {
    if (!captureActive || createdPage === clickPage) return;
    newPages.push(createdPage);
  });
  clickPage.on('popup', (popup) => {
    if (captureActive) popups.push(popup);
  });
  clickPage.on('dialog', async (dialog) => {
    dialogs.push({ type: dialog.type(), message: dialog.message(), defaultValue: dialog.defaultValue() });
    await dialog.dismiss().catch(() => {});
  });

  try {
    await clickPage.goto(LIST_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await clickPage.waitForTimeout(1600);
    const locator = clickPage.locator('a[href], a[onclick]');
    const exactAnchors = await locator.evaluateAll((items) => items.map((anchor, index) => {
      const text = (anchor.textContent || '').replace(/\s+/g, ' ').trim();
      const parentText = (anchor.parentElement?.textContent || '').replace(/\s+/g, ' ').trim();
      const grandparentText = (anchor.parentElement?.parentElement?.textContent || '').replace(/\s+/g, ' ').trim();
      return {
        index,
        text,
        context: `${text} ${parentText} ${grandparentText}`.slice(0, 3000),
        rawHref: anchor.getAttribute('href'),
        href: anchor.href || '',
        onclick: anchor.getAttribute('onclick'),
        target: anchor.getAttribute('target'),
        attributes: Array.from(anchor.attributes).map((attribute) => ({ name: attribute.name, value: attribute.value })),
        outerHTML: anchor.outerHTML.slice(0, 7000),
        parentHTML: (anchor.parentElement?.outerHTML || '').slice(0, 10_000),
      };
    }));

    const ranked = exactAnchors
      .map((anchor) => ({ ...anchor, score: scoreText(anchor.context) }))
      .filter((anchor) => anchor.score >= 100 && /(^|\D)621(\D|$)/.test(anchor.context))
      .sort((a, b) => b.score - a.score || a.index - b.index);
    const exactAnchor = ranked[0] || null;

    if (!exactAnchor) {
      return {
        exactAnchor: null,
        classification: 'SIRENA-ANCHOR-NOT-FOUND',
        network,
        dialogs,
        popups: [],
        newPages: [],
      };
    }

    const beforeUrl = clickPage.url();
    const beforeBody = String(await clickPage.evaluate(() =>
      document.body?.innerText || document.documentElement?.innerText || '',
    ));
    const beforeImages = await clickPage.locator('img').evaluateAll((images) => images.map((image) => image.currentSrc || image.src));
    const beforeHtmlHash = await clickPage.evaluate(() => document.documentElement?.outerHTML || '')
      .then((html) => sha256(Buffer.from(html)));

    await locator.nth(exactAnchor.index).scrollIntoViewIfNeeded();
    captureActive = true;
    let clickError = null;
    try {
      await locator.nth(exactAnchor.index).click({ timeout: 15_000 });
    } catch (error) {
      clickError = error instanceof Error ? error.message : String(error);
      try {
        await locator.nth(exactAnchor.index).evaluate((anchor) => anchor.click());
      } catch (fallbackError) {
        clickError += `; DOM click failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`;
      }
    }
    await clickPage.waitForTimeout(CLICK_SETTLE_MS);
    for (const createdPage of [...popups, ...newPages]) {
      await createdPage.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
      await createdPage.waitForTimeout(500).catch(() => {});
    }
    captureActive = false;

    const afterUrl = clickPage.url();
    const afterBody = String(await clickPage.evaluate(() =>
      document.body?.innerText || document.documentElement?.innerText || '',
    ));
    const afterHtml = await clickPage.evaluate(() => document.documentElement?.outerHTML || '');
    const afterHtmlHash = sha256(Buffer.from(afterHtml));
    const afterImages = await clickPage.locator('img').evaluateAll((images) => images.map((image, index) => ({
      index,
      src: image.src,
      currentSrc: image.currentSrc,
      alt: image.alt || '',
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      parentText: (image.parentElement?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 1200),
      outerHTML: image.outerHTML.slice(0, 5000),
    })));
    const overlayCandidates = await clickPage.locator('[role="dialog"], dialog, [class*="modal" i], [class*="popup" i], [id*="modal" i], [id*="popup" i]').evaluateAll((elements) => elements.map((element) => ({
      tagName: element.tagName,
      id: element.id,
      className: typeof element.className === 'string' ? element.className : '',
      text: (element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 2000),
      outerHTML: element.outerHTML.slice(0, 8000),
      visible: Boolean(element.getClientRects().length),
    })));

    const popupDetails = [];
    for (const popup of [...new Set([...popups, ...newPages])]) {
      popupDetails.push({
        url: popup.url(),
        title: await popup.title().catch(() => ''),
        images: await popup.locator('img').evaluateAll((images) => images.map((image) => ({
          src: image.src,
          currentSrc: image.currentSrc,
          alt: image.alt || '',
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
        }))).catch(() => []),
      });
    }

    const discoveredImageUrls = new Set();
    for (const image of afterImages) {
      const imageUrl = image.currentSrc || image.src;
      if (isInterestingUrl(imageUrl) && !beforeImages.includes(imageUrl)) discoveredImageUrls.add(imageUrl);
      if (/\/pictures\/el2-/i.test(imageUrl) && scoreText(`${image.alt} ${image.parentText}`) >= 100) {
        discoveredImageUrls.add(imageUrl);
      }
    }
    for (const popup of popupDetails) {
      for (const image of popup.images) {
        const imageUrl = image.currentSrc || image.src;
        if (isInterestingUrl(imageUrl)) discoveredImageUrls.add(imageUrl);
      }
    }
    for (const event of network) {
      if (event.phase === 'response' && event.contentType?.startsWith('image/')) {
        discoveredImageUrls.add(event.url);
      }
    }

    const probes = [];
    for (const imageUrl of discoveredImageUrls) {
      probes.push(await probeUrl(context, imageUrl, afterUrl || beforeUrl));
    }

    const successfulImages = probes.filter((probe) => probe.savedAs);
    const urlChanged = afterUrl !== beforeUrl;
    const bodyChanged = afterBody !== beforeBody;
    const domChanged = afterHtmlHash !== beforeHtmlHash;
    const popupOpened = popupDetails.length > 0;
    const relevantNetwork = network.some((event) => event.phase === 'response' && event.url !== LIST_URL);
    const rawHrefIsHash = !exactAnchor.rawHref || exactAnchor.rawHref === '#';
    const hasHandler = Boolean(exactAnchor.onclick)
      || Object.keys(attributesToObject(exactAnchor.attributes)).some((name) => name.startsWith('data-'));

    let classification;
    if (successfulImages.length > 0) {
      classification = 'SIRENA-PAGE621-IMAGE-CANDIDATES-ACQUIRED-ROLE-REVIEW';
    } else if (urlChanged || popupOpened || relevantNetwork) {
      classification = 'SIRENA-CLICK-ROUTE-IDENTIFIED-BYTES-NOT-ACQUIRED';
    } else if (domChanged || bodyChanged || overlayCandidates.some((item) => item.visible)) {
      classification = 'SIRENA-CLICK-DOM-INTERACTION-IDENTIFIED-BYTES-NOT-ACQUIRED';
    } else if (rawHrefIsHash && !hasHandler) {
      classification = 'SIRENA-ELECTRONIC-ASSET-NOT-EXPOSED';
    } else {
      classification = 'SIRENA-CLICK-PRODUCED-NO-RESOLVABLE-ASSET';
    }

    return {
      sourcePage: sourcePage.finalUrl,
      exactAnchor,
      beforeUrl,
      afterUrl,
      clickError,
      bodyChanged,
      domChanged,
      beforeHtmlHash,
      afterHtmlHash,
      beforeImageCount: beforeImages.length,
      afterImages,
      overlayCandidates,
      dialogs,
      network,
      popups: popupDetails,
      discoveredImageUrls: [...discoveredImageUrls],
      probes,
      successfulImageCount: successfulImages.length,
      classification,
    };
  } finally {
    captureActive = false;
    context.off('request', onRequest);
    context.off('response', onResponse);
    await clickPage.close().catch(() => {});
  }
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
  clickInspection: null,
  technicalErrors: [],
};

try {
  for (const sourceUrl of [LIST_URL, CONTENTS_URL]) {
    try {
      const inspected = await inspectPage(page, sourceUrl);
      report.sourcePages.push({ ...inspected, bodyText: undefined });
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
      const routeKey = `${anchor.href || source.finalUrl}::${anchor.index}`;
      if (score <= 0) continue;
      rankedMap.set(routeKey, {
        href: anchor.href,
        rawHref: anchor.rawHref,
        onclick: anchor.onclick,
        target: anchor.target,
        attributes: anchor.attributes,
        outerHTML: anchor.outerHTML,
        parentHTML: anchor.parentHTML,
        score,
        text: anchor.text,
        context: contextText.slice(0, 3000),
        discoveredOn: source.finalUrl,
        anchorIndex: anchor.index,
      });
    }
    for (const image of source.images) {
      const imageUrl = image.currentSrc || image.src;
      const score = scoreText(`${image.alt} ${image.parentText} ${imageUrl}`);
      if (score <= 0 || !/^https?:/i.test(imageUrl)) continue;
      rankedMap.set(`${imageUrl}::image-${image.index}`, {
        href: imageUrl,
        score,
        text: image.alt,
        context: image.parentText,
        discoveredOn: source.finalUrl,
      });
    }
  }

  report.rankedRoutes = [...rankedMap.values()]
    .sort((a, b) => b.score - a.score || String(a.href).localeCompare(String(b.href)))
    .slice(0, MAX_ROUTE_CANDIDATES);

  for (const route of report.rankedRoutes) {
    if (!/^https?:/i.test(route.href || '') || route.rawHref === '#') continue;
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

  const listSource = report.sourcePages.find((source) => source.finalUrl.includes('el2-spis'));
  if (listSource) {
    try {
      report.clickInspection = await inspectExactSirenaClick(context, listSource);
      report.probes.push(...(report.clickInspection.probes || []));
    } catch (error) {
      report.technicalErrors.push({
        url: LIST_URL,
        phase: 'exact-anchor-click',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
} finally {
  await browser.close();
}

const successfulImages = report.probes.filter((probe) => probe.savedAs);
const clickClassification = report.clickInspection?.classification || null;
let classification;
if (successfulImages.length > 0) {
  classification = 'SIRENA-PAGE621-IMAGE-CANDIDATES-ACQUIRED-ROLE-REVIEW';
} else if (clickClassification) {
  classification = clickClassification;
} else if (report.rankedRoutes.length > 0) {
  classification = 'SIRENA-ROUTES-IDENTIFIED-BYTES-NOT-ACQUIRED';
} else {
  classification = 'SIRENA-ROUTE-NOT-IDENTIFIED';
}

report.summary = {
  sourcePageCount: report.sourcePages.length,
  rankedRouteCount: report.rankedRoutes.length,
  inspectedRouteCount: report.inspectedRoutes.length,
  probeCount: report.probes.length,
  successfulImageCount: successfulImages.length,
  clickClassification,
  technicalErrorCount: report.technicalErrors.length,
  classification,
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
