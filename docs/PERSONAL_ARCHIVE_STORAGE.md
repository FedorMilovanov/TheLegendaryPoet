# Personal archive storage

The personal archive combines saved poems with resumable music sessions. It is private browser state, not a public account feature and not part of community ratings.

## Saved poem format

The current key is:

```text
tlp-my-archive:v3
```

Its validated shape is:

```ts
{
  version: 3,
  items: Array<{ id: string; addedAt: number }>,
  updatedAt: number,
}
```

The store rejects malformed IDs, invalid objects and unusable timestamps, deduplicates entries by poem ID, clamps future timestamps, and returns defensive copies.

## Migration

The former `tlp-my-archive-favorites-v2` array is read automatically. The old key is removed only after the validated v3 snapshot has been written successfully. Corrupt JSON falls back to a safe empty or migratable state instead of breaking poet pages.

## Synchronization

A same-tab custom event updates every archive button and the archive page immediately. The browser `storage` event updates other tabs. React components share one `useSyncExternalStore` subscription, so a page containing many poem cards does not create one localStorage parser and two browser listeners per card.

## Library changes

`reconcileFavoritePoems` compares stored IDs with the current poem library. Deleted or renamed poem IDs are pruned without requiring a manual localStorage reset. A migration or reconciliation result is not presented as persisted when the browser rejects the write.

## Write failures

Private browsing restrictions, quota failures, or disabled storage must not crash reading pages. A failed toggle returns the actual previous favorite state, preventing the button from claiming a change that was not stored.

## Listening history

Music progress and completion remain in the separate versioned audio session store. The personal archive reads that state through the global audio provider and shows only meaningful progress (at least eight seconds) or completed releases. Archived or removed public releases are pruned by the audio-session reconciliation introduced in the music catalog runtime.

## Regression verification

`npm run validate:archive-store` checks:

- fresh storage creation;
- v2 migration and delayed legacy-key removal;
- malformed and duplicate entry cleanup;
- future timestamp clamping;
- same-tab and cross-tab notifications;
- invalid-ID rejection;
- write-failure truthfulness;
- reconciliation after library changes;
- defensive copies;
- corrupt JSON recovery.
