# Deep audit: reference fidelity, SVG motion and site breadth

**Audit date:** 2026-08-02  
**Audited production main:** `f068596e6096b3bf7f07ad3c2f9b4b998d517f5a`  
**Representative successful implementation evidence:** `018086fbd4d73a0fca973b480b60dcf3b3596f2e`  
**Canonical reference:** `canonical-hooded-figure-v2-clean-base`  
**Artistic decision:** **NOT REFERENCE APPROVED**

## Executive verdict

The audit separates three things that must never be allowed to certify one another:

1. **Reference fidelity** — whether the SVG actually matches the canonical hooded figure.
2. **Motion engineering** — whether the existing semantic layers move smoothly, proportionally and predictably.
3. **Site integrity** — whether production routes render without metadata, runtime, image, link or layout failures.

Green CI proves implementation stability. It does not make a rejected drawing visually correct. The production emblem and all current v19 candidates remain below the canonical reference bar. Production geometry was deliberately left unchanged.

The engineering corrections are nevertheless real and production-worthy:

- translation is normalized to the rendered box instead of fixed pixels;
- one frame-rate-invariant controller owns all spring motion;
- elapsed time is consumed through bounded substeps rather than discarded when RAF is sparse;
- the integration clock resets whenever RAF settles;
- reduced motion remains transform-free;
- browser timing is measured by interpolated crossings, not nearest sparse samples;
- smoothness is checked both as an absolute visible jump and as displacement normalized to an equivalent 60 Hz frame;
- a separate sitemap-derived audit now covers 38 route/inventory scenarios.

## 1. Reference contract

| Ratio | Canonical target |
|---|---:|
| Hood height / visible figure height | 0.27–0.36 |
| Hood width / cloak width | 0.32–0.43 |
| Face cavern width / hood width | 0.68–0.86 |
| Cloak width / hood width | ≥ 2.30 |

Exact Chromium `getBBox()` measurements:

| SVG family | Hood height | Hood / cloak | Face / hood | Cloak / hood | Eligible |
|---|---:|---:|---:|---:|---|
| Production v17 | **0.3303 pass** | **0.2820 fail** | **0.6404 fail** | **3.5467 pass** | No |
| v19.11 full-size | **0.3738 fail** | **0.3919 pass** | **0.6256 fail** | **2.5514 pass** | No |
| v19.17 optical | **0.3805 fail** | **0.3837 pass** | **0.6552 fail** | **2.6061 pass** | No |
| v19.14 micro | **0.4306 fail** | **0.4643 fail** | **0.6308 fail** | **2.1538 fail** | No |

### Consequences

- Production has a correctly bounded hood height, but the hood is too narrow relative to the cloak and the face cavern is too narrow relative to the hood.
- v19.11 and v19.17 improve hood/cloak width, but make the hood too tall and still undersize the face cavern.
- v19.14 micro is not a valid optical master: every macro ratio fails.
- No current family may be promoted by renaming it, adding glow or pointing to green CI.

The earlier 0.86 estimate mixed strong interaction engineering with unresolved geometry. The conservative evaluation remains **0.63**.

## 2. Visual fidelity blockers

The canonical reference depends on a combined structure:

- monumental pointed layered hood;
- huge rounded-pentagonal pure-black face cavern;
- broad shoulders close to the square crop;
- crushed gathered cowl rather than a clean horizontal armor band or crossed necktie;
- three primary cloth families with asymmetric secondary overlaps;
- irregular electrical field behind the hood and upper sides;
- heavy black lower mass without a required smoke pool.

Current blockers:

- production hood is too rounded and controlled;
- face cavern remains vertically narrow;
- shoulder spread and crop pressure are insufficient;
- cowl planes are too clean and horizontal;
- folds look like regular vector wedges instead of compressed cloth mass;
- aura branches are too paired and mirror-regular;
- at 24 and 16 px the identity collapses mainly into a cyan hood arc.

At 128 px the measured left/right irregularity is `0.1233` for the reference, `0.0146` for production and `0.0308` for v19.11. This does not replace artistic review, but confirms the obvious visual problem: current electrical fields are much more symmetrical and designed than the reference.

## 3. Correct motion architecture

### Ownership

- `src/components/brandMotionV18.ts` owns only the CSS layer contract.
- `src/components/brandMotionFrameInvariant.ts` owns the only spring controller and the only `requestAnimationFrame` scheduling site.
- `BrandMark.tsx` owns lifecycle and pointer events but does not re-render React on pointer movement.

There is no duplicate dormant controller.

### Identity

`spring-awakening-v5 / rendered-box-v1 / bounded-substeps-v1`

### Rendered-size normalization

All translation channels are scaled from the real rendered bounding box around a neutral 64 px design size. This fixes the old optical drift where the same 3.65 px energy translation represented:

- 7.60% of a 48 px mark;
- 5.70% of a 64 px mark;
- 3.80% of a 96 px mark.

Scale-only channels remain dimensionless.

### Frame-rate invariance

The old one-step `dt ≤ 32 ms` clamp prevented teleports, but discarded time. Under a 50–100 ms RAF interval the visual spring advanced only 32 ms, so wall-clock entry speed depended on runner load.

The new integrator:

- accepts up to 100 ms of real elapsed time per frame;
- consumes it in stable substeps no larger than `1/60 s`;
- preserves the established spring constants;
- resets the clock whenever the active or return phase settles;
- keeps one RAF loop and no interval/timer loop.

### Deterministic frequency matrix

The exact controller is simulated at 15, 20, 30, 60, 120 and 144 Hz:

- 95% entry: approximately 266.7–316.7 ms;
- cross-frequency spread: 50 ms;
- exact return: approximately 562.5–600 ms;
- maximum overshoot: approximately 1.12%.

The same spring parameters are used at every rate. No per-device tuning is involved.

## 4. Exact browser motion evidence

The dedicated Chromium audit on `018086fbd4d73a0fca973b480b60dcf3b3596f2e` recorded:

- 95% amplitude after activation: **351.216 ms**;
- exact `idle` after pointer leave: **927 ms**;
- maximum absolute sampled energy jump: **0.776 px**;
- maximum jump normalized to an equivalent 60 Hz frame: **0.226476 px**;
- peak energy translation: **2.321 px** against **2.30826 px** target;
- overshoot: approximately **0.552%**;
- header/footer amplitude ratio: **1.23886205** observed against **1.24000005** expected.

The browser gate also proves:

- 120 ms entry response;
- 95% convergence under 650 ms;
- bounded overshoot;
- semantic depth ordering;
- face counter-parallax;
- exact idle and no residual drift;
- proportional header/footer movement;
- transform-free reduced motion.

### Why interpolation matters

RAF evidence on a loaded runner may be sampled every 16–100 ms. Assigning a threshold to the nearest sample creates up to one whole sampling interval of timing error. The audit now linearly interpolates:

- first measurable 0.5% crossing;
- value exactly 120 ms after activation;
- 95% crossing.

### Why smoothness is dual-gated

A 100 ms interval cannot be treated as one 16.7 ms frame. The audit therefore checks:

1. displacement normalized to an equivalent 60 Hz interval;
2. a separate absolute observed-jump cap.

A long sample gap cannot create a false failure, but a genuinely large visible leap cannot be hidden by normalization.

## 5. Site-wide 30+ URL audit

The breadth audit does not use a hand-maintained list of poet, essay and track pages. It reads the generated production sitemap, so newly added canonical content automatically enters the test.

Current matrix:

- 28 canonical URLs from `public/sitemap.xml`;
- 2 utility routes: `/hall`, `/archive`;
- 6 legacy redirect scenarios;
- 1 explicit 404 scenario;
- 1 inventory contract test.

**Total: 38 tests.**

On `018086fbd4d73a0fca973b480b60dcf3b3596f2e`, all **38/38 passed on the first attempt**.

Every rendered route is checked for:

- same-origin 4xx/5xx responses;
- JavaScript errors and chunk-load failures;
- title, description and canonical ownership;
- meaningful main content and primary heading;
- header, footer and brand shell;
- decoded visible viewport images;
- persistent `aria-busy` regions;
- horizontal overflow;
- unknown internal route links.

Redirects must arrive at the declared destination. The 404 route must retain a healthy application shell.

### Real defect found

The first broad crawl discovered that `/poets` inherited canonical `/` from the base HTML. `PoetsPage` did not own route SEO metadata.

The correction was made in production code through the shared `useSeo` hook:

- route canonical: `/poets`;
- catalog title;
- catalog description.

The crawler was not weakened and no global automatic canonical fallback was added. Each canonical page remains responsible for declaring complete SEO metadata, so future omissions remain detectable.

## 6. Browser-layer separation

The system deliberately uses different layers:

### Breadth

Isolated Chromium crawls every canonical/utility/redirect/404 scenario. Its job is content, metadata, resources, links and layout integrity.

### Reference and motion depth

A dedicated Chromium workflow measures SVG geometry and time-domain motion without the load of the full route matrix.

### Interaction and engine depth

Focused Chromium, Android Chrome and iPhone Safari suites exercise interaction-heavy templates and mobile behavior. Safari uses fresh process boundaries for independent contours because Linux WebKit process exits must not be “fixed” by weakening production animation.

No workflow is allowed to stand in for another:

- route green does not approve SVG geometry;
- motion green does not prove every route;
- Safari process isolation does not permit retries to count as green;
- green CI does not create reference approval.

## 7. Anti-hack rules

The following are prohibited:

- lowering geometry, opacity, blur, motion or timing thresholds after a failure without new reference evidence;
- adding long fixed sleeps instead of deterministic state ownership;
- browser-specific SVG path data;
- disabling `failOnFlakyTests`;
- using `--retries=0` to hide retry-dependent behavior;
- excluding a failing production URL from the breadth crawl;
- hardcoding canonical content routes already available from the sitemap;
- using glow, blur or clipping to conceal wrong geometry;
- changing production geometry to work around Linux WebKit exits;
- promoting a candidate because its movement is good while its silhouette is rejected;
- keeping duplicate spring implementations “for compatibility”.

## 8. Correct geometry remediation sequence

The next family must be new reference-led v20 work, not another decorative patch on v19:

1. Freeze the approved reference measurement sheet.
2. Create the full-size master without motion.
3. Establish the face cavern first: at least 0.68 of hood width.
4. Keep hood height inside 0.27–0.36 of visible figure height.
5. Keep hood width inside 0.32–0.43 of cloak width.
6. Replace the armor-like cowl with compressed overlapping cloth planes.
7. Preserve three major folds and add asymmetric secondary compression.
8. Create deliberately unequal aura gaps and branch rhythms.
9. Create a separate 16–32 px micro master around the black cavern and shoulder mass.
10. Pass static geometry and optical-size review before attaching motion.
11. Reuse the already validated semantic motion controller.
12. Run deep geometry/motion, the 38-test breadth crawl and focused cross-engine matrices on one exact commit.
13. Promote only after an explicit human `reference-approved` verdict.

## 9. Revised score

| Area | Score |
|---|---:|
| Macro proportions | 0.66 |
| Hood and face cavern | 0.58 |
| Collar and folds | 0.50 |
| Cloak silhouette | 0.68 |
| Rim and aura | 0.55 |
| Micro readability | 0.57 |
| Interaction quality | 0.90 |
| **Overall** | **0.63** |

The motion foundation is now substantially stronger. The drawing is still not approved. Those two conclusions are intentionally allowed to coexist.
