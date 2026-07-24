import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = process.env.OUT_DIR || 'artifacts/yesenin-feb-page-witnesses-76';
const USER_AGENT = 'TheLegendaryPoet research verification/1.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)';

const targets = [
  {
    id: 'wit-ye1-school-certificate-545',
    indexUrl: 'https://feb-web.ru/feb/esenin/chronics/el1/el1-411-.htm?cmd=p',
    printedPages: [545],
    titleNeedles: ['Свидетельство об окончании', 'Спас-Клепиковской'],
  },
  {
    id: 'wit-ye1-train-assignment-672-674',
    directUrl: 'https://feb-web.ru/feb/esenin/chronics/el1/el1-669-.htm?cmd=p',
    printedPages: [672, 673, 674],
    titleNeedles: ['военно-санитарный поезд № 143', 'Петроградского резерва санитаров'],
  },
  {
    id: 'wit-ye1-train-reports-688-691',
    indexUrl: 'https://feb-web.ru/feb/esenin/chronics/el1/el1-411-.htm?cmd=p',
    printedPages: [688, 689, 690, 691],
    titleNeedles: ['доклад', 'поезд', '143'],
  },
  {
    id: 'wit-ye1-imagist-sirena-cover-621',
    indexUrl: 'https://feb-web.ru/feb/esenin/chronics/el2/el2-449-.htm?cmd=p',
    printedPages: [621],
    titleNeedles: ['Сирена', 'Декларация имажинистов'],
  },
];

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function safeName(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
}

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

async function resolveTargetUrl(page, target) {
  if (target.directUrl) return { url: target.directUrl, method: 'direct-known-group' };

  await page.goto(target.indexUrl, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForTimeout(1500);

  const candidates = await page.locator('a[href]').evaluateAll((anchors) => anchors.map((anchor) => ({
    text: (anchor.textContent || '').replace(/\s+/g, ' ').trim(),
    href: anchor.href,
    context: (anchor.parentElement?.textContent || anchor.textContent || '').replace(/\s+/g, ' ').trim(),
  })));

  const exactPagePatterns = target.printedPages.map((number) => new RegExp(`(^|\\D)${number}(\\D|$)`));
  const scored = candidates
    .filter((candidate) => candidate.href.includes('/feb/esenin/chronics/'))
    .map((candidate) => {
      const haystack = `${candidate.text} ${candidate.context}`.toLowerCase();
      const pageHits = exactPagePatterns.filter((pattern) => pattern.test(haystack)).length;
      const titleHits = target.titleNeedles.filter((needle) => haystack.includes(needle.toLowerCase())).length;
      return { ...candidate, score: pageHits * 10 + titleHits * 4 };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.href.localeCompare(b.href));

  if (scored.length === 0) {
    return { url: target.indexUrl, method: 'index-fallback-no-link-match', candidates: [] };
  }

  return {
    url: scored[0].href,
    method: 'index-anchor-match',
    candidates: scored.slice(0, 10),
  };
}

async function collectPageEvidence(page, context, target, resolved) {
  const response = await page.goto(resolved.url, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForTimeout(2000);

  const finalUrl = page.url();
  const title = await page.title();
  const bodyText = (await page.locator('body').innerText()).replace(/\r/g, '');
  const visiblePageNumbers = target.printedPages.filter((number) =>
    new RegExp(`(^|\\D)${number}(\\D|$)`, 'm').test(bodyText),
  );
  const visibleNeedles = target.titleNeedles.filter((needle) =>
    bodyText.toLowerCase().includes(needle.toLowerCase()),
  );

  const targetDir = path.join(OUT_DIR, target.id);
  await ensureDir(targetDir);
  await page.screenshot({ path: path.join(targetDir, 'full-page.png'), fullPage: true });
  await writeFile(path.join(targetDir, 'body.txt'), bodyText, 'utf8');

  const imageElements = await page.locator('img').evaluateAll((images) => images.map((image, index) => {
    const rect = image.getBoundingClientRect();
    return {
      index,
      alt: image.alt || '',
      src: image.src,
      currentSrc: image.currentSrc,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      displayWidth: Math.round(rect.width),
      displayHeight: Math.round(rect.height),
      parentText: (image.parentElement?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 500),
    };
  }));

  const downloads = [];
  for (const image of imageElements) {
    const sourceUrl = image.currentSrc || image.src;
    if (!sourceUrl || !/^https?:/i.test(sourceUrl)) continue;

    const likelyContent = image.naturalWidth >= 250
      || image.naturalHeight >= 250
      || target.titleNeedles.some((needle) => `${image.alt} ${image.parentText}`.toLowerCase().includes(needle.toLowerCase()));
    if (!likelyContent) continue;

    const result = {
      ...image,
      sourceUrl,
      status: 'not-requested',
    };

    try {
      const imageResponse = await context.request.get(sourceUrl, {
        timeout: 90_000,
        headers: { 'User-Agent': USER_AGENT, Referer: finalUrl },
      });
      const bytes = await imageResponse.body();
      const contentType = imageResponse.headers()['content-type'] || '';
      result.status = imageResponse.status();
      result.finalUrl = imageResponse.url();
      result.contentType = contentType;
      result.byteSize = bytes.length;
      result.sha256 = sha256(bytes);

      if (imageResponse.ok() && contentType.startsWith('image/') && bytes.length > 0) {
        const extension = contentType.includes('png') ? '.png'
          : contentType.includes('webp') ? '.webp'
            : contentType.includes('gif') ? '.gif'
              : '.jpg';
        const fileName = `${String(image.index).padStart(2, '0')}-${safeName(image.alt || 'image')}${extension}`;
        await writeFile(path.join(targetDir, fileName), bytes);
        result.savedAs = fileName;
      } else {
        result.rejectedReason = 'response is not a successful non-empty image';
      }
    } catch (error) {
      result.status = 'request-error';
      result.error = error instanceof Error ? error.message : String(error);
    }

    downloads.push(result);
  }

  return {
    id: target.id,
    requestedUrl: resolved.url,
    resolutionMethod: resolved.method,
    resolutionCandidates: resolved.candidates || [],
    finalUrl,
    documentStatus: response?.status() ?? null,
    documentContentType: response?.headers()['content-type'] || null,
    title,
    expectedPrintedPages: target.printedPages,
    visiblePrintedPages: visiblePageNumbers,
    expectedTitleNeedles: target.titleNeedles,
    visibleTitleNeedles: visibleNeedles,
    screenshot: `${target.id}/full-page.png`,
    bodyText: `${target.id}/body.txt`,
    imageElementCount: imageElements.length,
    downloadedCandidateCount: downloads.filter((item) => item.savedAs).length,
    images: downloads,
    classification: downloads.some((item) => item.savedAs)
      ? 'PUBLISHED-PAGE-BYTES-CANDIDATES-ACQUIRED'
      : 'PAGE-IDENTIFIED-BYTES-NOT-ACQUIRED',
    limitations: [
      'Downloaded bytes are published FEB page/image candidates, not direct archive originals.',
      'Object provenance and reproduction rights require separate editorial verification.',
      'A successful download does not authorize public reuse.',
    ],
  };
}

await ensureDir(OUT_DIR);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  userAgent: USER_AGENT,
  viewport: { width: 1440, height: 1100 },
  locale: 'ru-RU',
  ignoreHTTPSErrors: false,
});
const page = await context.newPage();

const manifest = {
  generatedAt: new Date().toISOString(),
  workflowPurpose: 'Issue #76 exact FEB published-page witness acquisition',
  targets: [],
};

try {
  for (const target of targets) {
    const resolved = await resolveTargetUrl(page, target);
    manifest.targets.push(await collectPageEvidence(page, context, target, resolved));
  }
} finally {
  await browser.close();
}

manifest.summary = {
  targetCount: manifest.targets.length,
  candidateImageCount: manifest.targets.reduce((sum, target) => sum + target.downloadedCandidateCount, 0),
  pageIdentityComplete: manifest.targets.every((target) =>
    target.expectedPrintedPages.every((pageNumber) => target.visiblePrintedPages.includes(pageNumber)),
  ),
  allTargetsHaveImageCandidates: manifest.targets.every((target) => target.downloadedCandidateCount > 0),
};

await writeFile(path.join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
await writeFile(path.join(OUT_DIR, 'summary.txt'), [
  `targets=${manifest.summary.targetCount}`,
  `candidate_images=${manifest.summary.candidateImageCount}`,
  `page_identity_complete=${manifest.summary.pageIdentityComplete}`,
  `all_targets_have_image_candidates=${manifest.summary.allTargetsHaveImageCandidates}`,
  ...manifest.targets.map((target) =>
    `${target.id}: ${target.classification}; pages ${target.visiblePrintedPages.join(',') || 'none'}; images ${target.downloadedCandidateCount}`,
  ),
  '',
].join('\n'), 'utf8');

console.log(JSON.stringify(manifest.summary, null, 2));

if (!manifest.summary.pageIdentityComplete) {
  console.error('At least one exact printed-page identity was not visible in the captured FEB page.');
  process.exitCode = 2;
}
