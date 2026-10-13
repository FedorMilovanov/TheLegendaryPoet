# Lazy-canonical QA synchronization — 2026-10-14

## Scope and anchors

Product baseline: `bd897f954b666f923750dc7389da67d5685502ff`.
Main remained `090ea18233ca4888de1ea854d05d27f4e14c7eae`.
This is a repair to **test synchronization**, not a production canonical/SEO fix.
Application runtime, dependencies, discovery policy and CI workflows are unchanged.

The baseline GitHub CI, route audit and all dispatched Browser QA jobs completed
SUCCESS. Local Chromium 153 observations do not supersede pinned CI certification.
The original local failure was intermittent: an isolated run passed, followed by
three failures of the lazy-canonical case in a repeated discovery group.

## Demonstrated cause and owning layer

`settleRoute()` accepted any visible h1. During an in-flight React transition,
`location.pathname` and loading metadata already describe `/privacy`, while the
previous `/about` heading can remain visible. Therefore the helper returned before
its stated destination-ready condition was true.

A diagnostic copy of the unchanged test recorded DOM/head writes:

| Event | Milliseconds since document start |
| --- | ---: |
| `/privacy` loading title applied; old canonical removed | 606 |
| `settleRoute()` returned with **О Проекте THE LEGENDARY POET** | 769 |
| Privacy title and ready head applied | 5523 |

A second run showed the same ordering (679 / 794 / 6619 ms). All local route
scripts returned 200; the deliberately delayed Privacy import took about 1512 ms
in the inspected trace. The reason for the additional render delay is **not
established**. No production defect is inferred merely from that delay.

The single repair owner is the route-audit readiness helper. It accepts an explicit
destination heading for SPA callers. The lazy test now waits for the visible
Privacy heading before starting its existing ready-head checks. Initial-document
callers retain their previous behavior; not-found and error transitions already
wait for their own destination/error UI before reading the head.

The 1500 ms import delay, 1000 ms loading-head deadline, 5000 ms canonical deadline,
neutral loading assertions, final canonical, og:url and JSON-LD assertions remain
unchanged. No reload, retry, timeout increase or page-specific runtime patch was added.

## Local verification

Dark-first Chromium 153.0.8010.0, Node 22.22.3, npm 10.9.8. Browser dependencies
were isolated under ignored `qa-artifacts`, using the npm Chromium/NSS diagnostic
shim documented in the session audit. This is not a locked-browser security proof.

| Scenario | Result |
| --- | --- |
| Clean baseline: npm ci / contracts / check / build / prerender | PASS |
| Original discovery group, desktop reduced motion, 3 repeats | 6 PASS / 3 lazy-canonical FAIL |
| Repaired group, desktop reduced motion, 3 repeats | 9/9 PASS |
| Repaired group, desktop no-preference, 3 repeats | 8 PASS / 1 offline-alert FAIL |
| Repaired lazy-canonical alone, mobile reduced motion, 3 repeats | 3/3 PASS |
| Negative control: remove canonical from ready Privacy | Correctly FAIL at unchanged 5000 ms assertion |
| Original offline/error case, no-preference, separate 3 repeats | 3/3 PASS |

Post-patch contracts/check/build/budgets/prerender/SEO passed; all 55 build-output
rows match the clean baseline. The initial five dependency advisories remain.

Thus the repaired lazy-canonical case passed **9/9** across desktop motion settings
and mobile. The broader modified-test sample was **20/21**, not all green.
The remaining offline/error failure waited 10000 ms for `[role="alert"]`; its cause
is unresolved. It is not hidden by retries, changed assertions or a longer timeout.

Desktop: 1365×900, non-mobile; mobile: 390×844, DPR 2, touch/mobile enabled.
Mobile success screenshots and failing traces were inspected. No visual, contrast,
CLS, LCP or production-browser issue is declared fixed by this QA-only patch.

For locked-browser revalidation, use the existing `playwright.route-audit.config.mjs`
and run the three cases matching `lazy loading owns|lazy route error|SPA navigation
to not-found`, with `--repeat-each=3 --workers=1`. Sandbox configs add only explicit
browser executable/launch options and the motion/mobile settings above. Diagnostic
copies, mutation probes, logs and traces are ignored under `qa-artifacts/canonical-step/`.

## Migration, rollback and remaining work

No data or runtime migration. Revert the helper/call-site change to roll back;
never restore legacy metadata or weaken discovery policy as part of this step.
Exact-head CI must still be checked after push. The original audit's UI/a11y,
layout, dependency and human production-proof lanes remain separate and open.
