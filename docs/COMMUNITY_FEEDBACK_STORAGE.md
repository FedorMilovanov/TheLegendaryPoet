# Community feedback storage and sync

This document defines the reliability, privacy, and scale boundary for reader ratings, comments and helpful votes.

## Local durability

The canonical browser key is `tlp-community-feedback:v3`.

The envelope contains only device-owned state needed for resilience:

- optimistic local ratings/comments that belong to this browser;
- a persistent outbox of operations not yet acknowledged by the shared backend;
- local cooldown timestamps;
- local helpful-vote records;
- local own-rating records;
- update and successful-sync timestamps.

All reads pass through validation. Malformed IDs, target types, scores, comment kinds, timestamps and oversized fields are discarded.

The legacy `tlp-community-device-v1` UUID is **local bookkeeping only**. It is not authentication, legal identity, fingerprinting, person-level deduplication, or server authority.

## Shared backend

The production shared path is:

`browser → Cloudflare Worker → D1`

The browser never writes directly to D1 and never supplies a trusted actor ID, network key or server rate-limit bucket.

For the first shared write without a valid actor session, the client executes Cloudflare Turnstile with action `community_session`. The Worker validates the one-time token server-side, checks its hostname/action, derives a keyed network-abuse hash from Cloudflare connection metadata, and mints a signed anonymous actor session. The browser persists only that signed token and its expiry under `tlp-community-actor:v1`.

The actor session is deliberately longer-lived than a Turnstile token so the durable outbox can retry after an outage. Turnstile tokens themselves are never placed in the outbox or localStorage.

## Local and shared modes

Production shared mode is enabled only when both public client inputs are present and valid: `VITE_COMMUNITY_API_URL` and `VITE_TURNSTILE_SITE_KEY`. If either is missing or the API URL is malformed, community fails closed to local mode instead of creating a queue that can never mint a signed actor session.

When shared mode is configured, visible state distinguishes waiting, synchronizing, online, queued and offline states. `remoteEnabled` means the complete client-side shared-write configuration exists; it still never proves that the latest read or write succeeded. Runtime success is represented by `CommunitySyncState`.

Repository/browser tests may substitute a loopback-only human-proof fixture on `127.0.0.1` or `localhost`; that path is unavailable to production hostnames.

## Atomic user actions and outbox

A rating, comment or helpful vote is accepted locally only when the complete v3 envelope can be persisted. Optimistic state, own-vote metadata, cooldown and the pending operation are committed together.

Remote writes are delivered in order. A failed operation remains at the head of the outbox and stops the current flush, avoiding reordering and retry storms. A server acknowledgement removes only the matching operation.

Comment writes use a stable client comment ID for network-retry idempotency. Ratings are unique server-side by signed actor + target, and helpful votes by signed actor + comment.

## Public reads and scale

The browser never hydrates a global raw ratings corpus.

- Detail pages request one target aggregate and a cursor-paginated comment page.
- Ratings leaderboards request bounded aggregate batches only.
- Comment pages use stable `created_at/id` cursors.
- Compact poem panels remain passive until explicitly opened.
- Local persistence is bounded and contains device-owned work, not the public corpus.

The Worker calculates aggregates in D1 and returns only public fields. Actor IDs and network hashes are never included in read DTOs.

## Canonical target authority

`npm run community:targets` derives `public/community-targets.json` from the Product's canonical published poet/poem/track/article catalogs during build.

Mutation handling fails closed when that manifest is unavailable or when a syntactically valid target is not in it. A client-side regex alone is never treated as proof that an object exists.

## Privacy and abuse boundary

D1 stores:

- signed-session actor UUIDs on private tables;
- a 64-character HMAC network key in short-lived abuse buckets;
- community content and rating values.

It does **not** store raw IP addresses, passwords, emails, Turnstile tokens or browser fingerprints.

A registration-free system cannot prove that one physical human has exactly one identity forever. The production control is layered instead: Turnstile-gated actor issuance, signed server identity, per-actor uniqueness, HMAC network budgets, canonical targets, bounded payloads and database constraints.

## Backend invariants

The shared backend independently enforces:

- accepted target types and canonical target IDs;
- exact score keys and integer range 1–5;
- comment length/kind constraints;
- one mutable rating per signed actor and target;
- one helpful vote per signed actor and comment;
- stable comment-ID idempotency;
- actor cooldown plus network abuse budgets;
- moderation status;
- public responses without actor/network authority fields.

Client checks are usability and durability controls, not the security boundary.