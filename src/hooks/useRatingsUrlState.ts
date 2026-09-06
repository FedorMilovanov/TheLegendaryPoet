import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

function sameState(left: RatingsUrlState, right: RatingsUrlState) {
  return left.query === right.query
    && left.tag === right.tag
    && left.sortBy === right.sortBy
    && left.ratedOnly === right.ratedOnly;
}

export function useRatingsUrlState(validTags: readonly string[]) {
  const [searchParams, setSearchParams] = useSearchParams();
  const validTagSet = useMemo(() => new Set(validTags), [validTags]);
  const canonicalState = useMemo(
    () => readCanonicalState(searchParams, validTagSet),
    [searchParams, validTagSet],
  );
  const canonicalQuery = useMemo(() => buildCanonicalParams(canonicalState).toString(), [canonicalState]);
  const currentQuery = searchParams.toString();

  const [intentState, setIntentState] = useState<RatingsUrlState>(canonicalState);
  const intentRef = useRef<RatingsUrlState>(canonicalState);
  const pendingTargetRef = useRef<string | null>(null);
  const internalTargetsRef = useRef<Set<string>>(new Set());
  const lastCanonicalQueryRef = useRef(canonicalQuery);

  const syncIntent = useCallback((next: RatingsUrlState) => {
    intentRef.current = next;
    setIntentState((current) => sameState(current, next) ? current : next);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      // Browser Back/Forward is external authority. A POP can arrive after the
      // address bar has reached an optimistic target but before React Router's
      // transition/effect has acknowledged it, so any queued local intent must
      // be discarded synchronously from the browser's new URL.
      pendingTargetRef.current = null;
      internalTargetsRef.current.clear();
      syncIntent(readCanonicalState(new URLSearchParams(window.location.search), validTagSet));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [syncIntent, validTagSet]);

  useEffect(() => {
    if (currentQuery === canonicalQuery) return;

    setSearchParams((latestParams) => {
      const latestCanonical = buildCanonicalParams(readCanonicalState(latestParams, validTagSet));
      return latestParams.toString() === latestCanonical.toString() ? latestParams : latestCanonical;
    }, { replace: true });
  }, [canonicalQuery, currentQuery, setSearchParams, validTagSet]);

  useEffect(() => {
    const previousCanonical = lastCanonicalQueryRef.current;
    lastCanonicalQueryRef.current = canonicalQuery;
    const pendingTarget = pendingTargetRef.current;

    if (pendingTarget === canonicalQuery) {
      pendingTargetRef.current = null;
      internalTargetsRef.current.clear();
      syncIntent(canonicalState);
      return;
    }

    if (pendingTarget && internalTargetsRef.current.has(canonicalQuery)) {
      internalTargetsRef.current.delete(canonicalQuery);
      return;
    }

    if (pendingTarget && canonicalQuery !== previousCanonical) {
      pendingTargetRef.current = null;
      internalTargetsRef.current.clear();
      syncIntent(canonicalState);
      return;
    }

    if (!pendingTarget) syncIntent(canonicalState);
  }, [canonicalQuery, canonicalState, syncIntent]);

  const updateState = useCallback((
    update: (current: RatingsUrlState) => RatingsUrlState,
    options?: { replace?: boolean },
  ) => {
    const requested = update(intentRef.current);
    const next = readCanonicalState(buildCanonicalParams(requested), validTagSet);
    const nextParams = buildCanonicalParams(next);
    const targetQuery = nextParams.toString();
    const hadPendingNavigation = pendingTargetRef.current !== null;

    syncIntent(next);

    if (!hadPendingNavigation && targetQuery === canonicalQuery) {
      pendingTargetRef.current = null;
      internalTargetsRef.current.clear();
      return;
    }

    pendingTargetRef.current = targetQuery;
    internalTargetsRef.current.add(targetQuery);
    setSearchParams(nextParams, options);
  }, [canonicalQuery, setSearchParams, syncIntent, validTagSet]);

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
    updateState(() => ({ query: '', tag: '', sortBy: 'reader', ratedOnly: false }));
  }, [updateState]);

  return {
    ...intentState,
    setQuery,
    setTag,
    setSortBy,
    setRatedOnly,
    resetFilters,
  };
}
