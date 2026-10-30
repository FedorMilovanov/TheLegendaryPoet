import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { essays } from '../src/data/essays/index';
import { parseImageProvenance } from './poet-authoring-contract.ts';
import { figureLayoutWidth, readIntrinsicSize } from './lib/image-metrics.mjs';

// Local images an essay actually publishes: their bytes are the delivery, so a
// silent swap, a drifted provenance pin or a figure painted above the pixels its
// source carries is a publication defect, not a cosmetic one. Remote Commons
// redirects are out of scope here — their bytes are not ours to pin.

const errors: string[] = [];
const warnings: string[] = [];

type LocalUsage = {
  publicPath: string;
  where: string;
  /** Layout width the essay asks for, for body figures only. */
  layoutWidth?: number;
  sourceWidth?: number;
};

const provenance = parseImageProvenance(fs.readFileSync('public/images/PROVENANCE.yml', 'utf8'));
const recordsByPath = new Map<string, ReturnType<typeof parseImageProvenance>>();
for (const record of provenance) {
  const bucket = recordsByPath.get(record.path) ?? [];
  bucket.push(record);
  recordsByPath.set(record.path, bucket);
}

function intrinsic(pathname: string) {
  const bytes = fs.readFileSync(pathname);
  return { bytes, size: readIntrinsicSize(bytes) };
}

/** Every local image an essay publishes, with the layout that paints it. */
function localUsages(): LocalUsage[] {
  const usages: LocalUsage[] = [];
  const add = (src: unknown, where: string, layoutWidth?: number, sourceWidth?: number) => {
    if (typeof src !== 'string' || !src.startsWith('/images/') || src.includes('..')) return;
    usages.push({ publicPath: `public${src}`, where, layoutWidth, sourceWidth });
  };

  const walk = (blocks: unknown[], where: string) => {
    for (const block of blocks) {
      if (!block || typeof block !== 'object') continue;
      const candidate = block as Record<string, unknown>;
      if (candidate.type === 'image') {
        add(
          candidate.src,
          where,
          figureLayoutWidth(candidate.layout === 'portrait' ? 'portrait' : 'wide'),
          typeof candidate.sourceWidth === 'number' ? candidate.sourceWidth : undefined,
        );
      }
      for (const value of Object.values(candidate)) {
        if (Array.isArray(value)) walk(value, where);
      }
    }
  };

  for (const essay of essays) {
    const where = essay.slug;
    add(essay.cover, `${where} cover`);
    add(essay.cardCover, `${where} cardCover`);
    walk(essay.blocks as unknown[], `${where} figure`);
  }
  return usages;
}

const usages = localUsages();
const checked = new Set<string>();

for (const usage of usages) {
  const key = `${usage.publicPath}|${usage.layoutWidth ?? '-'}`;
  if (checked.has(key)) continue;
  checked.add(key);

  if (!fs.existsSync(usage.publicPath)) {
    errors.push(`${usage.where}: local image is missing from disk: ${usage.publicPath}`);
    continue;
  }

  let size: { width: number; height: number };
  let bytes: Buffer;
  try {
    ({ bytes, size } = intrinsic(usage.publicPath));
  } catch (error) {
    errors.push(`${usage.where}: ${usage.publicPath} has no readable frame size: ${(error as Error).message}`);
    continue;
  }

  // A published local asset is policy-bound to an item-level record.
  const records = recordsByPath.get(usage.publicPath) ?? [];
  if (records.length === 0) {
    errors.push(`${usage.where}: ${usage.publicPath} has no item-level PROVENANCE.yml record`);
  } else if (records.length !== 1) {
    errors.push(`${usage.where}: ${usage.publicPath} must have exactly one PROVENANCE.yml record, found ${records.length}`);
  } else {
    const record = records[0];
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    if (record.bytes && Number(record.bytes) !== bytes.length) {
      errors.push(`${usage.where}: ${usage.publicPath} bytes drifted from PROVENANCE.yml (${record.bytes} pinned, ${bytes.length} on disk)`);
    }
    if (record.sha256 && record.sha256 !== sha256) {
      errors.push(`${usage.where}: ${usage.publicPath} SHA-256 drifted from PROVENANCE.yml (${record.sha256} pinned, ${sha256} on disk)`);
    }
    if (record.intrinsic && record.intrinsic !== `${size.width}x${size.height}`) {
      errors.push(`${usage.where}: ${usage.publicPath} intrinsic size pinned as ${record.intrinsic}, file holds ${size.width}x${size.height}`);
    }
  }

  if (usage.layoutWidth === undefined) continue;

  // The rule that keeps a 300px archive scan from being stretched to a 576px
  // column: a figure is painted at the pixels its source carries, no further.
  if (usage.sourceWidth !== undefined) {
    if (usage.sourceWidth !== size.width) {
      errors.push(
        `${usage.where}: ${usage.publicPath} declares sourceWidth ${usage.sourceWidth} but the file holds ${size.width}px`,
      );
    }
    if (usage.sourceWidth > usage.layoutWidth) {
      warnings.push(`${usage.where}: ${usage.publicPath} declares sourceWidth above the ${usage.layoutWidth}px layout; the cap has no effect`);
    }
  } else if (size.width < usage.layoutWidth) {
    errors.push(
      `${usage.where}: ${usage.publicPath} holds ${size.width}px but the ${usage.layoutWidth}px ${usage.layoutWidth === 576 ? 'portrait' : 'wide'} frame would upscale it; declare sourceWidth: ${size.width} or supply a larger source`,
    );
  }
}

for (const message of warnings) console.warn(`WARN  ${message}`);
for (const message of errors) console.error(`ERROR ${message}`);
console.log(
  `Essay figure audit: ${essays.length} essays, ${checked.size} local image usages, ${errors.length} errors, ${warnings.length} warnings`,
);

if (errors.length > 0) process.exit(1);
