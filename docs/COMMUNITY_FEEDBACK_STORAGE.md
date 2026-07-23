# Community feedback storage and sync

This document defines the reliability, privacy, and scale boundary for reader ratings, comments, and helpful votes.

## Goals

The community subsystem must remain usable when:

- the shared backend is not configured;
- the visitor is temporarily offline;
- a remote request times out or returns an error;
- browser storage is unavailable or reaches its quota;
- an older local format contains malformed or duplicate records;
- the archive grows to many poets, poems, tracks, articles, ratings, and comments;
- several tabs are open at the same time.

The interface must never claim that an action was saved or synchronized when the corresponding durable write failed.

## Storage envelope

The canonical browser key is `tlp-community-feedback:v2`.

The envelope contains:

- a validated local snapshot of public ratings and comments;
- a persistent outbox of operations that have not reached the shared backend;
- cooldown timestamps;
- device-local helpful-vote records;
- device-local own-rating records;
- local update and successful-sync timestamps.

All reads pass through validation. Unknown target types, malformed IDs, invalid scores, unsupported comment kinds, broken timestamps, oversized fields, and structurally invalid records are discarded rather than entering the runtime.

## Migration

The v2 reader migrates these earlier keys:

- `tlp-community-feedback-v1`;
- `tlp-community-cooldowns-v1`;
- `tlp-community-helpful-v1`;
- `tlp-community-rated-v1`.

Legacy keys are removed only after the validated v2 envelope is written successfully. A quota or private-mode failure therefore cannot destroy the only surviving copy of the visitor's state.

## Local and shared modes

When Supabase configuration is absent, community feedback runs in local mode. The interface explicitly says that the data belongs to the current browser.

When the backend is configured, the visible state distinguishes:

- waiting for the first synchronization;
- synchronizing;
- online and synchronized;
- online with queued writes;
- offline with a cached snapshot;
- offline with queued writes.

`remoteEnabled` means that a shared backend is configured. It does not by itself prove that the latest request succeeded, so user-facing text must be driven by `CommunitySyncState`, not by the configuration flag alone.

## Atomic user actions

A rating, comment, or helpful vote is accepted only when the complete local envelope can be persisted.

A successful action updates together:

- the visible optimistic snapshot;
- own-rating or helpful-vote metadata where applicable;
- the cooldown;
- the remote outbox operation when shared mode is enabled.

If browser storage rejects the write, none of those changes are committed to the in-memory interface. The user receives a failure message instead of a false success state.

## Persistent outbox

Remote writes are not fire-and-forget. Each pending operation contains a stable operation ID, device ID, validated payload, creation timestamp, and attempt count.

Operations are delivered in order. A failed operation remains in the outbox and stops the current flush, preserving ordering and avoiding a rapid retry loop. The outbox is retried when:

- the action is created;
- remote hydration succeeds;
- the browser returns online.

Successful delivery removes only the matching operation. Repeating an operation is safe because ratings and comments use stable IDs and the backend RPC layer is expected to be idempotent for those IDs and device identities.

## Remote hydration and conflict handling

Remote ratings and comments are authoritative for already synchronized data. Before replacing the local cache, the client preserves unsent local work:

- pending ratings override a remote row with the same stable ID;
- pending comments remain visible even when the server has not received them;
- an optimistic helpful count is retained until its queued vote is delivered.

Malformed remote rows are rejected by the same validation boundary used for local data.

Remote lists are fetched in explicit pages of 1000 rows, up to the current safety ceiling of 20,000 rows per view. Requests have a 12-second timeout. Reaching that ceiling is an operational signal that the backend should expose target-scoped or cursor-based endpoints rather than silently loading an unbounded global table.

## Target-scoped rendering

A page may contain many `CommunityPanel` instances, especially when one poet has many poems. Components therefore subscribe through `communityTargetStore` rather than directly to the full global snapshot.

The target store:

- keeps stable snapshots for unchanged targets;
- recomputes only targets that currently have subscribers;
- notifies only the poet, poem, track, or article whose ratings or comments changed;
- releases the global subscription and cached target records after the last consumer unmounts.

This prevents one helpful vote or comment from rerendering every community panel on a long page.

## Comments and ratings at scale

Comment lists render five entries at a time and support:

- stable newest/helpful ordering;
- filtering by comment kind;
- progressive “show more” rendering;
- a visible result count;
- explicit already-marked helpful state.

Rating controls implement radio-group keyboard behavior with arrow keys, Home, and End. The form reports how many required dimensions are complete and submits only the known dimension keys.

The ratings hub supports search and stable sorting. Search, tag, sort, and rated-only state are encoded in the URL so a filtered view can be shared or restored.

## Privacy boundary

The browser stores a generated device identifier used to make rating updates and helpful votes device-specific. It is not an account, authentication proof, legal identity, or reliable person-level deduplication mechanism.

The client must not describe local browser state as a verified human identity. Stronger abuse prevention, moderation, account recovery, cross-device ownership, deletion requests, and legal retention controls belong to the backend and administrative workflow.

## Backend invariants

The shared backend is expected to enforce independently:

- accepted target types and target IDs;
- score keys and the integer range 1–5;
- comment length and allowed comment kinds;
- one mutable rating per device and target;
- one helpful vote per device and comment;
- stable-ID idempotency for retried operations;
- rate limits and abuse controls;
- moderation and removal rules;
- safe public views that never expose voter or device identifiers.

Client checks improve usability and resilience but are not a security boundary.

## Required validation

Run:

```bash
npm run validate:community-store
npm run validate:community-target-store
npm run typecheck
npm run build
```

The community store validator covers migration, malformed data, remote hydration, outbox retention and retry, pending-write conflict handling, duplicate helpful votes, quota failures, cross-tab events, and corrupt-state recovery.

The target-store validator verifies stable snapshot identity and proves that a mutation for one target does not notify unrelated community panels.
