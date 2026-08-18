# Community feedback storage, sync, and authority

This document defines the reliability, privacy, and trust boundaries for reader ratings, comments, and helpful votes.

## Goals

The community subsystem must remain usable when the shared backend is not configured, the visitor is temporarily offline, a remote request fails, browser storage is unavailable, older local state is malformed, the catalog grows, or several tabs are open at once.

The interface must never claim that an action reached the shared database when the corresponding durable write has not been acknowledged.

## Browser envelope

The canonical browser envelope is `tlp-community-feedback:v3`. It stores only device-owned state needed for optimistic UI and reliable retry:

- a bounded local snapshot of the visitor's own/pending ratings and comments;
- a persistent outbox of operations not yet acknowledged by the shared backend;
- local cooldown timestamps;
- local helpful-state markers;
- the visitor's own rating records used to edit an existing rating in the UI;
- update and successful-sync timestamps.

All reads pass through validation. Unknown target types, malformed IDs, invalid scores, broken timestamps and oversized fields are discarded before entering runtime state.

The old `tlp-community-device-v1` UUID exists only inside the legacy v3 outbox shape. It is **not authentication or person identity and не передаётся на сервер hardened transport**. After a durable Supabase Auth session is established the legacy key is removed. A future storage-format migration may remove the unused field from persisted outbox records without changing the remote security model.

## Shared-mode identity

When shared mode is enabled, a mutation first obtains a **server-issued** anonymous Supabase Auth session. No email, password, profile or mandatory registration is required. The browser persists the access/refresh session so normal reloads and tabs reuse the same server actor rather than minting an identity for every action.

The browser cannot choose the actor used by Postgres. The Edge Function verifies the Auth bearer token and derives the actor UUID from the verified server response. Caller-provided `voter_id`, `actor_id`, network hash and similar authority fields are not accepted in the mutation body.

## Local and shared modes

Without backend configuration, feedback stays local to the current browser and the UI must say so.

With backend configuration, public reads use the safe aggregate/comment views while writes use the trusted `community-write` Edge Function. `remoteEnabled` means configuration exists; it does not prove the last network request succeeded. User-facing state is therefore driven by `CommunitySyncState`, not by the configuration flag alone.

## Atomic local actions and outbox

A rating, comment or helpful action is accepted locally only when the complete browser envelope can be persisted. Successful local acceptance updates the optimistic state, local ownership marker/cooldown and (in shared mode) the outbox atomically. If browser storage rejects the write, the in-memory interface does not pretend the action succeeded.

Pending operations are delivered in order. A failed operation remains queued and stops the current flush, preventing a hot retry loop. Retry occurs on creation, successful remote hydration and return to online state. Stable operation IDs keep comment/helpful retries idempotent; ratings are upserted by the verified server actor and canonical target.

## Trusted remote write boundary

The remote write path is:

`browser → Supabase Auth → community-write Edge Function → service-only RPC → Postgres`.

The Edge Function independently enforces:

- verified Auth actor identity;
- canonical target membership from the deployed Product manifest `/community-targets.json`;
- exact target-specific rating dimension keys and integer range 1–5;
- comment kind, author and text bounds;
- published-comment existence for helpful votes;
- request size and origin policy;
- a keyed network abuse budget derived from the trusted gateway client-IP header.

The raw IP is not written to the community tables. The function converts the gateway value to an HMAC-SHA256 network key with `COMMUNITY_ABUSE_SECRET`, and Postgres applies atomic rate budgets to that keyed value. Clearing localStorage or creating another anonymous Auth actor therefore does not create an unlimited write path.

The canonical target manifest is generated from the same Product sources that render public poet, poem, published-track and article pages. Unknown or stale target IDs fail closed instead of becoming arbitrary database namespaces.

## Database permissions

Public clients may select only the public views. Base tables and abuse buckets are not writable by `anon` or `authenticated`.

Legacy browser-authoritative mutation RPCs are removed. Hardened mutation functions and the atomic budget helper are executable only by `service_role`, which is available to the Edge Function and never shipped to the browser.

A rating has one active row per verified Auth actor and target; an update replaces that actor's previous score rather than adding another rating. Helpful votes are unique per verified actor and comment.

## Remote reads and scale

Remote data is target-scoped. The target store loads an aggregate row and bounded cursor-paginated comments for the active target. The ratings hub loads aggregate poet rows only. Public raw-rating downloads are not part of the normal reader path.

A page may contain many community panels, so components subscribe through `communityTargetStore`. Stable snapshots are retained only while needed, unrelated targets are not notified, and target records are released after their last subscriber unmounts.

## Cross-tab and failure behavior

Browser storage events keep persisted community state observable across tabs. Offline writes stay in the outbox. A failed remote read must not be rendered as authoritative zero/empty data; read-state semantics are owned separately by the current community read-state repair root.

The current v3 envelope still serializes a legacy local outbox UUID for migration compatibility, but remote transport ignores it completely. This compatibility field has no security meaning and cannot alter Auth actor, canonical target checks or network budgets.

## Privacy boundary

The anonymous Auth actor is a pseudonymous backend identifier, not a verified human identity. The HMAC network key is an abuse-control pseudonym and is not exposed in public views. Public views omit actor IDs and network keys.

Stronger account recovery, cross-device ownership, formal deletion workflows, moderation/reporting tools and optional CAPTCHA challenges are separate product/operations capabilities. None may weaken the rule that client-side fields are not a server authority.

## Required validation

Run:

```bash
npm run validate:community-store
npm run validate:community-target-store
npm run validate:community-scaling
npm run validate:community-authority
npm run typecheck
npm run build
```

`validate:community-authority` additionally proves that the release-derived target manifest matches canonical Product data, browser mutation payloads contain no actor/network authority, the Edge Function verifies Auth and derives the network key server-side, legacy public RPCs are removed, and hardened RPCs are service-role-only.
