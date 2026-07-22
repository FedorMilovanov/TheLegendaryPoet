import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import { essayImageCatalog } from './essay-image-catalog.mjs';

const ROOT = process.cwd();
const ARCHIVE_DIR = path.join(ROOT, 'public/images/essays/archive');
const GENERATED_FILE = path.join(ROOT, 'src/generated/essayMedia.ts');
const TARGET_WIDTHS = [480, 768, 1120, 1600];
const USER_AGENT = 'TheLegendaryPoet/1.0 (archival image localization; https://github.com/FedorMilovanov/TheLegendaryPoet)';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchImage(url) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
        },
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const contentType = response.headers.get('content-type') ?? '';
      const buffer = Buffer.from(await response.arrayBuffer());
      if (!contentType.startsWith('image/') || buffer.length < 1024) {
        throw new Error(`unexpected payload (${contentType || 'unknown'}, ${buffer.length} bytes)`);
      }
      return buffer;
    } catch (error) {
      lastError = error;
      if (attempt < 4) await sleep(1200 * attempt * attempt);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error(`Cannot download ${url}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

function publicPath(filePath) {
  return `/${path.relative(path.join(ROOT, 'public'), filePath).split(path.sep).join('/')}`;
}

async function encodeVariant(input, outputPath, width, format) {
  const pipeline = sharp(input, { failOn: 'none' })
    .rotate()
    .resize({ width, withoutEnlargement: true, fit: 'inside', kernel: sharp.kernel.lanczos3 });

  if (format === 'avif') {
    await pipeline.avif({ quality: 57, effort: 6, chromaSubsampling: '4:2:0' }).toFile(outputPath);
  } else {
    await pipeline.webp({ quality: 80, effort: 6, smartSubsample: true }).toFile(outputPath);
  }
}

async function processRemote(entry) {
  const input = await fetchImage(entry.url);
  const metadata = await sharp(input, { failOn: 'none' }).rotate().metadata();
  if (!metadata.width || !metadata.height) throw new Error(`No dimensions for ${entry.key}`);

  const largestWidth = Math.min(metadata.width, 1600);
  const widths = [...new Set([...TARGET_WIDTHS.filter((width) => width < largestWidth), largestWidth])].sort((a, b) => a - b);
  const variants = { avif: [], webp: [] };

  for (const width of widths) {
    const suffix = width === largestWidth ? '' : `-${width}`;
    for (const format of ['avif', 'webp']) {
      const outputPath = path.join(ARCHIVE_DIR, `${entry.key}${suffix}.${format}`);
      await encodeVariant(input, outputPath, width, format);
      const actual = await sharp(outputPath).metadata();
      variants[format].push({ src: publicPath(outputPath), width: actual.width ?? width });
    }
  }

  const fallbackPath = path.join(ARCHIVE_DIR, `${entry.key}.webp`);
  const fallbackMeta = await sharp(fallbackPath).metadata();
  const lqip = await sharp(input, { failOn: 'none' })
    .rotate()
    .resize({ width: 32, withoutEnlargement: true })
    .webp({ quality: 34, effort: 4 })
    .toBuffer();

  return {
    width: fallbackMeta.width ?? largestWidth,
    height: fallbackMeta.height ?? Math.round((metadata.height / metadata.width) * largestWidth),
    fallback: publicPath(fallbackPath),
    placeholder: `data:image/webp;base64,${lqip.toString('base64')}`,
    avif: variants.avif,
    webp: variants.webp,
  };
}

async function optimizeLocalEssayMedia() {
  const root = path.join(ROOT, 'public/images/essays');
  const entries = [];

  async function walk(dir) {
    for (const item of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        if (full === ARCHIVE_DIR) continue;
        await walk(full);
      } else if (/\.(?:jpe?g|png|webp)$/i.test(item.name) && !/-640\.(?:webp|avif)$/i.test(item.name)) {
        entries.push(full);
      }
    }
  }

  await walk(root);
  for (const source of entries) {
    const ext = path.extname(source);
    const base = source.slice(0, -ext.length);
    const input = await fs.readFile(source);
    for (const width of [640, 1600]) {
      const suffix = width === 1600 ? '' : `-${width}`;
      const webpPath = `${base}${suffix}.webp`;
      if (webpPath !== source) await encodeVariant(input, webpPath, width, 'webp');
      await encodeVariant(input, `${base}${suffix}.avif`, width, 'avif');
    }
  }
}

function serializeManifest(entries) {
  return `/* AUTO-GENERATED by scripts/localize-essay-images.mjs. Do not edit manually. */\n\nexport interface EssayMediaVariant {\n  src: string;\n  width: number;\n}\n\nexport interface EssayMediaEntry {\n  width: number;\n  height: number;\n  fallback: string;\n  placeholder: string;\n  avif: EssayMediaVariant[];\n  webp: EssayMediaVariant[];\n}\n\nexport const essayMedia: Record<string, EssayMediaEntry> = ${JSON.stringify(entries, null, 2)};\n`;
}

await fs.mkdir(ARCHIVE_DIR, { recursive: true });
await fs.mkdir(path.dirname(GENERATED_FILE), { recursive: true });

const manifest = {};
for (const [index, entry] of essayImageCatalog.entries()) {
  process.stdout.write(`[${index + 1}/${essayImageCatalog.length}] ${entry.key}\n`);
  manifest[entry.key] = await processRemote(entry);
}

await optimizeLocalEssayMedia();
await fs.writeFile(GENERATED_FILE, serializeManifest(manifest));
console.log(`Localized ${essayImageCatalog.length} archival images and optimized local essay covers.`);
