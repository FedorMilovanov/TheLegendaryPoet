# Hall v3 — staged production authority

`TLP-HALL-001` owns the rebuild of `/hall`.

This directory is the technical/art-production authority for Hall v3 while the lane is open. It does **not** make Hall v2 production authority, and it does not authorize a WebGL scene before the visual gates below are passed.

The current machine phase and gate state live in [`hall-v3-contract.json`](hall-v3-contract.json). Agents must update that contract explicitly when advancing a gate; prose alone cannot silently advance Hall production state.

## Current phase — camera approval

Gate 0 / foundation and Gate 1 / Reference Bible are completed. Gate 2 / metric greybox is completed by a separate explicit topology decision. Gate 3 / camera approval is now active.

The neutral H1/H2/H3 shootout remains immutable evidence. It was regenerated on exact PR head `70aeb9c1aca4414d9cade3cb9cdcfb887b7ea806` in Blender 4.5.12 LTS and merged through PR #376 to Product `main@66dabcdcff5fa0fc8ad8fde44544432e4a144e4d`.

The topology decision is:

- **H3 — advance**: selected single topology authority for camera evaluation;
- **H1 — reserve**: retained as route/orientation benchmark only;
- **H2 — reject**: parked because the neutral evidence does not justify its 53.8854 m baseline route and 8 forced turns;
- **camera rig — not approved**: the common 35 mm shootout lens remains benchmark instrumentation only.

Current source authority:

- [`REFERENCE_BIBLE.md`](REFERENCE_BIBLE.md) — completed institutional/conservation evidence;
- [`SPATIAL_BRIEF.md`](SPATIAL_BRIEF.md) — inherited metric/camera/evidence criteria;
- [`reference-bible.json`](reference-bible.json) — completed evidence and explicit non-decisions;
- [`greybox-tooling.json`](greybox-tooling.json) — completed reproducible Blender 4.5.12 runtime/smoke evidence contract;
- [`greybox-layouts.json`](greybox-layouts.json) — frozen H1/H2/H3 metre-scale shootout source;
- [`greybox-candidates.json`](greybox-candidates.json) — retained candidate dispositions with H3 selected and `approvedRig=null`;
- [`greybox-decision.json`](greybox-decision.json) — exact artifact-backed select/reject authority and phase transition;
- `scripts/hall-greybox/generate-candidates.py` — deterministic generator retained for reproducibility;
- `scripts/validate-hall-topology-selection.ts` — persistent source + generated-evidence guard;
- `.github/workflows/hall-greybox-tooling.yml` — exact-head Blender reproduction barrier for the frozen shootout.

## Current production boundary

- `/hall` remains a lightweight DOM placeholder.
- `src/components/hall/*` is legacy implementation evidence only.
- Three.js/R3F remains out of the dormant `/hall` dependency graph.
- No generated `.blend`, PNG/SVG comparison evidence or runtime GLB is committed as production web authority.
- H3 selection authorizes **camera evaluation only**; it does not authorize geometry redesign, materials, lights, textures, export or WebGL.
- Candidate scenes contain proxy geometry only; no rights-uncleared documentary image becomes a source asset.
- No Hall v2 FPS, hover-whisper, dust, mirror-floor or post-processing behavior is a required Hall v3 feature.

## Authority layers

1. **Reference/evidence bible** — visual language, exclusions, spatial brief and acceptance criteria.
2. **Frozen metric shootout source** — H1/H2/H3 layout data and deterministic Blender generator.
3. **Generated Blender evidence** — exact-head Actions artifacts proving routes, clearances, sightlines and comparison metrics.
4. **Topology decision** — H3 advance / H1 reserve / H2 reject; no camera approval implied.
5. **Camera approval evidence** — next active layer; must prove guided desktop/mobile/reduced-motion framing on selected H3.
6. **Later approved Blender scene** — only after camera approval and later lookdev/export gates.
7. **Asset/runtime manifest** — later GLB/KTX2 files, hashes, exhibit bindings and budgets.
8. **Canonical poet library + rights register** — content/provenance remain outside Blender.
9. **Web runtime** — later loading, approved camera, accessible DOM, quality tiers, reduced motion and fallback.

A lower layer must not silently repair a higher-layer defect. React does not fix architecture. Post-processing does not fix materials. AI does not approve its own output.

## Mandatory production order

`reference bible → metric greybox → candidate decision → camera approval → material/lighting/export spike → Pushkin vertical slice → offline visual approval → optimized runtime asset → web vertical slice → remaining exhibits → advanced modes`

Skipping a gate is a blocker, not an acceleration.

## Gate 0 — foundation — completed

Foundation permanently guards Hall-v3 authority, the lightweight `/hall` shell, legacy isolation, Three/R3F isolation and stale public-concept exclusion.

## Gate 1 — references and spatial brief — completed

Reference Bible owns institutional `TAKE / AVOID / WHY / SOURCE` evidence, real-metre accessibility witnesses, H1/H2/H3 hypotheses, equal camera/mobile output requirements, automatic rejection rules, Pushkin proxy grammar and data-authority boundaries.

## Gate 2 — Blender metric greybox — completed

Exact-head CI proved Blender `4.5.12` LTS, vendor SHA-256 verification, headless execution, one-unit-one-metre scenes, a common 1.75 m proxy, `.blend` save/reopen, neutral Workbench output, route/viewing/headroom witnesses and equal H1/H2/H3 camera packages.

Frozen comparison metrics:

- H1 — 32.1462 m / 2 forced turns;
- H2 — 53.8854 m / 8 forced turns;
- H3 — 37.8327 m / 4 forced turns.

All 18 certified sightline witnesses passed. All three Pushkin viewing pockets passed the inherited accessibility witness. Materials = 0, lights = 0. The topology-selection validator also pins the exact layout fingerprints from that evidence so this decision cannot be retroactively justified after a hidden layout change.

### Topology decision — completed

H3 advances because it has the strongest spatial identity, changing diagonal sightlines and side-focus hierarchy at a moderate route cost. H1 remains the orientation/route-simplicity reserve benchmark. H2 is rejected for the current production path because its longest route/highest turn count is not compensated by stronger neutral spatial evidence.

This is a topology decision only. It does not approve the common 35 mm camera set.

## Gate 3 — camera approval — active

Camera Approval must operate on the selected H3 topology without redesigning that topology to rescue a weak shot.

Known shootout-camera problem: `pushkinViewing` is too close/flat in portrait framing. The next bounded camera wave must compare a small common set of guided rigs/lenses and prove:

- entry reveal;
- orientation;
- first transition;
- Pushkin approach;
- Pushkin viewing;
- reverse/exit;
- equivalent portrait-mobile crops;
- direct reduced-motion cut destinations;
- wayfinding that does not depend on FPS/free-look.

`approvedRig` remains `null` until that evidence is inspected and explicitly approved.

## Gate 4 — material / lighting / export spike — blocked

Only after Camera Approval may one small H3 architectural bay test PBR colour spaces, UV strategy, navigation-safe lighting, static-light delivery, raw→optimized asset validation and browser viability. Do not texture or bake the full museum first.

## Gate 5 — Pushkin vertical slice — blocked

A finished slice eventually contains part of the approved spatial/camera system, one transition and one complete Pushkin exhibit with rights-cleared documentary material. It must pass `VISUAL_ACCEPTANCE.md` before scale-out.

## Later gates — blocked

Offline visual approval, optimized runtime asset, web vertical slice and full museum scale-out remain blocked. Only after offline visual approval may the web runtime load approved optimized assets, use an approved guided camera, retain authoritative accessible DOM, support reduced motion/fallback and prove resource cleanup.

FPS/free-walk, poet-connection mode, timeline animation and ambient audio remain later optional features.

## Documents

- [`hall-v3-contract.json`](hall-v3-contract.json)
- [`REFERENCE_BIBLE.md`](REFERENCE_BIBLE.md)
- [`SPATIAL_BRIEF.md`](SPATIAL_BRIEF.md)
- [`reference-bible.json`](reference-bible.json)
- [`greybox-tooling.json`](greybox-tooling.json)
- [`greybox-candidates.json`](greybox-candidates.json)
- [`greybox-layouts.json`](greybox-layouts.json)
- [`greybox-decision.json`](greybox-decision.json)
- [`ART_DIRECTION.md`](ART_DIRECTION.md)
- [`SCENE_CONTRACT.md`](SCENE_CONTRACT.md)
- [`ASSET_PIPELINE.md`](ASSET_PIPELINE.md)
- [`VISUAL_ACCEPTANCE.md`](VISUAL_ACCEPTANCE.md)
- [`AI_USAGE_POLICY.md`](AI_USAGE_POLICY.md)
- [`PERFORMANCE_BUDGET.md`](PERFORMANCE_BUDGET.md)
- [`RIGHTS_REGISTER.md`](RIGHTS_REGISTER.md)
- [`LEGACY_RETIREMENT.md`](LEGACY_RETIREMENT.md)

## Closure

Topology selection does not close `TLP-HALL-001`. The lane closes only after camera, lookdev/export, Pushkin slice, offline/web delivery and fallback contracts are certified, production `/hall` safely replaces the placeholder and resulting exact-head evidence is recorded in AuditRepo.
