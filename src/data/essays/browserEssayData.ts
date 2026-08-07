import type { Essay, EssaySummary } from '../../types/essay';

const baseUrl = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;
const payloadRoot = `${baseUrl}data/essays/`;
const validSlugPattern = /^[a-z0-9-]+$/;

let catalogPromise: Promise<readonly EssaySummary[]> | undefined;
const essayPromises = new Map<string, Promise<Essay | undefined>>();

function summaryOf(essay: Essay): EssaySummary {
  const { blocks: _blocks, sources: _sources, ...summary } = essay;
  return summary;
}

function assertSummary(value: unknown, label: string): EssaySummary {
  if (!value || typeof value !== 'object') throw new Error(`${label} is not an object`);
  const summary = value as Partial<EssaySummary>;
  if (
    typeof summary.id !== 'string'
    || typeof summary.slug !== 'string'
    || typeof summary.title !== 'string'
    || typeof summary.excerpt !== 'string'
    || typeof summary.author !== 'string'
    || typeof summary.date !== 'string'
    || typeof summary.readTime !== 'number'
    || typeof summary.cover !== 'string'
    || !Array.isArray(summary.tags)
  ) {
    throw new Error(`${label} is missing required Essay summary fields`);
  }
  return summary as EssaySummary;
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error(`Essay payload request failed (${response.status}) for ${url}`);
  }
  return response.json();
}

async function getDevCatalog(): Promise<readonly EssaySummary[]> {
  const { getAllEssays } = await import('./index');
  return getAllEssays().map(summaryOf);
}

async function getDevEssayBySlug(slug: string): Promise<Essay | undefined> {
  const { getEssayBySlug } = await import('./index');
  return getEssayBySlug(slug);
}

export function getBrowserEssayCatalog(): Promise<readonly EssaySummary[]> {
  catalogPromise ??= import.meta.env.DEV
    ? getDevCatalog()
    : fetchJson(`${payloadRoot}catalog.json`).then((value) => {
        if (!Array.isArray(value)) throw new Error('Essay catalog payload is not an array');
        const summaries = value.map((entry, index) => assertSummary(entry, `Essay catalog entry ${index + 1}`));
        const ids = new Set<string>();
        const slugs = new Set<string>();
        for (const summary of summaries) {
          if (ids.has(summary.id)) throw new Error(`Duplicate browser essay id: ${summary.id}`);
          if (slugs.has(summary.slug)) throw new Error(`Duplicate browser essay slug: ${summary.slug}`);
          ids.add(summary.id);
          slugs.add(summary.slug);
        }
        return summaries;
      });
  return catalogPromise;
}

export function getBrowserEssayBySlug(slug: string): Promise<Essay | undefined> {
  if (!validSlugPattern.test(slug)) return Promise.resolve(undefined);

  const cached = essayPromises.get(slug);
  if (cached) return cached;

  const request = import.meta.env.DEV
    ? getDevEssayBySlug(slug)
    : Promise.all([
        getBrowserEssayCatalog(),
        fetch(`${payloadRoot}${encodeURIComponent(slug)}.json`, { credentials: 'same-origin' }),
      ]).then(async ([catalog, response]) => {
        const catalogEntry = catalog.find((entry) => entry.slug === slug);
        if (!catalogEntry) return undefined;
        if (!response.ok) {
          throw new Error(`Essay payload request failed (${response.status}) for ${slug}`);
        }

        const value = await response.json() as unknown;
        const summary = assertSummary(value, `Essay payload ${slug}`);
        const essay = value as Partial<Essay>;
        if (summary.slug !== slug) throw new Error(`Essay payload slug mismatch: requested ${slug}, received ${summary.slug}`);
        if (summary.id !== catalogEntry.id || summary.title !== catalogEntry.title || summary.series?.id !== catalogEntry.series?.id) {
          throw new Error(`Essay payload identity diverged from browser catalog for ${slug}`);
        }
        if (!Array.isArray(essay.blocks)) throw new Error(`Essay payload ${slug} has no block array`);
        if (essay.sources !== undefined && !Array.isArray(essay.sources)) {
          throw new Error(`Essay payload ${slug} has an invalid source list`);
        }
        return value as Essay;
      });

  essayPromises.set(slug, request);
  return request;
}
