# Hall v3 — performance budget policy

## Principle

Performance budgets are measured delivery contracts, not optimistic numbers written before the asset pipeline exists.

The foundation wave fixes **hard behavioral boundaries** now and defers exact 3D byte/triangle limits until the Pushkin/export spike produces real measurements.

## Hard boundaries already fixed

- The `/hall` page shell remains within its existing route budget (`8000` bytes in `src/routes/route-contract.json`) while Hall is dormant.
- No Three.js/R3F Hall runtime is imported by the route shell before an explicit approved entry action.
- No full-museum `Preload all` baseline.
- Static architecture does not require a perpetual frame loop merely for decorative particles.
- Baseline launch does not require FPS/pointer-lock controls.
- Runtime quality must degrade intentionally; low stable quality/fallback is preferable to unstable high quality.

## Measurements required from the first web vertical slice

Record separately for desktop and representative mobile tiers:

- initial DOM shell transfer;
- core 3D transfer after explicit entry;
- gallery/detail incremental transfer;
- total decoded texture residency estimate;
- `renderer.info` draw calls, triangles, geometries and textures at certified cameras;
- frame time/FPS during idle, camera transition and exhibit focus;
- shader/program count where useful;
- asset decode/load time;
- largest texture dimensions;
- number of realtime shadow-casting lights;
- number/cost of fullscreen post passes.

## Budget setting rule

Exact Hall v3 asset limits are set **after** the material/lighting/export and Pushkin vertical slices establish what quality actually costs.

The selected limits must:

1. preserve the approved look;
2. fit representative desktop/mobile devices;
3. include headroom rather than use the fastest development machine as the baseline;
4. be enforced by machine-readable validation once values are approved.

Raising a budget because a new asset exceeded it is not a repair. The asset/pipeline must first be profiled and justified.

## Quality tiers

The target architecture supports at least these conceptual tiers:

### Tier A

Full approved runtime assets, normal texture residency and optional subtle enhancements.

### Tier B

Lower DPR/texture residency and reduced decorative detail; core architecture/exhibit readability unchanged.

### Tier C

Simplified geometry/material features, no expensive optional post-processing and no realtime shadow luxuries.

### Tier D

Art-directed 2.5D/still/cinematic fallback with accessible DOM navigation when reliable 3D cannot be delivered.

The final device-selection logic is implemented only after measurement.

## Runtime loop policy

If the scene is static between user interactions, R3F on-demand rendering is preferred over a permanent animation loop. A permanent loop requires a measured feature justification, not decorative habit.

## Lighting policy

The static museum is expected to rely heavily on precomputed/static lighting information where the spike proves it beneficial. Realtime shadow-casting lights are treated as expensive exceptions.

## Resource lifecycle

Progressive chunks must be unloadable/disposable when the final navigation design requires it. Textures, materials, geometries, loaders and temporary render targets may not leak across repeated route entries.

## Browser certification

Hall-specific browser QA eventually covers:

- Chromium desktop;
- Android/Chrome class device;
- desktop WebKit;
- iPhone Safari/reduced-motion path;
- no-WebGL or deliberately forced fallback.

A desktop-only 60 FPS result is not Hall certification.
