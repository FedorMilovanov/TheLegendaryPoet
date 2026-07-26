import fs from 'node:fs';
import path from 'node:path';
import { essays } from '../src/data/essays/index';

const errors: string[] = [];
const warnings: string[] = [];
const allowedExtensions = /\.(?:avif|jpe?g|png|webp)(?:[?#].*)?$/i;
const seenCardCovers = new Map<string, string>();

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

for (const message of warnings) console.warn(`WARN  ${message}`);
for (const message of errors) console.error(`ERROR ${message}`);
console.log(`Essay cover audit: ${essays.length} essays, ${errors.length} errors, ${warnings.length} editorial warnings`);

if (errors.length > 0) process.exit(1);
