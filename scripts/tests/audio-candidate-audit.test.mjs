import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyCandidate, parseSilences } from '../audit-audio-candidate.mjs';

test('detects beginning, inner pause and ending from actual ffmpeg silence log', () => {
  const log = [
    '[silencedetect @ 000] silence_start: 0',
    '[silencedetect @ 000] silence_end: 3.2 | silence_duration: 3.2',
    '[silencedetect @ 000] silence_start: 81.4',
    '[silencedetect @ 000] silence_end: 83.1 | silence_duration: 1.7',
    '[silencedetect @ 000] silence_start: 96',
  ].join('\n');
  const segments = parseSilences(log, 100);
  assert.deepEqual(segments, [
    { start: 0, end: 3.2 },
    { start: 81.4, end: 83.1 },
    { start: 96, end: 100 },
  ]);
});

test('trailing silence is review-only and never triggers automatic cutting or approval', () => {
  const silences = [{ start: 97, end: 100 }];
  const result = classifyCandidate({
    streams: [{ codec_type: 'audio', codec_name: 'mp3' }],
    durationSeconds: 100,
    bitrateKbps: 320,
    origin: 'suno-export',
    silenceIntervals: silences,
  });
  assert.equal(result.decision, 'manual_listening_and_source_verification_required');
  assert.equal(result.trailingSilenceSeconds, 3);
  assert.ok(result.warnings.includes('long_outro_silence_review'));
  assert.match(result.note, /Do not auto-trim/);
});

test('MP4 and video-derived audio require separate proof even with a clean ending', () => {
  const result = classifyCandidate({
    streams: [{ codec_type: 'audio', codec_name: 'aac' }, { codec_type: 'video', codec_name: 'h264' }],
    durationSeconds: 180,
    bitrateKbps: 256,
    origin: 'video-extraction',
    silenceIntervals: [],
  });
  assert.ok(result.warnings.includes('contains_video_stream_not_site_audio'));
  assert.ok(result.warnings.includes('video_audio_requires_separate_listening_and_rights'));
  assert.equal(result.decision, 'manual_listening_and_source_verification_required');
});

test('128 kbps copy is flagged; 320 kbps does not prove it is a good master', () => {
  const baseline = { streams: [{ codec_type: 'audio', codec_name: 'mp3' }], durationSeconds: 200, silenceIntervals: [] };
  const low = classifyCandidate({ ...baseline, origin: 'original-master', bitrateKbps: 128 });
  const high = classifyCandidate({ ...baseline, origin: 'original-master', bitrateKbps: 320 });
  assert.ok(low.warnings.includes('low_bitrate_no_premium_quality_claim'));
  assert.equal(high.warnings.includes('low_bitrate_no_premium_quality_claim'), false);
  assert.equal(high.decision, 'manual_listening_and_source_verification_required');
});

test('undocumented provenance and separate audio tracks are visible', () => {
  const result = classifyCandidate({
    streams: [{ codec_type: 'audio', codec_name: 'pcm_s16le' }, { codec_type: 'audio', codec_name: 'aac' }],
    durationSeconds: 123,
    bitrateKbps: null,
    origin: 'unknown',
    silenceIntervals: [],
  });
  assert.ok(result.warnings.includes('multiple_audio_streams_choose_exact_track'));
  assert.ok(result.warnings.includes('source_provenance_unknown'));
});
