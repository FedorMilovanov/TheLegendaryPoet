import fs from 'node:fs';
import path from 'node:path';

interface ManifestEntry {
  file: string;
  src?: string;
  isEntry?: boolean;
  isDynamicEntry?: boolean;
  imports?: string[];
  dynamicImports?: string[];
}

const manifestPath = path.resolve('dist', '.vite', 'manifest.json');
const errors: string[] = [];

if (!fs.existsSync(manifestPath)) {
  console.error('ERROR missing dist/.vite/manifest.json');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Record<string, ManifestEntry>;
const entries = Object.entries(manifest);

const requiredRoutes = [
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
] as const;

const deferredDataModules = ['src/components/command/commandItems.ts'] as const;

function findEntry(source: string): [string, ManifestEntry] | undefined {
  return entries.find(([key, entry]) => key === source || entry.src === source);
}

const shell =
  findEntry('src/main.tsx') ??
  entries.find(
    ([key, entry]) =>
      entry.isEntry === true && (key === 'index.html' || entry.src === 'index.html'),
  );
let shellFile = '';
if (!shell) {
  errors.push('missing application shell manifest entry (src/main.tsx or index.html)');
} else {
  const [, entry] = shell;
  shellFile = entry.file;
  if (!entry.isEntry) errors.push('application shell is not marked as the build entry');
  if (!fs.existsSync(path.resolve('dist', entry.file))) {
    errors.push(`main entry points to missing file ${entry.file}`);
  }
}

const routeFiles = new Set<string>();
for (const source of requiredRoutes) {
  const found = findEntry(source);
  if (!found) {
    errors.push(`${source}: missing manifest entry`);
    continue;
  }

  const [, entry] = found;
  if (!entry.isDynamicEntry) errors.push(`${source}: route is not a dynamic entry`);
  if (!entry.file.endsWith('.js')) errors.push(`${source}: route output is not JavaScript (${entry.file})`);
  if (!fs.existsSync(path.resolve('dist', entry.file))) errors.push(`${source}: emitted file is missing (${entry.file})`);
  if (routeFiles.has(entry.file)) errors.push(`${source}: unexpectedly shares the same facade file ${entry.file}`);
  if (entry.file === shellFile) errors.push(`${source}: route collapsed back into the persistent shell`);
  routeFiles.add(entry.file);
}

if (routeFiles.size !== requiredRoutes.length) {
  errors.push(`expected ${requiredRoutes.length} distinct route facades, found ${routeFiles.size}`);
}

const deferredFiles = new Set<string>();
for (const source of deferredDataModules) {
  const found = findEntry(source);
  if (!found) {
    errors.push(`${source}: missing deferred-data manifest entry`);
    continue;
  }

  const [, entry] = found;
  if (!entry.isDynamicEntry) errors.push(`${source}: heavy data registry is not a dynamic entry`);
  if (!fs.existsSync(path.resolve('dist', entry.file))) errors.push(`${source}: emitted deferred-data file is missing (${entry.file})`);
  if (entry.file === shellFile) errors.push(`${source}: heavy data registry collapsed into the shell`);
  deferredFiles.add(entry.file);
}

for (const error of errors) console.error(`ERROR ${error}`);
console.log(
  `Route chunk validation: ${requiredRoutes.length} routes, ${routeFiles.size} route facades, ${deferredFiles.size} deferred data chunks, ${errors.length} errors`,
);
if (errors.length > 0) process.exit(1);
