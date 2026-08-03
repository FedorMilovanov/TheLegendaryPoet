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
    'cda598891eaf934e76562f205a37bf574e15bda82b8d5b8e38b2b16f9639dbc3',
  'mayakovsky-public-reading-reconstruction.webp':
    'fc7c1244e65e1d9f57e973fe0fc5df4e2d2f6a7007b334f227ac66e0cc695a7d',
  'mayakovsky-late-desk-reconstruction.webp':
    'f0f64b7f2b069f46697a36dc90711947d59c78b960448da439e1975fb575e569',
  'mayakovsky-dlya-golosa-1923.webp':
    'd3dd3426b7b930866d7f597f29b0c82f1420d4276ca8d09cbf9f566adc58b1c6',
  'mayakovsky-kruchenykh-stikhi-cover.webp':
    '277941306257879ea4b225dda873128c314f070d09332008f44282ead1659296',
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
    if (!/(?:не фотография|не архивная фотография)/i.test(image.caption)) {
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
