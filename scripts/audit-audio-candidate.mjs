#!/usr/bin/env node
// Read-only candidate audit: metadata, checksum and suspicious silent regions.
// This cannot approve a musical master: audible outros, voice tags and transitions need listening.
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DB_THRESHOLD = '-45dB';
const MIN_SILENCE_SECONDS = 0.7;
const LEADING_REVIEW_SECONDS = 2;
const TRAILING_REVIEW_SECONDS = 2.5;
const SUPPORTED_ORIGINS = new Set(['suno-export', 'original-master', 'editor-export', 'video-extraction', 'unknown']);

function numberOrNull(value) {
  const result = Number(value);
  return Number.isFinite(result) && result >= 0 ? result : null;
}

export function parseSilences(log, durationSeconds) {
  const intervals = [];
  const pending = [];
  for (const line of log.split(/\r?\n/)) {
    const start = /silence_start:\s*(-?\d+(?:\.\d+)?)/.exec(line);
    if (start) pending.push(Number(start[1]));
    const end = /silence_end:\s*(-?\d+(?:\.\d+)?)/.exec(line);
    if (end && pending.length) {
      const from = pending.shift();
      const to = Number(end[1]);
      if (to > from) intervals.push({ start: Math.max(0, from), end: Math.min(durationSeconds, to) });
    }
  }
  for (const from of pending) {
    if (durationSeconds > from) intervals.push({ start: Math.max(0, from), end: durationSeconds });
  }
  return intervals.filter((segment) => segment.end > segment.start);
}

export function classifyCandidate({ streams, durationSeconds, bitrateKbps, origin, silenceIntervals }) {
  const warnings = [];
  const audioStreams = streams.filter((stream) => stream.codec_type === 'audio');
  const videoStreams = streams.filter((stream) => stream.codec_type === 'video');
  const codec = audioStreams[0]?.codec_name ?? null;
  const leading = silenceIntervals.find((segment) => segment.start <= 0.5 && segment.end - segment.start >= LEADING_REVIEW_SECONDS);
  const trailing = silenceIntervals.find((segment) => segment.end >= durationSeconds - 0.5 && segment.end - segment.start >= TRAILING_REVIEW_SECONDS);
  if (!audioStreams.length) warnings.push('no_audio_stream');
  if (audioStreams.length > 1) warnings.push('multiple_audio_streams_choose_exact_track');
  if (videoStreams.length) warnings.push('contains_video_stream_not_site_audio');
  if (origin === 'video-extraction') warnings.push('video_audio_requires_separate_listening_and_rights');
  if (origin === 'unknown') warnings.push('source_provenance_unknown');
  if (codec === 'mp3' && bitrateKbps !== null && bitrateKbps < 192) warnings.push('low_bitrate_no_premium_quality_claim');
  if (leading) warnings.push('long_intro_silence_review');
  if (trailing) warnings.push('long_outro_silence_review');
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) warnings.push('invalid_duration');
  return {
    decision: 'manual_listening_and_source_verification_required',
    warnings,
    leadingSilenceSeconds: leading ? Number((leading.end - leading.start).toFixed(2)) : 0,
    trailingSilenceSeconds: trailing ? Number((trailing.end - trailing.start).toFixed(2)) : 0,
    // Silencedetect cannot recognize DJ jingles, video end-card music or speech.
    note: 'Do not auto-trim, normalize, upscale, transcode or publish. Listen to the first and last 30s, inspect transitions and verify the exact original master.',
  };
}

function runTool(binary, args) {
  const result = spawnSync(binary, args, {
    encoding: 'utf8', shell: false, maxBuffer: 8 * 1024 * 1024, timeout: 180_000, windowsHide: true,
  });
  if (result.error) throw new Error(binary + ' unavailable or timed out: ' + result.error.message);
  if (result.status !== 0) throw new Error(binary + ' failed: ' + (result.stderr ?? '').slice(-1000));
  return result;
}

async function fileSha256(filePath) {
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) digest.update(chunk);
  return digest.digest('hex');
}

export async function auditCandidate(filePath, origin = 'unknown') {
  if (!SUPPORTED_ORIGINS.has(origin)) throw new Error('Invalid origin: ' + origin);
  const fullPath = resolve(filePath);
  const info = await stat(fullPath);
  if (!info.isFile() || !info.size) throw new Error('Candidate is not a nonempty file');
  const probe = runTool('ffprobe', [
    '-v', 'error', '-show_entries',
    'format=duration,format_name,bit_rate:stream=index,codec_type,codec_name,channels,sample_rate,bit_rate',
    '-of', 'json', fullPath,
  ]);
  const metadata = JSON.parse(probe.stdout);
  const durationSeconds = numberOrNull(metadata.format?.duration);
  if (durationSeconds === null || durationSeconds === 0) throw new Error('Duration unavailable; cannot audit silent regions');
  const audio = (metadata.streams ?? []).find((stream) => stream.codec_type === 'audio');
  if (!audio) throw new Error('No audio track in candidate');
  const rate = numberOrNull(audio.bit_rate) ?? numberOrNull(metadata.format?.bit_rate);
  const silence = runTool('ffmpeg', [
    '-nostdin', '-hide_banner', '-nostats', '-i', fullPath, '-map', '0:a:0', '-vn',
    '-af', 'silencedetect=noise=' + DB_THRESHOLD + ':d=' + MIN_SILENCE_SECONDS,
    '-f', 'null', '-',
  ]);
  const silenceIntervals = parseSilences(silence.stderr, durationSeconds);
  const bitrateKbps = rate === null ? null : Math.round(rate / 1000);
  return {
    schema: 'tlp.readonly-audio-intake.v1',
    path: fullPath,
    sha256: await fileSha256(fullPath),
    bytes: info.size,
    origin,
    format: metadata.format?.format_name ?? null,
    codec: audio.codec_name ?? null,
    channels: audio.channels ?? null,
    sampleRate: numberOrNull(audio.sample_rate),
    bitrateKbps,
    durationSeconds: Number(durationSeconds.toFixed(3)),
    silenceIntervals,
    review: classifyCandidate({ streams: metadata.streams ?? [], durationSeconds, bitrateKbps, origin, silenceIntervals }),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const path = args[0];
  const originIndex = args.indexOf('--origin');
  const origin = originIndex === -1 ? 'unknown' : args[originIndex + 1];
  if (!path || path.startsWith('--') || (originIndex !== -1 && !origin)) {
    console.error('Usage: node scripts/audit-audio-candidate.mjs "/path/to/master.mp3|.wav|.flac|.mp4" [--origin suno-export|original-master|editor-export|video-extraction|unknown]');
    process.exitCode = 2;
    return;
  }
  try {
    console.log(JSON.stringify(await auditCandidate(path, origin), null, 2));
  } catch (error) {
    console.error('Audio candidate audit failed: ' + (error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
