import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';

export type RatingsSortKey = 'reader' | 'votes' | 'discussion' | 'editorial' | 'consensus';

const SORT_KEYS = new Set<RatingsSortKey>(['reader', 'votes', 'discussion', 'editorial', 'consensus']);
const QUERY_LIMIT = 100;

function buildCanonicalParams({
  query,
  tag,
  sortBy,
  ratedOnly,
}: {
  query: string;
  tag: string;
  sortBy: RatingsSortKey;
  ratedOnly: boolean;
}) {
  const next = new URLSearchParams();
  if (query.trim()) next.set('q', query);
  if (tag) next.set('tag', tag);
  if (sortBy !== 'reader') next.set('sort', sortBy);
  if (ratedOnly) next.set('rated', '1');
  return next;
}

export function useRatingsUrlState(validTags: readonly string[]) {
  const [searchParams, setSearchParams] = useSearchParams();
  const validTagSet = useMemo(() => new Set(validTags), [validTags]);

  const query = (searchParams.get('q') ?? '').slice(0, QUERY_LIMIT);
  const rawTag = searchParams.get('tag') ?? '';
  const tag = validTagSet.has(rawTag) ? rawTag : '';
  const rawSort = searchParams.get('sort') as RatingsSortKey | null;
  const sortBy: RatingsSortKey = rawSort && SORT_KEYS.has(rawSort) ? rawSort : 'reader';
  const ratedOnly = searchParams.get('rated') === '1';

  const canonicalParams = useMemo(
    () => buildCanonicalParams({ query, tag, sortBy, ratedOnly }),
    [query, ratedOnly, sortBy, tag],
  );
  const canonicalQuery = canonicalParams.toString();
  const currentQuery = searchParams.toString();

  useEffect(() => {
    if (currentQuery === canonicalQuery) return;
    setSearchParams(canonicalParams, { replace: true });
  }, [canonicalParams, canonicalQuery, currentQuery, setSearchParams]);

  const setQuery = useCallback((value: string) => {
    const next = new URLSearchParams(canonicalParams);
    const bounded = value.slice(0, QUERY_LIMIT);
    if (bounded.trim()) next.set('q', bounded);
    else next.delete('q');
    setSearchParams(next, { replace: true });
  }, [canonicalParams, setSearchParams]);

  const setTag = useCallback((value: string) => {
    const next = new URLSearchParams(canonicalParams);
    if (value && validTagSet.has(value)) next.set('tag', value);
    else next.delete('tag');
    setSearchParams(next);
  }, [canonicalParams, setSearchParams, validTagSet]);

  const setSortBy = useCallback((value: RatingsSortKey) => {
    const next = new URLSearchParams(canonicalParams);
    if (value === 'reader') next.delete('sort');
    else if (SORT_KEYS.has(value)) next.set('sort', value);
    setSearchParams(next);
  }, [canonicalParams, setSearchParams]);

  const setRatedOnly = useCallback((value: boolean) => {
    const next = new URLSearchParams(canonicalParams);
    if (value) next.set('rated', '1');
    else next.delete('rated');
    setSearchParams(next);
  }, [canonicalParams, setSearchParams]);

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  return {
    query,
    tag,
    sortBy,
    ratedOnly,
    setQuery,
    setTag,
    setSortBy,
    setRatedOnly,
    resetFilters,
  };
}
