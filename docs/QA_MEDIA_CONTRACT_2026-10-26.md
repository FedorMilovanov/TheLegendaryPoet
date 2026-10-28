# QA media wiring: complete the remaining migration

Branch: `arena/f3e23b45-thelegendarypoet`; draft PR #525 stays unmerged.
Baseline: `9143983a7b977ec58384696ad576863a2171df2c`, clean tree.
No production source, media, prose, dependencies, workflows, test budgets,
thresholds, retry settings or owner-gate contracts change in this follow-up.

## Root cause and single owner

The locked runner does not wire standalone `test.use({ reducedMotion })`
fields into BrowserContext media settings. The earlier theme-spec repair was
correct, but the remaining inventory was incomplete: there are **nine**, not
previously reported eight, declaration sites in seven other modules. The
additional site is `manual-e2e`'s common **no-preference** route audit; it is a
`test.use` declaration, not a `browser.newContext` call.

| QA module | Sites migrated |
| --- | ---: |
| shell-noise-singleton | 1 |
| reader-text | 1 |
| reader-journeys | 2 |
| manual-e2e | 2 |
| home-labels | 1 |
| hall-production-route (geometry only) | 1 |
| essay-lightbox-overlay | 1 |

All nine now use `contextOptions`. Existing explicit `page.emulateMedia`
calls remain unchanged. The theme-spec guard is extracted without changing
its assertion logic into **one shared owner**, `qa/media-contract.mjs`, and
registered in all eight affected specs. It checks actual reduced-motion and
forced-colors `matchMedia` values on the blank page before each requested-media
scenario. Unspecified media remains unconstrained; later explicit emulation
is not overridden. This checks the initial declared scenario mode, not every
subsequent emulation transition or every rendered animation frame.

Seven new Node tests cover acceptance, both mismatch directions, registration,
unspecified media, and an AST scanner. The scanner walks QA `.mjs` modules and
rejects literal/shorthand standalone `reducedMotion`/`forcedColors` properties
in `test.use`, without rejecting `contextOptions`, `page.emulateMedia` or
`browser.newContext`. It is not a general evaluator of arbitrary dynamic JS.
The existing `validate:browser-runtime` command executes these tests, so this
is a permanent existing-gate check, not an optional local-only test file.

## Evidence before commit

- Clean baseline: `npm ci`, contracts, check, build, budgets, **92 Node / 4 TS**
  tests all PASS. Previous exact-head CI for 9143983 remains historical.
- New tests before migration: **6 PASS / 1 FAIL**, listing all **nine** invalid
  declaration sites. No existing production failure was silently reclassified.
- After migration: **7/7 new Node tests PASS**, including guard rejection tests.
- Final contracts/check/build/build-output budget: PASS; **99 Node / 4 TS PASS**.
- Focused browser migration run: **45 PASS, 8.2 minutes**, one serial Chromium149
  worker, no retries, unchanged 45s scenarios/20s expectations. Includes actual
  reduced/no-preference viewport matrices, enlarged-text captions/dock, reader
  progress/citations/viewer, restored local media and Hall shell geometry.
- Combined unfiltered discovery: **202 cases in 10 source files** (eight specs
  plus imported case registries). Discovery is not a completed-run PASS.
- Source review and `git diff --check`: PASS; production files unchanged.

Local launcher only substitutes the external executable/launch arguments and
artifact paths. It does not globally force reduced motion or alter timeouts.
Chromium149 uses its own extracted AL2023 libraries, no NSS shim. Browser runs
and production builds are serial, with no simultaneous local browser suites.
Ignored diagnostics: `/home/user/qa-media-{red,green,focused,final-*}.log` and
`qa-artifacts/media-contract/`. No binary artifacts committed.

## Exact-head completion and boundaries

The full unfiltered local run and remote results for the resulting commit are
reported separately in the PR, avoiding a documentation-only follow-up commit
that would invalidate exact-head evidence and restart the same workflows.
The earlier 104-pass theme run and original four timeouts remain documented in
`PR525_RECHECK_2026-10-25.md`, not relabeled as results for this new commit.

Changing the Hall geometry QA file correctly requires the existing **Hall web
runtime proof** certification lane. Neither its classifier nor its owner gates
are changed or bypassed. This is automated technical QA, not new Hall visual,
documentary-rights or full-museum approval.

The prior 23 external artwork URL failures and 68 focused axe incomplete-node
observations remain uncertified; a media-fixture repair does not resolve them.
No image replacements/hash repinning, issue closure, deployment, merge or branch
deletion occurs. Rollback: revert this bounded QA/helper/validator/test change;
there is no application data migration.
