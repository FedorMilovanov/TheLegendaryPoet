import type { Essay, EssayBlock, EssaySource } from '../../types/essay';
import { estimateReadTime } from '../../utils/readTime';

export type EssayPublicationOverrides = Omit<Partial<Essay>, 'blocks' | 'sources' | 'readTime'> & {
  blocks?: readonly EssayBlock[];
  sources?: readonly EssaySource[];
};

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, cloneValue(item)]),
    ) as T;
  }

  return value;
}

export function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;

  for (const nested of Object.values(value as Record<string, unknown>)) {
    deepFreeze(nested);
  }

  return Object.freeze(value);
}

export function publishEssay(base: Essay, overrides: EssayPublicationOverrides = {}): Essay {
  const draft = cloneValue({
    ...base,
    ...overrides,
    blocks: overrides.blocks ?? base.blocks,
    sources: overrides.sources ?? base.sources,
  }) as Essay;

  draft.readTime = estimateReadTime(draft.blocks);
  return deepFreeze(draft);
}

export function publishEssayCatalog(items: readonly Essay[]): readonly Essay[] {
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const essay of items) {
    if (ids.has(essay.id)) throw new Error(`duplicate published essay id: ${essay.id}`);
    if (slugs.has(essay.slug)) throw new Error(`duplicate published essay slug: ${essay.slug}`);
    ids.add(essay.id);
    slugs.add(essay.slug);
  }

  return deepFreeze([...items]);
}
