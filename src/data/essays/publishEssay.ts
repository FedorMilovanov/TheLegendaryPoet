import type { Essay, EssaySource } from '../../types/essay';
import { estimateReadTime } from '../../utils/readTime';

export type PublishedEssay = Readonly<Essay>;

type EssayOverrides = Partial<Omit<Essay, 'id' | 'slug'>>;

function cloneAndFreeze<T>(value: T): T {
  if (Array.isArray(value)) {
    return Object.freeze(value.map((item) => cloneAndFreeze(item))) as T;
  }

  if (value && typeof value === 'object') {
    const clone = Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        cloneAndFreeze(item),
      ]),
    );
    return Object.freeze(clone) as T;
  }

  return value;
}

/**
 * Publish an authoring essay as a new, deeply frozen value.
 *
 * Imported authoring modules remain immutable inputs: overrides are composed
 * into a fresh object, reading time is always derived from the final blocks,
 * and every nested array/object is cloned before freezing.
 */
export function publishEssay(base: Essay, overrides: EssayOverrides = {}): PublishedEssay {
  const composed: Essay = {
    ...base,
    ...overrides,
    id: base.id,
    slug: base.slug,
    readTime: 1,
  };

  composed.readTime = estimateReadTime(composed.blocks);
  return cloneAndFreeze(composed);
}

/** Deduplicate bibliography entries without mutating the authoring arrays. */
export function uniqueEssaySources(sources: readonly EssaySource[] = []): EssaySource[] {
  const seen = new Set<string>();

  return sources.reduce<EssaySource[]>((result, source) => {
    const secureUrl = source.url?.startsWith('http:')
      ? `https:${source.url.slice(5)}`
      : source.url;
    const key = secureUrl?.endsWith('/')
      ? secureUrl.slice(0, -1)
      : secureUrl ?? `${source.id ?? ''}:${source.title}`;

    if (seen.has(key)) return result;
    seen.add(key);
    result.push(secureUrl === source.url ? { ...source } : { ...source, url: secureUrl });
    return result;
  }, []);
}
