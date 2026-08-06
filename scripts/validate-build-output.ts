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
type BudgetResult = {
  kind: 'entry' | 'route' | 'asset' | 'total';
  source: string;
  file?: string;
  actualBytes: number;
  budgetBytes: number;
  passed: boolean;
};

const root = process.cwd();
const dist = path.join(root, 'dist');
const manifestPath = path.join(dist, '.vite', 'manifest.json');
const reportPath = path.join(dist, 'build-budget-report.json');
const failures: string[] = [];
const measurements: BudgetResult[] = [];

const ENTRY_BUDGET_BYTES = 665_000;
const SINGLE_JS_BUDGET_BYTES = 665_000;
const TOTAL_JS_BUDGET_BYTES = 1_800_000;
const TOTAL_CSS_BUDGET_BYTES = 300_000;

const routeContract = JSON.parse(fs.readFileSync(path.join(root, 'src/routes/route-contract.json'), 'utf8')) as {
  routes: Array<{ module: string; budgetBytes: number }>;
};
const routeBudgets = new Map<string, number>(
  routeContract.routes.map((route) => [route.module, route.budgetBytes]),
);

function expect(condition: unknown, message: string) {
  if (!condition) failures.push(message);
}

function sizeOf(relativeFile: string) {
  const absolute = path.join(dist, relativeFile);
  expect(fs.existsSync(absolute), `manifest asset is missing from dist: ${relativeFile}`);
  return fs.existsSync(absolute) ? fs.statSync(absolute).size : 0;
}

function measure(kind: BudgetResult['kind'], source: string, actualBytes: number, budgetBytes: number, file?: string) {
  const passed = actualBytes <= budgetBytes;
  measurements.push({ kind, source, file, actualBytes, budgetBytes, passed });
  expect(passed, `${source} exceeds raw budget: ${file ?? source} (${actualBytes} > ${budgetBytes} bytes)`);
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

function formatKiB(bytes: number) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
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
    measure('entry', 'production entry', sizeOf(main.file), ENTRY_BUDGET_BYTES, main.file);
  }

  const routeRecords = [...routeBudgets].map(([source, budgetBytes]) => {
    const key = Object.keys(manifest).find((candidate) => candidate === source || manifest[candidate]?.src === source);
    const chunk = key ? manifest[key] : undefined;
    expect(Boolean(chunk), `route module is absent from the build manifest: ${source}`);
    expect(chunk?.isDynamicEntry === true, `route must remain a lazy dynamic entry: ${source}`);
    if (chunk) {
      const bytes = sizeOf(chunk.file);
      expect(bytes > 0, `route chunk is empty: ${chunk.file}`);
      measure('route', source, bytes, budgetBytes, chunk.file);
    }
    return key && chunk ? { key, chunk } : null;
  }).filter((record): record is { key: string; chunk: ManifestChunk } => Boolean(record));

  const uniqueRouteFiles = new Set(routeRecords.map(({ chunk }) => chunk.file));
  expect(uniqueRouteFiles.size === routeBudgets.size, `route splitting must keep ${routeBudgets.size} distinct chunks, found ${uniqueRouteFiles.size}`);

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
      measure('asset', 'single JavaScript asset', bytes, SINGLE_JS_BUDGET_BYTES, file);
    }
    if (file.endsWith('.css')) totalCss += bytes;
  }

  measure('total', 'total JavaScript', totalJs, TOTAL_JS_BUDGET_BYTES);
  measure('total', 'total CSS', totalCss, TOTAL_CSS_BUDGET_BYTES);

  console.log('\nProduction build budget report:');
  for (const item of measurements.filter((entry) => entry.kind !== 'asset' || !entry.passed)) {
    const label = item.file ? `${item.source} (${item.file})` : item.source;
    console.log(`- ${label}: ${formatKiB(item.actualBytes)} / ${formatKiB(item.budgetBytes)} ${item.passed ? 'OK' : 'FAIL'}`);
  }
  console.log(`Build audit: ${uniqueRouteFiles.size} named route chunks, ${formatKiB(totalJs)} JS, ${formatKiB(totalCss)} CSS.`);
}

fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify({
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  budgets: {
    entryBytes: ENTRY_BUDGET_BYTES,
    singleJsBytes: SINGLE_JS_BUDGET_BYTES,
    totalJsBytes: TOTAL_JS_BUDGET_BYTES,
    totalCssBytes: TOTAL_CSS_BUDGET_BYTES,
    routes: Object.fromEntries(routeBudgets),
  },
  measurements,
  failures,
  passed: failures.length === 0,
}, null, 2)}\n`);

if (failures.length) {
  console.error('\nBuild output validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Build output validation passed. Report: ${path.relative(root, reportPath)}`);
