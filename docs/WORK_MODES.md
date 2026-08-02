# Work Modes — FAST / LANE / SYSTEM

**Project:** THE LEGENDARY POET  
**Effective:** 2 August 2026

Purpose: choose checks in proportion to the real risk instead of treating every typo, article and shared-engine change as the same operation.

## 1. Minimum pre-flight

Before mutation:

1. read the owner's current instruction;
2. record current `main`, active branch/PR and rollback SHA;
3. inspect only adjacent active work that may overlap;
4. choose one mode;
5. identify source of truth and checks that directly cover the diff.

## 2. Modes

| Mode | Use | Minimum iteration evidence |
|---|---|---|
| `FAST` | one bounded wording, metadata or documentation correction without schema/runtime impact | reference/link integrity; whitespace/diff check |
| `LANE` | article, research corpus, visual marathon, multi-file feature or route-local work | relevant content/data/type/browser contracts |
| `SYSTEM` | governance, package/workflow, shared essay engine, global data schema, routing or release policy | checks for the touched control plane plus exact-head evidence |

Mode controls risk and verification, not branch multiplication. One active lane does not fan out into duplicate branches.

## 3. Current editorial lane

```md
Mode: LANE
Lane / owner: long-form editorial marathon
Canonical branch: editorial/longform-marathon-2026-08
Canonical PR: #271
Purpose: article research, myth/source ledgers, visual rights, approved covers, publication queue and related validators/QA
Forbidden overlap: emblem marathon, homepage redesign, unrelated shared UI, premature public routes
```

## 4. Verification matrix

### Documentation only

Use when prose cannot affect runtime or published content:

- verify internal links and authority order;
- ensure new rule does not contradict an explicit owner invariant;
- inspect exact diff;
- no full build or browser suite is required solely for wording.

### Research/source ledger

- verify source URL and bibliographic identity;
- mark primary/academic/memoir/popular status;
- check duplicates and provenance;
- keep unresolved claims `HOLD`;
- confirm no reader route or unsupported production metadata was introduced.

### Article/content/data

Run the applicable subset:

```bash
npm run validate:library
npm run validate:essays
npm run validate:myths
npm run validate:citations
npm run validate:covers
npm run validate:style
npm run typecheck
npm run build
```

A new or materially changed article normally needs content checks, typecheck and build. Add its route/browser contracts when rendering or interaction can change.

### Shared engine/runtime

- targeted validator for the component/type/runtime contract;
- `npm run typecheck`;
- `npm run build`;
- relevant interaction/route/browser checks;
- do not weaken exhaustiveness or schema guards.

### Visual, cover and archive-image work

- verify actual file dimensions, format, size and checksum;
- update alt, caption, `coverKind`, credit, provenance and source URL atomically;
- run `validate:covers` and applicable essay/content checks;
- inspect desktop and mobile crops;
- verify overlays/lightbox when affected.

### Production claim

Source truth, build truth and production truth are separate:

1. exact source SHA;
2. exact build artifact from that SHA;
3. exact deployed/live witness.

A merge or green CI job is not a live-site witness.

## 5. Boundaries

`FAST` must not change shared engine, routes, package files, workflows, global styles or broad data.

`LANE` must not absorb unrelated system fixes or another active owner's surface.

`SYSTEM` must remain bounded; governance changes do not silently include article rewrites or visual redesign.

## 6. Before merge

- actual diff matches declared scope;
- required checks cover final head;
- unresolved review threads are handled;
- temporary automation introduced by the lane is absent;
- public dates remain proposals until production gates close;
- production is not claimed without same-SHA live evidence.
