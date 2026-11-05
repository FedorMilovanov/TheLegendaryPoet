import { readFileSync } from 'node:fs';
import { estimateReadTime } from '../src/utils/readTime';
import { sectionAnchor } from '../src/components/essay/anchor';
import type { Essay } from '../src/types/essay';

interface RawEssayModule {
  path: string;
  exportName: string;
}

const rawModules: RawEssayModule[] = [
  { path: '../src/data/essays/simonovSonArtilleristaDraft', exportName: 'simonovSonArtilleristaDraft' },
  { path: '../src/data/essays/benislavskayaDraft', exportName: 'benislavskayaDraft' },
  { path: '../src/data/essays/lermontovRoadEssay', exportName: 'lermontovRoadEssay' },
  { path: '../src/data/essays/prorokDraft', exportName: 'prorokDraft' },
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

/**
 * Recent independently reviewed editorial essays must retain their verified
 * bibliography and section identities after registration in the public catalog.
 * This check runs in the canonical publication pipeline, not a parallel CI job.
 */
const reviewedEditorialModules: RawEssayModule[] = [
  { path: '../src/data/essays/prorokDraft', exportName: 'prorokDraft' },
];

for (const entry of reviewedEditorialModules) {
  const module = await import(entry.path);
  const draft = module[entry.exportName] as Essay | undefined;
  if (!draft) throw new Error(`missing reviewed editorial export ${entry.exportName}`);
  const slug = draft.slug;
  const assert = (ok: unknown, reason: string) => {
    if (!ok) throw new Error(`reviewed essay ${slug}: ${reason}`);
  };

  assert(/^[a-z0-9-]+$/.test(slug), 'invalid slug');
  assert(draft.id?.trim() && draft.title?.trim() && draft.excerpt?.trim(), 'missing identity or title');
  assert(draft.blocks.length && draft.sources?.length, 'empty content or bibliography');
  assert(/^\d{4}-\d{2}-\d{2}$/.test(draft.date) && draft.cover.startsWith('/images/'),
    'published essay requires reviewed date and local cover');
  assert(draft.readTime === estimateReadTime(draft.blocks), 'readTime drift');
  assert(catalog.some((item) => item.id === draft.id && item.slug === slug && item.cover === draft.cover),
    'reviewed essay must be registered in the canonical published catalog with its approved cover');

  const ids = new Set<string>();
  const urls = new Set<string>();
  for (const source of draft.sources ?? []) {
    assert(source.id && /^[a-z0-9-]+$/.test(source.id) && !ids.has(source.id),
      `missing or duplicate source ID: ${source.id ?? '(none)'}`);
    ids.add(source.id!);
    assert(source.title.trim() && source.note?.trim(), `missing source title/note: ${source.id}`);
    assert(source.url, `missing source URL: ${source.id}`);
    let url: URL;
    try {
      url = new URL(source.url!);
    } catch {
      throw new Error(`staged essay ${slug}: invalid source URL: ${source.id}`);
    }
    assert(url.protocol === 'https:', `source URL must be HTTPS: ${source.id}`);
    const normalized = `${url.origin}${url.pathname.replace(/\/$/, '')}${url.search}`;
    assert(!urls.has(normalized), `duplicate source URL: ${source.id}`);
    urls.add(normalized);
  }

  const anchors = new Set<string>();
  const cited = new Set<string>();
  for (const [index, block] of draft.blocks.entries()) {
    if (block.type === 'section') {
      assert(block.heading.trim(), `empty heading at block ${index + 1}`);
      const id = sectionAnchor(block.heading, block.anchor);
      assert(id.trim() && !anchors.has(id), `duplicate or empty section anchor: ${id}`);
      anchors.add(id);
    }
    if ('text' in block && typeof block.text === 'string') {
      assert(block.text.trim(), `empty text at block ${index + 1}`);
    }
    if ('sourceIds' in block && block.sourceIds) {
      for (const id of block.sourceIds) {
        assert(ids.has(id), `block ${index + 1} cites missing source: ${id}`);
        cited.add(id);
      }
    }
  }
  for (const id of ids) assert(cited.has(id), `unused source: ${id}`);

  console.log(
    `Reviewed published essay ${slug}: ${draft.blocks.length} blocks, ${anchors.size} sections, ${ids.size} cited sources.`,
  );
}

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

const buildTimeCanonicalConsumers = [
  'scripts/gen-essay-browser-data.ts',
  'scripts/validate-essay-browser-data.ts',
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
  'scripts/validate-yesenin-part-two-publication.ts',
];
const browserPublishedConsumers = [
  'src/pages/HomePage.tsx',
  'src/pages/ArticlesPage.tsx',
  'src/pages/EssayPage.tsx',
  'src/components/poet-detail/RelatedEssays.tsx',
];

const catalogImportPattern = /from\s*['"][^'"]*data\/essays(?:\/index(?:\.ts)?)?['"]/;
const rawEssayImportPattern = /from\s*['"][^'"]*data\/essays\/(?!index(?:\.ts)?['"]|browserEssayData(?:\.ts)?['"])[^'"]+['"]/;
const browserAdapterImportPattern = /from\s*['"][^'"]*data\/essays\/browserEssayData(?:\.ts)?['"]/;

for (const file of buildTimeCanonicalConsumers) {
  const source = readFileSync(file, 'utf8');
  if (!catalogImportPattern.test(source)) {
    throw new Error(`build-time essay consumer bypasses the canonical catalog module: ${file}`);
  }
  if (rawEssayImportPattern.test(source)) {
    throw new Error(`build-time essay consumer imports an authoring module directly: ${file}`);
  }
}

for (const file of browserPublishedConsumers) {
  const source = readFileSync(file, 'utf8');
  if (!browserAdapterImportPattern.test(source)) {
    throw new Error(`browser essay consumer bypasses the generated publication adapter: ${file}`);
  }
  if (catalogImportPattern.test(source) || rawEssayImportPattern.test(source)) {
    throw new Error(`browser essay consumer reintroduces an eager canonical/authoring import: ${file}`);
  }
}

const browserAdapterSource = readFileSync('src/data/essays/browserEssayData.ts', 'utf8');
if (catalogImportPattern.test(browserAdapterSource) || rawEssayImportPattern.test(browserAdapterSource)) {
  throw new Error('browser essay adapter must remain payload-only and must not import the full corpus');
}

const generatorSource = readFileSync('scripts/gen-essay-browser-data.ts', 'utf8');
if (!catalogImportPattern.test(generatorSource)) {
  throw new Error('browser payload generator lost the canonical published catalog as its source');
}

console.log(
  `Essay publication contract: ${catalog.length} immutable essays, stable canonical catalog identity, derived readTime, untouched authoring modules, one canonical build-time boundary plus one generated browser publication adapter across ${browserPublishedConsumers.length} browser consumers.`,
);
