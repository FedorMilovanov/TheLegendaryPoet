import fs from 'node:fs';
import path from 'node:path';
import { essays } from '../src/data/essays/index';
import {
  brikEssayPlacements,
  mayakovskyPartOnePlacements,
  mayakovskyPartTwoPlacements,
  type PlacementRule,
} from '../src/data/essays/essayVisualLayout';
import { essayMedia, type EssayMediaEntry } from '../src/generated/essayMedia';

const errors: string[] = [];
const root = process.cwd();
const mediaByFallback = new Map<string, EssayMediaEntry>(
  Object.values(essayMedia).map((entry) => [entry.fallback, entry]),
);

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

function validateManifestEntry(label: string, media: EssayMediaEntry) {
  if (!(media.width > 0 && media.height > 0)) errors.push(`${label}: invalid dimensions`);
  if (!media.placeholder.startsWith('data:image/webp;base64,')) errors.push(`${label}: missing WebP LQIP`);
  if (!media.fallback.endsWith('.webp')) errors.push(`${label}: <img> fallback must be WebP, got ${media.fallback}`);
  if (media.avif.length === 0 || media.webp.length === 0) {
    errors.push(`${label}: both AVIF and WebP variants are required`);
  }

  const avifWidths = media.avif.map((variant) => variant.width);
  const webpWidths = media.webp.map((variant) => variant.width);
  if (JSON.stringify(avifWidths) !== JSON.stringify(webpWidths)) {
    errors.push(`${label}: AVIF and WebP responsive width sets differ (${avifWidths.join(', ')} vs ${webpWidths.join(', ')})`);
  }
  if (media.avif.some((variant) => !variant.src.endsWith('.avif'))) {
    errors.push(`${label}: malformed AVIF variant path`);
  }
  if (media.webp.some((variant) => !variant.src.endsWith('.webp'))) {
    errors.push(`${label}: malformed WebP variant path`);
  }

  requireFile(`${label} fallback`, media.fallback);
  for (const variant of [...media.avif, ...media.webp]) requireFile(`${label} variant`, variant.src);
}

function validateLocalSiblingSet(label: string, assetPath: string) {
  requireFile(label, assetPath);
  for (const extension of ['avif', 'webp'] as const) {
    const full = optimizedSibling(assetPath, extension);
    const small = optimizedSibling(assetPath, extension, true);
    if (full) requireFile(`${label} ${extension}`, full);
    if (small) requireFile(`${label} ${extension} 640`, small);
  }
}

for (const essay of essays) {
  for (const [label, cover] of [['cover', essay.cover], ['cardCover', essay.cardCover ?? essay.cover]] as const) {
    const coverLabel = `${essay.slug} ${label}`;
    if (/^https?:\/\//.test(cover)) {
      errors.push(`${coverLabel}: remote runtime cover is forbidden: ${cover}`);
      continue;
    }

    const manifestMedia = mediaByFallback.get(cover);
    if (manifestMedia) validateManifestEntry(coverLabel, manifestMedia);
    else validateLocalSiblingSet(coverLabel, cover);
  }

  for (const [index, block] of essay.blocks.entries()) {
    if (block.type !== 'image') continue;
    const label = `${essay.slug} image ${index + 1}`;
    if (/^https?:\/\//.test(block.src)) errors.push(`${label}: remote runtime image is forbidden: ${block.src}`);
    if (!block.mediaKey) {
      validateLocalSiblingSet(`${label} local`, block.src);
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
    validateManifestEntry(label, media);
  }
}

const placementRulesBySlug: Record<string, PlacementRule[]> = {
  'mayakovsky-before-revolution': mayakovskyPartOnePlacements,
  'mayakovsky-gromovoy': mayakovskyPartTwoPlacements,
  'brik-case': brikEssayPlacements,
};

for (const [slug, rules] of Object.entries(placementRulesBySlug)) {
  const essay = essays.find((entry) => entry.slug === slug);
  if (!essay) {
    errors.push(`${slug}: placement rules reference a missing essay`);
    continue;
  }
  for (const rule of rules) {
    const image = essay.blocks.find(
      (block) => block.type === 'image' && block.mediaKey === rule.mediaKey,
    );
    if (!image || image.type !== 'image') {
      errors.push(`${slug}: placement rule references missing mediaKey “${rule.mediaKey}”`);
    } else if (image.placement !== rule.placement) {
      errors.push(
        `${slug}: mediaKey “${rule.mediaKey}” expected placement ${rule.placement}, got ${image.placement ?? 'full'}`,
      );
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

const mediaCount = Object.keys(essayMedia).length;
console.log(`Essay media validation: ${essays.length} essays, ${mediaCount} optimized archival originals, AVIF-first responsive sets and valid placements.`);
