# Personal archive storage

The personal archive combines saved poems with resumable music sessions. It is private browser state, not a public account feature and not part of community ratings.

## Saved poem format

The current key is:

```text
tlp-my-archive:v4
```

The validated v4 snapshot stores one winning operation per poem ID:

```ts
{
  version: 4,
  operations: Array<{
    id: string;
    favorite: boolean;
    addedAt: number;
    generation: string;
    writerId: string;
  }>;
  updatedAt: number;
}
```

`generation` is a decimal causal counter for one poem ID. It is compared independently of wall-clock time. A higher generation wins; equal-generation add/remove conflicts are removal-wins; `writerId` provides a stable total order for equal-intent concurrent operations. `addedAt` is presentation metadata, not causal ordering metadata. Future display values are clamped only when exposed to the UI, so repeated parsing/merging of the stored operation remains deterministic.

The store rejects malformed IDs, generations and writer IDs, deduplicates operations by poem ID and returns defensive copies.

## Migration

`tlp-my-archive:v3` whole snapshots and the older `tlp-my-archive-favorites-v2` array are migration inputs. Their valid saved poems are converted to v4 operations. A previous key is removed only after the validated v4 snapshot has been persisted successfully, so a quota/private-storage failure does not falsely retire the last good representation.

Corrupt JSON falls back to a safe empty or migratable v4 state instead of breaking poet pages. Read-side migration persists silently; user mutation notifications are reserved for actual add/remove/reconciliation writes.

## Cross-tab convergence

A same-tab custom event updates archive buttons and the archive page immediately. Browser `storage` events do more than notify: for the v4 key the store merges the current physical value with `StorageEvent.oldValue` and `StorageEvent.newValue`.

This repairs the localStorage last-writer-wins race. If two tabs both read an old empty archive, then one writes poem A and a stale peer physically overwrites it with poem B, the storage event still carries A in `oldValue`; the deterministic per-poem merge restores `{A, B}`. The repair is idempotent and does not rely on sleeps or debounce.

For the same poem ID, a later observed operation advances generation. An equal-generation concurrent removal beats an add, preventing a stale peer from resurrecting a removal. A later intentional re-add that has observed that removal advances generation normally and can win.

React components still share one `useSyncExternalStore` subscription, so a page containing many poem cards does not create one localStorage parser and two browser listeners per card.

## Library changes

`reconcileFavoritePoems` compares active saved IDs with the current poem library. Deleted or renamed poem IDs become removal tombstones instead of being erased from the protocol state. That keeps reconciliation authoritative even if a stale peer later delivers an older add for the removed ID.

A migration or reconciliation result is not presented as persisted when the browser rejects the write.

## Write failures

Private browsing restrictions, quota failures, or disabled storage must not crash reading pages. A failed toggle returns the actual previous favorite state, preventing the button from claiming a change that was not stored.

## Listening history

Music progress and completion remain in the separate versioned audio session store. The personal archive reads that state through the global audio provider and shows only meaningful progress (at least eight seconds) or completed releases. Archived or removed public releases are pruned by the audio-session reconciliation introduced in the music catalog runtime.

## Regression verification

`npm run validate:archive-store` checks:

- fresh v4 storage creation;
- lossless v3 and v2 migration with delayed old-key retirement;
- malformed ID/generation/writer cleanup;
- future display timestamp isolation from convergence ordering;
- same-tab mutation and cross-tab notification behavior;
- deterministic stale-reader add/add convergence in either order;
- equal-generation remove-wins semantics and later intentional re-add;
- duplicate-delivery idempotence;
- physical stale-overwrite repair through storage-event `oldValue` + `newValue`;
- invalid-ID rejection;
- write-failure truthfulness;
- reconciliation tombstones after library changes;
- defensive copies;
- corrupt JSON recovery.

Manual Browser QA also runs a Chromium two-tab witness through real poet archive controls and verifies that both tabs plus `/archive` converge on both saved poems.
