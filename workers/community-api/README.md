# Cloudflare community API

This directory is the trusted server boundary for shared ratings, comments and helpful votes.

Production topology:

`thelegendarypoet.ru (GitHub Pages) → Cloudflare Worker → D1`

A browser-generated UUID is **not** server authority. The Worker mints a signed anonymous actor session only after Cloudflare Turnstile verification, derives a keyed network-abuse hash from `CF-Connecting-IP`, checks target membership against the release-generated `community-targets.json`, and only then exposes or mutates target-scoped community data.

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

The Worker imports the canonical rating score contract from the repository `src/` tree. Wrangler's normal bundled mode follows static imports into the final Worker bundle; do not copy that contract into a second Worker-only list.

## Runtime configuration in Cloudflare

In the Worker **Settings → Variables and Secrets**, add these three values as type **Secret**:

- `COMMUNITY_SESSION_SECRET`
- `COMMUNITY_NETWORK_SECRET`
- `TURNSTILE_SECRET`

The two HMAC secrets must be different random values of at least 32 bytes. Generate them locally or with a password manager and paste them directly into Cloudflare; never send them through chat, git, GitHub Variables, screenshots, or logs.

`wrangler.jsonc` declares those exact three names under `secrets.required`. The declaration contains names only, never values. Wrangler must refuse `deploy`/`versions upload` if a required secret binding is missing, so an incomplete secret setup cannot silently become a new production Worker version.

For local Worker development, put values only in an ignored `.dev.vars`/`.dev.vars.*` file. Those files are gitignored and must never be committed.

The non-secret runtime variables and D1 binding are already declared in `wrangler.jsonc`:

- `ALLOWED_ORIGINS=https://thelegendarypoet.ru,https://www.thelegendarypoet.ru`
- `TURNSTILE_HOSTNAMES=thelegendarypoet.ru,www.thelegendarypoet.ru`
- `COMMUNITY_TARGET_MANIFEST_URL=https://thelegendarypoet.ru/community-targets.json`
- D1 binding `DB=the-legendary-poet-community`

## Bring-up and activation

The target manifest is part of the static Product release, so Worker readiness must not be certified before that release artifact exists. Worker and Pages deployments may run in either order after merge; a Worker that starts first is expected to remain fail-closed until the manifest appears.

1. Apply `schema.sql` to D1.
2. Confirm the Turnstile widget is **Managed** and restricted to the two production hostnames.
3. Merge only after exact-head repository gates pass. Let the resulting GitHub Pages build publish `/community-targets.json`; community can still remain in local client mode because the public Worker URL has not been activated yet.
4. Let Cloudflare Workers Builds deploy the same `main` revision. If this finishes before the Pages manifest, an interim `GET /health` **503** is expected and is not a deployment success signal.
5. Confirm `/community-targets.json` is reachable from the production site, then verify `GET /health` returns HTTP **200** and reports all of the following:
   - `ok: true`
   - `database: "d1"`
   - `databaseReady: true`
   - `targetAuthorityReady: true`
   - `writesReady: true`
6. Use the `workers.dev` URL only for bring-up. Prefer `community.thelegendarypoet.ru` as a later production custom domain after the initial contour is certified.
7. In GitHub Actions variables set:
   - `COMMUNITY_API_URL` — final HTTPS Worker/custom-domain URL;
   - `TURNSTILE_SITE_KEY` — public Turnstile sitekey.
8. Deploy the static site again so the client receives those public values.
9. Run live adversarial checks before AuditRepo P1 closure.

`/health` is deliberately fail-closed. It does not infer readiness from the D1 binding name or from the mere presence of secrets. It verifies that the four canonical D1 tables exist, that the release target manifest is reachable and valid, and that the required secrets are present and separated. A partial rollout returns HTTP **503**, `ok: false`, and `writesReady: false` rather than producing a false green.

## Human-backed live adversarial certification

The final `TLP-COMM-ABUSE-001` production proof must not bypass Cloudflare Turnstile. Use the committed operator harness only after the Worker, D1, target manifest and Pages client are already live and `GET /health` is fully write-ready.

The harness deliberately **does not accept actor bearer tokens in command-line arguments or environment variables**. It asks for them through a local hidden TTY prompt and never prints them.

1. Choose one current canonical target that is safe for a short operator diagnostic. Use the same target for both fresh profiles and for the harness.
2. Open **two fresh normal browser profiles** on `https://thelegendarypoet.ru` — not Playwright, not a Turnstile bypass and not an existing reader profile.
3. In each fresh profile, submit one temporary **rating** on that target. Complete Turnstile normally. A rating is used because it mints the signed actor session without consuming the comment cooldown required by the concurrency proof.
4. In each profile, open DevTools → Application/Storage → Local Storage → `https://thelegendarypoet.ru` and inspect `tlp-community-actor:v1`. Copy only the `actorToken` value locally. Do **not** paste it into chat, an issue, a shell command, an environment variable or a file.
5. From the repository root run:

```bash
npm run operator:community-live -- \
  --api-url <COMMUNITY_API_URL> \
  --target-type <poet|poem|track|article> \
  --target-id <canonical-target-id>
```

6. Paste profile A and B actor tokens only when the hidden prompts appear. Nothing is echoed.
7. The harness verifies:
   - production `/health` is fully write-ready;
   - the selected target exists in the production manifest;
   - the two signed session payloads contain distinct actor UUIDs;
   - a syntactically valid unknown target is rejected with `404 unknown_target`;
   - two concurrent identical comment writes converge successfully;
   - a stable third replay returns `idempotent=true`;
   - the temporary comment appears exactly once in the public feed;
   - reusing the same comment ID with changed content returns `409 comment_id_conflict`;
   - the second valid rotated actor using that same comment ID also reaches `409 comment_id_conflict`, proving the distinct signed session reached the Worker authority boundary.
8. In a `finally` path the harness runs pinned Wrangler `4.120.0` against production D1 and deletes **all ratings/comments/helpful rows belonging to the two fresh certification actors**. This removes the two ratings used to mint sessions and the temporary proof comment. Shared `tlp_rate_buckets` are intentionally preserved because they are network-abuse authority and may contain real traffic.
9. After cleanup the harness re-reads the public comment feed and refuses PASS if the temporary certification comment remains visible.

If D1 cleanup fails, the harness exits non-zero and leaves a mode-`0600` SQL file in the local temp directory. That file contains pseudonymous actor UUIDs but no bearer tokens. Do not publish it. Re-run the pinned Wrangler cleanup locally, verify the temporary content is gone, then delete the file.

A successful run emits only sanitized evidence: timestamps, origins, target ID, readiness flags and categorical HTTP outcomes. It never emits actor tokens or actor UUIDs.

## Security invariants

- Turnstile is validated server-side on anonymous session issuance and checked for expected action + hostname.
- Anonymous actor tokens are HMAC-signed by the Worker and expire after 90 days.
- Creating another actor session requires another Turnstile verification and is network-budgeted.
- Rating score keys come from one shared canonical contract used by the UI, local outbox and Worker. Incomplete legacy pending ratings are removed from the remote-delivery queue rather than retried forever; historical local data can remain readable without inventing missing scores.
- Rating uniqueness is `(target_type, target_id, actor_id)` in D1.
- Comment retries are idempotent only when the stable comment ID belongs to the same actor **and** the same normalized immutable payload (`target`, author, text, kind). Reusing an ID with different content is a `409 comment_id_conflict`. Concurrent identical retries converge on the single stored row.
- The 20-second per-actor comment cooldown is enforced inside the D1 `INSERT ... WHERE NOT EXISTS` statement, so two concurrent requests cannot both pass a separate read-before-write check.
- Helpful uniqueness is `(comment_id, actor_id)`.
- Network abuse budgets are atomic D1 upserts; the client never supplies the network key, actor ID or budget fields.
- Public read and mutation target IDs must exist in the release-generated canonical manifest. Retiring a target removes Worker-level public access even if stale rows remain in D1. The Worker rejects malformed manifests, unexpected target-type keys and duplicate target IDs instead of silently widening or collapsing authority.
- Reads expose no actor IDs, network keys or secrets.

## Deterministic target authority

`npm run community:targets` derives `public/community-targets.json` from the canonical Product catalogs: published poets, their poems, published music tracks, and published essays. It is generated during the site build, so it is not a second editorial source of truth. Generation fails on duplicate canonical IDs instead of silently de-duplicating them.
