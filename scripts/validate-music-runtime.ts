import type { MusicTrack, MusicTrackAvailability } from '../src/types/poet';
import {
  filterMusicTracks,
  getAdjacentMusicTrack,
  getFeaturedMusicTrack,
  getPlaybackQueue,
  getRelatedMusicTracks,
  getUpcomingMusicTracks,
  normalizeMusicSearchText,
  sortMusicTracks,
} from '../src/data/musicCatalog';

const errors: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) errors.push(message);
};

function fixture(
  id: string,
  releaseOrder: number,
  availability: MusicTrackAvailability = 'published',
  overrides: Partial<MusicTrack> = {},
): MusicTrack {
  const published = availability === 'published';
  const archived = availability === 'archived';
  return {
    id,
    title: `Релиз ${id}`,
    poet: 'Сергей Есенин',
    poetId: 'sergei-yesenin',
    availability,
    releaseOrder,
    releaseYear: published || archived ? 2026 : 2027,
    publishedAt: published || archived ? '2026-07-23' : undefined,
    duration: published || archived ? '4:00' : undefined,
    durationSeconds: published || archived ? 240 : undefined,
    audioUrl: published || archived ? `/audio/${id}.mp3` : undefined,
    coverUrl: `/images/music/${id}-cover.webp`,
    wideCoverUrl: `/images/music/${id}-wide.webp`,
    description: `Проверочная музыкальная публикация ${id} для устойчивой очереди и масштабируемого каталога проекта.`,
    credits: ['Слова — Сергей Есенин', 'Мастер — The Legendary Poet'],
    rightsNotice: 'Проверочный полный текст уведомления о правах для регрессионного теста музыкальной системы The Legendary Poet.',
    audioSha256: published || archived ? id.padEnd(64, 'a').slice(0, 64) : undefined,
    waveform: published || archived ? Array.from({ length: 64 }, () => 0.5) : undefined,
    theme: { accent: '#d7a84b', secondary: '#577f72', surface: '#0b1210' },
    ...overrides,
  };
}

const first = fixture('first-release', 10, 'published', { featured: true, title: 'Ёлка и метель' });
const second = fixture('second-release', 20, 'published', { poet: 'Александр Пушкин', poetId: 'alexander-pushkin', title: 'Туча' });
const samePoet = fixture('same-poet-release', 40, 'published', { title: 'Другая исповедь' });
const archived = fixture('archived-release', 30, 'archived');
const scheduledLater = fixture('scheduled-later', 60, 'coming-soon', { scheduledFor: '2027-03-01' });
const scheduledSooner = fixture('scheduled-sooner', 70, 'coming-soon', { scheduledFor: '2027-01-01' });
const unscheduledFirst = fixture('unscheduled-first', 80, 'coming-soon');
const unscheduledSecond = fixture('unscheduled-second', 90, 'coming-soon');
const registry = [second, unscheduledSecond, archived, scheduledLater, first, unscheduledFirst, scheduledSooner, samePoet];

const originalOrder = registry.map((track) => track.id).join('|');
const editorial = sortMusicTracks(registry, 'editorial');
expect(editorial.map((track) => track.releaseOrder).join('|') === '10|20|30|40|60|70|80|90', 'editorial sorting must follow releaseOrder');
expect(registry.map((track) => track.id).join('|') === originalOrder, 'sorting must not mutate the release registry');

const queue = getPlaybackQueue(registry);
expect(queue.map((track) => track.id).join('|') === 'first-release|second-release|same-poet-release', 'playback queue must contain only published playable releases');
expect(getFeaturedMusicTrack(registry)?.id === 'first-release', 'featured selection must use a playable published release');
expect(getAdjacentMusicTrack(registry, 'first-release', 1)?.id === 'second-release', 'next release must use stable queue order');
expect(getAdjacentMusicTrack(registry, 'first-release', -1)?.id === 'same-poet-release', 'previous release must wrap within the playable queue');
expect(getAdjacentMusicTrack([first], first.id, 1) === null, 'a one-item queue must not point to itself as the next release');
expect(getAdjacentMusicTrack([], first.id, 1) === null, 'an empty queue must not produce an adjacent release');
expect(getAdjacentMusicTrack(registry, 'unknown-release', 1)?.id === 'first-release', 'an unknown current id must recover at the beginning of the queue');

const upcoming = getUpcomingMusicTracks(registry);
expect(upcoming.map((track) => track.id).join('|') === 'scheduled-sooner|scheduled-later|unscheduled-first|unscheduled-second', 'scheduled announcements must precede unscheduled entries, with deterministic editorial fallback');

expect(normalizeMusicSearchText('  Ёлка, МЕТЕЛЬ! ') === 'елка метель', 'search normalization must handle case, ё, punctuation, and whitespace');
expect(filterMusicTracks(registry, { query: 'елка метель' }).map((track) => track.id).join('|') === 'first-release', 'multi-term search must match a normalized title');
expect(filterMusicTracks(registry, { query: 'пушкин туча' }).map((track) => track.id).join('|') === 'second-release', 'search must combine poet and title terms');
expect(filterMusicTracks(registry, { poetId: 'sergei-yesenin' }).every((track) => track.poetId === 'sergei-yesenin' && track.availability === 'published'), 'poet filtering must stay inside the public catalog');

const related = getRelatedMusicTracks(registry, first, 3);
expect(related[0]?.id === 'same-poet-release', 'related releases must prioritize the same poet');
expect(related.every((track) => track.id !== first.id && track.availability === 'published'), 'related releases must exclude the current and non-public entries');

for (const error of errors) console.error(`ERROR music-runtime: ${error}`);
console.log(`Music runtime validation: ${errors.length} error(s)`);
if (errors.length) process.exit(1);
