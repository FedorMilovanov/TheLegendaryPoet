import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

interface Target {
  id: `VBA16-${string}`;
  title: string;
  authority: 'РГАЛИ' | 'Library of Congress';
  recordUrl: string;
  downloadUrl: string;
  required: boolean;
  expectedKinds: readonly ImageKind[];
  attribution: string;
  rightsBoundary: string;
}

type ImageKind = 'jpeg' | 'png' | 'gif' | 'webp' | 'tiff';
type AcquisitionState =
  | 'acquired'
  | 'http-error'
  | 'html-response'
  | 'unsupported-bytes'
  | 'network-error';

interface Dimensions {
  width: number;
  height: number;
}

interface Result {
  id: string;
  title: string;
  authority: string;
  recordUrl: string;
  requestedUrl: string;
  finalUrl: string | null;
  required: boolean;
  state: AcquisitionState;
  httpStatus: number | null;
  contentType: string | null;
  kind: ImageKind | null;
  bytes: number;
  sha256: string | null;
  dimensions: Dimensions | null;
  savedPath: string | null;
  attribution: string;
  rightsBoundary: string;
  error: string | null;
}

const targets: readonly Target[] = [
  {
    id: 'VBA16-RGALI-86424',
    title: 'С. А. Есенин. Фотография. 1915',
    authority: 'РГАЛИ',
    recordUrl: 'https://www.rgali.ru/news-new/1320',
    downloadUrl: 'https://www.rgali.ru/image/86424/n',
    required: false,
    expectedKinds: ['jpeg', 'png', 'webp'],
    attribution: 'Российский государственный архив литературы и искусства; official exhibition item 86424.',
    rightsBoundary: 'Acquisition is for editorial verification only; production reuse requires an explicit RGALI rights decision.',
  },
  {
    id: 'VBA16-RGALI-86425',
    title: 'Выпись из метрической книги о рождении С. А. Есенина',
    authority: 'РГАЛИ',
    recordUrl: 'https://www.rgali.ru/news-new/1320',
    downloadUrl: 'https://www.rgali.ru/image/86425/n',
    required: false,
    expectedKinds: ['jpeg', 'png', 'webp'],
    attribution: 'Российский государственный архив литературы и искусства; official exhibition item 86425.',
    rightsBoundary: 'Primary-document bytes may be inspected and hashed; republication remains unauthorized.',
  },
  {
    id: 'VBA16-RGALI-86426',
    title: 'Автограф «Край ты мой заброшенный…». 1914',
    authority: 'РГАЛИ',
    recordUrl: 'https://www.rgali.ru/news-new/1320',
    downloadUrl: 'https://www.rgali.ru/image/86426/n',
    required: false,
    expectedKinds: ['jpeg', 'png', 'webp'],
    attribution: 'Российский государственный архив литературы и искусства; official exhibition item 86426.',
    rightsBoundary: 'No generative restoration or production reuse without a separate rights decision.',
  },
  {
    id: 'VBA16-RGALI-86427',
    title: 'Записка С. А. Есенина А. А. Блоку. 9 марта 1915',
    authority: 'РГАЛИ',
    recordUrl: 'https://www.rgali.ru/news-new/1320',
    downloadUrl: 'https://www.rgali.ru/image/86427/n',
    required: false,
    expectedKinds: ['jpeg', 'png', 'webp'],
    attribution: 'Российский государственный архив литературы и искусства; official exhibition item 86427.',
    rightsBoundary: 'Acquired bytes do not authorize republication; preserve handwriting and Blok annotation without AI repair.',
  },
  {
    id: 'VBA16-RGALI-86428',
    title: 'Афиша вечера памяти декабристов. 14 декабря 1917',
    authority: 'РГАЛИ',
    recordUrl: 'https://www.rgali.ru/news-new/1320',
    downloadUrl: 'https://www.rgali.ru/image/86428/n',
    required: false,
    expectedKinds: ['jpeg', 'png', 'webp'],
    attribution: 'Российский государственный архив литературы и искусства; official exhibition item 86428.',
    rightsBoundary: 'Editorial verification only until RGALI reproduction permission is established.',
  },
  {
    id: 'VBA16-RGALI-86429',
    title: 'Автограф «Разбуди меня завтра рано». 1917',
    authority: 'РГАЛИ',
    recordUrl: 'https://www.rgali.ru/news-new/1320',
    downloadUrl: 'https://www.rgali.ru/image/86429/n',
    required: false,
    expectedKinds: ['jpeg', 'png', 'webp'],
    attribution: 'Российский государственный архив литературы и искусства; official exhibition item 86429.',
    rightsBoundary: 'No production use and no synthetic reconstruction before explicit authorization.',
  },
  {
    id: 'VBA16-RGALI-86430',
    title: 'С. А. Есенин. Фотография. 1921 — начало 1922',
    authority: 'РГАЛИ',
    recordUrl: 'https://www.rgali.ru/news-new/1320',
    downloadUrl: 'https://www.rgali.ru/image/86430/n',
    required: false,
    expectedKinds: ['jpeg', 'png', 'webp'],
    attribution: 'Российский государственный архив литературы и искусства; official exhibition item 86430.',
    rightsBoundary: 'Do not caption as the Duncan meeting; production rights unresolved.',
  },
  {
    id: 'VBA16-RGALI-86431',
    title: 'Листовка имажинистов «Всеобщая мобилизация…». 12 июня 1921',
    authority: 'РГАЛИ',
    recordUrl: 'https://www.rgali.ru/news-new/1320',
    downloadUrl: 'https://www.rgali.ru/image/86431/n',
    required: false,
    expectedKinds: ['jpeg', 'png', 'webp'],
    attribution: 'Российский государственный архив литературы и искусства; official exhibition item 86431.',
    rightsBoundary: 'Primary typographic object; bytes may be verified, but production reuse remains unauthorized.',
  },
  {
    id: 'VBA16-LOC-7A14235',
    title: 'Isadora Duncan dancer, portrait photograph',
    authority: 'Library of Congress',
    recordUrl: 'https://www.loc.gov/pictures/item/2018708185/',
    downloadUrl: 'https://tile.loc.gov/storage-services/service/pnp/agc/7a14000/7a14200/7a14235v.jpg',
    required: true,
    expectedKinds: ['jpeg'],
    attribution: 'Arnold Genthe; Genthe photograph collection, Library of Congress, Prints and Photographs Division; LC-DIG-agc-7a14235.',
    rightsBoundary: 'LOC states no known restrictions on publication; date is only 1915–1923 and must not be narrowed to Moscow 1921.',
  },
  {
    id: 'VBA16-LOC-7A00247',
    title: 'Isadora Duncan dancers',
    authority: 'Library of Congress',
    recordUrl: 'https://www.loc.gov/pictures/item/2018708234/',
    downloadUrl: 'https://tile.loc.gov/storage-services/service/pnp/agc/7a00000/7a00200/7a00247v.jpg',
    required: true,
    expectedKinds: ['jpeg'],
    attribution: 'Arnold Genthe; Genthe photograph collection, Library of Congress, Prints and Photographs Division; LC-DIG-agc-7a00247.',
    rightsBoundary: 'No known restrictions on publication; image is contextual and does not document the Moscow school or Esenin meeting.',
  },
  {
    id: 'VBA16-LOC-7A00253',
    title: 'Isadora Duncan dancers',
    authority: 'Library of Congress',
    recordUrl: 'https://www.loc.gov/pictures/item/2018708261/',
    downloadUrl: 'https://tile.loc.gov/storage-services/service/pnp/agc/7a00000/7a00200/7a00253v.jpg',
    required: true,
    expectedKinds: ['jpeg'],
    attribution: 'Arnold Genthe; Genthe photograph collection, Library of Congress, Prints and Photographs Division; LC-DIG-agc-7a00253.',
    rightsBoundary: 'No known restrictions on publication; image must not be represented as Russia or a dated Esenin event.',
  },
  {
    id: 'VBA16-LOC-BAIN-05654',
    title: 'Isadora Duncan',
    authority: 'Library of Congress',
    recordUrl: 'https://www.loc.gov/pictures/item/2014685647/',
    downloadUrl: 'https://cdn.loc.gov/service/pnp/ggbain/05600/05654v.jpg',
    required: true,
    expectedKinds: ['jpeg'],
    attribution: 'Bain News Service; George Grantham Bain Collection, Library of Congress; LC-DIG-ggbain-05654.',
    rightsBoundary: 'No known restrictions on publication; caption-card date is absent, so no precise date or Moscow attribution is allowed.',
  },
] as const satisfies readonly Target[];

const root = 'artifacts/yesenin-visual-byte-acquisition-pass16';
const originalsDir = join(root, 'originals');
await mkdir(originalsDir, { recursive: true });

function identifyKind(bytes: Uint8Array): ImageKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  if (bytes.length >= 8 && Buffer.from(bytes.subarray(0, 8)).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(Buffer.from(bytes.subarray(0, 6)).toString('ascii'))) return 'gif';
  if (bytes.length >= 12 && Buffer.from(bytes.subarray(0, 4)).toString('ascii') === 'RIFF' && Buffer.from(bytes.subarray(8, 12)).toString('ascii') === 'WEBP') return 'webp';
  if (bytes.length >= 4) {
    const prefix = Buffer.from(bytes.subarray(0, 4)).toString('hex');
    if (prefix === '49492a00' || prefix === '4d4d002a') return 'tiff';
  }
  return null;
}

function dimensions(bytes: Uint8Array, kind: ImageKind): Dimensions | null {
  const buffer = Buffer.from(bytes);
  if (kind === 'png' && buffer.length >= 24) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (kind === 'gif' && buffer.length >= 10) {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  }
  if (kind === 'webp' && buffer.length >= 30) {
    const chunk = buffer.subarray(12, 16).toString('ascii');
    if (chunk === 'VP8X') {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3),
      };
    }
  }
  if (kind === 'jpeg') {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      offset += 2;
      if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > buffer.length) break;
      const length = buffer.readUInt16BE(offset);
      if (length < 2 || offset + length > buffer.length) break;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
      }
      offset += length;
    }
  }
  return null;
}

function extension(kind: ImageKind): string {
  return ({ jpeg: '.jpg', png: '.png', gif: '.gif', webp: '.webp', tiff: '.tif' } as const)[kind];
}

async function acquire(target: Target): Promise<Result> {
  try {
    const response = await fetch(target.downloadUrl, {
      redirect: 'follow',
      headers: {
        'user-agent': 'TheLegendaryPoet archival verification runner/1.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)',
        accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif,image/tiff,*/*;q=0.1',
      },
      signal: AbortSignal.timeout(60_000),
    });
    const contentType = response.headers.get('content-type');
    if (!response.ok) {
      return {
        ...target,
        requestedUrl: target.downloadUrl,
        finalUrl: response.url || null,
        state: 'http-error',
        httpStatus: response.status,
        contentType,
        kind: null,
        bytes: 0,
        sha256: null,
        dimensions: null,
        savedPath: null,
        error: `HTTP ${response.status} ${response.statusText}`,
      };
    }
    const body = new Uint8Array(await response.arrayBuffer());
    const kind = identifyKind(body);
    if (!kind) {
      const sample = Buffer.from(body.subarray(0, 200)).toString('utf8').replace(/\s+/g, ' ').trim();
      const html = /text\/html/i.test(contentType ?? '') || /^\s*<!doctype html|^\s*<html/i.test(sample);
      return {
        ...target,
        requestedUrl: target.downloadUrl,
        finalUrl: response.url || null,
        state: html ? 'html-response' : 'unsupported-bytes',
        httpStatus: response.status,
        contentType,
        kind: null,
        bytes: body.byteLength,
        sha256: createHash('sha256').update(body).digest('hex'),
        dimensions: null,
        savedPath: null,
        error: `Unexpected payload; prefix=${JSON.stringify(sample.slice(0, 120))}`,
      };
    }
    if (!target.expectedKinds.includes(kind)) {
      return {
        ...target,
        requestedUrl: target.downloadUrl,
        finalUrl: response.url || null,
        state: 'unsupported-bytes',
        httpStatus: response.status,
        contentType,
        kind,
        bytes: body.byteLength,
        sha256: createHash('sha256').update(body).digest('hex'),
        dimensions: dimensions(body, kind),
        savedPath: null,
        error: `Expected ${target.expectedKinds.join('/')}, received ${kind}`,
      };
    }
    const sha256 = createHash('sha256').update(body).digest('hex');
    const path = join(originalsDir, `${target.id}${extension(kind)}`);
    await writeFile(path, body);
    return {
      ...target,
      requestedUrl: target.downloadUrl,
      finalUrl: response.url || null,
      state: 'acquired',
      httpStatus: response.status,
      contentType,
      kind,
      bytes: body.byteLength,
      sha256,
      dimensions: dimensions(body, kind),
      savedPath: path,
      error: null,
    };
  } catch (error) {
    return {
      ...target,
      requestedUrl: target.downloadUrl,
      finalUrl: null,
      state: 'network-error',
      httpStatus: null,
      contentType: null,
      kind: null,
      bytes: 0,
      sha256: null,
      dimensions: null,
      savedPath: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

const results: Result[] = [];
for (const target of targets) {
  console.log(`ACQUIRE ${target.id} ${target.downloadUrl}`);
  const result = await acquire(target);
  results.push(result);
  console.log(`${result.state.toUpperCase()} ${target.id} bytes=${result.bytes} sha=${result.sha256 ?? '-'} dims=${result.dimensions ? `${result.dimensions.width}x${result.dimensions.height}` : '-'}`);
}

const acquired = results.filter((result) => result.state === 'acquired');
const failedRequired = results.filter((result) => result.required && result.state !== 'acquired');
const manifest = {
  schema: 'yesenin-visual-byte-acquisition-pass16/v1',
  generatedAt: new Date().toISOString(),
  productionAuthorized: false,
  syntheticContentUsed: false,
  targets: targets.length,
  acquired: acquired.length,
  requiredAcquired: results.filter((result) => result.required && result.state === 'acquired').length,
  rgaliAcquired: results.filter((result) => result.authority === 'РГАЛИ' && result.state === 'acquired').length,
  locAcquired: results.filter((result) => result.authority === 'Library of Congress' && result.state === 'acquired').length,
  results,
};
await writeFile(join(root, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const rows = results.map((result) => [
  result.id,
  result.authority,
  result.state,
  result.httpStatus ?? '—',
  result.kind ?? '—',
  result.bytes,
  result.dimensions ? `${result.dimensions.width}×${result.dimensions.height}` : '—',
  result.sha256 ?? '—',
].join(' | '));
const summary = `# Yesenin visual byte acquisition — pass 16\n\n`
  + `- Generated: ${manifest.generatedAt}\n`
  + `- Targets: ${manifest.targets}\n`
  + `- Acquired: ${manifest.acquired}\n`
  + `- LOC required acquired: ${manifest.requiredAcquired}/4\n`
  + `- RGALI acquired: ${manifest.rgaliAcquired}/8\n`
  + `- Production authorized: false\n`
  + `- Synthetic content used: false\n\n`
  + `ID | Authority | State | HTTP | Kind | Bytes | Dimensions | SHA-256\n`
  + `--- | --- | --- | ---: | --- | ---: | --- | ---\n`
  + `${rows.join('\n')}\n`;
await writeFile(join(root, 'SUMMARY.md'), summary, 'utf8');

if (failedRequired.length > 0) {
  throw new Error(`Required LOC acquisitions failed: ${failedRequired.map((result) => `${result.id}:${result.state}`).join(', ')}`);
}
