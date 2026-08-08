# Hall v3 — staged production authority

`TLP-HALL-001` owns the rebuild of `/hall`.

This directory is the technical/art-production authority for Hall v3 while the lane is open. It does **not** make Hall v2 production authority, and it does not authorize a WebGL scene before the visual gates below are passed.

The current machine phase and gate state live in [`hall-v3-contract.json`](hall-v3-contract.json). Agents must update that contract explicitly when advancing a gate; prose alone cannot silently advance Hall production state.

## Current phase — camera approval decision recorded

Gate 0 / foundation, Gate 1 / Reference Bible and Gate 2 / metric greybox are completed. Gate 3 / camera approval remains the current machine phase, but the camera decision itself is now recorded separately from gate promotion.

The immutable topology and Camera Approval evidence say:

- **H3 — selected topology**;
- **H1 — topology reserve benchmark**;
- **H2 — topology reject**;
- **R1 — selected guided camera rig**;
- **R3 — camera reserve**;
- **R0 — rejected close/flat benchmark**;
- **R2 — rejected because `pushkinViewing` hits `HUMAN_PROXY` before the Pushkin proxy**.

The camera candidate evidence was rendered on exact PR #382 head `7637010ef69248fe05ea37c1a1cf9ee8d2a38193` in Blender 4.5.12 LTS. `camera-decision.json` owns the human select/reject decision; `camera-rigs.json` deliberately remains immutable candidate evidence with `approvedRig=null` rather than being rewritten after inspection.

Current source authority:

- [`REFERENCE_BIBLE.md`](REFERENCE_BIBLE.md) — completed institutional/conservation evidence;
- [`SPATIAL_BRIEF.md`](SPATIAL_BRIEF.md) — inherited metric/camera/evidence criteria;
- [`reference-bible.json`](reference-bible.json) — completed evidence and explicit non-decisions;
- [`greybox-tooling.json`](greybox-tooling.json) — completed reproducible Blender 4.5.12 runtime/smoke evidence contract;
- [`greybox-layouts.json`](greybox-layouts.json) — frozen H1/H2/H3 metre-scale shootout source;
- [`greybox-candidates.json`](greybox-candidates.json) — frozen topology candidate evidence;
- [`greybox-decision.json`](greybox-decision.json) — artifact-backed H3/H1/H2 topology select/reject authority;
- [`camera-rigs.json`](camera-rigs.json) — immutable R0/R1/R2/R3 camera candidate source;
- [`camera-decision.json`](camera-decision.json) — selected R1 / reserve R3 / rejected R0,R2 authority;
- `scripts/hall-greybox/generate-candidates.py` — deterministic topology-evidence generator retained for reproducibility;
- `scripts/hall-camera/generate-camera-candidates.py` — deterministic camera-evidence generator that may not mutate H3 geometry;
- `scripts/validate-hall-topology-selection.ts` and `scripts/validate-hall-topology-selection-provenance.ts` — persistent frozen-topology guards;
- `scripts/validate-hall-camera-approval.ts` plus `scripts/validate-hall-camera-decision.ts` — immutable camera evidence + decision guards;
- `.github/workflows/hall-greybox-tooling.yml` — exact-head Blender reproduction barrier.

## Current production boundary

- `/hall` remains a lightweight DOM placeholder.
- `src/components/hall/*` is legacy implementation evidence only.
- Three.js/R3F remains out of the dormant `/hall` dependency graph.
- No generated `.blend`, PNG/SVG comparison evidence or runtime GLB is committed as production web authority.
- H3 topology and R1 camera selection do **not** authorize geometry redesign, materials, lights, textures, export or WebGL.
- Candidate scenes contain proxy geometry only; no rights-uncleared documentary image becomes a source asset.
- No Hall v2 FPS, hover-whisper, dust, mirror-floor or post-processing behavior is a required Hall v3 feature.

## Authority layers

1. **Reference/evidence bible** — visual language, exclusions, spatial brief and acceptance criteria.
2. **Frozen metric shootout source** — H1/H2/H3 layout data and deterministic Blender generator.
3. **Generated topology evidence** — exact-head Actions artifacts proving routes, clearances, sightlines and comparison metrics.
4. **Topology decision** — H3 selected, H1 reserve, H2 rejected.
5. **Immutable camera candidate evidence** — R0/R1/R2/R3 generated on frozen H3.
6. **Camera decision** — R1 selected, R3 reserve, R0/R2 rejected; camera candidate source remains unmodified evidence.
7. **Later material/lighting/export spike** — may start only after a separate machine gate-promotion transaction.
8. **Later approved Blender scene** — only after lookdev/export and Pushkin vertical-slice gates.
9. **Asset/runtime manifest** — later GLB/KTX2 files, hashes, exhibit bindings and budgets.
10. **Canonical poet library + rights register** — content/provenance remain outside Blender.
11. **Web runtime** — later loading, approved camera, accessible DOM, quality tiers, reduced motion and fallback.

A lower layer must not silently repair a higher-layer defect. React does not fix architecture. Post-processing does not fix materials. AI does not approve its own output.

## Mandatory production order

`reference bible → metric greybox → candidate decision → camera approval → gate promotion → material/lighting/export spike → Pushkin vertical slice → offline visual approval → optimized runtime asset → web vertical slice → remaining exhibits → advanced modes`

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

All 18 certified topology sightline witnesses passed. H3 advances because it has the strongest spatial identity, changing diagonal sightlines and side-focus hierarchy at a moderate route cost. H1 remains the orientation/route-simplicity reserve benchmark. H2 is rejected for the current production path.

## Gate 3 — camera approval — decision recorded, promotion pending

Camera candidate authoring kept H3 geometry, materials/lights and the five non-problem journey witnesses frozen. Only `pushkinViewing` varied.

Exact-head candidate findings:

- R0 / 35 mm / 3.5082 m — rejected close/flat benchmark;
- R1 / 28 mm / 4.3342 m — **selected**; unobstructed, stronger room/document context, portrait-mobile Pushkin proxy fully inside frame;
- R2 / 32 mm / 4.7101 m — rejected by generated ray evidence because `HUMAN_PROXY` blocks the Pushkin target;
- R3 / 35 mm / 5.4116 m — valid reserve; unobstructed but compositionally weaker than R1 in current neutral evidence.

The selected R1 `pushkinViewing` camera is exactly the candidate evidence position `[8.0, 2.5, 1.60]`, target/destination `[11.15, 5.45, 1.95]`, lens `28 mm`. The other five guided H3 witness cameras remain the frozen baseline values.

`camera-decision.json` does **not** itself complete the machine gate. A separate bounded promotion transaction must verify the merged decision evidence, then set `cameraApproval=completed` and activate only `materialLightingExportSpike`. Any later camera change requires reopening Camera Approval with new evidence.

## Gate 4 — material / lighting / export spike — blocked

Only after explicit gate promotion may one small H3 architectural bay test PBR colour spaces, UV strategy, navigation-safe lighting, static-light delivery, raw→optimized asset validation and browser viability. Do not texture or bake the full museum first.

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
- [`camera-rigs.json`](camera-rigs.json)
- [`camera-decision.json`](camera-decision.json)
- [`ART_DIRECTION.md`](ART_DIRECTION.md)
- [`SCENE_CONTRACT.md`](SCENE_CONTRACT.md)
- [`ASSET_PIPELINE.md`](ASSET_PIPELINE.md)
- [`VISUAL_ACCEPTANCE.md`](VISUAL_ACCEPTANCE.md)
- [`AI_USAGE_POLICY.md`](AI_USAGE_POLICY.md)
- [`PERFORMANCE_BUDGET.md`](PERFORMANCE_BUDGET.md)
- [`RIGHTS_REGISTER.md`](RIGHTS_REGISTER.md)
- [`LEGACY_RETIREMENT.md`](LEGACY_RETIREMENT.md)

## Closure

Camera selection does not close `TLP-HALL-001`. The lane closes only after gate promotion, lookdev/export, Pushkin slice, offline/web delivery and fallback contracts are certified, production `/hall` safely replaces the placeholder and resulting exact-head evidence is recorded in AuditRepo.
