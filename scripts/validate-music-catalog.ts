import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { musicTracks } from '../src/data/library/musicTracks';

interface AudioManifest {
  tracks: Array<{ id: string; path: string; durationSeconds: number; cover: string; sha256: string }>;
}

const HEX = /^#[0-9a-f]{6}$/i;
const SHA256 = /^[0-9a-f]{64}$/i;
const errors: string[] = [];
const warnings: string[] = [];

function parseDuration(value: string) {
  const match = /^(\d+):(\d{2})$/.exec(value);
  if (!match) return Number.NaN;
  return Number(match[1]) * 60 + Number(match[2]);
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

const ids = new Set<string>();
let featuredCount = 0;

for (const track of musicTracks) {
  const prefix = `music:${track.id}`;
  if (!track.id || ids.has(track.id)) errors.push(`${prefix}: missing or duplicate id`);
  ids.add(track.id);
  if (track.featured) featuredCount += 1;

  if (!track.title.trim() || !track.poet.trim()) errors.push(`${prefix}: title and poet are required`);
  if (!track.audioUrl?.startsWith('/audio/') || !track.audioUrl.endsWith('.mp3')) errors.push(`${prefix}: audioUrl must point to /audio/*.mp3`);
  if (!track.coverUrl?.startsWith('/images/music/') || !track.coverUrl.endsWith('.webp')) errors.push(`${prefix}: coverUrl must point to /images/music/*.webp`);
  if (!track.wideCoverUrl?.startsWith('/images/music/') || !track.wideCoverUrl.endsWith('.webp')) errors.push(`${prefix}: wideCoverUrl must point to /images/music/*.webp`);
  if (!track.audioSha256 || !SHA256.test(track.audioSha256)) errors.push(`${prefix}: invalid SHA-256`);
  if (!track.durationSeconds || track.durationSeconds <= 0) errors.push(`${prefix}: durationSeconds must be positive`);

  const displayedDuration = parseDuration(track.duration);
  if (!Number.isFinite(displayedDuration)) errors.push(`${prefix}: duration must use m:ss`);
  else if (track.durationSeconds && Math.abs(displayedDuration - track.durationSeconds) > 1.5) warnings.push(`${prefix}: displayed duration differs from master by more than 1.5 seconds`);

  if (!track.waveform || track.waveform.length < 64) errors.push(`${prefix}: waveform must contain at least 64 verified peaks`);
  else if (track.waveform.some((peak) => !Number.isFinite(peak) || peak < 0 || peak > 1)) errors.push(`${prefix}: waveform peaks must be finite values from 0 to 1`);

  if (!track.theme) {
    errors.push(`${prefix}: release theme is required`);
  } else {
    for (const [name, value] of Object.entries({ accent: track.theme.accent, secondary: track.theme.secondary, surface: track.theme.surface })) {
      if (!HEX.test(value)) errors.push(`${prefix}: theme.${name} must be a six-digit hex colour`);
    }
    if (HEX.test(track.theme.accent) && HEX.test(track.theme.surface) && contrast(track.theme.accent, track.theme.surface) < 3) {
      errors.push(`${prefix}: accent colour has insufficient contrast against the release surface`);
    }
  }

  if (track.chapters) {
    let previous = -1;
    for (const chapter of track.chapters) {
      if (!chapter.label.trim()) errors.push(`${prefix}: chapter label is empty`);
      if (!Number.isFinite(chapter.start) || chapter.start < 0 || chapter.start <= previous) errors.push(`${prefix}: chapter timings must be strictly increasing`);
      if (track.durationSeconds && chapter.start >= track.durationSeconds) errors.push(`${prefix}: chapter starts outside the track duration`);
      previous = chapter.start;
    }
  }
}

if (featuredCount !== 1) errors.push(`music catalog: expected exactly one featured release, found ${featuredCount}`);

const manifestPath = resolve(process.cwd(), 'public/audio/manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as AudioManifest;
const manifestById = new Map(manifest.tracks.map((track) => [track.id, track]));

for (const track of musicTracks) {
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
  if (!ids.has(manifestTrack.id)) errors.push(`audio manifest:${manifestTrack.id}: no matching release in the music catalog`);
}

for (const warning of warnings) console.warn(`WARN ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);
console.log(`Music catalog validation: ${musicTracks.length} release(s), ${warnings.length} warning(s), ${errors.length} error(s)`);
if (errors.length) process.exit(1);
