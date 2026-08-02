# Lane Lock Policy

**Project:** THE LEGENDARY POET  
**Effective:** 2 August 2026

Purpose: prevent several agents from editing the same article, shared file, visual surface or release boundary through competing branches.

## 1. Canonical lane rule

One independently mergeable lane has:

- one owner;
- one bounded purpose;
- one canonical branch;
- one PR;
- one rollback point;
- a named set of checks.

A larger initiative may use several lanes only when they are genuinely non-overlapping and independently reviewable. Do not create duplicate refs for one lane.

## 2. Current protected work

The long-form editorial marathon is protected active work:

```text
branch: editorial/longform-marathon-2026-08
PR: #271
scope: editorial standards, sources, myths, visual rights, approved covers, queue, validators and article QA
```

Continue it on the existing branch. Do not create successor/editorial-copy/final branches unless the owner explicitly replaces the lane and records a handoff.

The emblem marathon follows its narrow direct-main exception in root `AGENTS.md`. That exception must not be generalized to articles, research or unrelated UI.

## 3. Collision rules

1. One article, route or shared surface has one active owner.
2. Never reset, rebase, force-push, close or delete another owner's active branch.
3. Never continue another lane without explicit handoff.
4. A content lane does not absorb emblem, homepage or unrelated system work.
5. A system lane does not absorb article prose or visual redesign.
6. Shared types, essay blocks, package files and release policy require declared overlap review.
7. Out-of-lane findings are recorded in an issue/ledger, not silently fixed.
8. Temporary scripts, writers, triggers and workflows do not survive their lane.
9. A branch name, age, inactivity or closed PR is never deletion authority.
10. Unknown unique delta remains protected until inspected.

## 4. Minimum lane record

```md
Mode: FAST | LANE | SYSTEM
Owner:
Purpose and bounded scope:
Base / rollback SHA:
Canonical branch and PR:
Allowed files or surfaces:
Forbidden overlap:
Source of truth:
Required checks:
```

Do not duplicate the same record across many files when the PR description and a single scope document already contain it.

## 5. Handoff

Before another agent continues a lane, record:

```md
Current owner:
New owner:
Exact head SHA:
Completed:
Known failures or unavailable checks:
Next action:
```

A handoff changes ownership; it does not create a second branch for the same work.

## 6. Merge and cleanup

Before merge:

- diff matches scope;
- final head has applicable checks;
- review threads are handled;
- adjacent active work is untouched;
- temporary automation is absent.

Before branch cleanup, inspect actual content and relationship to `main`. Preserve unique evidence; delete only after explicit owner-approved disposition.
