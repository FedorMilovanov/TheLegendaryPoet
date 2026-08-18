# Cloudflare community API

This directory is the trusted write boundary for shared ratings, comments and helpful votes.

Production topology:

`thelegendarypoet.ru (GitHub Pages) → Cloudflare Worker → D1`

A browser-generated UUID is **not** server authority. The Worker mints a signed anonymous actor session only after Cloudflare Turnstile verification, derives a keyed network-abuse hash from `CF-Connecting-IP`, checks target membership against the release-generated `community-targets.json`, and only then writes to D1.

## Secrets and privacy

Set these as Worker secrets, never as repository variables or `VITE_*` values:

- `COMMUNITY_SESSION_SECRET` — random 32+ byte secret used to sign anonymous actor sessions.
- `COMMUNITY_NETWORK_SECRET` — a different random 32+ byte secret used to HMAC the connecting IP for abuse budgets.
- `TURNSTILE_SECRET` — secret for the Turnstile widget bound to `thelegendarypoet.ru` and `www.thelegendarypoet.ru`.

D1 stores only the resulting 64-character HMAC network key. Raw IP addresses and Turnstile tokens are never persisted.

## One-time account setup

Do not copy the example config into production until the real D1 database exists.

1. Create D1 database `the-legendary-poet-community` in the owner Cloudflare account.
2. Copy `wrangler.example.jsonc` to a local uncommitted `wrangler.jsonc` and replace the database ID with the real D1 ID.
3. Apply `schema.sql` to that exact database.
4. Create a Turnstile **Managed** widget for the production hostnames.
5. Put the three secrets above into the Worker secret store.
6. Deploy the Worker and verify `/health` reports `database: "d1"` and `writesReady: true`.
7. Prefer a same-site custom domain such as `community.thelegendarypoet.ru` for production. `workers.dev` is acceptable for bring-up only.
8. Set GitHub Actions variables `COMMUNITY_API_URL` and `TURNSTILE_SITE_KEY`. They are public runtime configuration; no secret goes into the site bundle.
9. Run the full exact-head repository and browser QA gates before merge/closure.

The current repository intentionally does not commit a real `database_id`, account ID, Turnstile secret or Worker secrets.

## Security invariants

- Turnstile is validated server-side on anonymous session issuance and checked for expected action + hostname.
- Anonymous actor tokens are HMAC-signed by the Worker and expire after 90 days.
- Creating another actor session requires another Turnstile verification and is network-budgeted.
- Rating uniqueness is `(target_type, target_id, actor_id)` in D1.
- Comment retries are idempotent by stable client comment ID, but a different actor cannot claim an existing ID.
- Helpful uniqueness is `(comment_id, actor_id)`.
- Network abuse budgets are atomic D1 upserts; the client never supplies the network key, actor ID or budget fields.
- Mutation target IDs must exist in the release-generated canonical manifest.
- Reads expose no actor IDs, network keys or secrets.

## Deterministic target authority

`npm run community:targets` derives `public/community-targets.json` from the canonical Product catalogs: published poets, their poems, published music tracks, and published essays. It is generated during the site build, so it is not a second editorial source of truth.
