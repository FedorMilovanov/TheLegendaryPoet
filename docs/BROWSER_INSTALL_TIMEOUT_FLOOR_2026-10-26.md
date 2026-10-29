# Browser install timeout floor — PR #525

Baseline for this step: `b9fdfb91827ae94af605c85ce995541e44785f4a`, session branch
`arena/f3e23b45-thelegendarypoet`. `main` remained
`033299b943484ed2c2f50221a03a1d7d3cdef3c5` at the pre-commit source guard.
Owner decision: raise the timeouts of jobs that install browsers. Scope is CI
patience only — no trigger path, required check, test assertion, quality
threshold, retry policy or install method changes. PR stays **draft / unmerged**.

## Red being fixed

On `b9fdfb9` the remote result was 20 checks = 16 SUCCESS / 3 deliberate SKIP /
1 CANCELLED. The cancelled one was not a test failure:

- `analytics-route-qa` ([job 121720153775](https://github.com/FedorMilovanov/TheLegendaryPoet/actions/runs/40364991519/job/121720153775)) ran 17:03:19 → 17:33:45 UTC and was cancelled **at its own `timeout-minutes: 30`** while the `Install locked analytics browsers` step was still running. The preview step was then skipped and the assertion step failed. **No test ever started.**
- Observed installs of the same shared action that day: about **44 minutes** in run 40337808740, again inside a **51m04s** canonical job in run 40364991449, and earlier in the session ~25–30 minutes. A 30-minute job timeout cannot survive that variance.

The Hall certification repair of `b9fdfb9` fixed the *observer's* patience for one
lane. This step fixes the *job's* patience for every lane that installs browsers,
because the same install is the shared hazard.

## Repair: one documented floor, checked by one owner

`docs/browser-install-budget.json` is the SSOT:

- `observedInstallMinutesMax: 44` — the measured worst case, with the run IDs recorded as evidence;
- `minimumJobTimeoutMinutes: 60` — install maximum plus at least 10 minutes of headroom, enforced by the validator;
- `maximumJobTimeoutMinutes: 120` — bounded ceiling, so the floor cannot be used to hand out unbounded job time.

`scripts/browser-install-timeouts.mjs` parses every workflow, finds the jobs that
use `.github/actions/install-playwright`, and requires an explicit
`timeout-minutes` inside `[60, 120]`. `scripts/validate-browser-install-timeouts.mjs`
is wired into `npm run check` and into the CI `verify` job, so a future job that
installs browsers without enough patience fails locally instead of being
cancelled at 3am in a pull request check.

| Workflow | Job | Before | After |
| --- | --- | ---: | ---: |
| manual-browser-qa | analytics-route-qa | 30m | **60m** |
| manual-browser-qa | webkit-home-reveal-qa | 45m | **60m** |
| manual-browser-qa | premium-home-qa | 45m | **60m** |
| manual-browser-qa | premium-iphone-critical-qa | 45m | **60m** |

Jobs already at or above the floor are unchanged: `browser-qa` 90m,
`browser-runtime-proof` 75m, `blender-preflight` 60m. Jobs that never install
browsers are not touched at all; the parser proves it by listing exactly five
covered jobs.

## Verification

- Red control: the new validator failed **4 jobs** before the edit (30m/45m/45m/45m below the 60m floor) and passes after it.
- Five new permanent tests: current-truth floor, a 20m job rejected, a missing `timeout-minutes` rejected, non-browser jobs exempt, and a floor without headroom above the observed maximum rejected.
- `npm run validate:browser-install-timeouts` OK; `npm run validate:workflow-consolidation` OK; project contracts OK.
- Final `npm run check` PASS, contracts/build/output-budget PASS, **108 Node / 4 TypeScript tests PASS**.
- Not yet verified: the new head's remote CI. In particular a green `analytics-route-qa` still depends on the shared install finishing inside the raised limit on that runner.

## Rollback and limits

Rollback is one commit reverting four `timeout-minutes` values, the SSOT, the
validator, its `package.json`/CI wiring, the tests and this document; it is
independent of both the community empty-copy repair and the Hall certification
ordering repair. This change buys patience, not speed: it does not make the
25–44 minute Playwright install faster, and it is not evidence that 60 minutes is
sufficient for every future runner. The durable alternative — caching the locked
browser install inside `.github/actions/install-playwright/action.yml` — remains an
explicitly unrequested owner option and was deliberately not attempted here.
