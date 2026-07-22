import fs from 'node:fs';
import path from 'node:path';
import { essays } from '../src/data/essays/index';
import { essayMedia } from '../src/generated/essayMedia';

const errors: string[] = [];
const root = process.cwd();

function publicFile(assetPath: string): string {
  return path.join(root, 'public', assetPath.replace(/^\//, ''));
}

function requireFile(label: string, assetPath: string) {
  if (!assetPath.startsWith('/')) {
    errors.push(`${label}: expected local public path, got ${assetPath}`);
    return;
  }
  if (!fs.existsSync(publicFile(assetPath))) errors.push(`${label}: missing ${assetPath}`);
}

function optimizedSibling(assetPath: string, extension: 'avif' | 'webp', small = false): string | null {
  if (!/\.(?:jpe?g|png|webp)$/i.test(assetPath)) return null;
  const suffix = small ? '-640' : '';
  return assetPath.replace(/\.(?:jpe?g|png|webp)$/i, `${suffix}.${extension}`);
}

for (const essay of essays) {
  for (const [label, cover] of [['cover', essay.cover], ['cardCover', essay.cardCover ?? essay.cover]] as const) {
    if (/^https?:\/\//.test(cover)) {
      errors.push(`${essay.slug} ${label}: remote runtime cover is forbidden: ${cover}`);
      continue;
    }
    requireFile(`${essay.slug} ${label}`, cover);
    for (const extension of ['avif', 'webp'] as const) {
      const full = optimizedSibling(cover, extension);
      const small = optimizedSibling(cover, extension, true);
      if (full) requireFile(`${essay.slug} ${label} ${extension}`, full);
      if (small) requireFile(`${essay.slug} ${label} ${extension} 640`, small);
    }
  }

  for (const [index, block] of essay.blocks.entries()) {
    if (block.type !== 'image') continue;
    const label = `${essay.slug} image ${index + 1}`;
    if (/^https?:\/\//.test(block.src)) errors.push(`${label}: remote runtime image is forbidden: ${block.src}`);
    if (!block.mediaKey) {
      requireFile(`${label} local fallback`, block.src);
      for (const extension of ['avif', 'webp'] as const) {
        const full = optimizedSibling(block.src, extension);
        const small = optimizedSibling(block.src, extension, true);
        if (full) requireFile(`${label} local ${extension}`, full);
        if (small) requireFile(`${label} local ${extension} 640`, small);
      }
      continue;
    }
    const media = essayMedia[block.mediaKey];
    if (!media) {
      errors.push(`${label}: mediaKey “${block.mediaKey}” is absent from generated manifest`);
      continue;
    }
    if (block.src !== media.fallback) {
      errors.push(`${label}: src ${block.src} does not match manifest fallback ${media.fallback}`);
    }
    if (!(media.width > 0 && media.height > 0)) errors.push(`${label}: invalid dimensions`);
    if (!media.placeholder.startsWith('data:image/webp;base64,')) errors.push(`${label}: missing WebP LQIP`);
    if (media.avif.length === 0 || media.webp.length === 0) errors.push(`${label}: both AVIF and WebP variants are required`);
    requireFile(`${label} fallback`, media.fallback);
    for (const variant of [...media.avif, ...media.webp]) requireFile(`${label} variant`, variant.src);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

const mediaCount = Object.keys(essayMedia).length;
console.log(`Essay media validation: ${essays.length} essays, ${mediaCount} optimized archival originals, no runtime hotlinks.`);
