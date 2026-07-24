import { chromium } from 'playwright';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('build/rsl-active-photo-witness-77');
const targets = [
  {
    id: 'c08-author-date-page',
    url: 'https://dlib.rsl.ru/viewer/01005408088#?page=377',
    purpose: 'Commons cites this page for the 1928 date and Osip Brik attribution.',
  },
  {
    id: 'c08-publication-source-page',
    url: 'https://dlib.rsl.ru/viewer/01005408111#?page=5',
    purpose: 'Commons cites this 1930 collected-works page as the reproduction source.',
  },
];

await fs.mkdir(root, { recursive: true });

const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
const events = [];
const network = [];
const captures = [];
let browser;
let fatal = null;

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: 'ru-RU',
    viewport: { width: 1600, height: 1200 },
    ignoreHTTPSErrors: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/148.0.0.0 Safari/537.36 TLP-source-verifier/1.0',
  });

  for (const target of targets) {
    const targetRoot = path.join(root, target.id);
    const responsesRoot = path.join(targetRoot, 'responses');
    await fs.mkdir(responsesRoot, { recursive: true });
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
        const entry = {
          target: target.id,
          status: response.status(),
          url: response.url(),
          contentType,
          contentLength: headers['content-length'] || '',
        };
        network.push(entry);
        if (!/^image\//i.test(contentType)) return;
        try {
          const body = await response.body();
          if (body.length < 20_000) return;
          const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
          const filename = `${digest(response.url()).slice(0, 20)}-${body.length}.${extension}`;
          await fs.writeFile(path.join(responsesRoot, filename), body);
          captures.push({
            target: target.id,
            filename: `${target.id}/responses/${filename}`,
            url: response.url(),
            status: response.status(),
            contentType,
            bytes: body.length,
            sha256: digest(body),
          });
        } catch (error) {
          events.push({ target: target.id, type: 'response-body-error', url: response.url(), text: String(error) });
        }
      })();
      pending.push(task);
    });

    const started = Date.now();
    let navigationStatus = null;
    let navigationError = null;
    try {
      const response = await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
      navigationStatus = response?.status() ?? null;
    } catch (error) {
      navigationError = String(error?.stack || error);
    }

    await page.waitForTimeout(20_000);
    const state = await page.evaluate(() => ({
      title: document.title,
      finalUrl: location.href,
      bodyText: (document.body?.innerText || '').slice(0, 100_000),
      html: document.documentElement?.outerHTML || '',
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
  await fs.writeFile(path.join(root, 'summary.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    targets,
    networkEntries: network.length,
    capturedImages: captures.length,
    fatal,
  }, null, 2)).catch(() => {});
  if (fatal) await fs.writeFile(path.join(root, 'fatal-error.txt'), fatal).catch(() => {});
  await browser?.close().catch(() => {});
}

if (fatal) process.exitCode = 1;
