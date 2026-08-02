# Brand reference remediation plan

## Decision

The current production emblem and every v19 candidate remain `not-reference-approved`. Green CI means the implementation is stable; it does not mean the drawing matches the canonical reference.

The next visual revision must be a new reference-led family rather than another patch applied to the current production paths. Production promotion is allowed only after geometry, optical-size and motion gates pass independently.

## Non-negotiable separation of concerns

### 1. Reference geometry

Reference geometry owns silhouette, negative space, mass, asymmetry, folds and electrical-field topology. It must not be changed to satisfy browser timing or performance tests.

### 2. Motion controller

Motion owns pointer normalization, spring integration, layer depth, counter-parallax, reduced motion and exact idle semantics. It must not modify SVG path data.

### 3. Browser infrastructure

Browser QA owns route coverage, process isolation and deterministic evidence. WebKit process instability must be handled by process boundaries, never by weakening production animations or adding browser-specific visual branches.

## Phase A — digitize the reference before drawing

Create a reference measurement sheet with stable landmarks rather than relying on an overall similarity percentage.

Required measurements:

- total occupied bounding box;
- cloak width and shoulder envelope;
- hood width and height;
- face-void width, height and area;
- vertical position of the face void;
- left/right shoulder asymmetry;
- centre-of-mass offset;
- outer-field occupied width and height;
- fold direction histogram;
- silhouette convexity at hood, neck and shoulders.

Required reference ranges already established by the audit:

- hood width / cloak width: `0.32–0.43`;
- hood height / occupied height: `0.27–0.36`;
- face-void width / hood width: at least `0.68`;
- the face void must remain visually dominant at 24px and above.

The measurement sheet becomes the source of truth for candidate evaluation. A reviewer may override a numeric gate only by updating the reference contract and documenting why the reference itself requires the exception.

## Phase B — build a new semantic full-size master

Do not continue deforming the current production path. Create a new full-size master at a neutral design size with semantic groups:

- `data-brand-cloak`;
- `data-brand-hood`;
- `data-brand-face-void`;
- `data-brand-folds-near`;
- `data-brand-folds-far`;
- `data-brand-field-front`;
- `data-brand-field-mid`;
- `data-brand-field-rear`.

Rules:

- preserve a heavy, near-black monolithic silhouette before adding glow;
- establish the negative face void before drawing folds;
- use deliberate left/right imbalance taken from the reference;
- avoid mirrored Bézier handles and repeated equal-radius arcs;
- build cloth folds as a hierarchy of broad structural planes, not decorative lines;
- keep field branches irregular in length, density and curvature;
- never use blur or glow to conceal an incorrect silhouette.

The first accepted full-size master must pass at 64, 96, 128 and 256px without motion.

## Phase C — create a separate micro master

The 16–32px mark must not be a scaled copy of the full-size master.

Micro rules:

- keep the face void open and recognisable;
- reduce fold count rather than thinning every fold;
- enlarge critical gaps optically;
- simplify the electrical field to a few asymmetric strokes;
- retain the cloak mass and shoulder width;
- avoid filters whose blur radius consumes the negative space.

Required review sizes: 16, 20, 24, 32 and 48px on dark and light diagnostic backgrounds.

## Phase D — motion as a normalized vector field

Keep path geometry static. Animate only semantic groups.

Input model:

- normalize pointer coordinates to `[-1, 1]` inside the rendered bounding box;
- clamp input outside the mark;
- scale translation by the real rendered box relative to the neutral 64px size;
- keep depth coefficients dimensionless;
- run one `requestAnimationFrame` loop per mark;
- never trigger React renders on pointer movement.

Layer model:

- rear field moves least;
- cloak and hood move at medium depth;
- front field moves most;
- face void uses restrained counter-parallax;
- no layer may cross another layer's depth order during overshoot.

Time model:

- active and return springs have explicit, separate parameters;
- entry is measured from the first real motion sample, not event dispatch time;
- exact idle requires both subpixel position and low velocity;
- no invisible settling tail may keep RAF active after visual rest;
- reduced motion removes transforms and cancels active RAF immediately.

## Phase E — evidence matrix

### Geometry evidence

For every candidate family:

- live `getBBox()` ratios;
- occupied area and negative-space area;
- raster evidence at all review sizes;
- dark/light diagnostic background;
- overlay against the canonical reference landmarks;
- explicit `reference-approved` or `not-reference-approved` verdict.

### Motion evidence

For header and footer marks:

- first 120ms response;
- 95% convergence time;
- maximum per-sample displacement;
- overshoot percentage;
- layer depth ordering;
- counter-parallax direction;
- exact return-to-idle time;
- residual drift after idle;
- proportional amplitude across rendered sizes;
- reduced-motion state.

### Site-wide evidence

Use two complementary browser layers:

1. breadth: crawl every canonical sitemap URL plus utility, redirect and 404 scenarios in isolated Chromium tests;
2. depth: keep focused Chromium, Android Chrome and iPhone Safari tests for interaction-heavy templates.

The route audit must fail on:

- same-origin 4xx/5xx resources;
- page errors and chunk-load failures;
- missing canonical metadata on canonical routes;
- malformed or unknown internal route links;
- empty main content or missing primary heading;
- undecoded visible viewport images;
- persistent busy/loading states;
- horizontal overflow;
- unhealthy legacy redirects;
- broken application shell on 404.

## Anti-hack rules

The following are prohibited as acceptance fixes:

- lowering opacity, blur, geometry or motion thresholds after a failure without new reference evidence;
- adding long fixed sleeps instead of waiting for a deterministic state;
- adding browser-specific SVG path data;
- disabling `failOnFlakyTests`;
- forcing `--retries=0` to hide retry-dependent behaviour;
- excluding a failing production route from the crawl;
- hardcoding poet, essay or track URLs when the sitemap already derives them from typed application data;
- using glow, blur or clipping to conceal incorrect geometry;
- promoting a candidate because its animation is good while its silhouette is rejected;
- changing production geometry to work around Linux WebKit process exits.

## Promotion sequence

1. Approve the measurement sheet.
2. Produce full-size v20 candidates without motion.
3. Select one full-size candidate by reference gates and human overlay review.
4. Produce the independent v20 micro master.
5. Integrate semantic layer IDs.
6. Attach the existing normalized motion controller.
7. Run deep geometry and motion audit.
8. Run the 35-plus route integrity crawl.
9. Run focused Chromium, Android Chrome and iPhone Safari matrices.
10. Promote only when every required workflow is green on one exact commit and the candidate has an explicit human `reference-approved` verdict.

## Current production safety

Until the sequence above is complete:

- keep the current production geometry unchanged;
- keep all v19 candidates QA-only;
- preserve `not-reference-approved` metadata;
- merge infrastructure and measurement improvements separately from any future visual promotion.
