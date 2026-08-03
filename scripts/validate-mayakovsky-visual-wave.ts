import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getEssayBySlug } from '../src/data/essays/index';
import type { EssayBlock } from '../src/types/essay';

const assetPrefix = '/images/essays/mayakovsky/editorial-wave/';
const assetDirectory = path.resolve('public/images/essays/mayakovsky/editorial-wave');
const provenancePath = path.join(assetDirectory, 'PROVENANCE.yml');

const expectedAssets = {
  'brik-reading-circle-reconstruction.webp':
    '67d201a28ec9481a2e675df2c72a25c5acb3751096394614588895ce2b7c158a',
  'brik-triad-interior-reconstruction.webp':
    'e47e4e916e7d1cdb364079f6abe186d4c683b2a4b7dc3d56439673e1fe9e9177',
  'mayakovsky-rosta-workshop-reconstruction.webp':
    'f82837970a5cfb80870935917da89d2194bda6d66590b7cc6e8c14ec48cc687f',
  'mayakovsky-public-reading-reconstruction.webp':
    'ca0ca8c5fb70ef2974a35b9d2ba39360a27166260321869057449db8e89390f3',
  'mayakovsky-late-desk-reconstruction.webp':
    'acdc85f416eda5e6f401b1e81bf3a70269543e37ef39e59f046e8b355d9812c7',
  'mayakovsky-dlya-golosa-1923.webp':
    '4de7da4ddb89ec7bc818ccae774900423eb5c4fdd17901802c105297ad956178',
  'mayakovsky-kruchenykh-stikhi-cover.webp':
    '0c14b6ac71affbb0f8b4ea066ef41e423266eab1b780e9a669251394d5b8e046',
} as const;

const expectedArticleAssets: Record<string, string[]> = {
  'mayakovsky-gromovoy': [
    'mayakovsky-rosta-workshop-reconstruction.webp',
    'mayakovsky-dlya-golosa-1923.webp',
    'mayakovsky-public-reading-reconstruction.webp',
    'mayakovsky-late-desk-reconstruction.webp',
  ],
  'brik-case': [
    'brik-reading-circle-reconstruction.webp',
    'brik-triad-interior-reconstruction.webp',
    'mayakovsky-kruchenykh-stikhi-cover.webp',
  ],
};

const expectedDocuments = new Map([
  [
    'mayakovsky-dlya-golosa-1923.webp',
    'https://commons.wikimedia.org/wiki/File:Dlja_golosa._1923-100.jpg',
  ],
  [
    'mayakovsky-kruchenykh-stikhi-cover.webp',
    'https://commons.wikimedia.org/wiki/File:Mayakovsky_books_kruchyonyx_stixi.png',
  ],
]);

const errors: string[] = [];

function fail(message: string) {
  errors.push(message);
}

function sha256(filePath: string): string {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function editorialImages(blocks: EssayBlock[]) {
  return blocks.filter(
    (block): block is Extract<EssayBlock, { type: 'image' }> =>
      block.type === 'image' && block.src.startsWith(assetPrefix),
  );
}

if (!fs.existsSync(provenancePath)) {
  fail(`missing provenance ledger: ${provenancePath}`);
}

const provenance = fs.existsSync(provenancePath)
  ? fs.readFileSync(provenancePath, 'utf8')
  : '';

for (const [fileName, expectedHash] of Object.entries(expectedAssets)) {
  const filePath = path.join(assetDirectory, fileName);
  if (!fs.existsSync(filePath)) {
    fail(`missing production asset: ${fileName}`);
    continue;
  }

  const actualHash = sha256(filePath);
  if (actualHash !== expectedHash) {
    fail(`${fileName}: SHA-256 mismatch; expected ${expectedHash}, found ${actualHash}`);
  }

  if (!provenance.includes(`path: ${fileName}`)) {
    fail(`${fileName}: missing from PROVENANCE.yml`);
  }
  if (!provenance.includes(`sha256: ${expectedHash}`)) {
    fail(`${fileName}: exact SHA-256 missing from PROVENANCE.yml`);
  }
}

let totalReconstructions = 0;
let totalDocuments = 0;

for (const [slug, expectedFiles] of Object.entries(expectedArticleAssets)) {
  const essay = getEssayBySlug(slug);
  if (!essay) {
    fail(`missing essay: ${slug}`);
    continue;
  }

  const images = editorialImages(essay.blocks);
  const actualFiles = images.map((image) => image.src.slice(assetPrefix.length));

  if (actualFiles.length !== expectedFiles.length) {
    fail(`${slug}: expected ${expectedFiles.length} visual-wave images, found ${actualFiles.length}`);
  }

  for (const expectedFile of expectedFiles) {
    if (!actualFiles.includes(expectedFile)) {
      fail(`${slug}: missing visual-wave image ${expectedFile}`);
    }
  }

  const noticeCount = essay.blocks.filter(
    (block) =>
      block.type === 'note' &&
      block.text.includes('отдельно помеченные редакционные реконструкции') &&
      block.text.includes('не являются фотографиями конкретных исторических сцен'),
  ).length;

  if (noticeCount !== 1) {
    fail(`${slug}: expected exactly one reconstruction notice, found ${noticeCount}`);
  }

  for (const image of images) {
    const fileName = image.src.slice(assetPrefix.length);
    const expectedSourceUrl = expectedDocuments.get(fileName);

    if (image.loading !== 'eager') {
      fail(`${slug}/${fileName}: audited editorial-wave image must use loading=eager`);
    }

    if (expectedSourceUrl) {
      totalDocuments += 1;
      if (image.kind !== 'document') {
        fail(`${slug}/${fileName}: real print object must use kind=document`);
      }
      if (image.sourceUrl !== expectedSourceUrl) {
        fail(`${slug}/${fileName}: item-level source URL changed or disappeared`);
      }
      if (!image.credit?.trim()) {
        fail(`${slug}/${fileName}: documentary object has no credit`);
      }
      continue;
    }

    totalReconstructions += 1;
    if (image.kind !== 'reconstruction') {
      fail(`${slug}/${fileName}: editorial reconstruction must use kind=reconstruction`);
    }
    if (image.sourceUrl) {
      fail(`${slug}/${fileName}: reconstruction must not impersonate an archival source URL`);
    }
    if (!image.credit?.includes('редакционная реконструкция')) {
      fail(`${slug}/${fileName}: reconstruction credit is not explicit`);
    }
    if (!image.caption.includes('Редакционная реконструкция')) {
      fail(`${slug}/${fileName}: caption does not identify the reconstruction`);
    }
    if (!/(?:не фотография|не архивная фотография|не снимок)/i.test(image.caption)) {
      fail(`${slug}/${fileName}: caption lacks the non-archive boundary`);
    }
  }
}

if (totalReconstructions !== 5) {
  fail(`expected exactly 5 editorial reconstructions, found ${totalReconstructions}`);
}
if (totalDocuments !== 2) {
  fail(`expected exactly 2 documentary print objects, found ${totalDocuments}`);
}

if (!provenance.includes('rights: public_domain')) {
  fail('PROVENANCE.yml does not record public-domain rights for documentary objects');
}
if (!provenance.includes('source_use: not_primary_evidence')) {
  fail('PROVENANCE.yml does not preserve the non-evidence boundary for reconstructions');
}

for (const message of errors) console.error(`ERROR ${message}`);
console.log(
  `Mayakovsky visual wave validation: ${Object.keys(expectedAssets).length} assets, ${totalReconstructions} reconstructions, ${totalDocuments} documents, ${errors.length} errors`,
);

if (errors.length > 0) process.exit(1);
