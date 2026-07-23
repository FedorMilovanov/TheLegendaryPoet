# Music release workflow

This document defines the minimum safe path for adding, announcing, publishing, archiving, or replacing a music release.

## Registry first

Every entry lives in `src/data/library/musicTracks.ts` inside `allMusicTracks`.

Required lifecycle fields:

- `availability`: `published`, `coming-soon`, or `archived`;
- `releaseOrder`: a unique positive integer controlling the stable editorial and playback order;
- `publishedAt`: a verified `YYYY-MM-DD` date for published releases;
- `poetId`: an existing poet record whose visible name matches `poet`.

`musicTracks` is derived automatically and contains only published entries. The persistent audio runtime receives that public list, so an announcement without a master file cannot enter Next/Previous playback by accident.

## Coming soon

A future release may be registered before the audio is ready:

```ts
{
  availability: 'coming-soon',
  releaseOrder: 40,
  publishedAt: undefined,
  audioUrl: undefined,
  audioSha256: undefined,
  durationSeconds: undefined,
  waveform: undefined,
}
```

It must not be `featured`. Its detail route can exist without pretending that audio is playable.

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
9. matching entry in `public/audio/manifest.json`.

Run:

```bash
npm run check
npm run build
```

The music validator rejects duplicate IDs, order values, audio paths, covers, hashes, malformed dates, unknown poets, inaccessible theme colours, invalid chapter timings, registry/manifest drift, and queue regressions.

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

Set `availability: 'archived'` instead of deleting the record immediately. Archived entries leave the public archive and playback queue, while their stable ID can still resolve to an explanatory detail page. Persistent listening state is reconciled against the current public catalog and stale progress is pruned.

## Ordering and scale

Do not rely on array position. `releaseOrder` is the stable editorial order used by the default archive view and playback queue. Search, poet filtering, title sorting, and newest/oldest sorting are independent user views and never mutate the source registry.
