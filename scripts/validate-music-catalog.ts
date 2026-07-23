import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { MusicTrack } from '../src/types/poet';
import { poets } from '../src/data/library';
import { allMusicTracks, musicTracks } from '../src/data/library/musicTracks';
import {
  filterMusicTracks,
  getAdjacentMusicTrack,
  getFeaturedMusicTrack,
  getMusicCatalogStats,
  getPlaybackQueue,
  getPublishedMusicTracks,
  getRelatedMusicTracks,
  normalizeMusicSearchText,
  sortMusicTracks,
} from '../src/data/musicCatalog';

interface AudioManifestTrack {
  id: string;
  path: string;
  durationSeconds: number;
  cover: string;
  sha256: string;
  bytes?: number;
  codec?: string;
}

interface AudioManifest {
  version?: number;
  generatedAt?: string;
  tracks: AudioManifestTrack[];
}

const HEX = /^#[0-9a-f]{6}$/i;
const SHA256 = /^[0-9a-f]{64}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TRACK_ID = /^[a-z0-9][a-z0-9-]{1,119}$/;
const HERO_POSITION = /^(?:(?:left|center|right)|(?:\d{1,3}%))(?:\s+(?:(?:top|center|bottom)|(?:\d{1,3}%)))?$/;
const errors: string[] = [];
const warnings: string[] = [];

function expect(condition: unknown, message: string) {
  if (!condition) errors.push(`music runtime: ${message}`);
}

function parseDuration(value: string) {
  const match = /^(\d+):(\d{2})$/.exec(value);
  if (!match) return Number.NaN;
  const seconds = Number(match[2]);
  if (seconds >= 60) return Number.NaN;
  return Number(match[1]) * 60 + seconds;
}

function luminance(hex: string) {
  const values = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
  const linear = values.map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(a: string, b: string) {
  const high = Math.max(luminance(a), luminance(b));
  const low = Math.min(luminance(a), luminance(b));
  return (high + 0.05) / (low + 0.05);
}

function validIsoDate(value: string) {
  if (!ISO_DATE.test(value)) return false;
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value;
}

const ids = new Set<string>();
const releaseOrders = new Set<number>();
const audioUrls = new Set<string>();
const coverUrls = new Set<string>();
const wideCoverUrls = new Set<string>();
const audioHashes = new Set<string>();
const poetById = new Map(poets.map((poet) => [poet.id, poet]));
let featuredCount = 0;

for (const track of allMusicTracks) {
  const prefix = `music:${track.id || '<missing-id>'}`;

  if (!TRACK_ID.test(track.id) || ids.has(track.id)) errors.push(`${prefix}: missing, invalid, or duplicate id`);
  ids.add(track.id);

  if (!Number.isInteger(track.releaseOrder) || track.releaseOrder <= 0 || releaseOrders.has(track.releaseOrder)) {
    errors.push(`${prefix}: releaseOrder must be a unique positive integer`);
  }
  releaseOrders.add(track.releaseOrder);

  if (!['published', 'coming-soon', 'archived'].includes(track.availability)) errors.push(`${prefix}: invalid availability`);
  if (track.featured && track.availability !== 'published') errors.push(`${prefix}: only a published release may be featured`);
  if (track.featured) featuredCount += 1;

  if (!track.title.trim() || track.title.length > 120 || !track.poet.trim() || track.poet.length > 120) {
    errors.push(`${prefix}: title and poet are required and must fit the interface`);
  }
  if (!track.description || track.description.trim().length < 60 || track.description.length > 420) {
    errors.push(`${prefix}: description must contain 60–420 characters`);
  }

  if (!track.poetId) {
    errors.push(`${prefix}: poetId is required`);
  } else {
    const poet = poetById.get(track.poetId);
    if (!poet) errors.push(`${prefix}: poetId does not exist in the poet library`);
    else if (poet.name !== track.poet) errors.push(`${prefix}: poet name differs from the linked poet record`);
  }

  if (track.publishedAt) {
    if (!validIsoDate(track.publishedAt)) errors.push(`${prefix}: publishedAt must be a valid YYYY-MM-DD date`);
    if (track.releaseYear && Number(track.publishedAt.slice(0, 4)) !== track.releaseYear) errors.push(`${prefix}: releaseYear differs from publishedAt`);
  } else if (track.availability === 'published') {
    errors.push(`${prefix}: published releases require publishedAt`);
  }

  if (!track.credits || track.credits.length < 2 || new Set(track.credits).size !== track.credits.length) {
    errors.push(`${prefix}: credits must contain at least two unique entries`);
  }
  if (!track.rightsNotice || track.rightsNotice.length < 80) errors.push(`${prefix}: a complete rights notice is required`);

  if (track.audioUrl) {
    if (!track.audioUrl.startsWith('/audio/') || !track.audioUrl.endsWith('.mp3')) errors.push(`${prefix}: audioUrl must point to /audio/*.mp3`);
    if (audioUrls.has(track.audioUrl)) errors.push(`${prefix}: audioUrl is already used by another release`);
    audioUrls.add(track.audioUrl);
  }
  if (track.coverUrl) {
    if (!track.coverUrl.startsWith('/images/music/') || !track.coverUrl.endsWith('.webp')) errors.push(`${prefix}: coverUrl must point to /images/music/*.webp`);
    if (coverUrls.has(track.coverUrl)) errors.push(`${prefix}: coverUrl is already used by another release`);
    coverUrls.add(track.coverUrl);
  }
  if (track.wideCoverUrl) {
    if (!track.wideCoverUrl.startsWith('/images/music/') || !track.wideCoverUrl.endsWith('.webp')) errors.push(`${prefix}: wideCoverUrl must point to /images/music/*.webp`);
    if (wideCoverUrls.has(track.wideCoverUrl)) errors.push(`${prefix}: wideCoverUrl is already used by another release`);
    wideCoverUrls.add(track.wideCoverUrl);
  }
  if (track.audioSha256) {
    if (!SHA256.test(track.audioSha256)) errors.push(`${prefix}: invalid SHA-256`);
    if (audioHashes.has(track.audioSha256)) errors.push(`${prefix}: SHA-256 is already used by another release`);
    audioHashes.add(track.audioSha256);
  }

  const displayedDuration = parseDuration(track.duration);
  if (!Number.isFinite(displayedDuration)) errors.push(`${prefix}: duration must use a valid m:ss value`);
  else if (track.durationSeconds && Math.abs(displayedDuration - track.durationSeconds) > 1.5) warnings.push(`${prefix}: displayed duration differs from master by more than 1.5 seconds`);

  if (track.availability === 'published') {
    if (!track.audioUrl || !track.coverUrl || !track.wideCoverUrl) errors.push(`${prefix}: published releases require audio, square cover, and wide cover`);
    if (!track.audioSha256 || !SHA256.test(track.audioSha256)) errors.push(`${prefix}: published releases require a valid SHA-256`);
    if (!track.durationSeconds || track.durationSeconds <= 0) errors.push(`${prefix}: published releases require a positive durationSeconds`);
    if (!track.waveform || track.waveform.length < 64) errors.push(`${prefix}: published releases require at least 64 verified waveform peaks`);
  }

  if (track.waveform?.some((peak) => !Number.isFinite(peak) || peak < 0 || peak > 1)) {
    errors.push(`${prefix}: waveform peaks must be finite values from 0 to 1`);
  }

  if (!track.theme && track.availability === 'published') {
    errors.push(`${prefix}: published releases require a visual theme`);
  } else if (track.theme) {
    for (const [name, value] of Object.entries({ accent: track.theme.accent, secondary: track.theme.secondary, surface: track.theme.surface })) {
      if (!HEX.test(value)) errors.push(`${prefix}: theme.${name} must be a six-digit hex colour`);
    }
    if (HEX.test(track.theme.accent) && HEX.test(track.theme.surface) && contrast(track.theme.accent, track.theme.surface) < 3) {
      errors.push(`${prefix}: accent colour has insufficient contrast against the release surface`);
    }
    if (track.theme.heroPosition && !HERO_POSITION.test(track.theme.heroPosition)) errors.push(`${prefix}: theme.heroPosition uses an unsupported format`);
  }

  if (track.chapters) {
    let previous = -1;
    const chapterLabels = new Set<string>();
    for (const chapter of track.chapters) {
      const normalizedLabel = chapter.label.trim().toLocaleLowerCase('ru-RU');
      if (!normalizedLabel || chapterLabels.has(normalizedLabel)) errors.push(`${prefix}: chapter labels must be non-empty and unique`);
      chapterLabels.add(normalizedLabel);
      if (!Number.isFinite(chapter.start) || chapter.start < 0 || chapter.start <= previous) errors.push(`${prefix}: chapter timings must be strictly increasing`);
      if (track.durationSeconds && chapter.start >= track.durationSeconds) errors.push(`${prefix}: chapter starts outside the track duration`);
      previous = chapter.start;
    }
  }
}

const expectedPublicIds = getPublishedMusicTracks(allMusicTracks).map((track) => track.id);
const exportedPublicIds = musicTracks.map((track) => track.id);
if (expectedPublicIds.join('|') !== exportedPublicIds.join('|')) {
  errors.push('music catalog: public export differs from the published registry order');
}
if (musicTracks.length > 0 && featuredCount !== 1) errors.push(`music catalog: expected exactly one featured published release, found ${featuredCount}`);

const manifestPath = resolve(process.cwd(), 'public/audio/manifest.json');
let manifest: AudioManifest = { tracks: [] };
try {
  manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as AudioManifest;
} catch (error) {
  errors.push(`audio manifest: unreadable or invalid JSON (${String(error)})`);
}

if (!Number.isInteger(manifest.version) || Number(manifest.version) < 1) errors.push('audio manifest: version must be a positive integer');
if (!manifest.generatedAt || !validIsoDate(manifest.generatedAt)) errors.push('audio manifest: generatedAt must be a valid YYYY-MM-DD date');
if (!Array.isArray(manifest.tracks)) {
  errors.push('audio manifest: tracks must be an array');
  manifest.tracks = [];
}

const manifestIds = new Set<string>();
const manifestPaths = new Set<string>();
const manifestHashes = new Set<string>();
for (const manifestTrack of manifest.tracks) {
  if (manifestIds.has(manifestTrack.id)) errors.push(`audio manifest:${manifestTrack.id}: duplicate id`);
  if (manifestPaths.has(manifestTrack.path)) errors.push(`audio manifest:${manifestTrack.id}: duplicate audio path`);
  if (manifestHashes.has(manifestTrack.sha256)) errors.push(`audio manifest:${manifestTrack.id}: duplicate SHA-256`);
  manifestIds.add(manifestTrack.id);
  manifestPaths.add(manifestTrack.path);
  manifestHashes.add(manifestTrack.sha256);
  if (!Number.isFinite(manifestTrack.durationSeconds) || manifestTrack.durationSeconds <= 0) errors.push(`audio manifest:${manifestTrack.id}: invalid durationSeconds`);
  if (manifestTrack.bytes !== undefined && (!Number.isInteger(manifestTrack.bytes) || manifestTrack.bytes <= 0)) errors.push(`audio manifest:${manifestTrack.id}: invalid byte size`);
}

const playableTracks = getPlaybackQueue(allMusicTracks);
const manifestById = new Map(manifest.tracks.map((track) => [track.id, track]));
for (const track of playableTracks) {
  const manifestTrack = manifestById.get(track.id);
  if (!manifestTrack) {
    errors.push(`music:${track.id}: missing from public/audio/manifest.json`);
    continue;
  }
  if (manifestTrack.path !== track.audioUrl) errors.push(`music:${track.id}: audioUrl differs from manifest path`);
  if (manifestTrack.cover !== track.coverUrl) errors.push(`music:${track.id}: coverUrl differs from manifest cover`);
  if (manifestTrack.sha256 !== track.audioSha256) errors.push(`music:${track.id}: SHA-256 differs from manifest`);
  if (track.durationSeconds && Math.abs(manifestTrack.durationSeconds - track.durationSeconds) > 0.01) errors.push(`music:${track.id}: durationSeconds differs from manifest`);
}
for (const manifestTrack of manifest.tracks) {
  if (!playableTracks.some((track) => track.id === manifestTrack.id)) errors.push(`audio manifest:${manifestTrack.id}: no matching playable published release`);
}

if (musicTracks.length >= 2) {
  const first = musicTracks[0];
  const second = musicTracks[1];
  const comingSoon: MusicTrack = {
    ...first,
    id: 'future-catalog-release',
    title: 'Будущая публикация',
    availability: 'coming-soon',
    releaseOrder: first.releaseOrder + 1,
    featured: false,
    audioUrl: undefined,
    audioSha256: undefined,
    durationSeconds: undefined,
    waveform: undefined,
  };
  const archived: MusicTrack = {
    ...second,
    id: 'archived-catalog-release',
    title: 'Архивная публикация',
    availability: 'archived',
    releaseOrder: second.releaseOrder + 1,
    featured: false,
  };
  const fixture = [second, comingSoon, first, archived];
  expect(getPlaybackQueue(fixture).map((track) => track.id).join('|') === [first.id, second.id].join('|'), 'playback queue must skip upcoming and archived entries and restore editorial order');
  expect(getAdjacentMusicTrack(fixture, first.id, 1)?.id === second.id, 'next release must skip unavailable entries');
  expect(getAdjacentMusicTrack(fixture, first.id, -1)?.id === second.id, 'previous release must wrap within playable entries');
  expect(getFeaturedMusicTrack(fixture)?.id === first.id, 'featured selection must ignore unavailable entries');
  expect(getRelatedMusicTracks(fixture, first, 10).every((track) => track.availability === 'published' && track.id !== first.id), 'related releases must remain public and exclude the current release');
  expect(sortMusicTracks([second, first], 'editorial')[0]?.id === first.id, 'editorial sorting must follow releaseOrder rather than source order');
}

expect(normalizeMusicSearchText('Ёлка, Есенин!') === 'елка есенин', 'search normalization must handle ё and punctuation');
expect(filterMusicTracks(musicTracks, { query: 'сергей есенин' }).some((track) => track.id.startsWith('yesenin-')), 'search must find a release by poet name');
expect(filterMusicTracks(musicTracks, { query: 'туча пушкин' }).some((track) => track.id === 'pushkin-tucha'), 'search must combine title and poet terms');
expect(filterMusicTracks(musicTracks, { poetId: 'alexander-blok' }).every((track) => track.poetId === 'alexander-blok'), 'poet filters must never leak other authors');
const stats = getMusicCatalogStats(allMusicTracks);
expect(stats.publishedCount === musicTracks.length, 'catalog statistics must count the public export exactly');
expect(stats.playableCount === playableTracks.length, 'catalog statistics must count playable releases exactly');
expect(stats.totalDurationSeconds > 0, 'catalog statistics must include total listening time');

for (const warning of warnings) console.warn(`WARN ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);
console.log(`Music catalog validation: ${allMusicTracks.length} registry entry/entries, ${musicTracks.length} public release(s), ${warnings.length} warning(s), ${errors.length} error(s)`);
if (errors.length) process.exit(1);
