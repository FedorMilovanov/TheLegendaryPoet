import type { MusicTrack } from '../types/poet';

export type MusicCatalogSort = 'editorial' | 'newest' | 'oldest' | 'title' | 'poet';

const russianCollator = new Intl.Collator('ru', {
  sensitivity: 'base',
  numeric: true,
  ignorePunctuation: true,
});

const publishedTime = (track: MusicTrack) => {
  if (!track.publishedAt) return 0;
  const parsed = Date.parse(`${track.publishedAt}T00:00:00Z`);
  return Number.isFinite(parsed) ? parsed : 0;
};

const scheduledTime = (track: MusicTrack) => {
  if (!track.scheduledFor) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(`${track.scheduledFor}T00:00:00Z`);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
};

export function normalizeMusicSearchText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toLocaleLowerCase('ru-RU');
}

export function isPublishedMusicTrack(track: MusicTrack) {
  return track.availability === 'published';
}

export function isPlayableMusicTrack(track: MusicTrack) {
  return isPublishedMusicTrack(track) && Boolean(track.audioUrl);
}

export function sortMusicTracks(tracks: readonly MusicTrack[], sort: MusicCatalogSort = 'editorial') {
  const sourceIndex = new Map(tracks.map((track, index) => [track.id, index]));
  return [...tracks].sort((left, right) => {
    if (sort === 'newest' || sort === 'oldest') {
      const dateDifference = publishedTime(left) - publishedTime(right);
      if (dateDifference !== 0) return sort === 'newest' ? -dateDifference : dateDifference;
      const orderDifference = left.releaseOrder - right.releaseOrder;
      if (orderDifference !== 0) return sort === 'newest' ? -orderDifference : orderDifference;
    } else if (sort === 'title') {
      const titleDifference = russianCollator.compare(left.title, right.title);
      if (titleDifference !== 0) return titleDifference;
    } else if (sort === 'poet') {
      const poetDifference = russianCollator.compare(left.poet, right.poet);
      if (poetDifference !== 0) return poetDifference;
      const titleDifference = russianCollator.compare(left.title, right.title);
      if (titleDifference !== 0) return titleDifference;
    } else {
      const orderDifference = left.releaseOrder - right.releaseOrder;
      if (orderDifference !== 0) return orderDifference;
    }

    const sourceDifference = (sourceIndex.get(left.id) ?? 0) - (sourceIndex.get(right.id) ?? 0);
    if (sourceDifference !== 0) return sourceDifference;
    return russianCollator.compare(left.id, right.id);
  });
}

export function getPublishedMusicTracks(tracks: readonly MusicTrack[]) {
  return sortMusicTracks(tracks.filter(isPublishedMusicTrack));
}

export function getUpcomingMusicTracks(tracks: readonly MusicTrack[]) {
  return tracks
    .filter((track) => track.availability === 'coming-soon')
    .sort((left, right) => {
      const dateDifference = scheduledTime(left) - scheduledTime(right);
      if (dateDifference !== 0) return dateDifference;
      const orderDifference = left.releaseOrder - right.releaseOrder;
      if (orderDifference !== 0) return orderDifference;
      return russianCollator.compare(left.id, right.id);
    });
}

export function getPlaybackQueue(tracks: readonly MusicTrack[]) {
  return sortMusicTracks(tracks.filter(isPlayableMusicTrack));
}

export function getFeaturedMusicTrack(tracks: readonly MusicTrack[]) {
  const queue = getPlaybackQueue(tracks);
  return queue.find((track) => track.featured) ?? queue[0] ?? null;
}

export function getAdjacentMusicTrack(
  tracks: readonly MusicTrack[],
  currentTrackId: string,
  direction: -1 | 1,
) {
  const queue = getPlaybackQueue(tracks);
  if (queue.length < 2) return null;
  const currentIndex = queue.findIndex((track) => track.id === currentTrackId);
  if (currentIndex < 0) return queue[direction === 1 ? 0 : queue.length - 1] ?? null;
  return queue[(currentIndex + direction + queue.length) % queue.length] ?? null;
}

export function getRelatedMusicTracks(
  tracks: readonly MusicTrack[],
  currentTrack: MusicTrack,
  limit = 2,
) {
  return tracks
    .filter((track) => track.id !== currentTrack.id && isPublishedMusicTrack(track))
    .sort((left, right) => {
      const leftSamePoet = left.poetId && currentTrack.poetId && left.poetId === currentTrack.poetId ? 0 : 1;
      const rightSamePoet = right.poetId && currentTrack.poetId && right.poetId === currentTrack.poetId ? 0 : 1;
      if (leftSamePoet !== rightSamePoet) return leftSamePoet - rightSamePoet;

      const leftDistance = Math.abs(left.releaseOrder - currentTrack.releaseOrder);
      const rightDistance = Math.abs(right.releaseOrder - currentTrack.releaseOrder);
      if (leftDistance !== rightDistance) return leftDistance - rightDistance;
      return left.releaseOrder - right.releaseOrder;
    })
    .slice(0, Math.max(0, limit));
}

export function filterMusicTracks(
  tracks: readonly MusicTrack[],
  options: { query?: string; poetId?: string; sort?: MusicCatalogSort } = {},
) {
  const normalizedQuery = normalizeMusicSearchText(options.query ?? '');
  const filtered = tracks.filter((track) => {
    if (!isPublishedMusicTrack(track)) return false;
    if (options.poetId && track.poetId !== options.poetId) return false;
    if (!normalizedQuery) return true;

    const haystack = normalizeMusicSearchText([
      track.title,
      track.poet,
      track.description ?? '',
      ...(track.credits ?? []),
    ].join(' '));
    return normalizedQuery.split(' ').every((part) => haystack.includes(part));
  });

  return sortMusicTracks(filtered, options.sort ?? 'editorial');
}

export function getMusicCatalogPoets(tracks: readonly MusicTrack[]) {
  const byId = new Map<string, string>();
  for (const track of getPublishedMusicTracks(tracks)) {
    if (track.poetId && !byId.has(track.poetId)) byId.set(track.poetId, track.poet);
  }
  return [...byId.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((left, right) => russianCollator.compare(left.name, right.name));
}

export function getMusicCatalogStats(tracks: readonly MusicTrack[]) {
  const published = tracks.filter(isPublishedMusicTrack);
  const playable = published.filter(isPlayableMusicTrack);
  return {
    publishedCount: published.length,
    playableCount: playable.length,
    poetCount: new Set(published.map((track) => track.poetId ?? track.poet)).size,
    totalDurationSeconds: playable.reduce((sum, track) => sum + (track.durationSeconds ?? 0), 0),
    comingSoonCount: tracks.filter((track) => track.availability === 'coming-soon').length,
  };
}
