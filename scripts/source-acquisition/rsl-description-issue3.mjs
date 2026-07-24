import { chromium } from 'playwright';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('rsl-description-issue-3');
const responsesRoot = path.join(root, 'responses');
const downloadsRoot = path.join(root, 'downloads');
const recordUrl = 'https://search.rsl.ru/ru/record/01006741660';
const guessedViewerUrl = 'https://viewer.rsl.ru/ru/rsl01006741660?page=1&rotate=0&theme=white';

await fs.mkdir(responsesRoot, { recursive: true });
await fs.mkdir(downloadsRoot, { recursive: true });
await fs.writeFile(path.join(root, 'probe-started.txt'), new Date().toISOString());

const network = [];
const events = [];
const bodySaves = [];
const pendingResponseReads = [];
let firstPdf = null;
let fatalError = null;
let browser;

const safeName = (value) => crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 20);
const writeJson = (filename, value) => fs.writeFile(path.join(root, filename), `${JSON.stringify(value, null, 2)}\n`);

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    acceptDownloads: true,
    ignoreHTTPSErrors: true,
    locale: 'ru-RU',
    viewport: { width: 1440, height: 1050 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/148.0.0.0 Safari/537.36 source-verifier/4.0',
  });
  const page = await context.newPage();

  page.on('console', (message) => {
    events.push({ type: 'console', level: message.type(), text: message.text() });
  });
  page.on('pageerror', (error) => {
    events.push({ type: 'pageerror', text: error.stack || error.message });
  });
  page.on('requestfailed', (request) => {
    events.push({
      type: 'requestfailed',
      url: request.url(),
      failure: request.failure()?.errorText || '',
    });
  });
  page.on('request', (request) => {
    network.push({
      phase: 'request',
      method: request.method(),
      resourceType: request.resourceType(),
      url: request.url(),
    });
  });
  page.on('download', (download) => {
    const pending = (async () => {
      const suggested = download.suggestedFilename().replace(/[^a-zA-Z0-9._-]+/g, '_');
      const destination = path.join(downloadsRoot, `${Date.now()}-${suggested}`);
      try {
        await download.saveAs(destination);
        events.push({ type: 'download', destination, suggested });
      } catch (error) {
        events.push({ type: 'download-error', text: String(error), suggested });
      }
    })();
    pendingResponseReads.push(pending);
  });
  page.on('response', (response) => {
    const pending = (async () => {
      const headers = await response.allHeaders().catch(() => ({}));
      const contentType = headers['content-type'] || '';
      const item = {
        phase: 'response',
        status: response.status(),
        contentType,
        contentLength: headers['content-length'] || '',
        url: response.url(),
      };
      network.push(item);

      const lowerType = contentType.toLowerCase();
      const lowerUrl = response.url().toLowerCase();
      const isPotentialPdf = lowerType.includes('application/pdf') || lowerUrl.includes('.pdf');
      const isInspectable = isPotentialPdf
        || lowerType.includes('application/json')
        || lowerType.includes('javascript')
        || lowerType.startsWith('text/');
      if (!isInspectable) return;

      try {
        const body = await response.body();
        if (body.length > 15_000_000 && !isPotentialPdf) return;
        const isPdf = body.subarray(0, 5).toString() === '%PDF-';
        const extension = isPdf
          ? 'pdf'
          : lowerType.includes('json')
            ? 'json'
            : lowerType.includes('javascript')
              ? 'js'
              : 'txt';
        const filename = `${safeName(response.url())}.${extension}`;
        await fs.writeFile(path.join(responsesRoot, filename), body);
        bodySaves.push({
          filename,
          bytes: body.length,
          contentType,
          isPdf,
          status: response.status(),
          url: response.url(),
        });
        if (isPdf && firstPdf === null) {
          firstPdf = path.join(responsesRoot, filename);
        }
      } catch (error) {
        events.push({ type: 'response-body-error', url: response.url(), text: String(error) });
      }
    })();
    pendingResponseReads.push(pending);
  });

  const snapshot = async (label, url) => {
    let status = null;
    let navigationError = null;
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
      status = response?.status() || null;
    } catch (error) {
      navigationError = error.stack || String(error);
      events.push({ type: 'navigation-error', label, url, text: navigationError });
    }
    await page.waitForTimeout(12_000);

    const state = await page.evaluate(() => {
      const readSection = document.querySelector('.rsl-record-read-link-section');
      const freeModal = document.querySelector('#freeAccessAlert');
      const freeLink = document.querySelector('#freeAccessAlertReadLink');
      const visible = (element) => {
        if (!element) return false;
        const style = getComputedStyle(element);
        const rectangle = element.getBoundingClientRect();
        return style.display !== 'none'
          && style.visibility !== 'hidden'
          && Number(style.opacity || 1) !== 0
          && rectangle.width > 0
          && rectangle.height > 0;
      };
      return {
        title: document.title,
        url: location.href,
        bodyText: (document.body?.innerText || '').slice(0, 200_000),
        html: document.documentElement?.outerHTML || '',
        readSectionHtml: readSection?.innerHTML || '',
        freeModalExists: Boolean(freeModal),
        freeModalVisible: visible(freeModal),
        freeLinkAttribute: freeLink?.getAttribute('href') || '',
        freeLinkResolved: freeLink?.href || '',
        links: [...document.querySelectorAll('a')].map((anchor) => ({
          href: anchor.href,
          text: (anchor.innerText || '').trim(),
          visible: visible(anchor),
          download: anchor.download || '',
        })),
        buttons: [...document.querySelectorAll('button,[role=button]')].map((button) => ({
          text: (button.innerText || '').trim(),
          ariaLabel: button.getAttribute('aria-label') || '',
          title: button.getAttribute('title') || '',
          visible: visible(button),
        })),
        resources: performance.getEntriesByType('resource').map((entry) => ({
          name: entry.name,
          initiatorType: entry.initiatorType,
          transferSize: entry.transferSize,
          decodedBodySize: entry.decodedBodySize,
        })),
      };
    }).catch((error) => ({ evaluationError: String(error) }));

    if (state.html) {
      await fs.writeFile(path.join(root, `${label}.html`), state.html);
      delete state.html;
    }
    await writeJson(`${label}.json`, { status, navigationError, ...state });
    await page.screenshot({ path: path.join(root, `${label}.png`), fullPage: true }).catch((error) => {
      events.push({ type: 'screenshot-error', label, text: String(error) });
    });
    return { status, navigationError, ...state };
  };

  const recordState = await snapshot('record', recordUrl);
  let viewerUrl = guessedViewerUrl;
  if (recordState.freeLinkAttribute && recordState.freeLinkAttribute !== '#') {
    viewerUrl = recordState.freeLinkResolved;
  }

  const viewerState = await snapshot('viewer', viewerUrl);

  const visibleDownload = viewerState.links?.find((link) => link.visible && /скач|download/i.test(`${link.text} ${link.href}`));
  if (visibleDownload) {
    await page.goto(viewerUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 }).catch(() => {});
    await page.waitForTimeout(5_000);
    const locator = page.locator(`a[href="${visibleDownload.href}"]`).first();
    await locator.click({ timeout: 10_000 }).catch((error) => {
      events.push({ type: 'download-link-click-error', href: visibleDownload.href, text: String(error) });
    });
    await page.waitForTimeout(5_000);
  }

  await Promise.allSettled(pendingResponseReads);

  if (firstPdf !== null) {
    await fs.copyFile(firstPdf, path.join(root, 'source.pdf'));
  }

  const classification = {
    recordStatus: recordState.status,
    recordReadSectionEmpty: !recordState.readSectionHtml?.trim(),
    freeAccessModalExists: Boolean(recordState.freeModalExists),
    freeAccessModalVisible: Boolean(recordState.freeModalVisible),
    freeAccessLinkAttribute: recordState.freeLinkAttribute || '',
    selectedViewerUrl: viewerUrl,
    viewerStatus: viewerState.status,
    viewerTitle: viewerState.title || '',
    viewerBodyText: (viewerState.bodyText || '').slice(0, 20_000),
    pdfCaptured: firstPdf !== null,
    capturedBodies: bodySaves.length,
  };
  await writeJson('classification.json', classification);
} catch (error) {
  fatalError = error.stack || String(error);
  await fs.writeFile(path.join(root, 'fatal-error.txt'), fatalError);
} finally {
  await Promise.allSettled(pendingResponseReads);
  await writeJson('network.json', network).catch(() => {});
  await writeJson('events.json', events).catch(() => {});
  await writeJson('saved-bodies.json', bodySaves).catch(() => {});
  await writeJson('probe-summary.json', {
    recordUrl,
    guessedViewerUrl,
    networkEntries: network.length,
    savedBodies: bodySaves.length,
    pdfCaptured: firstPdf !== null,
    fatalError,
  }).catch(() => {});
  await browser?.close().catch(() => {});
}

if (fatalError) {
  process.exitCode = 1;
}
