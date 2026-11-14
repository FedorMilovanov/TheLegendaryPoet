# Music release workflow

This document defines the minimum safe path for adding, announcing, publishing, archiving, or replacing a music release.

## Audio origin: originals first, never assume video soundtrack is the master

**Site playback format remains MP3** under `/public/audio/`, because the existing player, manifest, validator and production release gate use this established format. The source/master archive can retain WAV or lossless FLAC separately; WAV files are **not** automatically added to the site, which would significantly increase download size, nor mislabeled as playable MP3. Do not change the player or music catalogue just to admit a new file extension.

Candidate search precedence:

1. Original Suno generation / downloaded owner export or an explicitly approved studio mix in WAV, FLAC or high-quality MP3.
2. Project-owned finished audio-only export with verifiable provenance; compare duration, lyrics and arrangement with source.
3. Editor export from the clean music timeline, with no video outro, bumper or end-screen sound.
4. Only when the version really has unique desired audio: sound extracted from a project-owned video, **explicitly labeled as a video-derived candidate**. Never claim a YouTube/VK stream download is the clean master or that a 128 kbps extraction improves by re-encoding to 320 kbps.

Do not use MP3 from `sermon_MP3_bot` as an audio-release source merely because the bot can extract 128 kbps from a YouTube URL: that is a conversion service, not the music master archive. Use the exact master chosen for the release; a second arrangement must have its own stable release ID and editorial credits.

Before publication, audition the first and last **30 seconds** at minimum **and the full track at least once**. Review musical endings, nonmusical video cards, unexpected spoken words, jingles, appended songs, fade-outs, silence, clipping/distortion and edits that introduce a second composition. Deliberate pauses may be valid; a detected quiet span is not automatic evidence of a defect. Record a human editorial decision; no automated silence threshold is allowed to trim, pad or approve a song.

### Read-only local candidate audit

Requires `ffprobe` and `ffmpeg` installed; **neither writes or edits audio**:

```bash
node scripts/audit-audio-candidate.mjs "/path/to/original-suno.wav" --origin suno-export
node scripts/audit-audio-candidate.mjs "/path/to/mix.mp3" --origin editor-export
node scripts/audit-audio-candidate.mjs "/path/to/clip.mp4" --origin video-extraction
node --test scripts/tests/audio-candidate-audit.test.mjs
```

The JSON report records actual codec, bitrate, duration, channels, file SHA-256 and possible leading/trailing silence. It flags weak bitrate and video soundtrack provenance; it **cannot** detect intelligibility, spliced music, sounds beneath a closing video graphic, musical quality or rights, so the result is always `manual_listening_and_source_verification_required`. Never use this tool's output as an unconditional publication approval.

Record for each candidate: source location and date, exact SHA-256, owner/project, original format/codec, associated poem and generation variant, preferred master decision, human listening notes, edit operations if any, rights/AI disclosures and final release checksum. Do not place local personal paths in public site metadata.

If trimming or remastering is warranted, edit a **new derivative**, preserve the original file and both checksums and re-audit the actual final bytes. Loudness and peak review should be done on final audio, never assumed from the container format; avoid automatic normalization across a whole catalogue without listening. A visually interesting clip may contain a superior musical variant, but keep it separate from the original rather than silently replacing one arrangement with another.

**Only after that** use the existing published-release acceptance below: 320 kbps MP3 is a preferred web delivery target **when supported by a higher-quality original**, never a proof of fidelity; keep the original WAV/FLAC as archival source outside the site's required web assets. Check embedded metadata, separate square/wide artwork, actual duration, waveform, rights, manifest and production URL. `coming-soon` must not be counted as playable.

## Registry first

Every entry lives in `src/data/library/musicTracks.ts` inside `allMusicTracks`.

Required lifecycle fields:

- `availability`: `published`, `coming-soon`, or `archived`;
- `releaseOrder`: a unique positive integer controlling the stable editorial and playback order;
- `releaseYear`: the year associated with the verified publication date or announced target date;
- `publishedAt`: a verified `YYYY-MM-DD` date used only after publication;
- `scheduledFor`: an optional `YYYY-MM-DD` target date used only while an entry is `coming-soon`;
- `poetId`: an existing poet record whose visible name matches `poet`.

`musicTracks` is derived automatically and contains only published entries. The persistent audio runtime receives that public list, so an announcement without a master file cannot enter Next/Previous playback by accident.

`publishedAt` and `scheduledFor` are mutually exclusive. Never convert an announcement into a fake publication by placing its expected date in `publishedAt`.

## Coming soon

A future release may be registered before the audio is ready:

```ts
{
  availability: 'coming-soon',
  releaseOrder: 40,
  releaseYear: 2027,
  publishedAt: undefined,
  scheduledFor: '2027-01-15',
  audioUrl: undefined,
  audioSha256: undefined,
  durationSeconds: undefined,
  waveform: undefined,
}
```

It must not be `featured`. Its detail route can exist without pretending that audio is playable. Do not expose an unfinished MP3, guessed duration, provisional checksum, or synthetic waveform as verified master data.

## Published

Before changing `availability` to `published`, provide and verify:

1. MP3 master under `/public/audio/`;
2. square WebP cover under `/public/images/music/`;
3. wide WebP artwork under `/public/images/music/`;
4. exact duration in seconds and display duration in `m:ss`;
5. SHA-256 of the final immutable MP3;
6. at least 64 real waveform peaks in the `0..1` range;
7. complete credits and rights notice;
8. release-specific accessible theme;
9. matching entry in `public/audio/manifest.json`;
10. actual `publishedAt` date, with `scheduledFor` removed.

Run:

```bash
npm run check
npm run build
```

The music validator rejects duplicate IDs, order values, audio paths, covers, hashes, malformed lifecycle dates, contradictory publication states, unknown poets, inaccessible theme colours, invalid chapter timings, registry/manifest drift, and queue regressions.

## Replacing a master

A master replacement is not a silent file overwrite. Update together:

- MP3 bytes;
- byte count in the manifest;
- SHA-256 in the manifest and registry;
- exact duration;
- waveform when the audio content changed;
- embedded cover and ID3 metadata when needed.

Old checksums must stop matching. This is intentional provenance, not DRM.

## Archiving

Set `availability: 'archived'` instead of deleting the record immediately. Archived entries retain their original `publishedAt`, lose any `scheduledFor`, leave the public archive and playback queue, while their stable ID can still resolve to an explanatory detail page. Persistent listening state is reconciled against the current public catalog and stale progress is pruned.

## Ordering and scale

Do not rely on array position. `releaseOrder` is the stable editorial order used by the default archive view and playback queue. Search, poet filtering, title sorting, and newest/oldest sorting are independent user views and never mutate the source registry.

The archive renders results incrementally rather than mounting an unlimited number of heavy release cards at once. Adding a large batch therefore does not require a new page implementation or a manual queue rewrite.
