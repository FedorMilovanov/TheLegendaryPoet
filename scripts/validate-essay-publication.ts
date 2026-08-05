import { readFileSync } from 'node:fs';
import { estimateReadTime } from '../src/utils/readTime';
import type { Essay } from '../src/types/essay';

interface RawEssayModule {
  path: string;
  exportName: string;
}

const rawModules: RawEssayModule[] = [
  { path: '../src/data/essays/lermontovRoadEssay', exportName: 'lermontovRoadEssay' },
  { path: '../src/data/essays/yeseninVisual', exportName: 'yeseninKutezhiVisual' },
  { path: '../src/data/essays/yeseninPartOnePublic', exportName: 'yeseninPartOnePublic' },
  { path: '../src/data/essays/yeseninPartTwoPublic', exportName: 'yeseninPartTwoPublic' },
  {
    path: '../src/data/essays/yeseninDuncanFirstMeetingPublished',
    exportName: 'yeseninDuncanFirstMeetingPublished',
  },
  { path: '../src/data/essays/mayakovskyPartOne', exportName: 'mayakovskyPartOne' },
  { path: '../src/data/essays/mayakovskyPartTwoVisual', exportName: 'mayakovskyPartTwo' },
  { path: '../src/data/essays/brikCaseVisual', exportName: 'brikCaseVisual' },
];

const rawEssays = new Map<string, Essay>();
const rawSnapshots = new Map<string, string>();

for (const entry of rawModules) {
  const module = await import(entry.path);
  const essay = module[entry.exportName] as Essay | undefined;
  if (!essay) throw new Error(`missing raw essay export ${entry.exportName} from ${entry.path}`);
  rawEssays.set(essay.slug, essay);
  rawSnapshots.set(essay.slug, JSON.stringify(essay));
}

const { getAllEssays, getEssayBySlug } = await import('../src/data/essays/index');
const catalog = getAllEssays();

function assertDeepFrozen(value: unknown, path: string, seen = new Set<object>()): void {
  if (!value || typeof value !== 'object') return;
  if (seen.has(value)) return;
  seen.add(value);

  if (!Object.isFrozen(value)) throw new Error(`published essay value is mutable: ${path}`);
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    assertDeepFrozen(nested, `${path}.${key}`, seen);
  }
}

if (!Object.isFrozen(catalog)) throw new Error('published essay catalog array is mutable');
if (getAllEssays() !== catalog) throw new Error('getAllEssays does not return one stable catalog identity');

const ids = new Set<string>();
const slugs = new Set<string>();
for (const essay of catalog) {
  if (ids.has(essay.id)) throw new Error(`duplicate published essay id: ${essay.id}`);
  if (slugs.has(essay.slug)) throw new Error(`duplicate published essay slug: ${essay.slug}`);
  ids.add(essay.id);
  slugs.add(essay.slug);

  if (getEssayBySlug(essay.slug) !== essay) {
    throw new Error(`getEssayBySlug does not return the canonical object: ${essay.slug}`);
  }

  const expectedReadTime = estimateReadTime(essay.blocks);
  if (essay.readTime !== expectedReadTime) {
    throw new Error(
      `published readTime drift for ${essay.slug}: ${essay.readTime} !== ${expectedReadTime}`,
    );
  }

  assertDeepFrozen(essay, `essay:${essay.slug}`);

  const raw = rawEssays.get(essay.slug);
  if (!raw) throw new Error(`published essay has no declared authoring input: ${essay.slug}`);
  if (raw === essay) throw new Error(`published essay reuses mutable authoring identity: ${essay.slug}`);
}

for (const [slug, raw] of rawEssays) {
  const before = rawSnapshots.get(slug);
  const after = JSON.stringify(raw);
  if (before !== after) throw new Error(`authoring module was mutated while publishing: ${slug}`);
}

const catalogSource = readFileSync('src/data/essays/index.ts', 'utf8');
for (const forbidden of [
  /yeseninPartTwoPublic\.(?:sources|blocks)\s*=/,
  /for\s*\(const essay of essays\)[\s\S]{0,160}essay\.readTime\s*=/,
]) {
  if (forbidden.test(catalogSource)) {
    throw new Error(`catalog contains forbidden post-import mutation: ${forbidden}`);
  }
}

const canonicalConsumers = [
  'src/pages/ArticlesPage.tsx',
  'src/pages/EssayPage.tsx',
  'scripts/gen-essay-search-index.ts',
  'scripts/validate-essay-search-index.ts',
  'scripts/gen-sitemap.mjs',
  'scripts/gen-feed.mjs',
  'scripts/prerender-og.mjs',
  'scripts/validate-library.ts',
  'scripts/validate-essays.ts',
  'scripts/validate-citations.ts',
  'scripts/validate-essay-covers.ts',
  'scripts/validate-literary-style.ts',
];

for (const file of canonicalConsumers) {
  const source = readFileSync(file, 'utf8');
  if (!source.includes('getAllEssays')) {
    throw new Error(`canonical essay consumer bypasses getAllEssays: ${file}`);
  }
  if (/import\s*\{[^}]*\bessays\b[^}]*\}\s*from\s*['"][^'"]*data\/essays/.test(source)) {
    throw new Error(`canonical essay consumer imports the catalog array directly: ${file}`);
  }
}

console.log(
  `Essay publication contract: ${catalog.length} immutable essays, stable catalog identity, derived readTime, untouched authoring modules, one consumer API.`,
);
