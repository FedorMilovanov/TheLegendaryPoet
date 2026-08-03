# Editorial Branch Closure Gate — 3 August 2026

**Repository:** `FedorMilovanov/TheLegendaryPoet`  
**Branch:** `editorial/longform-marathon-2026-08`  
**Pull request:** `#271`  
**Gate owner:** project editorial policy and exact-head evidence

## 1. Closed gate

The primary source-registry classification gate is closed.

```yaml
registered_rows: 287
row_level_verdicts: 287
audit_pending: 0
latest_audit: AUDIT-2026-08-03-P16
status: PRIMARY-REGISTRY-AUDIT-COMPLETE
```

This means every discovery row has a dated direct-audit classification. It does not mean every source is readable, reusable, correctly identified, acquired or suitable for publication.

## 2. Open source-remediation gates

```yaml
HOLD-RETRY: 102
HOLD-RIGHTS_OR_IDENTITY: 45
KEEP-DOWNLOAD-CANDIDATE_NOT_MANIFESTED: 12
DRIVE-VERIFIED: 3
DROPS: 6
LEGACY_TESTIMONY_HOLD-DIRECT-READ: 75
```

The 102 retry rows are not active evidence. The 45 rights/identity holds cannot be mirrored or used as canonical exact objects until resolved. The twelve download candidates still require the full acquisition, rights, dedupe and checksum gate.

## 3. Open editorial and evidentiary gates

PR `#271` still records these blockers:

- lawful original or complete binaries for the named Yesenin research objects;
- complete medical file and a supported account of treatment termination;
- hotel, transport and inquiry originals, Gilyarevsky act, witness rows and forensic object chain for 24–28 December 1925;
- final-poem facsimile and laboratory evidence plus the complete commission report;
- chapter 15 prose, chapter 16 and the final project-wide moral/theological review;
- exact approved production WebP files, metadata, provenance, SHA-256 and item-level image rights;
- explicit owner authorisation before sending the three institutional acquisition requests;
- dependency remediation using an npm-generated lockfile and rerun of normal final-head checks.

The 75 testimony quotations remain `HOLD-DIRECT-READ`. They may not be published as exact quotations merely because a phrase appears in search results or a secondary source.

## 4. Exact-head workflow gate

On the latest checked branch head before the final documentation commits, these pull-request workflows were successful:

- Yesenin Duncan safe publication;
- Yesenin Part I safe publication;
- Articles catalog acceptance;
- Yesenin Part I browser acceptance.

The following were cancelled rather than green:

- CI;
- Manual Browser QA;
- Site route integrity audit;
- Brand deep reference and motion audit.

Pages deployment was skipped as expected for the draft branch.

A cancelled workflow is not a passed workflow. All required checks must be rerun on the final exact head after the final content and dependency state is fixed.

## 5. Required repository state

```yaml
pr_state: OPEN
pr_mode: DRAFT
merge_to_main: BLOCKED
ready_for_review: BLOCKED
branch_deletion: BLOCKED
public_part_II_route: BLOCKED
production_cover_switch: BLOCKED
completion_announcement: BLOCKED
```

Closing or deleting the branch now would either discard work or imply a completion state unsupported by the evidence. Merging now would move unresolved editorial, forensic, rights, visual and dependency gates into `main`.

## 6. Conditions for later closure

The branch may be closed by merge only after all of the following are evidenced on one immutable final head:

1. all merge-critical editorial and evidentiary gates in PR `#271` are closed or explicitly removed by the owner through a documented policy decision;
2. all production-bound sources, quotations and images have exact identity and rights evidence;
3. dependency remediation is complete without fabricated integrity data or a hidden forced major migration;
4. every required CI, content, browser, route, visual and publication workflow is green on that exact head;
5. the PR is deliberately changed from Draft to Ready;
6. the final head SHA is re-read immediately before merge;
7. merge is performed with head-SHA protection and verified afterward;
8. branch deletion occurs only after the merge commit is confirmed in `main` and no unique unmerged commits remain.

## 7. Current decision

The primary source audit is complete. The editorial marathon is not complete.

```text
KEEP PR #271 OPEN AND DRAFT.
DO NOT MERGE.
DO NOT DELETE THE BRANCH.
```
