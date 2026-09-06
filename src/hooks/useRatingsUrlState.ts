import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';

export type RatingsSortKey = 'reader' | 'votes' | 'discussion' | 'editorial' | 'consensus';

interface RatingsUrlState {
  query: string;
  tag: string;
  sortBy: RatingsSortKey;
  ratedOnly: boolean;
}

const SORT_KEYS = new Set<RatingsSortKey>(['reader', 'votes', 'discussion', 'editorial', 'consensus']);
const QUERY_LIMIT = 100;

function readCanonicalState(searchParams: URLSearchParams, validTags: ReadonlySet<string>): RatingsUrlState {
  const query = (searchParams.get('q') ?? '').slice(0, QUERY_LIMIT).trim();
  const rawTag = searchParams.get('tag') ?? '';
  const rawSort = searchParams.get('sort') as RatingsSortKey | null;

  return {
    query,
    tag: validTags.has(rawTag) ? rawTag : '',
    sortBy: rawSort && SORT_KEYS.has(rawSort) ? rawSort : 'reader',
    ratedOnly: searchParams.get('rated') === '1',
  };
}

function buildCanonicalParams({ query, tag, sortBy, ratedOnly }: RatingsUrlState) {
  const next = new URLSearchParams();
  if (query) next.set('q', query);
  if (tag) next.set('tag', tag);
  if (sortBy !== 'reader') next.set('sort', sortBy);
  if (ratedOnly) next.set('rated', '1');
  return next;
}

export function useRatingsUrlState(validTags: readonly string[]) {
  const [searchParams, setSearchParams] = useSearchParams();
  const validTagSet = useMemo(() => new Set(validTags), [validTags]);
  const state = useMemo(() => readCanonicalState(searchParams, validTagSet), [searchParams, validTagSet]);
  const { query, tag, sortBy, ratedOnly } = state;

  const canonicalQuery = useMemo(() => buildCanonicalParams(state).toString(), [state]);
  const currentQuery = searchParams.toString();

  useEffect(() => {
    if (currentQuery === canonicalQuery) return;

    setSearchParams((latestParams) => {
      const latestCanonical = buildCanonicalParams(readCanonicalState(latestParams, validTagSet));
      return latestParams.toString() === latestCanonical.toString() ? latestParams : latestCanonical;
    }, { replace: true });
  }, [canonicalQuery, currentQuery, setSearchParams, validTagSet]);

  const updateState = useCallback((
    update: (current: RatingsUrlState) => RatingsUrlState,
    options?: { replace?: boolean },
  ) => {
    setSearchParams((latestParams) => {
      const current = readCanonicalState(latestParams, validTagSet);
      return buildCanonicalParams(update(current));
    }, options);
  }, [setSearchParams, validTagSet]);

  const setQuery = useCallback((value: string) => {
    const bounded = value.slice(0, QUERY_LIMIT).trim();
    updateState((current) => ({ ...current, query: bounded }), { replace: true });
  }, [updateState]);

  const setTag = useCallback((value: string) => {
    updateState((current) => ({
      ...current,
      tag: value && validTagSet.has(value) ? value : '',
    }));
  }, [updateState, validTagSet]);

  const setSortBy = useCallback((value: RatingsSortKey) => {
    updateState((current) => ({
      ...current,
      sortBy: SORT_KEYS.has(value) ? value : 'reader',
    }));
  }, [updateState]);

  const setRatedOnly = useCallback((value: boolean) => {
    updateState((current) => ({ ...current, ratedOnly: value }));
  }, [updateState]);

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
