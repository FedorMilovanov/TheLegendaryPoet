# Deep audit: reference fidelity and SVG motion

**Audit date:** 2026-08-02  
**Audited production main:** `f068596e6096b3bf7f07ad3c2f9b4b998d517f5a`  
**Canonical reference:** `canonical-hooded-figure-v2-clean-base`  
**Decision:** **NOT REFERENCE APPROVED**

## Executive verdict

The merged zero-flaky run is valid evidence of implementation stability. It is not evidence that the emblem matches the canonical reference. The current production art and all three v19 candidate tiers remain below the reference bar.

The production motion architecture is technically strong: a single requestAnimationFrame controller, no React render loop, no interaction long tasks, deterministic active/settling/idle ownership, bounded timestep and a correct reduced-motion path. The audit found two motion defects: translation amplitude was fixed in pixels across differently rendered marks, and the original return spring retained an invisible numerical tail in `settling` on throttled renderers. Translation is now normalized to the rendered bounding box; active entry remains unchanged, while the return spring reaches exact idle inside a bounded interval after only subpixel motion remains.

## 1. Reference contract audit

The repository already defines these hard targets:

| Ratio | Target |
|---|---:|
| Hood height / visible figure height | 0.27–0.36 |
| Hood width / cloak width | 0.32–0.43 |
| Face cavern width / hood width | 0.68–0.86 |
| Cloak width / hood width | ≥ 2.30 |

Measured SVG geometry:

| SVG | Hood height | Hood / cloak | Face / hood | Cloak / hood | Eligible |
|---|---:|---:|---:|---:|---|
| Production v17 | **0.330 pass** | **0.278 fail** | **0.640 fail** | **3.592 pass** | No |
| v19.11 full-size | **0.374 fail** | **0.388 pass** | **0.638 fail** | **2.576 pass** | No |
| v19.17 optical | **0.381 fail** | **0.380 pass** | **0.655 fail** | **2.629 pass** | No |
| v19.14 micro | **0.431 fail** | **0.464 fail** | **0.646 fail** | **2.154 fail** | No |

### Meaning

- Production has a hood that is too narrow relative to the cloak and a face cavern that is too narrow relative to the hood.
- v19.11 and v19.17 fix the hood/cloak relationship, but the face remains below the contract and the hood becomes too tall relative to the visible figure.
- v19.14 micro is not a valid optical reduction of the canonical architecture; all four macro ratios fail.

The previous evaluation score of 0.86 was therefore too optimistic. It mixed strong motion engineering with unresolved geometry and did not enforce the repository’s own numeric contract.

## 2. Visual fidelity audit

### Reference strengths that must survive

- high pointed, layered hood;
- huge rounded-pentagonal black face cavern;
- broad shoulders close to the square crop;
- crushed gathered cowl, not a clean horizontal armor band or crossed necktie;
- three large cloth families with secondary overlaps;
- irregular electric field behind the hood and upper sides;
- heavy black lower mass without a required smoke pool.

### Production v17

Strengths:

- stable dark monolith;
- clean lower edge;
- usable silhouette at header size;
- no fake glow used to conceal a completely missing figure.

Blocking deviations:

- rounded, controlled hood instead of a monumental pointed structure;
- narrow vertical face cavern;
- cloak is tall and bell-like, with insufficient shoulder spread near the crop;
- collar and folds are cleaner and less crushed than the reference;
- aura is smooth, regular and highly symmetric.

### v19.11 full-size

Improvements:

- substantially broader hood and shoulders;
- more explicit cloth families;
- better cloak/hood ratio.

Blocking deviations:

- face width remains almost unchanged as a proportion of hood width;
- hood is too tall in the visible figure;
- horizontal cowl reads like armor plates;
- lower cloth becomes regular vector wedges;
- aura branches are still paired and designed rather than naturally irregular.

### v19.17 optical

The optical redraw is more readable than a direct full-size reduction, but it inherits the same macro problems: undersized face cavern, over-tall hood and a short horizontal cowl. It is not a reference-compliant medium-size master.

### v19.14 micro

At 32 px it reads as a hooded glyph, but the canonical relationship is gone. At 24 and 16 px all families collapse mainly into a cyan hood arc. The heavy black face/shoulder identity does not survive.

## 3. Pixel evidence

At 128 px, measured from the exact-head comparison artifact:

| Image | Mean luminance | Left/right irregularity |
|---|---:|---:|
| Canonical reference | 0.0541 | 0.1233 |
| Production | 0.0378 | 0.0146 |
| v19.11 | 0.0353 | 0.0308 |

This does not by itself define artistic quality, but it confirms two visible facts:

1. production and v19.11 are materially darker and lose more internal separation;
2. their upper field is much more mirror-regular than the reference.

The architecture of the figure should remain nearly symmetric, but the cloth highlights and electric field must not be mirrored copies.

## 4. Motion engineering audit

### What is good

- one requestAnimationFrame loop;
- no state update per pointer frame;
- bounds cached on entry and ResizeObserver updates;
- active and settling use separate spring constants;
- 32 ms timestep cap prevents a long frame from causing a visual teleport;
- aura, figure and detail wake in phases;
- face uses counter-parallax;
- reduced motion removes all depth transforms;
- exact-head pointer test recorded 109 samples, 1.1 ms p95 latency, 5.2 ms maximum and zero interaction long tasks.

### Spring simulation

The exact integration was simulated at 30, 60, 90, 120 and 144 Hz:

- 95% entry: about 243–350 ms;
- exact return to `idle`: about 500–583 ms;
- exact return at a severely throttled 15 Hz: about 1000 ms;
- return overshoot: at most about 2.25%;
- corner reversal crosses the center in about 125–150 ms.

The active spring is unchanged. The return uses higher stiffness/damping and an explicit visual epsilon: the controller performs the final exact-zero write only after remaining position is subpixel and velocity/wake are visually negligible. This avoids both a visible snap and a long compositor-owning tail.

### Proven defect: fixed-pixel optical drift

Before this audit, the same translation values were used for every rendered size. For the energy layer, 3.65 px represented:

- 7.60% of a 48 px mark;
- 5.70% of a 64 px mark;
- 3.80% of a 96 px mark.

The header additionally scales a 48 px mark to about 59.5 px, while the footer leaves it at 48 px. Their relative depth therefore differed even though both used the same component.

### Correction

`spring-awakening-v4` now uses `rendered-box-v1`, which derives a bounded motion scale from the actual rendered box around a neutral 64 px design size. All translation channels use that scale; scale-only channels remain unchanged. The return spring uses `180/20` for directional stiffness/damping and `220/22` for wake stiffness/damping; active entry remains `136/18.5` and `126/15.8`.

The new browser audit checks:

- real geometry ratios for production, full-size, optical and micro SVGs;
- explicit non-eligibility for reference approval;
- 120 ms entry state measured from the first real motion sample;
- 95% convergence window;
- maximum per-frame displacement;
- bounded overshoot;
- depth ordering and counter-parallax signs;
- exact return to idle in under 1.2 seconds;
- no residual drift after idle;
- proportional motion between the transformed header mark and footer mark;
- reduced-motion transform removal.

## 5. Revised score

The score is intentionally conservative and is not an approval percentage.

| Area | Score |
|---|---:|
| Macro proportions | 0.66 |
| Hood and face cavern | 0.58 |
| Collar and folds | 0.50 |
| Cloak silhouette | 0.68 |
| Rim and aura | 0.55 |
| Micro readability | 0.57 |
| Interaction quality after normalization | 0.90 |
| **Overall** | **0.63** |

## 6. Required next geometry pass

A new family should be built from shared landmarks, not by decorating v19:

1. widen the face cavern to at least 0.68 of hood width;
2. reduce hood-height ratio into 0.27–0.36;
3. keep hood/cloak ratio in 0.32–0.43;
4. replace the horizontal armor-like cowl with compressed overlapping cloth planes;
5. preserve three primary folds while adding asymmetric secondary overlaps;
6. design aura branches with deliberate unequal gaps and non-mirrored rhythm;
7. create micro geometry independently around black-cavern and shoulder mass, not around the cyan rim;
8. do not replace production until every size tier passes the numeric contract and the exact visual matrix is clearly better.
