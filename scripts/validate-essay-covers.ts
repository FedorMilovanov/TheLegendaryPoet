import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { essays } from '../src/data/essays/index';

const errors: string[] = [];
const warnings: string[] = [];
const allowedExtensions = /\.(?:avif|jpe?g|png|webp)(?:[?#].*)?$/i;
const seenCardCovers = new Map<string, string>();

type ApprovedCover = {
  cover: string;
  bytes: number;
  sha256: string;
  alt: string;
  credit: string;
};

const approvedCovers: Record<string, ApprovedCover> = {
  'vykhozhu-odin-ya-na-dorogu-lermontov': {
    cover: '/images/essays/lermontov/lermontov-road-hero.webp',
    bytes: 98_178,
    sha256: '3316e08c20179e75899b72da686299e8d5b70ed3b090e295081311c3e338496f',
    alt: 'Михаил Лермонтов на одинокой ночной дороге — редакционная кинематографическая реконструкция образного мира стихотворения',
    credit: 'THE LEGENDARY POET · редакционная реконструкция на основе портретного референса',
  },
  'sergei-yesenin-1895-1921': {
    cover: '/images/essays/yesenin/yesenin-part-1-editorial.webp',
    bytes: 81_494,
    sha256: 'd666bbbf7a76200111b7c60fe06c703a518e1e83dfe0d5997feb1bb572f8a146',
    alt: 'Молодой Сергей Есенин среди берёз у воды, на фоне далёкого города — редакционная реконструкция периода 1895–1921 годов',
    credit: 'THE LEGENDARY POET · редакционная реконструкция на основе предоставленных портретных референсов',
  },
  'mayakovsky-before-revolution': {
    cover: '/images/essays/mayakovsky/mayakovsky-part-1-hero.webp',
    bytes: 89_742,
    sha256: 'aa3f997a812c5130e782830078abbff8cbdd594c1ddcfa29ef0f3dbe36399b61',
    alt: 'Молодой Владимир Маяковский читает стихи со сцены в жёлто-чёрной футуристической кофте — редакционная реконструкция',
    credit: 'THE LEGENDARY POET · редакционная реконструкция на основе архивных портретных референсов',
  },
  'mayakovsky-gromovoy': {
    cover: '/images/essays/mayakovsky/mayakovsky-part-2-hero.webp',
    bytes: 130_398,
    sha256: 'de1faac7d747a919c1f8f0b0468f4c8f6333f72b833b42d5ebd2697da0ab0b30',
    alt: 'Зрелый Владимир Маяковский в тёмном костюме на фоне города и конструктивистской графики — редакционная реконструкция позднего периода',
    credit: 'THE LEGENDARY POET · редакционная реконструкция на основе архивных портретных референсов',
  },
  'brik-case': {
    cover: '/images/essays/briks/brik-triangle-hero.webp',
    bytes: 111_850,
    sha256: 'f68ee5d38e6aedfff939bfb322a0dbe7df8ed65969d782129484177dde656533',
    alt: 'Осип Брик, Лиля Брик и Владимир Маяковский в напряжённой интерьерной композиции — редакционная реконструкция',
    credit: 'THE LEGENDARY POET · редакционная реконструкция на основе портретных референсов трёх участников',
  },
};

function isRemote(value: string) {
  return /^https:\/\//.test(value);
}

function localFile(value: string) {
  return path.resolve('public', value.replace(/^\//, ''));
}

function requireImage(slug: string, label: string, value?: string) {
  if (!value?.trim()) {
    errors.push(`${slug}: ${label} is required`);
    return;
  }
  if (!allowedExtensions.test(value)) {
    errors.push(`${slug}: ${label} must be a web image: ${value}`);
  }
  if (isRemote(value)) return;
  if (!value.startsWith('/')) {
    errors.push(`${slug}: ${label} local path must start with /: ${value}`);
    return;
  }
  const file = localFile(value);
  if (!fs.existsSync(file)) {
    errors.push(`${slug}: ${label} file is missing: ${value}`);
    return;
  }
  const bytes = fs.statSync(file).size;
  if (bytes < 80_000) warnings.push(`${slug}: ${label} is unusually small (${bytes} bytes): ${value}`);
}

for (const essay of essays) {
  requireImage(essay.slug, 'cover', essay.cover);
  requireImage(essay.slug, 'cardCover', essay.cardCover || essay.cover);

  if (!essay.coverAlt?.trim()) errors.push(`${essay.slug}: coverAlt is required`);
  if (!essay.coverKind) errors.push(`${essay.slug}: coverKind is required`);
  if (!essay.coverCredit?.trim()) errors.push(`${essay.slug}: coverCredit is required`);

  if (essay.coverKind && essay.coverKind !== 'reconstruction') {
    if (!essay.coverSourceUrl?.startsWith('https://')) {
      errors.push(`${essay.slug}: ${essay.coverKind} cover requires an HTTPS coverSourceUrl`);
    }
  }

  const approved = approvedCovers[essay.slug];
  if (approved) {
    if (essay.cover !== approved.cover) {
      errors.push(`${essay.slug}: approved hero path changed: ${essay.cover}`);
    }
    if ((essay.cardCover || essay.cover) !== approved.cover) {
      errors.push(`${essay.slug}: approved card path changed: ${essay.cardCover}`);
    }
    if (essay.coverKind !== 'reconstruction') {
      errors.push(`${essay.slug}: approved cover must remain a reconstruction`);
    }
    if (essay.coverSourceUrl) {
      errors.push(`${essay.slug}: project reconstruction must not carry coverSourceUrl`);
    }
    if (essay.coverAlt !== approved.alt) {
      errors.push(`${essay.slug}: approved coverAlt changed`);
    }
    if (essay.coverCredit !== approved.credit) {
      errors.push(`${essay.slug}: approved coverCredit changed`);
    }

    const file = localFile(approved.cover);
    if (fs.existsSync(file)) {
      const bytes = fs.statSync(file).size;
      if (bytes !== approved.bytes) {
        errors.push(`${essay.slug}: approved cover size changed: ${bytes} != ${approved.bytes}`);
      }
      const sha256 = createHash('sha256').update(fs.readFileSync(file)).digest('hex');
      if (sha256 !== approved.sha256) {
        errors.push(`${essay.slug}: approved cover SHA-256 changed: ${sha256}`);
      }
    }
  }

  const cardCover = essay.cardCover || essay.cover;
  const previous = seenCardCovers.get(cardCover);
  if (previous && previous !== essay.slug) {
    errors.push(`${essay.slug}: card cover duplicates ${previous}: ${cardCover}`);
  }
  seenCardCovers.set(cardCover, essay.slug);

  if (isRemote(essay.cover) && cardCover === essay.cover) {
    warnings.push(`${essay.slug}: uses one remote archival image for both hero and card; premium editorial replacement recommended`);
  }
}

for (const slug of Object.keys(approvedCovers)) {
  if (!essays.some((essay) => essay.slug === slug)) {
    errors.push(`${slug}: approved cover contract has no registered essay`);
  }
}

const provenance = fs.readFileSync('public/images/PROVENANCE.yml', 'utf8');
for (const [slug, approved] of Object.entries(approvedCovers)) {
  const repoPath = `public${approved.cover}`;
  if (!provenance.includes(`path: ${repoPath}`)) {
    errors.push(`${slug}: approved cover is missing from root provenance`);
  }
  if (!provenance.includes(`sha256: ${approved.sha256}`)) {
    errors.push(`${slug}: approved SHA-256 is missing from root provenance`);
  }
}

for (const message of warnings) console.warn(`WARN  ${message}`);
for (const message of errors) console.error(`ERROR ${message}`);
console.log(
  `Essay cover audit: ${essays.length} essays, ${Object.keys(approvedCovers).length} pinned replacements, ${errors.length} errors, ${warnings.length} editorial warnings`,
);

if (errors.length > 0) process.exit(1);
