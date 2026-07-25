#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputRoot = 'artifacts/yesenin-nypl-programs-pass19';
const pageRoot = join(outputRoot, 'public-pages');
const imageRoot = join(outputRoot, 'iiif-1600');
await mkdir(pageRoot, { recursive: true });
await mkdir(imageRoot, { recursive: true });

const requestedCaptureUuids = [
  '89b93c5d-a42e-99bb-e040-e00a18066f5f',
  '311074d0-26fa-0137-dbf3-5fc18a3ba411',
  'ef354620-26fa-0137-4425-5325a3c555ef',
  '522978b0-26fb-0137-0433-0f1659985b85',
];
const userAgent = 'TheLegendaryPoet-NYPL-IIIF-Research/1.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)';
const sha256 = (data) => createHash('sha256').update(data).digest('hex');

function decodeBasicEntities(value) {
  return value
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function stripTags(value) {
  return decodeBasicEntities(value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function jpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
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
    const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
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

function extractTitle(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? stripTags(match[1]).replace(/\s+-\s+NYPL Digital Collections$/i, '') : null;
}

function extractVisibleField(html, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`data-testid="ds-text">${escaped}<\\/p><p[^>]*data-testid="ds-text">([\\s\\S]*?)<\\/p>`, 'i'));
  return match ? stripTags(match[1]) : null;
}

function extractDate(html) {
  const match = html.match(/dateStart%3D([^%&"']+)%5D%5BdateEnd%3D([^%&"']+)/i);
  return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : null;
}

function extractPlace(html) {
  const match = html.match(/place%3D([^%&"']+)/i);
  return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : null;
}

function extractItemStructure(html, requestedCaptureUuid) {
  const normalized = html.replace(/\\"/g, '"').replace(/\\\//g, '/');
  const requestedIndex = normalized.indexOf(requestedCaptureUuid);
  if (requestedIndex < 0) throw new Error(`requested capture ${requestedCaptureUuid} not found in public item page`);

  const rootMatches = [...normalized.matchAll(/"uuid":"([0-9a-f-]{36})","itemDetail":\{"uuid":"\1","captures":\[/g)];
  const rootMatch = rootMatches.find((candidate) => candidate.index <= requestedIndex + 50_000) ?? rootMatches[0];
  if (!rootMatch) throw new Error(`itemDetail root not found for ${requestedCaptureUuid}`);
  const rootItemUuid = rootMatch[1];
  const captureStart = rootMatch.index + rootMatch[0].length;
  const captureEnd = normalized.indexOf('],"buyable":', captureStart);
  if (captureEnd < 0) throw new Error(`capture array end not found for ${requestedCaptureUuid}`);
  const captureText = normalized.slice(captureStart, captureEnd);
  const captures = [];
  for (const match of captureText.matchAll(/\{"uuid":"([0-9a-f-]{36})","imageId":"([^"]+)","mediaFileUrl":(null|"[^"]*"),"orderInSequence":(\d+)/g)) {
    captures.push({
      uuid: match[1],
      imageId: match[2],
      orderInSequence: Number(match[4]),
    });
  }
  if (!captures.some((capture) => capture.uuid === requestedCaptureUuid)) {
    throw new Error(`requested capture ${requestedCaptureUuid} not present in extracted item ${rootItemUuid}`);
  }
  const stateText = normalized.slice(captureEnd, captureEnd + 220);
  const stateMatch = stateText.match(/"buyable":(true|false),"isRestricted":(true|false)/);
  return {
    rootItemUuid,
    captures,
    buyable: stateMatch ? stateMatch[1] === 'true' : null,
    isRestricted: stateMatch ? stateMatch[2] === 'true' : null,
  };
}

function rightsState(html) {
  if (/believes that this item is in the public domain under the laws of the United States/i.test(html)) {
    return 'public-domain-us / international-status-not-determined';
  }
  if (/unable to make a conclusive determination as to the copyright status/i.test(html)) {
    return 'copyright-status-undetermined';
  }
  return 'rights-text-unclassified';
}

async function fetchBytes(url, accept) {
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
  return {
    status: response.status,
    finalUrl: response.url,
    contentType: response.headers.get('content-type') || '',
    bytes,
  };
}

const items = [];
const captureEvidence = [];
const seenRootItems = new Set();
const seenCaptures = new Set();

for (const requestedCaptureUuid of requestedCaptureUuids) {
  const pageUrl = `https://digitalcollections.nypl.org/items/${requestedCaptureUuid}`;
  const page = await fetchBytes(pageUrl, 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.2');
  if (page.status !== 200 || !page.contentType.toLowerCase().includes('text/html') || page.bytes.length < 100_000) {
    throw new Error(`invalid NYPL public page for ${requestedCaptureUuid}: HTTP ${page.status}, ${page.contentType}, ${page.bytes.length} bytes`);
  }
  const html = page.bytes.toString('utf8');
  const structure = extractItemStructure(html, requestedCaptureUuid);
  if (seenRootItems.has(structure.rootItemUuid)) {
    throw new Error(`duplicate root item ${structure.rootItemUuid}`);
  }
  seenRootItems.add(structure.rootItemUuid);
  const pageFile = `${structure.rootItemUuid}.html`;
  await writeFile(join(pageRoot, pageFile), page.bytes);

  const item = {
    requestedCaptureUuid,
    rootItemUuid: structure.rootItemUuid,
    pageUrl,
    finalPageUrl: page.finalUrl,
    pageBytes: page.bytes.length,
    pageSha256: sha256(page.bytes),
    pageFile: `public-pages/${pageFile}`,
    title: extractTitle(html),
    dateIssued: extractDate(html),
    place: extractPlace(html),
    libraryLocation: extractVisibleField(html, 'Library Location'),
    subjects: extractVisibleField(html, 'Subjects'),
    notes: extractVisibleField(html, 'Notes'),
    physicalDescription: extractVisibleField(html, 'Physical Description'),
    languages: extractVisibleField(html, 'Languages'),
    identifiers: extractVisibleField(html, 'Identifiers'),
    rightsText: extractVisibleField(html, 'Rights'),
    rightsState: rightsState(html),
    buyable: structure.buyable,
    isRestricted: structure.isRestricted,
    captureCount: structure.captures.length,
    captures: structure.captures,
  };
  items.push(item);

  for (const capture of structure.captures) {
    if (seenCaptures.has(capture.uuid)) throw new Error(`duplicate capture UUID ${capture.uuid}`);
    seenCaptures.add(capture.uuid);
    const iiifUrl = `https://iiif.nypl.org/iiif/3/${capture.imageId}/full/1600,/0/default.jpg`;
    const image = await fetchBytes(iiifUrl, 'image/jpeg,image/*;q=0.8,*/*;q=0.1');
    const dimensions = jpegDimensions(image.bytes);
    const jpegMagic = image.bytes.length >= 2 && image.bytes[0] === 0xff && image.bytes[1] === 0xd8;
    if (image.status !== 200 || !jpegMagic || !dimensions || image.bytes.length < 10_000) {
      throw new Error(`invalid IIIF JPEG ${capture.imageId}: HTTP ${image.status}, ${image.contentType}, ${image.bytes.length} bytes`);
    }
    const imageFile = `${capture.orderInSequence.toString().padStart(2, '0')}--${capture.uuid}--${capture.imageId}.jpg`;
    await writeFile(join(imageRoot, imageFile), image.bytes);
    captureEvidence.push({
      rootItemUuid: structure.rootItemUuid,
      itemTitle: item.title,
      itemDateIssued: item.dateIssued,
      itemPlace: item.place,
      itemRightsState: item.rightsState,
      captureUuid: capture.uuid,
      imageId: capture.imageId,
      orderInSequence: capture.orderInSequence,
      iiifUrl,
      finalUrl: image.finalUrl,
      contentType: image.contentType,
      bytes: image.bytes.length,
      sha256: sha256(image.bytes),
      width: dimensions.width,
      height: dimensions.height,
      jpegMagicVerified: true,
      visuallyInspected: false,
      productionAuthorized: false,
      file: `iiif-1600/${imageFile}`,
    });
  }
}

if (items.length !== 4 || seenRootItems.size !== 4) {
  throw new Error(`expected four distinct NYPL root items, found ${items.length}/${seenRootItems.size}`);
}
if (captureEvidence.length !== 15 || seenCaptures.size !== 15) {
  throw new Error(`expected fifteen distinct captures, found ${captureEvidence.length}/${seenCaptures.size}`);
}

const manifest = {
  schema: 'yesenin-nypl-program-captures-pass19/v1',
  generatedAt: new Date().toISOString(),
  sourceAuthority: 'The New York Public Library Digital Collections public item pages and IIIF Image API',
  requestedCaptureUuids,
  rootItemCount: items.length,
  captureCount: captureEvidence.length,
  publicDomainUsItems: items.filter((item) => item.rightsState.startsWith('public-domain-us')).length,
  undeterminedRightsItems: items.filter((item) => item.rightsState === 'copyright-status-undetermined').length,
  totalHtmlBytes: items.reduce((sum, item) => sum + item.pageBytes, 0),
  totalImageBytes: captureEvidence.reduce((sum, capture) => sum + capture.bytes, 0),
  items,
  captureEvidence,
  ocrUsed: false,
  syntheticContentUsed: false,
  allImagesResearchDerivatives: true,
  visuallyInspected: false,
  productionAuthorized: false,
};
await writeFile(join(outputRoot, 'capture-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const summary = [
  '# NYPL Duncan program capture acquisition pass 19',
  '',
  `- Root items: ${manifest.rootItemCount}`,
  `- Captures: ${manifest.captureCount}`,
  `- Public-domain-under-US-law items: ${manifest.publicDomainUsItems}`,
  `- Undetermined-rights items: ${manifest.undeterminedRightsItems}`,
  `- Public HTML bytes: ${manifest.totalHtmlBytes}`,
  `- IIIF JPEG bytes: ${manifest.totalImageBytes}`,
  '- JPEG magic and dimensions: verified for 15/15',
  '- OCR used: false',
  '- Synthetic content: false',
  '- Visual inspection: pending artifact review',
  '- Production authorization: false',
  '',
  'Title | Date | Place | Captures | Rights',
  '--- | --- | --- | ---: | ---',
  ...items.map((item) => [item.title, item.dateIssued ?? 'UNSPECIFIED', item.place ?? 'UNSPECIFIED', item.captureCount, item.rightsState].join(' | ')),
  '',
];
await writeFile(join(outputRoot, 'CAPTURE_SUMMARY.md'), `${summary.join('\n')}\n`, 'utf8');
console.log(summary.join('\n'));
