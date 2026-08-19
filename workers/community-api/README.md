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

The Turnstile **sitekey** and D1 `database_id` are public deployment identifiers, not credentials. The Turnstile secret and Worker HMAC secrets remain private.

## Production resource binding

The owner Cloudflare account already contains D1 database `the-legendary-poet-community`. Its production binding is committed in [`wrangler.jsonc`](./wrangler.jsonc) as `DB`, which is the normal Cloudflare deployment contract. No Cloudflare account ID, API token, Turnstile secret or HMAC secret is committed.

## Initial database schema

Apply [`schema.sql`](./schema.sql) once to the exact production database before enabling writes.

From the Cloudflare D1 dashboard, open the database **Console**, paste the complete schema, and execute it. The equivalent Wrangler command from this directory is:

```bash
npx --yes wrangler@4.120.0 d1 execute the-legendary-poet-community --remote --file=schema.sql
```

Afterward the database must contain exactly the community tables/indexes defined by `schema.sql`; do not hand-create a parallel schema.

## Worker deployment from GitHub

After this branch is merged and exact-head repository gates are green, use Cloudflare Workers Builds rather than copying Worker source into the dashboard editor:

1. **Workers & Pages → Create application → Import a repository**.
2. Connect GitHub repository `FedorMilovanov/TheLegendaryPoet`.
3. Worker name must be exactly `the-legendary-poet-community`.
4. Production branch: `main`.
5. Root directory: `/workers/community-api`.
6. Build command: leave blank.
7. Deploy command: `npx --yes wrangler@4.120.0 deploy`.
8. Keep production branch builds only until the initial rollout is certified; preview branch builds can be enabled later deliberately.

Cloudflare may create the build API token automatically. Do not create or paste a broad account API token unless there is a specific need.

## Runtime configuration in Cloudflare

In the Worker **Settings → Variables and Secrets**, add these three values as type **Secret**:

- `COMMUNITY_SESSION_SECRET`
- `COMMUNITY_NETWORK_SECRET`
- `TURNSTILE_SECRET`

The two HMAC secrets must be different random values of at least 32 bytes. Generate them locally or with a password manager and paste them directly into Cloudflare; never send them through chat, git, GitHub Variables, screenshots, or logs.

The non-secret runtime variables and D1 binding are already declared in `wrangler.jsonc`:

- `ALLOWED_ORIGINS=https://thelegendarypoet.ru,https://www.thelegendarypoet.ru`
- `TURNSTILE_HOSTNAMES=thelegendarypoet.ru,www.thelegendarypoet.ru`
- `COMMUNITY_TARGET_MANIFEST_URL=https://thelegendarypoet.ru/community-targets.json`
- D1 binding `DB=the-legendary-poet-community`

## Bring-up and activation

1. Apply `schema.sql` to D1.
2. Confirm the Turnstile widget is **Managed** and restricted to the two production hostnames.
3. Deploy the Worker through Workers Builds.
4. Verify `GET /health` reports all of the following:
   - `database: "d1"`
   - `databaseReady: true`
   - `targetAuthorityReady: true`
   - `writesReady: true`
5. Use the `workers.dev` URL only for bring-up. Prefer `community.thelegendarypoet.ru` as the production custom domain.
6. In GitHub Actions variables set:
   - `COMMUNITY_API_URL` — final HTTPS Worker/custom-domain URL;
   - `TURNSTILE_SITE_KEY` — public Turnstile sitekey.
7. Deploy the static site.
8. Run live adversarial checks before AuditRepo P1 closure.

`/health` is deliberately fail-closed. It does not infer readiness from the D1 binding name or from the mere presence of secrets. It verifies that the four canonical D1 tables exist, that the release target manifest is reachable and valid, and that the required secrets are present and separated. A partial rollout must therefore remain `writesReady: false` rather than producing a false green.

## Security invariants

- Turnstile is validated server-side on anonymous session issuance and checked for expected action + hostname.
- Anonymous actor tokens are HMAC-signed by the Worker and expire after 90 days.
- Creating another actor session requires another Turnstile verification and is network-budgeted.
- Rating uniqueness is `(target_type, target_id, actor_id)` in D1.
- Comment retries are idempotent only when the stable comment ID belongs to the same actor **and** the same normalized immutable payload (`target`, author, text, kind). Reusing an ID with different content is a `409 comment_id_conflict`. Concurrent identical retries converge on the single stored row.
- Helpful uniqueness is `(comment_id, actor_id)`.
- Network abuse budgets are atomic D1 upserts; the client never supplies the network key, actor ID or budget fields.
- Mutation target IDs must exist in the release-generated canonical manifest.
- Reads expose no actor IDs, network keys or secrets.

## Deterministic target authority

`npm run community:targets` derives `public/community-targets.json` from the canonical Product catalogs: published poets, their poems, published music tracks, and published essays. It is generated during the site build, so it is not a second editorial source of truth.
