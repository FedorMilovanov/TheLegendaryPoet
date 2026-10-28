# Hall certification timeout margin — PR #525

Baseline for this step: `f7a4e9dec12c65a8320bd34ba370004a0602236d`, session branch
`arena/f3e23b45-thelegendarypoet`. `main` remained
`033299b943484ed2c2f50221a03a1d7d3cdef3c5` at the pre-commit source guard.
Scope: CI certification timing only. No product, test, threshold, quality-gate,
dependency or brand change. PR stays **draft / unmerged**.

## Root cause: an impossible ordering, not a flaky install

The conditional Hall web runtime lane is certified when a canonical workflow
finishes on the exact head and an observing waiter job polls it to terminal
success. Those three durations were ordered wrongly:

| Number | Before | After |
| --- | ---: | ---: |
| Canonical `browser-runtime-proof` job timeout | 55m | 75m |
| Waiter poll window (`pollTimeoutSeconds`) | 2400s (40m) | 5400s (90m) |
| Waiter job timeout (`hall-web-runtime`) | 50m | 100m |

The poll window (40m) was **shorter than the canonical job's own timeout (55m)**.
Any canonical run slower than 40 minutes was therefore guaranteed to be reported
as a certification failure, however healthy it was. This is a contract defect,
not the 44-minute Playwright install that exposed it.

## Observed red on f7a4e9d

- Canonical [Hall web runtime proof 40337808740](https://github.com/FedorMilovanov/TheLegendaryPoet/actions/runs/40337808740), job `browser-runtime-proof`: started 14:14:38 UTC, `Install locked Chromium and WebKit` ran about **44 minutes**, job reached **success at 15:00:07 UTC** — i.e. it passed, and it needed 45.5m in total.
- Waiter `wait for Hall web runtime exact-head certification` ([job 121624104801](https://github.com/FedorMilovanov/TheLegendaryPoet/actions/runs/40337808735/job/121624104801)): started 14:14:49, **failure at 14:55:06** — five minutes before its canonical dependency finished. Its own 40m poll window expired first.
- `merge-certification` ([job 121646493989](https://github.com/FedorMilovanov/TheLegendaryPoet/actions/runs/40337808735/job/121646493989)) then failed only because the required lane result was not success.
- Raw log downloads returned EOF; the timeline above comes from job/step status, annotations and check-run identity, not from reading every log line.

Re-running those two jobs is not possible with the available integration token:
`POST /actions/jobs/{id}/rerun` returns **403 Resource not accessible by
integration**. This committed change creates a new head, so the same lane is
re-certified from scratch instead. The timed-out runs remain in the record.

## Repair: one ordered contract, checked by one owner

`docs/merge-certification.json` becomes the single authority for all three
numbers per lane, and `scripts/merge-certification-timeouts.mjs` is the single
place that checks their ordering:

```
canonical job timeout  + 600s queue slack  <=  poll timeout  <=  canonical + 3600s
poll timeout           + 300s startup slack <=  waiter job timeout <= poll + 1800s
```

`scripts/validate-merge-certification.mjs` now derives the lane check from that
module instead of hand-tuned per-lane constants, and additionally verifies that
the canonical workflow job and the waiter job in `merge-certification.yml`
carry the contracted `timeout-minutes`. Drift in either YAML file fails the
repository validator rather than surfacing as a mysterious CI red.

| Lane | Canonical job / timeout | Poll | Waiter job / timeout |
| --- | --- | --- | ---: |
| hall-pushkin-offline-exhibit | `offline-exhibit` 90m | 7200s | `hall-pushkin-offline` 125m |
| hall-pushkin-visual-remediation | `lookdev-candidate` 130m | 8400s (was 7800s) | `hall-pushkin-visual` 145m (was 140m) |
| hall-web-runtime-proof | `browser-runtime-proof` 75m (was 55m) | 5400s (was 2400s) | `hall-web-runtime` 100m (was 50m) |

The visual lane was already inconsistent under the new invariant (its 130m poll
equalled the canonical 130m job timeout with no queue slack), so it is aligned
too rather than left as a second latent copy of the same defect. The offline
lane already satisfied the invariant and is unchanged.

## Verification

- Red control: `scripts/tests/merge-certification-timeouts.test.mjs` asserts that a 50m waiter, a 1800s poll window and a missing canonical job block are each rejected. Four new tests, all PASS, alongside the current-truth assertion for all three lanes.
- `npm run validate:merge-certification` OK (`lanes=3`); `npm run check` PASS, including workflow-consolidation, reader certification and browser runtime contracts.
- Final contracts, build and build-output budget gates PASS; **103 Node / 4 TypeScript tests PASS** (99 Node before this step).
- Not yet verified: the new head's remote CI, in particular a real Hall web runtime lane run under the new margins. Slow installs were ~25–30m earlier in this session and ~44m here, so the widened margins are necessary but not a guarantee for arbitrarily slow runners.

## Rollback and limits

Rollback is one commit reverting the two workflow numbers, the contract fields,
the shared module, its validator wiring, the test and this document; the
community empty-copy repair of `f7a4e9d` is independent of it. No workflow
trigger path, required-check set, test assertion, retry policy, budget or
browser install method was changed; only how long a healthy canonical run is
allowed to take before its observer gives up. Ownership of the remaining
question — whether the ~44m Playwright install itself should be cached — is the
owner's, and is deliberately not attempted here.
