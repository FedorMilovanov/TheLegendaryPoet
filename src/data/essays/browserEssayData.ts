import type { Essay, EssaySummary } from '../../types/essay';

const baseUrl = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;
const payloadRoot = `${baseUrl}data/essays/`;
const validSlugPattern = /^[a-z0-9-]+$/;
const requestOptions: RequestInit = { credentials: 'same-origin', cache: 'no-store' };

type RequestStatus = 'pending' | 'fulfilled' | 'rejected';

interface VisitScopedRequest<T> {
  promise: Promise<T>;
  visitKeys: Set<string>;
  status: RequestStatus;
}

let catalogRequest: VisitScopedRequest<readonly EssaySummary[]> | undefined;
const essayRequests = new Map<string, VisitScopedRequest<Essay | undefined>>();

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
  const response = await fetch(url, requestOptions);
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

function reusableForVisit<T>(entry: VisitScopedRequest<T> | undefined, visitKey: string): entry is VisitScopedRequest<T> {
  if (!entry) return false;
  if (entry.status === 'pending') {
    // Concurrent consumers share one in-flight request. If it later rejects,
    // every visit that already waited on it keeps that same stable failure;
    // only a genuinely later visit may start a fresh attempt.
    entry.visitKeys.add(visitKey);
    return true;
  }
  return entry.status === 'fulfilled' || entry.visitKeys.has(visitKey);
}

export function getBrowserEssayCatalog(visitKey: string): Promise<readonly EssaySummary[]> {
  if (reusableForVisit(catalogRequest, visitKey)) return catalogRequest.promise;

  const request = import.meta.env.DEV
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

  const entry: VisitScopedRequest<readonly EssaySummary[]> = {
    promise: request,
    visitKeys: new Set([visitKey]),
    status: 'pending',
  };
  entry.promise = request.then(
    (value) => {
      if (catalogRequest === entry) entry.status = 'fulfilled';
      return value;
    },
    (error: unknown) => {
      if (catalogRequest === entry) entry.status = 'rejected';
      throw error;
    },
  );
  catalogRequest = entry;
  return entry.promise;
}

export function getBrowserEssayBySlug(slug: string, visitKey: string): Promise<Essay | undefined> {
  if (!validSlugPattern.test(slug)) return Promise.resolve(undefined);

  const cached = essayRequests.get(slug);
  if (reusableForVisit(cached, visitKey)) return cached.promise;

  const request = import.meta.env.DEV
    ? getDevEssayBySlug(slug)
    : Promise.all([
        getBrowserEssayCatalog(visitKey),
        fetch(`${payloadRoot}${encodeURIComponent(slug)}.json`, requestOptions),
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

  const entry: VisitScopedRequest<Essay | undefined> = {
    promise: request,
    visitKeys: new Set([visitKey]),
    status: 'pending',
  };
  entry.promise = request.then(
    (value) => {
      if (essayRequests.get(slug) === entry) entry.status = 'fulfilled';
      return value;
    },
    (error: unknown) => {
      if (essayRequests.get(slug) === entry) entry.status = 'rejected';
      throw error;
    },
  );
  essayRequests.set(slug, entry);
  return entry.promise;
}
