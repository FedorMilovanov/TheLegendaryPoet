#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputRoot = 'artifacts/yesenin-nypl-programs-pass19';
const pageRoot = join(outputRoot, 'public-pages-v2');
const imageRoot = join(outputRoot, 'iiif-1600-v2');
const userAgent = 'TheLegendaryPoet-NYPL-IIIF-Research/2.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)';

const items = [
  {
    requestedCaptureUuid: '89b93c5d-a42e-99bb-e040-e00a18066f5f',
    rootItemUuid: '360acb20-c605-012f-5a1e-58d385a7bc34',
    title: 'Carnegie Hall, Duncan-Damrosch Tour: Symphonic music and the dance',
    dateIssued: '1911-02-15',
    place: 'New York',
    rightsState: 'copyright-status-undetermined',
    captures: [
      { uuid: '89b93c5d-a42e-99bb-e040-e00a18066f5f', imageId: '1947210', orderInSequence: 1 },
    ],
  },
  {
    requestedCaptureUuid: '311074d0-26fa-0137-dbf3-5fc18a3ba411',
    rootItemUuid: '300e71f0-26fa-0137-efbc-2b3acc82e3f4',
    title: 'Idilli alla Danza eseguiti da Miss Isadora Duncan',
    dateIssued: '1903 (inferred)',
    place: 'Trieste',
    rightsState: 'public-domain-us / international-status-not-determined',
    captures: [
      { uuid: '311074d0-26fa-0137-dbf3-5fc18a3ba411', imageId: '57840595', orderInSequence: 1 },
      { uuid: '31cf3de0-26fa-0137-05f8-638de25b2932', imageId: '57840596', orderInSequence: 2 },
      { uuid: '1fd61fb0-26fc-0137-c0fe-0154c49baf79', imageId: '57840597', orderInSequence: 3 },
      { uuid: '1ff69b60-26fc-0137-f23b-737c54249e33', imageId: '57840598', orderInSequence: 4 },
    ],
  },
  {
    requestedCaptureUuid: 'ef354620-26fa-0137-4425-5325a3c555ef',
    rootItemUuid: 'ee239660-26fa-0137-bad9-0f2615afff59',
    title: 'Miss Isadora Duncan eseguira danze e cori de "L’Iphigenie" di Christoph Gluck',
    dateIssued: '1912-04-22',
    place: 'Teatro Costanzi, Rome',
    rightsState: 'public-domain-us / international-status-not-determined',
    captures: [
      { uuid: 'ef354620-26fa-0137-4425-5325a3c555ef', imageId: '57840585', orderInSequence: 1 },
      { uuid: 'efee3710-26fa-0137-0e6f-276a253666f3', imageId: '57840586', orderInSequence: 2 },
      { uuid: 'b56ed430-26fc-0137-b17b-3fd1894db45f', imageId: '57840587', orderInSequence: 3 },
      { uuid: 'b5990d00-26fc-0137-b21e-67ad796126be', imageId: '57840588', orderInSequence: 4 },
      { uuid: 'b5bb6050-26fc-0137-68e8-01d848e26eb0', imageId: '57840589', orderInSequence: 5 },
      { uuid: 'b5daf500-26fc-0137-6bc2-211be11ac026', imageId: '57840590', orderInSequence: 6 },
    ],
  },
  {
    requestedCaptureUuid: '522978b0-26fb-0137-0433-0f1659985b85',
    rootItemUuid: '512a89d0-26fb-0137-a8bb-47c28987601e',
    title: 'Miss Isadora Duncan eseguira le danze dell’Orfeo',
    dateIssued: '1912-04-25',
    place: 'Teatro Costanzi, Rome',
    rightsState: 'public-domain-us / international-status-not-determined',
    captures: [
      { uuid: '522978b0-26fb-0137-0433-0f1659985b85', imageId: '57840591', orderInSequence: 1 },
      { uuid: '52dd3c20-26fb-0137-2511-4798824f5a97', imageId: '57840592', orderInSequence: 2 },
      { uuid: '119de5b0-26fd-0137-c61a-671d669f207c', imageId: '57840593', orderInSequence: 3 },
      { uuid: '11be9130-26fd-0137-b7f3-05e89b90c9a2', imageId: '57840594', orderInSequence: 4 },
    ],
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sha256 = (data) => createHash('sha256').update(data).digest('hex');

function jpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    let marker = buffer[offset + 1];
    while (marker === 0xff) {
      offset += 1;
      marker = buffer[offset + 1];
    }
    if (marker === 0xd9 || marker === 0xda) break;
    if (offset + 4 > buffer.length) break;
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2 || offset + 2 + length > buffer.length) break;
    if (sofMarkers.has(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  return null;
}

async function fetchWithRetries(url, accept, attempts = 4) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'user-agent': userAgent,
          accept,
          'accept-language': 'en,ru;q=0.7',
        },
        signal: AbortSignal.timeout(120_000),
      });
      const bytes = Buffer.from(await response.arrayBuffer());
      if ((response.status === 429 || response.status >= 500) && attempt < attempts) {
        await sleep(1_500 * attempt);
        continue;
      }
      return {
        status: response.status,
        finalUrl: response.url,
        contentType: response.headers.get('content-type') || '',
        bytes,
        attempt,
      };
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await sleep(1_500 * attempt);
        continue;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function bodyPrefix(buffer) {
  return buffer.subarray(0, 160).toString('utf8').replace(/\s+/g, ' ').trim();
}

await rm(pageRoot, { recursive: true, force: true });
await rm(imageRoot, { recursive: true, force: true });
await mkdir(pageRoot, { recursive: true });
await mkdir(imageRoot, { recursive: true });

const pageEvidence = [];
const captureEvidence = [];
const seenRoots = new Set();
const seenCaptureUuids = new Set();
const seenImageIds = new Set();

for (const item of items) {
  if (seenRoots.has(item.rootItemUuid)) throw new Error(`duplicate root item ${item.rootItemUuid}`);
  seenRoots.add(item.rootItemUuid);
  if (!item.captures.some((capture) => capture.uuid === item.requestedCaptureUuid)) {
    throw new Error(`requested capture is not in declared item ${item.rootItemUuid}`);
  }

  const pageUrl = `https://digitalcollections.nypl.org/items/${item.requestedCaptureUuid}`;
  const page = await fetchWithRetries(pageUrl, 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.2');
  const pageText = page.bytes.toString('utf8');
  const pageValid =
    page.status === 200 &&
    page.contentType.toLowerCase().includes('text/html') &&
    page.bytes.length > 100_000 &&
    pageText.includes(item.rootItemUuid) &&
    pageText.includes(item.requestedCaptureUuid) &&
    item.captures.every((capture) => pageText.includes(capture.uuid) && pageText.includes(capture.imageId));
  if (!pageValid) {
    throw new Error(
      `invalid public page ${item.rootItemUuid}: HTTP ${page.status}, ${page.contentType}, ${page.bytes.length} bytes, prefix=${JSON.stringify(bodyPrefix(page.bytes))}`,
    );
  }
  const pageFile = `${item.rootItemUuid}.html`;
  await writeFile(join(pageRoot, pageFile), page.bytes);
  pageEvidence.push({
    requestedCaptureUuid: item.requestedCaptureUuid,
    rootItemUuid: item.rootItemUuid,
    title: item.title,
    dateIssued: item.dateIssued,
    place: item.place,
    rightsState: item.rightsState,
    pageUrl,
    finalUrl: page.finalUrl,
    status: page.status,
    contentType: page.contentType,
    bytes: page.bytes.length,
    sha256: sha256(page.bytes),
    captureCount: item.captures.length,
    declaredCaptureUuidsVerifiedInHtml: true,
    declaredImageIdsVerifiedInHtml: true,
    file: `public-pages-v2/${pageFile}`,
  });

  for (const capture of item.captures) {
    if (seenCaptureUuids.has(capture.uuid)) throw new Error(`duplicate capture UUID ${capture.uuid}`);
    if (seenImageIds.has(capture.imageId)) throw new Error(`duplicate image ID ${capture.imageId}`);
    seenCaptureUuids.add(capture.uuid);
    seenImageIds.add(capture.imageId);

    const iiifUrl = `https://iiif.nypl.org/iiif/3/${capture.imageId}/full/!1600,1600/0/default.jpg`;
    const image = await fetchWithRetries(iiifUrl, 'image/jpeg,image/*;q=0.8,*/*;q=0.1');
    const dimensions = jpegDimensions(image.bytes);
    const jpegMagic = image.bytes.length >= 2 && image.bytes[0] === 0xff && image.bytes[1] === 0xd8;
    if (
      image.status !== 200 ||
      !image.contentType.toLowerCase().includes('image/jpeg') ||
      !jpegMagic ||
      !dimensions ||
      image.bytes.length < 10_000
    ) {
      throw new Error(
        `invalid IIIF JPEG ${capture.imageId}: HTTP ${image.status}, ${image.contentType}, ${image.bytes.length} bytes, prefix=${JSON.stringify(bodyPrefix(image.bytes))}`,
      );
    }
    if (dimensions.width > 1600 || dimensions.height > 1600) {
      throw new Error(`IIIF derivative ${capture.imageId} exceeds 1600 bounding box: ${dimensions.width}x${dimensions.height}`);
    }

    const imageFile = `${item.rootItemUuid}--${String(capture.orderInSequence).padStart(2, '0')}--${capture.uuid}--${capture.imageId}.jpg`;
    await writeFile(join(imageRoot, imageFile), image.bytes);
    captureEvidence.push({
      rootItemUuid: item.rootItemUuid,
      itemTitle: item.title,
      itemDateIssued: item.dateIssued,
      itemPlace: item.place,
      itemRightsState: item.rightsState,
      captureUuid: capture.uuid,
      imageId: capture.imageId,
      orderInSequence: capture.orderInSequence,
      iiifUrl,
      finalUrl: image.finalUrl,
      status: image.status,
      contentType: image.contentType,
      bytes: image.bytes.length,
      sha256: sha256(image.bytes),
      width: dimensions.width,
      height: dimensions.height,
      jpegMagicVerified: true,
      visuallyInspected: false,
      productionAuthorized: false,
      file: `iiif-1600-v2/${imageFile}`,
    });
  }
}

if (pageEvidence.length !== 4 || seenRoots.size !== 4) {
  throw new Error(`expected four distinct public item pages, found ${pageEvidence.length}/${seenRoots.size}`);
}
if (captureEvidence.length !== 15 || seenCaptureUuids.size !== 15 || seenImageIds.size !== 15) {
  throw new Error(
    `expected 15 distinct captures/image IDs, found ${captureEvidence.length}/${seenCaptureUuids.size}/${seenImageIds.size}`,
  );
}

const manifest = {
  schema: 'yesenin-nypl-program-captures-pass19/v2',
  generatedAt: new Date().toISOString(),
  sourceAuthority: 'The New York Public Library Digital Collections public item pages and IIIF Image API',
  iiifSizeSyntax: '!1600,1600',
  rootItemCount: pageEvidence.length,
  captureCount: captureEvidence.length,
  publicDomainUsItems: pageEvidence.filter((item) => item.rightsState.startsWith('public-domain-us')).length,
  undeterminedRightsItems: pageEvidence.filter((item) => item.rightsState === 'copyright-status-undetermined').length,
  totalHtmlBytes: pageEvidence.reduce((sum, item) => sum + item.bytes, 0),
  totalImageBytes: captureEvidence.reduce((sum, capture) => sum + capture.bytes, 0),
  pageEvidence,
  captureEvidence,
  noMoscow1921Item: true,
  ocrUsed: false,
  syntheticContentUsed: false,
  allImagesResearchDerivatives: true,
  visuallyInspected: false,
  productionAuthorized: false,
};

await writeFile(join(outputRoot, 'capture-manifest-v2.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const summary = [
  '# NYPL Duncan program capture acquisition pass 19 v2',
  '',
  `- Root items: ${manifest.rootItemCount}`,
  `- Captures: ${manifest.captureCount}`,
  `- Public-domain-under-US-law items: ${manifest.publicDomainUsItems}`,
  `- Undetermined-rights items: ${manifest.undeterminedRightsItems}`,
  `- Public HTML bytes: ${manifest.totalHtmlBytes}`,
  `- IIIF JPEG bytes: ${manifest.totalImageBytes}`,
  '- JPEG magic and dimensions: verified for 15/15',
  '- Moscow 1921 item: none',
  '- OCR used: false',
  '- Synthetic content: false',
  '- Visual inspection: pending artifact review',
  '- Production authorization: false',
  '',
  'Title | Date | Place | Captures | Rights',
  '--- | --- | --- | ---: | ---',
  ...pageEvidence.map((item) => [item.title, item.dateIssued, item.place, item.captureCount, item.rightsState].join(' | ')),
  '',
];
await writeFile(join(outputRoot, 'CAPTURE_SUMMARY_V2.md'), `${summary.join('\n')}\n`, 'utf8');
console.log(summary.join('\n'));
