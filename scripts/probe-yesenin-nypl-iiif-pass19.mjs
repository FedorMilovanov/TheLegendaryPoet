#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputRoot = 'artifacts/yesenin-nypl-programs-pass19/iiif-probe';
await mkdir(outputRoot, { recursive: true });

const imageId = '1947210';
const variants = [
  ['v3-og-288', `https://iiif.nypl.org/iiif/3/${imageId}/full/!288,288/0/default.jpg`],
  ['v3-800', `https://iiif.nypl.org/iiif/3/${imageId}/full/!800,800/0/default.jpg`],
  ['v3-1200', `https://iiif.nypl.org/iiif/3/${imageId}/full/!1200,1200/0/default.jpg`],
  ['v3-1600', `https://iiif.nypl.org/iiif/3/${imageId}/full/!1600,1600/0/default.jpg`],
  ['v3-max', `https://iiif.nypl.org/iiif/3/${imageId}/full/max/0/default.jpg`],
  ['v3-info', `https://iiif.nypl.org/iiif/3/${imageId}/info.json`],
  ['v2-800', `https://iiif.nypl.org/iiif/2/${imageId}/full/800,/0/default.jpg`],
  ['v2-info', `https://iiif.nypl.org/iiif/2/${imageId}/info.json`],
];

const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function probe(label, url) {
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'user-agent': 'TheLegendaryPoet-NYPL-IIIF-Probe/1.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)',
          accept: 'image/jpeg,application/json,text/plain;q=0.8,*/*;q=0.2',
        },
        signal: AbortSignal.timeout(60_000),
      });
      const bytes = Buffer.from(await response.arrayBuffer());
      const extension = (response.headers.get('content-type') || '').includes('json')
        ? 'json'
        : bytes[0] === 0xff && bytes[1] === 0xd8
          ? 'jpg'
          : 'bin';
      const file = `${label}.${extension}`;
      await writeFile(join(outputRoot, file), bytes);
      return {
        label,
        url,
        finalUrl: response.url,
        attempt,
        status: response.status,
        contentType: response.headers.get('content-type') || '',
        contentLengthHeader: response.headers.get('content-length'),
        bytes: bytes.length,
        sha256: sha256(bytes),
        jpegMagic: bytes.length > 1 && bytes[0] === 0xff && bytes[1] === 0xd8,
        prefixHex: bytes.subarray(0, 24).toString('hex'),
        prefixText: bytes.subarray(0, 240).toString('utf8').replace(/\s+/g, ' ').trim(),
        file: `iiif-probe/${file}`,
        error: null,
      };
    } catch (error) {
      lastError = error;
      if (attempt < 3) await sleep(1_000 * attempt);
    }
  }
  return {
    label,
    url,
    finalUrl: null,
    attempt: 3,
    status: null,
    contentType: null,
    contentLengthHeader: null,
    bytes: 0,
    sha256: null,
    jpegMagic: false,
    prefixHex: null,
    prefixText: null,
    file: null,
    error: lastError instanceof Error ? lastError.message : String(lastError),
  };
}

const results = [];
for (const [label, url] of variants) results.push(await probe(label, url));

const report = {
  generatedAt: new Date().toISOString(),
  imageId,
  variants: results.length,
  successfulJpegs: results.filter((result) => result.status === 200 && result.jpegMagic).length,
  successfulInfoResponses: results.filter(
    (result) => result.status === 200 && (result.contentType || '').includes('application/json'),
  ).length,
  results,
};
await writeFile(join(outputRoot, 'probe.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
