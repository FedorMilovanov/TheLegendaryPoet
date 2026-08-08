# Hall v3 — staged production authority

`TLP-HALL-001` owns the rebuild of `/hall`.

This directory is the technical/art-production authority for Hall v3 while the lane is open. It does **not** make Hall v2 production authority, and it does not authorize a WebGL scene before the offline visual gates are passed.

The current machine phase and gate state live in [`hall-v3-contract.json`](hall-v3-contract.json). Prose cannot silently advance a Hall gate.

## Current phase — material / lighting / export spike

Foundation, Reference Bible, metric greybox and Camera Approval are completed. A separate gate-promotion record now activates **`materialLightingExportSpike`** and nothing later.

Frozen spatial authority:

- **H3 — selected topology**;
- **H1 — topology reserve benchmark**;
- **H2 — topology reject**;
- **R1 — approved guided camera rig**;
- **R3 — camera reserve**;
- **R0/R2 — camera rejects**.

The selected R1 variable witness is `pushkinViewing`: position `[8.0, 2.5, 1.60]`, target/destination `[11.15, 5.45, 1.95]`, lens `28 mm`. The other five guided H3 witnesses remain frozen.

`camera-rigs.json` stays immutable candidate evidence with `approvedRig=null`; `camera-decision.json` owns the human selection. [`camera-gate-promotion.json`](camera-gate-promotion.json) owns the machine transition from Camera Approval to the material/light/export spike.

## Current source authority

- [`REFERENCE_BIBLE.md`](REFERENCE_BIBLE.md), [`SPATIAL_BRIEF.md`](SPATIAL_BRIEF.md), [`reference-bible.json`](reference-bible.json) — completed reference/metric evidence;
- [`greybox-tooling.json`](greybox-tooling.json), [`greybox-layouts.json`](greybox-layouts.json), [`greybox-candidates.json`](greybox-candidates.json), [`greybox-decision.json`](greybox-decision.json) — frozen topology evidence and decision;
- [`camera-rigs.json`](camera-rigs.json), [`camera-decision.json`](camera-decision.json), [`camera-gate-promotion.json`](camera-gate-promotion.json) — immutable camera evidence, R1 decision and gate promotion;
- `scripts/hall-greybox/generate-candidates.py` and `scripts/hall-camera/generate-camera-candidates.py` — reproducibility generators only;
- `scripts/validate-hall-topology-selection-provenance.ts` — frozen shootout provenance;
- `scripts/validate-hall-post-camera-authority.ts` — current persistent H3/R1 spatial authority;
- `.github/workflows/hall-greybox-tooling.yml` — exact-head Blender regeneration barrier.

Earlier phase-specific validators remain in the repository for forensic reproduction of their original gates, but they are no longer the current mandatory authority after Camera Approval completion.

## Production boundary

- `/hall` remains a lightweight DOM placeholder.
- `src/components/hall/*` remains legacy evidence only.
- Three.js/R3F remains out of the dormant `/hall` dependency graph.
- H3 topology and R1 camera are frozen; the current spike may not redesign them.
- No generated `.blend`, PNG/SVG evidence or GLB becomes production web authority merely by existing in Actions.
- No rights-uncleared documentary media is allowed into the spike.
- FPS/free-walk, hover whispers, dust, mirror floor and effect-driven rescue remain non-goals.

## Gate 0 — foundation — completed

Lightweight `/hall`, legacy isolation, Three/R3F isolation and stale public-concept exclusion remain permanent invariants.

## Gate 1 — Reference Bible — completed

Institutional references, accessibility dimensions, TAKE/AVOID evidence and visual acceptance boundaries are fixed inputs rather than styling suggestions.

## Gate 2 — metric greybox — completed

Blender 4.5.12 LTS, metre-scale scenes and equal neutral evidence produced:

- H1 — `32.1462 m / 2` forced turns;
- H2 — `53.8854 m / 8` forced turns;
- H3 — `37.8327 m / 4` forced turns.

H3 is selected; H1 is reserve; H2 is rejected. Frozen H3 layout fingerprint: `5d5d0ddd8b150aa64afb73a2a3d9e00c6005e99fc935a6d4707a49ecd475fe65`.

## Gate 3 — Camera Approval — completed

Exact-head camera evidence on frozen H3 compared R0/R1/R2/R3. R1 was selected, R3 retained as reserve, R0 rejected as the close/flat baseline and R2 rejected because its Pushkin ray hits `HUMAN_PROXY` first.

Camera Decision PR #383 exact head `8682789cf78e4e717eba5181246700da09de5c11` reproduced frozen topology and camera evidence under Blender 4.5.12 before merge. Resulting source main: `07e23ea3feb79fea9d42f29b192e4e3f046713cc`.

Any later change to H3 or R1 requires reopening the relevant earlier gate with new evidence. Lookdev is not allowed to move walls or cameras to rescue a material/light problem.

## Gate 4 — material / lighting / export spike — active

The active task is deliberately small: **one representative H3 architectural bay**, not the whole museum.

This gate may prove:

- correct PBR color-space ownership (`baseColor/emissive` color data vs normal/roughness/metalness/AO non-color data);
- a bounded UV strategy and, if useful, a separately evidenced secondary UV/lightmap delivery contract;
- a static-lighting strategy comparison without changing H3/R1;
- raw → optimized glTF/GLB validation;
- preservation of required node names/extras through optimization;
- browser viability and measurable asset/render budgets for the bay.

This gate must **not**:

- texture/light the full Hall;
- add final Pushkin portrait/manuscript assets;
- introduce production Three/R3F/WebGL;
- redesign topology or camera;
- use bloom/fog/particles as a substitute for material/light quality.

The spike is not complete until a concrete delivery contract is chosen from measured evidence rather than assumed from Blender screenshots.

## Later gates — blocked

`pushkinVerticalSlice`, `offlineVisualApproval`, `webVerticalSlice` and `fullMuseumScaleOut` remain blocked. A complete Pushkin exhibit still requires rights-cleared documentary assets and separate visual approval before browser integration.

## Production order

`reference bible → metric greybox → topology decision → camera evidence → camera decision → gate promotion → material/lighting/export spike → Pushkin vertical slice → offline visual approval → optimized runtime asset → web vertical slice → remaining exhibits → advanced modes`

Skipping a gate is a blocker, not an acceleration.

## Documents

- [`hall-v3-contract.json`](hall-v3-contract.json)
- [`camera-gate-promotion.json`](camera-gate-promotion.json)
- [`camera-decision.json`](camera-decision.json)
- [`camera-rigs.json`](camera-rigs.json)
- [`greybox-decision.json`](greybox-decision.json)
- [`greybox-layouts.json`](greybox-layouts.json)
- [`ASSET_PIPELINE.md`](ASSET_PIPELINE.md)
- [`SCENE_CONTRACT.md`](SCENE_CONTRACT.md)
- [`ART_DIRECTION.md`](ART_DIRECTION.md)
- [`VISUAL_ACCEPTANCE.md`](VISUAL_ACCEPTANCE.md)
- [`PERFORMANCE_BUDGET.md`](PERFORMANCE_BUDGET.md)
- [`RIGHTS_REGISTER.md`](RIGHTS_REGISTER.md)
- [`AI_USAGE_POLICY.md`](AI_USAGE_POLICY.md)
- [`LEGACY_RETIREMENT.md`](LEGACY_RETIREMENT.md)

## Closure

`TLP-HALL-001` remains open. The lane closes only after the material/export decision, finished Pushkin slice, offline visual approval, runtime/fallback certification and safe replacement of the production `/hall` placeholder are all separately verified and recorded in AuditRepo.
