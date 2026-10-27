# Community queue copy and action toasts — PR #525

Baseline for this step: `64c5c1e4816f51b387c4bb12b46f300b9cebdbbf` (previous step),
session branch `arena/f3e23b45-thelegendarypoet`. `main` remained
`033299b943484ed2c2f50221a03a1d7d3cdef3c5` at the pre-commit source guard.
PR stays **draft / unmerged**.

## Scope

Two steps back the community status copy was repaired through the shared
light-theme remap table. That step recorded what it did **not** measure: the
offline-queue copy, the cooldown copy, the rejected-upload copy, and the toast
itself, which had only been checked through a computed colour on the wrapper of a
rendered element. This step renders those states for real and measures them.

## What "for real" means here

- The community worker is pointed at a mocked origin
  (`window.__TLP_COMMUNITY_TEST_CONFIG__`) with reads answered `200` and writes
  rejected with `500`, so the panel reaches a connected phase, a pending queue
  forms through the real store, and the offline status line is produced by the
  application — not by seeded markup.
- The **success toast** is produced by submitting a rating; the **warning toast**
  by submitting a second comment inside the 20-second comment cooldown. Both are
  genuine `ActionToast` renders, not synthetic nodes.
- The **offline-queue line** is the string the app builds when the server refuses
  writes: «Сервер недоступен. В очереди: N; ничего не потеряно.»
- "Before" numbers for the amber/emerald surfaces come from deleting the four
  remap rules from the CSSOM on the same build. The toast defects below were
  captured by the red test run before the repair instead, because the marker —
  not the rule set — is what fixes them.

## Regression found: the toast markers were one level too shallow

The exclusion in the shared remap table is **element-scoped**:
`:not([class*="theme-"])`. A marked wrapper therefore protects itself, but not a
child that sets its own colour utility. `ActionToast` marked the wrapper of its
warning tone only, and its glyph — plus the entire success tone — kept generic
dark-surface ink:

| Element | Dark | Light before | Light after |
| --- | ---: | ---: | ---: |
| Success toast text (`text-cyan-100` on `bg-cyan-950/85`) | 13.0763 | **1.2190** | **7.7070** |
| Success toast glyph (`text-cyan-300`) | 10.1619 | **1.8714** | **5.9893** |
| Warning toast text (`text-amber-100` on `bg-amber-950/85`) | 14.4508 | 8.7781 | 8.7781 |
| Warning toast glyph (`text-amber-300`) | 11.1263 | **1.0031** | **6.7587** |

The success-toast failure predates this branch: the cyan remap is old and the
success tone never carried a marker. The warning-toast **text** was already safe
because its wrapper was marked in the previous step — the glyph was not, and the
previous step's verification measured only the wrapper's computed colour. That
gap is why this step renders the toasts instead of sampling a class string.

Repair, at the owning layer: `theme-community-toast` now marks the toast surface
in **both** tones and the glyph, so the surface and everything that paints ink on
it are excluded together. No new token, no per-tone colour variant, no route
rule, no wording change.

## Offline-queue and syncing copy, measured for the first time

| String | Light before | Light after | Dark after |
| --- | ---: | ---: | ---: |
| «Сервер недоступен. В очереди: N; ничего не потеряно.» (`text-amber-100/58`) | **1.0420** | **6.9865** | 6.2801 |
| «Отправляем сохранённые изменения…» (`text-cyan-100/58`) | — | 6.8150 | 6.2603 |

The queue line was repaired by the earlier remap step and is only now measured;
deleting the amber rules on the fixed build drops it back to **1.0420**, which
confirms the causal link rather than a coincidence.

## Verification

- **Red control retained.** The new 12-case block (dark/light × desktop/mobile ×
  queue line / success toast / warning toast) ran **4 failed / 8 passed** before
  the repair: light desktop and light mobile for both toasts, with the exact
  ratios above. Nothing was relaxed. After the repair: **12/12 PASS, 26.0s,
  retries 0**.
- `status palette` block from the previous step, re-run after the change:
  **12/12 PASS** (unchanged behaviour).
- Focused suite covering every step of this audit
  (`status palette|community queue and toasts|community service copy|community empty copy|comment metadata|local community durability`):
  **54 PASS, 1.1m, retries 0**.
- Regression specs `rating-urlstate`, `poets-status`, `audio-completion`,
  `audio-cross-tab`, `floating-chrome`, `community-request-topology`:
  **13 PASS / 7 skipped**, 32.7s (the skips are project-gated cases, not
  suppressed failures).
- Static gates: project contracts OK (11 runtime / 4 editorial / 7 historical /
  0 lanes), `npm run check`, `npm run build`, `npm run validate:build-output`
  (1692.9 KiB JS, 258.6 KiB CSS), `git diff --check` clean, **108 Node /
  4 TypeScript tests PASS**.
- Route sweep repeated after the change (12 routes × desktop1440/mobile390,
  light mode): **8 status nodes, none below 3.0, none on a dark background.**
- Page health in both themes: fonts loaded, **0** page errors, **0** horizontal
  overflow, **0** broken images; the only console errors are the intentional
  rejected writes.
- Screenshots (ignored artifacts): `qa-artifacts/community-toasts/` —
  `success-toast-{dark,light}.png`, `warning-toast-{dark,light}.png`,
  `queue-line-{dark,light}.png`.

## Limits

- Not measured: the rejected-upload copy («Не удалось сохранить: локальное
  хранилище или очередь недоступны») — it needs a failing local store, which
  risks destabilising the whole application rather than one surface.
- Not reached deterministically: the connected-with-queue line («Общая база
  подключена. В очереди на отправку: N.»). Delaying writes produced the syncing
  message instead, which was measured in its place. The connected-queue string
  uses the same `text-amber-100/58` class as the offline-queue line and is
  therefore covered by construction, but that is reasoning, not a measurement.
- The offline-queue state was produced by `500` responses, not by an unreachable
  network; a genuine offline path may render a different message.
- Ratios are composited-colour measurements, not per-pixel gradient sampling.
  Icons are held to 3.0 (WCAG 1.4.11), text to 4.5. Not a full WCAG audit, not
  physical-device evidence.
- No wording, ARIA, data, store, API, dependency, workflow, budget or retry
  change. Rollback is one commit reverting the toast marker, the new test block
  and this document; it is independent of the earlier status-palette steps.
