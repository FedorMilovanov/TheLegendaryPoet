import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = process.env.OUT_DIR || 'artifacts/yesenin-feb-page-witnesses-76';
const USER_AGENT = 'TheLegendaryPoet research verification/1.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)';
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

const targets = [
  {
    id: 'wit-ye1-school-certificate-545',
    pageUrl: 'https://feb-web.ru/feb/esenin/chronics/el1/el1-485-.htm?cmd=p',
    fallbackUrl: 'https://feb-web.ru/feb/esenin/chronics/el1/el1-411-.htm?cmd=p',
    printedPages: [545],
    titleNeedles: ['Свидетельство об окончании', 'Спас-Клепиковской'],
    exactImagePages: [545],
    candidateUrls: [
      'https://feb-web.ru/feb/esenin/pictures/el1-545-.jpg',
      'https://feb-web.ru/feb/esenin/pictures/el1-545-1.jpg',
      'https://feb-web.ru/feb/esenin/pictures/el1-545-2.jpg',
    ],
  },
  {
    id: 'wit-ye1-train-assignment-672-674',
    pageUrl: 'https://feb-web.ru/feb/esenin/chronics/el1/el1-669-.htm?cmd=p',
    printedPages: [672, 673, 674],
    titleNeedles: ['военно-санитарный поезд № 143', 'Петроградского резерва санитаров'],
    exactImagePages: [672, 673],
    requiredImagePages: [673],
    candidateUrls: [
      'https://feb-web.ru/feb/esenin/pictures/el1-672-.jpg',
      'https://feb-web.ru/feb/esenin/pictures/el1-672-1.jpg',
      'https://feb-web.ru/feb/esenin/pictures/el1-672-2.jpg',
      'https://feb-web.ru/feb/esenin/pictures/el1-673-.jpg',
    ],
  },
  {
    id: 'wit-ye1-train-reports-688-691',
    pageUrl: 'https://feb-web.ru/feb/esenin/chronics/el1/el1-669-.htm?cmd=p',
    printedPages: [688, 689, 690, 691],
    titleNeedles: ['Доклад коменданта', 'военно-санитарного поезда № 143'],
    exactImagePages: [688, 689, 690, 691],
    requiredImagePages: [688, 691],
    candidateUrls: [
      'https://feb-web.ru/feb/esenin/pictures/el1-688-.jpg',
      'https://feb-web.ru/feb/esenin/pictures/el1-689-.jpg',
      'https://feb-web.ru/feb/esenin/pictures/el1-690-.jpg',
      'https://feb-web.ru/feb/esenin/pictures/el1-691-.jpg',
    ],
  },
  {
    id: 'wit-ye1-imagist-sirena-cover-621',
    pageUrl: 'https://feb-web.ru/feb/esenin/chronics/el2/el2-449-.htm?cmd=p',
    printedPages: [621],
    titleNeedles: ['Обложка журнала «Сирена»', 'декларацию имажинистов'],
    exactImagePages: [621],
    candidateUrls: [
      'https://feb-web.ru/feb/esenin/pictures/el2-621-.jpg',
      'https://feb-web.ru/feb/esenin/pictures/el2-621-1.jpg',
      'https://feb-web.ru/feb/esenin/pictures/el2-621-2.jpg',
    ],
    roleReviewRequired: true,
  },
];

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function safeName(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100) || 'image';
}

function pageNumberFromImageUrl(value) {
  const match = value.match(/\/pictures\/el[12]-(\d{3})(?:-|\.)/i);
  return match ? Number(match[1]) : null;
}

function isExactPageImageUrl(value, target) {
  const pageNumber = pageNumberFromImageUrl(value);
  return pageNumber !== null && target.exactImagePages.includes(pageNumber);
}

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

async function navigate(page, target) {
  const attempts = [target.pageUrl, target.fallbackUrl].filter(Boolean);
  const failures = [];

  for (const url of attempts) {
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      await page.waitForTimeout(1600);
      const status = response?.status() ?? null;
      if (status !== null && status >= 400) {
        failures.push({ url, status });
        continue;
      }
      return { requestedUrl: url, response };
    } catch (error) {
      failures.push({ url, error: error instanceof Error ? error.message : String(error) });
    }
  }

  throw new Error(`all FEB navigation attempts failed: ${JSON.stringify(failures)}`);
}

async function downloadCandidate(context, sourceUrl, referer, targetDir, label) {
  const result = { sourceUrl, label, status: 'not-requested' };
  try {
    const response = await context.request.get(sourceUrl, {
      timeout: 90_000,
      headers: { 'User-Agent': USER_AGENT, Referer: referer },
    });
    const bytes = await response.body();
    const contentType = response.headers()['content-type'] || '';
    result.status = response.status();
    result.finalUrl = response.url();
    result.contentType = contentType;
    result.byteSize = bytes.length;
    result.sha256 = sha256(bytes);
    result.pageNumber = pageNumberFromImageUrl(result.finalUrl || sourceUrl);

    if (!response.ok()) {
      result.rejectedReason = `HTTP ${response.status()}`;
      return result;
    }
    if (!contentType.startsWith('image/')) {
      result.rejectedReason = `non-image MIME ${contentType || '(missing)'}`;
      return result;
    }
    if (bytes.length === 0) {
      result.rejectedReason = 'empty image response';
      return result;
    }
    if (bytes.length > MAX_IMAGE_BYTES) {
      result.rejectedReason = `image exceeds ${MAX_IMAGE_BYTES} byte evidence cap`;
      return result;
    }

    const extension = contentType.includes('png') ? '.png'
      : contentType.includes('webp') ? '.webp'
        : contentType.includes('gif') ? '.gif'
          : '.jpg';
    const fileName = `${safeName(label)}-${result.sha256.slice(0, 12)}${extension}`;
    await writeFile(path.join(targetDir, fileName), bytes);
    result.savedAs = fileName;
    return result;
  } catch (error) {
    result.status = 'request-error';
    result.error = error instanceof Error ? error.message : String(error);
    return result;
  }
}

async function collectPageEvidence(page, context, target) {
  const navigation = await navigate(page, target);
  const finalUrl = page.url();
  const title = await page.title();
  const bodyText = String(await page.evaluate(() =>
    document.body?.innerText || document.documentElement?.innerText || '',
  )).replace(/\r/g, '');

  const visiblePrintedPages = target.printedPages.filter((number) =>
    new RegExp(`(^|\\D)${number}(\\D|$)`, 'm').test(bodyText),
  );
  const visibleTitleNeedles = target.titleNeedles.filter((needle) =>
    bodyText.toLowerCase().includes(needle.toLowerCase()),
  );

  const targetDir = path.join(OUT_DIR, target.id);
  await ensureDir(targetDir);
  await page.screenshot({ path: path.join(targetDir, 'viewport.png'), fullPage: false });
  await writeFile(path.join(targetDir, 'body.txt'), bodyText.slice(0, 1_000_000), 'utf8');

  const domImages = await page.locator('img').evaluateAll((images) => images.map((image, index) => ({
    index,
    alt: image.alt || '',
    src: image.src,
    currentSrc: image.currentSrc,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    parentText: (image.parentElement?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 700),
  })));

  const candidateMap = new Map();
  for (const explicitUrl of target.candidateUrls) {
    candidateMap.set(explicitUrl, { url: explicitUrl, label: `explicit-${path.basename(explicitUrl)}` });
  }
  for (const image of domImages) {
    const sourceUrl = image.currentSrc || image.src;
    if (!/^https?:/i.test(sourceUrl || '') || !isExactPageImageUrl(sourceUrl, target)) continue;
    candidateMap.set(sourceUrl, {
      url: sourceUrl,
      label: `dom-${image.index}-${path.basename(new URL(sourceUrl).pathname)}`,
      dom: image,
    });
  }

  const downloads = [];
  for (const candidate of candidateMap.values()) {
    const downloaded = await downloadCandidate(
      context,
      candidate.url,
      finalUrl,
      targetDir,
      candidate.label,
    );
    downloads.push({ ...candidate.dom, ...downloaded });
  }

  const savedExactImages = downloads.filter((item) =>
    item.savedAs && isExactPageImageUrl(item.finalUrl || item.sourceUrl, target),
  );
  const acquiredPages = [...new Set(savedExactImages.map((item) => item.pageNumber).filter(Number.isInteger))].sort((a, b) => a - b);
  const requiredImagePages = target.requiredImagePages || target.exactImagePages;
  const requiredImagesComplete = requiredImagePages.every((pageNumber) => acquiredPages.includes(pageNumber));
  const pageIdentityComplete = target.printedPages.every((pageNumber) => visiblePrintedPages.includes(pageNumber));
  const roleEvidence = savedExactImages.map((item) => ({
    pageNumber: item.pageNumber,
    sourceUrl: item.sourceUrl,
    finalUrl: item.finalUrl,
    alt: item.alt || '',
    parentText: item.parentText || '',
    savedAs: item.savedAs,
    sha256: item.sha256,
  }));
  const roleConfirmed = !target.roleReviewRequired || roleEvidence.some((item) =>
    `${item.alt} ${item.parentText}`.toLowerCase().includes('сирен'),
  );

  let classification;
  if (pageIdentityComplete && requiredImagesComplete && roleConfirmed) {
    classification = 'PAGE-IDENTIFIED-EXACT-BYTES-ACQUIRED';
  } else if (pageIdentityComplete && requiredImagesComplete && target.roleReviewRequired) {
    classification = 'PAGE-IDENTIFIED-EXACT-BYTES-ACQUIRED-ROLE-REVIEW';
  } else if (pageIdentityComplete && savedExactImages.length > 0) {
    classification = 'PAGE-IDENTIFIED-PARTIAL-EXACT-BYTES';
  } else if (pageIdentityComplete) {
    classification = 'PAGE-IDENTIFIED-BYTES-NOT-ACQUIRED';
  } else if (savedExactImages.length > 0) {
    classification = 'EXACT-BYTES-ACQUIRED-PAGE-IDENTITY-INCOMPLETE';
  } else {
    classification = 'PAGE-AND-BYTES-INCOMPLETE';
  }

  return {
    id: target.id,
    requestedUrl: navigation.requestedUrl,
    finalUrl,
    documentStatus: navigation.response?.status() ?? null,
    documentContentType: navigation.response?.headers()['content-type'] || null,
    title,
    expectedPrintedPages: target.printedPages,
    visiblePrintedPages,
    pageIdentityComplete,
    expectedTitleNeedles: target.titleNeedles,
    visibleTitleNeedles,
    exactImagePages: target.exactImagePages,
    requiredImagePages,
    acquiredImagePages: acquiredPages,
    requiredImagesComplete,
    roleReviewRequired: Boolean(target.roleReviewRequired),
    roleConfirmed,
    screenshot: `${target.id}/viewport.png`,
    bodyText: `${target.id}/body.txt`,
    domImageCount: domImages.length,
    probedCandidateCount: downloads.length,
    downloadedExactImageCount: savedExactImages.length,
    roleEvidence,
    images: downloads,
    classification,
    limitations: [
      'Downloaded bytes are published FEB page/image candidates, not direct archive originals.',
      'Object provenance and reproduction rights require separate editorial verification.',
      'A successful download does not authorize public reuse.',
      ...(target.roleReviewRequired && !roleConfirmed
        ? ['Page 621 contains two objects; the exact Sirena-cover role requires visual/metadata confirmation.']
        : []),
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
  page.setDefaultTimeout(30_000);

  for (const target of targets) {
    try {
      manifest.targets.push(await collectPageEvidence(page, context, target));
    } catch (error) {
      manifest.technicalErrors.push({
        targetId: target.id,
        message: error instanceof Error ? error.message : String(error),
      });
      manifest.targets.push({
        id: target.id,
        expectedPrintedPages: target.printedPages,
        visiblePrintedPages: [],
        acquiredImagePages: [],
        pageIdentityComplete: false,
        requiredImagesComplete: false,
        downloadedExactImageCount: 0,
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
  exactImageCount: manifest.targets.reduce((sum, target) => sum + (target.downloadedExactImageCount || 0), 0),
  identifiedTargetCount: manifest.targets.filter((target) => target.pageIdentityComplete).length,
  exactBytesCompleteTargetCount: manifest.targets.filter((target) => target.requiredImagesComplete).length,
  roleConfirmedTargetCount: manifest.targets.filter((target) => target.roleConfirmed !== false).length,
  pageIdentityComplete: manifest.targets.length === targets.length
    && manifest.targets.every((target) => target.pageIdentityComplete),
  exactBytesComplete: manifest.targets.length === targets.length
    && manifest.targets.every((target) => target.requiredImagesComplete),
  technicalErrorCount: manifest.technicalErrors.length,
};

await writeFile(path.join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
await writeFile(path.join(OUT_DIR, 'summary.txt'), [
  `targets=${manifest.summary.targetCount}`,
  `identified_targets=${manifest.summary.identifiedTargetCount}`,
  `exact_images=${manifest.summary.exactImageCount}`,
  `exact_bytes_complete_targets=${manifest.summary.exactBytesCompleteTargetCount}`,
  `page_identity_complete=${manifest.summary.pageIdentityComplete}`,
  `exact_bytes_complete=${manifest.summary.exactBytesComplete}`,
  `technical_errors=${manifest.summary.technicalErrorCount}`,
  ...manifest.targets.map((target) =>
    `${target.id}: ${target.classification}; visible ${(target.visiblePrintedPages || []).join(',') || 'none'}; acquired ${(target.acquiredImagePages || []).join(',') || 'none'}`,
  ),
  '',
].join('\n'), 'utf8');

console.log(JSON.stringify(manifest.summary, null, 2));

if (manifest.summary.technicalErrorCount > 0) {
  console.error('Technical acquisition errors occurred; inspect the uploaded manifest.');
  process.exitCode = 1;
}
