# CI & deploy notes

## Current GitHub Actions (`.github/workflows/deploy.yml`)

Runs on push to `main` (and `workflow_dispatch`):

1. `npm ci`
2. `npm run build` with `VITE_BASE=/TheLegendaryPoet/`
3. `npx tsx scripts/prerender-og.mjs`
4. `cp dist/index.html dist/404.html`
5. Upload + deploy to GitHub Pages

## Recommended full gate (run locally / before merge)

```bash
npm run check
# typecheck → integrity → deep → build → postbuild → live smoke
npm run check:hall   # Hall-specific static + route smoke
```

`postbuild.mjs` wraps prerender-og + `404.html` (same outcome as the two
deploy steps above, single entrypoint). Prefer it in any future workflow
edit once the token has `workflows` permission.

## Optional workflow upgrades (needs `workflows` scope)

When the GitHub App or a human can edit workflows, add before Build:

```yaml
- name: Typecheck + integrity + deep
  run: |
    npm run typecheck
    npm run check:integrity
    npm run check:deep
```

After Build, replace the two post steps with:

```yaml
- name: Postbuild (OG + SPA fallback)
  run: node scripts/postbuild.mjs

- name: Live smoke
  run: npm run check:smoke
  env:
    VITE_BASE: /TheLegendaryPoet/
```

## Hall Playwright

```bash
npx playwright install chromium   # once, needs network
npm run test:hall                 # e2e/hall.spec.ts against preview
```

Arena agent tokens often cannot push workflow file changes; keep CI docs here
and leave `deploy.yml` on the mainline shape until a human updates it.
