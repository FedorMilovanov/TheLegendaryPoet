import { chromium } from 'playwright';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('build/rsl-active-photo-witness-77');
const targets = [
  {
    id: 'c08-author-date-page',
    documentId: 'rsl01005408088',
    pageNumber: 377,
    url: 'https://dlib.rsl.ru/viewer/01005408088#?page=377',
    purpose: 'Commons cites this page for the 1928 date and Osip Brik attribution.',
  },
  {
    id: 'c08-publication-source-page',
    documentId: 'rsl01005408111',
    pageNumber: 5,
    url: 'https://dlib.rsl.ru/viewer/01005408111#?page=5',
    purpose: 'Commons cites this 1930 collected-works page as the reproduction source.',
  },
];

await fs.mkdir(root, { recursive: true });

const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
const events = [];
const network = [];
const captures = [];
const apiEvidence = [];
let browser;
let fatal = null;

async function saveApiInfo(context, target, targetRoot) {
  const apiUrl = `https://viewer.rsl.ru/api/v1/document/${target.documentId}/info`;
  try {
    const response = await context.request.get(apiUrl, {
      timeout: 120_000,
      failOnStatusCode: false,
      headers: { Referer: target.url },
    });
    const body = await response.body();
    const contentType = response.headers()['content-type'] || '';
    await fs.writeFile(path.join(targetRoot, 'document-info.bin'), body);
    let json = null;
    if (contentType.includes('json') || body.subarray(0, 1).toString() === '{') {
      try {
        json = JSON.parse(body.toString('utf8'));
        await fs.writeFile(path.join(targetRoot, 'document-info.json'), JSON.stringify(json, null, 2));
      } catch (error) {
        events.push({ target: target.id, type: 'api-json-parse-error', url: apiUrl, text: String(error) });
      }
    }
    apiEvidence.push({
      target: target.id,
      url: apiUrl,
      status: response.status(),
      contentType,
      bytes: body.length,
      sha256: digest(body),
      hasJson: json !== null,
    });
    return json;
  } catch (error) {
    events.push({ target: target.id, type: 'api-info-error', url: apiUrl, text: String(error) });
    return null;
  }
}

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: 'ru-RU',
    viewport: { width: 1600, height: 1200 },
    ignoreHTTPSErrors: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/148.0.0.0 Safari/537.36 TLP-source-verifier/2.0',
  });

  for (const target of targets) {
    const targetRoot = path.join(root, target.id);
    const responsesRoot = path.join(targetRoot, 'responses');
    await fs.mkdir(responsesRoot, { recursive: true });
    const documentInfo = await saveApiInfo(context, target, targetRoot);
    const page = await context.newPage();
    const pending = [];

    page.on('console', (message) => {
      if (message.type() === 'error') events.push({ target: target.id, type: 'console', text: message.text() });
    });
    page.on('pageerror', (error) => events.push({ target: target.id, type: 'pageerror', text: String(error) }));
    page.on('requestfailed', (request) => events.push({
      target: target.id,
      type: 'requestfailed',
      url: request.url(),
      error: request.failure()?.errorText || '',
    }));
    page.on('response', (response) => {
      const task = (async () => {
        const headers = await response.allHeaders().catch(() => ({}));
        const contentType = headers['content-type'] || '';
        const responseUrl = response.url();
        network.push({
          target: target.id,
          status: response.status(),
          url: responseUrl,
          contentType,
          contentLength: headers['content-length'] || '',
        });
        const isImage = /^image\//i.test(contentType);
        const isJson = /json/i.test(contentType) || /\/api\/v1\//.test(responseUrl);
        if (!isImage && !isJson) return;
        try {
          const body = await response.body();
          if (isJson) {
            const filename = `${digest(responseUrl).slice(0, 20)}-${body.length}.json`;
            await fs.writeFile(path.join(responsesRoot, filename), body);
            captures.push({
              target: target.id,
              kind: 'json',
              filename: `${target.id}/responses/${filename}`,
              url: responseUrl,
              status: response.status(),
              contentType,
              bytes: body.length,
              sha256: digest(body),
            });
            return;
          }
          if (body.length < 20_000) return;
          const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
          const filename = `${digest(responseUrl).slice(0, 20)}-${body.length}.${extension}`;
          await fs.writeFile(path.join(responsesRoot, filename), body);
          captures.push({
            target: target.id,
            kind: 'image',
            filename: `${target.id}/responses/${filename}`,
            url: responseUrl,
            status: response.status(),
            contentType,
            bytes: body.length,
            sha256: digest(body),
          });
        } catch (error) {
          events.push({ target: target.id, type: 'response-body-error', url: responseUrl, text: String(error) });
        }
      })();
      pending.push(task);
    });

    const started = Date.now();
    let navigationStatus = null;
    let navigationError = null;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const response = await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
        navigationStatus = response?.status() ?? null;
        navigationError = null;
        break;
      } catch (error) {
        navigationError = String(error?.stack || error);
        events.push({ target: target.id, type: 'navigation-attempt-error', attempt, text: navigationError });
        if (attempt < 2) await page.waitForTimeout(5_000);
      }
    }

    await page.waitForTimeout(25_000);
    const state = await page.evaluate(() => ({
      title: document.title,
      finalUrl: location.href,
      bodyText: (document.body?.innerText || '').slice(0, 100_000),
      html: document.documentElement?.outerHTML || '',
      canvases: [...document.querySelectorAll('canvas')].map((canvas) => ({
        width: canvas.width,
        height: canvas.height,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
      })),
      images: [...document.images].map((image) => ({
        src: image.currentSrc || image.src,
        alt: image.alt,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        complete: image.complete,
      })),
      resources: performance.getEntriesByType('resource').map((entry) => entry.name),
    })).catch((error) => ({ evaluationError: String(error) }));

    if (state.html) {
      await fs.writeFile(path.join(targetRoot, 'viewer.html'), state.html);
      delete state.html;
    }
    await fs.writeFile(path.join(targetRoot, 'state.json'), JSON.stringify({
      target,
      navigationStatus,
      navigationError,
      elapsedMs: Date.now() - started,
      documentInfoLoaded: documentInfo !== null,
      ...state,
    }, null, 2));
    await page.screenshot({ path: path.join(targetRoot, 'viewer.png'), fullPage: true }).catch((error) => {
      events.push({ target: target.id, type: 'screenshot-error', text: String(error) });
    });
    await Promise.allSettled(pending);
    await page.close();
  }
} catch (error) {
  fatal = String(error?.stack || error);
} finally {
  await fs.writeFile(path.join(root, 'network.json'), JSON.stringify(network, null, 2)).catch(() => {});
  await fs.writeFile(path.join(root, 'events.json'), JSON.stringify(events, null, 2)).catch(() => {});
  await fs.writeFile(path.join(root, 'captures.json'), JSON.stringify(captures, null, 2)).catch(() => {});
  await fs.writeFile(path.join(root, 'api-evidence.json'), JSON.stringify(apiEvidence, null, 2)).catch(() => {});
  await fs.writeFile(path.join(root, 'summary.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    targets,
    networkEntries: network.length,
    captures: captures.length,
    apiEvidence,
    fatal,
  }, null, 2)).catch(() => {});
  if (fatal) await fs.writeFile(path.join(root, 'fatal-error.txt'), fatal).catch(() => {});
  await browser?.close().catch(() => {});
}

if (fatal) process.exitCode = 1;
