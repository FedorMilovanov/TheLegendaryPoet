import fs from 'node:fs';
import path from 'node:path';

type ManifestChunk = {
  file: string;
  src?: string;
  isEntry?: boolean;
  isDynamicEntry?: boolean;
  imports?: string[];
  dynamicImports?: string[];
  css?: string[];
};

type Manifest = Record<string, ManifestChunk>;

const root = process.cwd();
const dist = path.join(root, 'dist');
const manifestPath = path.join(dist, '.vite', 'manifest.json');
const failures: string[] = [];

const routeSources = [
  'src/pages/HomePage.tsx',
  'src/pages/HallPage.tsx',
  'src/pages/PoetsPage.tsx',
  'src/pages/PoetDetailPage.tsx',
  'src/pages/RatingsPage.tsx',
  'src/pages/ArticlesPage.tsx',
  'src/pages/ArticleDetailPage.tsx',
  'src/pages/EssayPage.tsx',
  'src/pages/MusicPage.tsx',
  'src/pages/TrackDetailPage.tsx',
  'src/pages/AboutPage.tsx',
  'src/pages/MyArchivePage.tsx',
  'src/pages/NotFoundPage.tsx',
];

function expect(condition: unknown, message: string) {
  if (!condition) failures.push(message);
}

function sizeOf(relativeFile: string) {
  const absolute = path.join(dist, relativeFile);
  expect(fs.existsSync(absolute), `manifest asset is missing from dist: ${relativeFile}`);
  return fs.existsSync(absolute) ? fs.statSync(absolute).size : 0;
}

function collectEagerImports(manifest: Manifest, entryKey: string) {
  const visited = new Set<string>();
  const queue = [entryKey];
  while (queue.length) {
    const key = queue.shift();
    if (!key || visited.has(key)) continue;
    visited.add(key);
    for (const imported of manifest[key]?.imports ?? []) queue.push(imported);
  }
  return visited;
}

if (!fs.existsSync(manifestPath)) {
  failures.push('dist/.vite/manifest.json is missing; build.manifest must remain enabled');
} else {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Manifest;
  const entryRecords = Object.entries(manifest).filter(([, chunk]) => chunk.isEntry === true);
  expect(entryRecords.length === 1, `production build must expose exactly one entry, found ${entryRecords.length}`);

  const [entryKey, main] = entryRecords[0] ?? [];
  if (entryKey && main) {
    expect(entryKey === 'index.html' || main.src === 'index.html', `unexpected production entry: ${entryKey}`);
    const entryBytes = sizeOf(main.file);
    expect(entryBytes <= 700_000, `entry chunk exceeds 700 KB raw budget: ${main.file} (${entryBytes} bytes)`);
  }

  const routeRecords = routeSources.map((source) => {
    const key = Object.keys(manifest).find((candidate) => candidate === source || manifest[candidate]?.src === source);
    const chunk = key ? manifest[key] : undefined;
    expect(Boolean(chunk), `route module is absent from the build manifest: ${source}`);
    expect(chunk?.isDynamicEntry === true, `route must remain a lazy dynamic entry: ${source}`);
    if (chunk) {
      const bytes = sizeOf(chunk.file);
      expect(bytes > 0, `route chunk is empty: ${chunk.file}`);
      expect(bytes <= 1_300_000, `route chunk exceeds 1.3 MB raw budget: ${chunk.file} (${bytes} bytes)`);
    }
    return key && chunk ? { key, chunk } : null;
  }).filter((record): record is { key: string; chunk: ManifestChunk } => Boolean(record));

  const uniqueRouteFiles = new Set(routeRecords.map(({ chunk }) => chunk.file));
  expect(uniqueRouteFiles.size >= 10, `route splitting collapsed to only ${uniqueRouteFiles.size} distinct chunks`);

  if (entryKey && main) {
    const eagerImports = collectEagerImports(manifest, entryKey);
    for (const { key } of routeRecords) {
      expect(!eagerImports.has(key), `lazy route entered the eager dependency graph: ${key}`);
    }
  }

  const emittedFiles = new Set<string>();
  for (const chunk of Object.values(manifest)) {
    emittedFiles.add(chunk.file);
    for (const css of chunk.css ?? []) emittedFiles.add(css);
  }

  let totalJs = 0;
  let totalCss = 0;
  for (const file of emittedFiles) {
    const bytes = sizeOf(file);
    if (file.endsWith('.js')) {
      totalJs += bytes;
      expect(bytes <= 1_900_000, `single JavaScript asset exceeds 1.9 MB raw budget: ${file} (${bytes} bytes)`);
    }
    if (file.endsWith('.css')) totalCss += bytes;
  }

  expect(totalJs <= 9_000_000, `total JavaScript exceeds 9 MB raw budget (${totalJs} bytes)`);
  expect(totalCss <= 2_000_000, `total CSS exceeds 2 MB raw budget (${totalCss} bytes)`);

  console.log(`Build audit: ${uniqueRouteFiles.size} route chunks, ${(totalJs / 1024).toFixed(1)} KiB JS, ${(totalCss / 1024).toFixed(1)} KiB CSS.`);
}

if (failures.length) {
  console.error('\nBuild output validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Build output validation passed.');
