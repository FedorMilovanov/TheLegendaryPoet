# Community feedback storage and sync

This document defines the reliability, privacy, ordering and scale boundary for reader ratings, comments and helpful votes.

## Local durability

The canonical browser key is `tlp-community-feedback:v3`.

The envelope contains only device-owned state needed for resilience:

- optimistic ratings/comments that have not reached a terminal server outcome;
- a persistent outbox of operations not yet acknowledged or permanently rejected by the shared backend;
- bounded settlement tombstones used to reconcile stale tabs after ACK/reject;
- local cooldown timestamps;
- local helpful-vote records;
- local own-rating records;
- update and successful-sync timestamps.

All reads pass through validation. Malformed IDs, target types, score shapes, comment kinds, timestamps and oversized fields are discarded.

The legacy `tlp-community-device-v1` UUID is **local bookkeeping only**. It is not authentication, legal identity, fingerprinting, person-level deduplication, or server authority.

## Shared backend

The production shared path is:

`browser → Cloudflare Worker → D1`

The browser never writes directly to D1 and never supplies a trusted actor ID, network key or server rate-limit bucket.

For the first reader-initiated shared write without a valid actor session, the client executes Cloudflare Turnstile with action `community_session`. The Worker validates the one-time token server-side, checks its hostname/action, derives a keyed network-abuse hash from Cloudflare connection metadata, and mints a signed anonymous actor session. The browser persists only that signed token and its expiry under `tlp-community-actor:v1`.

The actor session is deliberately longer-lived than a Turnstile token so a durable outbox can retry after an outage. Turnstile tokens themselves are never placed in the outbox or localStorage. Background/startup replay is not allowed to summon a new Turnstile challenge: if a valid actor session is absent, queued work remains durable until the next explicit reader action can legitimately mint one.

## Local and shared modes

Production shared mode is enabled only when both public client inputs are present and valid: `VITE_COMMUNITY_API_URL` and `VITE_TURNSTILE_SITE_KEY`. If either is missing or the API URL is malformed, community fails closed to local mode instead of creating a queue that can never mint a signed actor session.

When shared mode is configured, visible state distinguishes waiting, synchronizing, online, queued and offline states. `remoteEnabled` means the complete client-side shared-write configuration exists; it still never proves that the latest read or write succeeded. Runtime success is represented by `CommunitySyncState` and target-specific read phases.

Repository/browser tests may substitute a loopback-only human-proof fixture on `127.0.0.1` or `localhost`; that path is unavailable to production hostnames.

## Atomic user actions, terminal outcomes and retry

A rating, comment or helpful vote is accepted locally only when the complete v3 envelope can be persisted. Optimistic state, own-vote metadata, cooldown and the pending operation are committed together. If the outbox is full, admission fails visibly; older pending work is never silently discarded to make room.

The remote mutation boundary has three explicit outcomes:

- **ACK** — the Worker accepted the operation, including a safe idempotent replay. The operation leaves the outbox and receives a settlement tombstone.
- **Retryable failure** — network failure, timeout, 429, or server-side 5xx/temporary failure. The operation stays at the head of the ordered outbox. Retry uses bounded backoff and honors `Retry-After` when present.
- **Permanent rejection** — a non-retryable 4xx contract/policy failure. The poison operation leaves the queue, gets a rejection tombstone, and its optimistic local shadow is reconciled away instead of being retried forever.

Remote writes are delivered in order. A retryable head failure stops the current flush so later operations are not reordered around it.

A successful ACK does **not** leave a permanent local copy of a server-owned comment/rating shadowing D1. Once acknowledged, the optimistic copy is removed and subscribed target views refresh from the server. This preserves moderation and server truth after reloads. Helpful-vote local metadata may remain as device UI memory, but the public helpful count is re-read from the backend.

Comment writes use a stable client comment ID for network-retry idempotency. Ratings are unique server-side by signed actor + target, and helpful votes by signed actor + comment.

## Multi-tab convergence

`localStorage` is shared across same-origin tabs, but browser read/modify/write is not transactional. Therefore v3 storage events are merged by operation identity instead of replacing the entire in-memory snapshot with whichever tab wrote last.

The merge contract is:

- independent pending operations are unioned deterministically;
- cooldowns keep the greatest still-relevant deadline;
- own-rating records keep the newest compatible value;
- helpful markers are unioned, except a terminal server rejection can roll back the rejected marker;
- ACK/reject settlement tombstones dominate an older pending/local copy with the same operation ID;
- a newer rating edit that legitimately reuses its stable local rating ID is not hidden by an older settlement because its creation timestamp is newer.

This makes stale-tab resurrection a tested failure mode: writing an old pre-ACK snapshot back into storage cannot recreate already settled work.

## Shared comment contract

The browser store/UI and Worker consume one source-of-truth module for comment limits and kinds. The current contract is:

- comment text: 8–2000 Unicode code points after line-ending/space normalization;
- author/pseudonym: at most 60 Unicode code points after control-character cleanup;
- allowed kinds: literary, history, moral, performance;
- per-actor comment cooldown: 20 seconds across comment targets, not a separate cooldown per article/poem.

D1 remains the final enforcement boundary. SQLite `length()` constraints and the Worker validation are aligned to the same character policy. Client checks are an early usability layer, not authority.

## Plain-text fidelity

Comments are plain text. React renders them as text rather than HTML, so markup-looking input such as `<script>` remains literal text. Newlines are preserved in the reader UI.

Collapsed previews truncate on grapheme boundaries when `Intl.Segmenter` is available and fall back to Unicode code-point iteration otherwise. They must not split UTF-16 surrogate pairs into replacement glyphs. Input limits use Unicode-aware truncation rather than browser `maxLength`, whose UTF-16 code-unit semantics would disagree with the Worker/D1 contract for emoji and supplementary characters.

## Public reads and honest read state

The browser never hydrates a global raw ratings corpus.

- Detail pages request one target aggregate and a cursor-paginated comment page.
- Ratings leaderboards request bounded aggregate batches only.
- Comment pages use stable `created_at/id` cursors.
- Compact poem panels remain passive until explicitly opened.
- Local persistence is bounded and contains device-owned work, not the public corpus.

Read state is explicit: unresolved/loading, error, ready-empty and ready-with-data are not interchangeable. A failed initial read must not render a fabricated “0 ratings” or “no comments” state. If a refresh fails after data was already loaded, the last successful aggregate/comment page remains visible with an error indication until a later successful refresh replaces it.

The Worker calculates aggregates in D1 and returns only public fields. Actor IDs and network hashes are never included in read DTOs.

## Comment ordering and filtering

The Worker exposes a canonical newest-first cursor (`created_at DESC, id DESC`). Client-side “Полезные/Новые” sorting and kind filtering apply to the rows that have actually been loaded into the current view.

While another server page exists, the UI explicitly says that the sort/filter scope is the loaded subset and keeps a “load more from the common feed” path reachable even under a kind filter. It must not imply that a helpful/kind ranking over the first page is a global ranking over unseen rows.

## Target ownership of editor state

Community editor, sort/filter and deferred-open state are bound to `targetType:targetId`. When a reused route/component changes from target A to target B, dirty rating/comment state from A is reset before callbacks can submit against B. The browser QA contour exercises a real essay-series A→B navigation, not a component mock.

## Canonical target authority

`npm run community:targets` derives `public/community-targets.json` from the Product's canonical published poet/poem/track/article catalogs during build.

Shared reads and mutations fail closed when that manifest is unavailable or when a syntactically valid target is not in it. If a target is retired from the published catalog, stale D1 rows do not keep its ratings or comments publicly addressable through the Worker. A client-side regex alone is never treated as proof that an object exists.

## Privacy and abuse boundary

D1 stores:

- signed-session actor UUIDs on private tables;
- a 64-character HMAC network key in short-lived abuse buckets;
- community content and rating values.

It does **not** store raw IP addresses, passwords, emails, Turnstile tokens or browser fingerprints.

A registration-free system cannot prove that one physical human has exactly one identity forever. The production control is layered instead: Turnstile-gated actor issuance, signed server identity, per-actor uniqueness, HMAC network budgets, canonical targets, bounded payloads and database constraints.

## Accessibility contract

Reusable mutation feedback is exposed through live-region semantics: successful transient status is polite, warnings/errors are assertive, and live messages are atomic. Sort and kind-filter controls expose `aria-pressed`; expandable comment text exposes `aria-expanded`; loading/error result regions use semantic status rather than color alone.

## Backend invariants

The shared backend independently enforces:

- accepted target types and canonical target IDs on public reads and mutations;
- exact score keys and integer range 1–5;
- shared comment length/kind/author contract;
- one mutable rating per signed actor and target;
- one helpful vote per signed actor and comment;
- stable comment-ID idempotency;
- global per-actor comment cooldown plus network abuse budgets;
- moderation status;
- public responses without actor/network authority fields.

Client checks improve usability and durability but are never the security boundary.
