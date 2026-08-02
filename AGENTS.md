# Repository agent rules

These rules apply to every human, coding agent and autonomous marathon working in this repository.

## 1. Authority and pre-flight

Use this order of authority:

1. the owner's current direct instruction;
2. `PROJECT_CHARTER.md` and current owner invariants;
3. current `main`, relevant open PRs/issues and exact branch heads;
4. actual source-of-truth files, types, registries and validators;
5. historical reports, closed PRs, old branches and chat handoffs only as evidence.

Before mutation:

1. identify current `main`, the active branch/PR and a rollback SHA;
2. inspect only active work that can overlap the intended files or surface;
3. choose `FAST`, `LANE` or `SYSTEM` according to `docs/WORK_MODES.md`;
4. declare bounded scope, source of truth and applicable checks;
5. read only the rules for the affected surface.

A historical report is not proof of current state. A closed PR or deleted branch proves neither the presence nor the absence of code.

## 2. One lane, one branch, one PR

- One independently mergeable lane has one owner, one canonical branch and one PR.
- Do not create a second branch for an already active lane.
- The current long-form editorial marathon stays on `editorial/longform-marathon-2026-08`, PR #271, until the owner explicitly changes that decision.
- Do not reset, rebase, force-push, close, delete or silently continue another owner's active work.
- Do not create empty remote branches, disposable diagnostic branches or `final/latest/final-2` copies.
- Record out-of-lane findings instead of silently absorbing them into the current PR.
- Temporary writers, patchers, triggers, generators and workflows must not survive their transaction.

The exact scope of the current editorial lane is in `docs/research/BRANCH_SCOPE.md`.

## 3. Proportionate verification

Run checks that can fail because of the actual diff:

- wording/docs only: reference integrity and whitespace/diff checks;
- research ledger: source, duplicate, provenance and public-route gates;
- article/content/data: applicable content validators, typecheck and build;
- shared engine/runtime: targeted contracts plus typecheck/build;
- visual/cover/UI: metadata/provenance, real dimensions and browser/mobile QA;
- production claim: exact source SHA, exact build artifact and separate live witness.

A green check on an earlier head is not evidence for a moved head. A merge does not prove deployment. Production-like output does not prove live bytes.

## 4. Editorial and architectural hard stops

Without a separate owner-approved scope, never:

1. create a one-off page, engine or component when the universal essay/library engine can express the material;
2. register a source-gated article as a public route before source, rights, content, visual and browser gates close;
3. change `dateModified` because of CSS, CI, refactor or a purely technical asset update;
4. present a reconstruction, film frame, museum retelling or random city photograph as historical evidence;
5. turn a poetic image into a diagnosis, exact motive, profession of faith or biographical fact without evidence;
6. weaken a validator merely to let the current material pass;
7. run repository-wide formatter/fixer commands or update dependencies without an explicit request;
8. leave English direct quotations in Russian reader prose when a Russian translation and source should be supplied;
9. publish a number, date, quotation, caption, myth verdict or causal claim without a concrete source;
10. mix raw sources, rights records, research notes and publication-ready packages.

`HOLD` is preferable to plausible falsehood. Ten websites repeating one late memoir are not ten independent witnesses.

## 5. Google Drive and PDF acquisition

The full contract is `docs/SOURCE_ACQUISITION_AND_DRIVE_POLICY.md`.

Minimum rules:

- a 40+ search pass is discovery, not automatic acquisition;
- deduplicate against every existing Drive library and batch, not one old index;
- compare normalized title, author/editor, edition/year, source URL and SHA-256;
- acquire only a source that closes a named research gap;
- record provenance, rights/public-domain status, page count, size, text-layer status and checksum;
- an open book license does not automatically license every embedded photograph separately;
- do not create `FINAL`, `LATEST`, `ULTIMATE`, `NEW` or `COPY` duplicates; use one master record and dated immutable snapshots when needed;
- pirated, rights-unclear, corrupted, low-value or redundant PDFs remain in discovery notes and are not uploaded.

## 6. Definition of done

A lane is complete when:

- the actual diff matches bounded scope;
- source, rights, editorial and technical gates pass on the final head;
- adjacent active work was not overwritten;
- review threads are handled;
- temporary tooling is removed;
- no public date was assigned before readiness;
- production was not claimed without same-SHA deploy/live evidence;
- important decisions, anti-patterns and prohibitions were written into durable documentation rather than left only in chat.

---

## Canonical emblem reference: absolute authority

The only visual authority for the THE LEGENDARY POET emblem is:

`qa/reference/brand-emblem-canonical-reference.webp`

Reference id: `canonical-hooded-figure-v2-clean-base`.

The approved reference has a high layered hood, a broad black face cavern, heavy gathered cloth, a wide cloak, cold upper/side electrical energy and a clean lower edge with no required smoke beneath the cloak. Older SVGs are implementation history only, never artistic references.

## Emblem-only direct-main exception

The following direct-main workflow is a narrow owner-approved exception for the emblem marathon. It does not authorize editorial, research, article, route or unrelated UI work to bypass its canonical lane/PR.

All emblem marathon work is committed directly to `main`. Do not create temporary brand branches or draft PRs that can be abandoned.

Every emblem pass must be one atomic Git tree based on the latest `main` and must update together:

- `src/components/BrandMark.tsx`;
- `public/brand-emblem.svg`;
- `public/brand-mark-micro.svg`;
- `public/brand-emblem-mask.svg`;
- `qa/brand-reference-evaluation.json` with exact Git blob locks;
- affected validators, Browser QA and cache/version markers.

Before moving `main`, confirm that its head has not advanced. Never force-push and never overwrite unrelated work. If `main` advances, rebuild the atomic tree on the new head.

## Mandatory emblem visual loop

1. Open the canonical reference before editing.
2. Keep it visible beside the candidate throughout the pass.
3. Judge macro geometry before detail: hood/body ratio, face width, shoulder spread, cowl construction, three large fold families and the smoke-free lower edge.
4. Never iterate from the preceding SVG alone.
5. Run strict static validation and exact-main Browser QA.
6. Inspect `REFERENCE / CURRENT CANDIDATE` at 192, 96, 56, 32 and 16 px.
7. Inspect `REFERENCE / CURRENT SVG / EXACT-MAIN LIVE SITE` and the actual homepage header/footer.
8. Record all remaining deviations honestly and keep `not-reference-approved` until the user accepts the exact-main visuals.

## Emblem hard stops

Reset the base geometry instead of micro-polishing when:

- the face becomes a narrow oval, droplet or tidy mask;
- the hood/body ratio drifts from the reference;
- the cloak becomes a compact bust, dome or poncho;
- the cowl becomes a clean X, bow, moustache or necktie;
- folds become identical radial wedges;
- glow hides weak cloth construction;
- smoke, mist or a bright pool appears under the cloak;
- tests freeze old coordinates that conflict with the reference;
- green CI is presented as proof of visual fidelity.

## Evidence required after every emblem main commit

- `qa-artifacts/brand-reference-comparison-matrix.png`;
- `qa-artifacts/brand-reference-live-site-comparison.png`;
- `qa-artifacts/brand-live-site-home-first-viewport.png`;
- the exact `main` SHA and workflow artifact digest;
- an explicit visual decision and remaining deviations.

Green CI proves technical integrity only. Change the candidate, never weaken the reference, evidence or score.
