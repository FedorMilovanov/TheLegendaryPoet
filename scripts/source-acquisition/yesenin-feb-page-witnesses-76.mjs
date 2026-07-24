import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = process.env.OUT_DIR || 'artifacts/yesenin-feb-page-witnesses-76';
const USER_AGENT = 'TheLegendaryPoet research verification/1.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)';
const MAX_IMAGES_PER_TARGET = 12;
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

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
  if (target.directUrl) return { url: target.directUrl, method: 'direct-known-group', candidates: [] };

  await page.goto(target.indexUrl, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForTimeout(1200);

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

function imageScore(image, target) {
  const haystack = `${image.alt} ${image.parentText}`.toLowerCase();
  const pageHits = target.printedPages.filter((number) => new RegExp(`(^|\\D)${number}(\\D|$)`).test(haystack)).length;
  const titleHits = target.titleNeedles.filter((needle) => haystack.includes(needle.toLowerCase())).length;
  const sizeScore = Math.min(8, Math.floor(Math.max(image.naturalWidth, image.naturalHeight) / 250));
  return pageHits * 20 + titleHits * 10 + sizeScore;
}

async function collectPageEvidence(page, context, target, resolved) {
  const response = await page.goto(resolved.url, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForTimeout(1800);

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
  await page.screenshot({ path: path.join(targetDir, 'viewport.png'), fullPage: false });
  await writeFile(path.join(targetDir, 'body.txt'), bodyText.slice(0, 1_000_000), 'utf8');

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
      parentText: (image.parentElement?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 700),
    };
  }));

  const rankedImages = imageElements
    .map((image) => ({ ...image, evidenceScore: imageScore(image, target) }))
    .filter((image) => {
      const sourceUrl = image.currentSrc || image.src;
      return /^https?:/i.test(sourceUrl || '')
        && (image.evidenceScore > 0 || image.naturalWidth >= 250 || image.naturalHeight >= 250);
    })
    .sort((a, b) => b.evidenceScore - a.evidenceScore || (b.naturalWidth * b.naturalHeight) - (a.naturalWidth * a.naturalHeight))
    .slice(0, MAX_IMAGES_PER_TARGET);

  const downloads = [];
  for (const image of rankedImages) {
    const sourceUrl = image.currentSrc || image.src;
    const result = { ...image, sourceUrl, status: 'not-requested' };

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

      if (!imageResponse.ok() || !contentType.startsWith('image/') || bytes.length === 0) {
        result.rejectedReason = 'response is not a successful non-empty image';
      } else if (bytes.length > MAX_IMAGE_BYTES) {
        result.rejectedReason = `image exceeds ${MAX_IMAGE_BYTES} byte evidence cap`;
      } else {
        const extension = contentType.includes('png') ? '.png'
          : contentType.includes('webp') ? '.webp'
            : contentType.includes('gif') ? '.gif'
              : '.jpg';
        const fileName = `${String(image.index).padStart(2, '0')}-${safeName(image.alt || 'image')}${extension}`;
        await writeFile(path.join(targetDir, fileName), bytes);
        result.savedAs = fileName;
      }
    } catch (error) {
      result.status = 'request-error';
      result.error = error instanceof Error ? error.message : String(error);
    }

    downloads.push(result);
  }

  const hasCandidateBytes = downloads.some((item) => item.savedAs);
  const pageIdentityComplete = target.printedPages.every((pageNumber) => visiblePageNumbers.includes(pageNumber));

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
    pageIdentityComplete,
    expectedTitleNeedles: target.titleNeedles,
    visibleTitleNeedles: visibleNeedles,
    screenshot: `${target.id}/viewport.png`,
    bodyText: `${target.id}/body.txt`,
    imageElementCount: imageElements.length,
    rankedImageCount: rankedImages.length,
    downloadedCandidateCount: downloads.filter((item) => item.savedAs).length,
    images: downloads,
    classification: pageIdentityComplete && hasCandidateBytes
      ? 'PAGE-IDENTIFIED-CANDIDATE-BYTES-ACQUIRED'
      : pageIdentityComplete
        ? 'PAGE-IDENTIFIED-BYTES-NOT-ACQUIRED'
        : hasCandidateBytes
          ? 'CANDIDATE-BYTES-ACQUIRED-PAGE-IDENTITY-INCOMPLETE'
          : 'PAGE-AND-BYTES-INCOMPLETE',
    limitations: [
      'Downloaded bytes are published FEB page/image candidates, not direct archive originals.',
      'Object provenance and reproduction rights require separate editorial verification.',
      'A successful download does not authorize public reuse.',
    ],
  };
}

await ensureDir(OUT_DIR);

const manifest = {
  generatedAt: new Date().toISOString(),
  workflowPurpose: 'Issue #76 exact FEB published-page witness acquisition',
  targets: [],
  technicalErrors: [],
};

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1440, height: 1100 },
    locale: 'ru-RU',
    ignoreHTTPSErrors: false,
  });
  const page = await context.newPage();

  for (const target of targets) {
    try {
      const resolved = await resolveTargetUrl(page, target);
      manifest.targets.push(await collectPageEvidence(page, context, target, resolved));
    } catch (error) {
      manifest.technicalErrors.push({
        targetId: target.id,
        message: error instanceof Error ? error.message : String(error),
      });
      manifest.targets.push({
        id: target.id,
        expectedPrintedPages: target.printedPages,
        visiblePrintedPages: [],
        pageIdentityComplete: false,
        downloadedCandidateCount: 0,
        classification: 'TECHNICAL-ACQUISITION-ERROR',
      });
    }
  }
} catch (error) {
  manifest.technicalErrors.push({
    targetId: 'browser-runtime',
    message: error instanceof Error ? error.message : String(error),
  });
} finally {
  if (browser) await browser.close();
}

manifest.summary = {
  targetCount: manifest.targets.length,
  candidateImageCount: manifest.targets.reduce((sum, target) => sum + (target.downloadedCandidateCount || 0), 0),
  identifiedTargetCount: manifest.targets.filter((target) => target.pageIdentityComplete).length,
  pageIdentityComplete: manifest.targets.length === targets.length && manifest.targets.every((target) => target.pageIdentityComplete),
  allTargetsHaveImageCandidates: manifest.targets.length === targets.length
    && manifest.targets.every((target) => (target.downloadedCandidateCount || 0) > 0),
  technicalErrorCount: manifest.technicalErrors.length,
};

await writeFile(path.join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
await writeFile(path.join(OUT_DIR, 'summary.txt'), [
  `targets=${manifest.summary.targetCount}`,
  `identified_targets=${manifest.summary.identifiedTargetCount}`,
  `candidate_images=${manifest.summary.candidateImageCount}`,
  `page_identity_complete=${manifest.summary.pageIdentityComplete}`,
  `all_targets_have_image_candidates=${manifest.summary.allTargetsHaveImageCandidates}`,
  `technical_errors=${manifest.summary.technicalErrorCount}`,
  ...manifest.targets.map((target) =>
    `${target.id}: ${target.classification}; pages ${(target.visiblePrintedPages || []).join(',') || 'none'}; images ${target.downloadedCandidateCount || 0}`,
  ),
  '',
].join('\n'), 'utf8');

console.log(JSON.stringify(manifest.summary, null, 2));

if (manifest.summary.technicalErrorCount > 0) {
  console.error('Technical acquisition errors occurred; inspect the uploaded manifest.');
  process.exitCode = 1;
}
