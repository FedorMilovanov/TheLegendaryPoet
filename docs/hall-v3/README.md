# Hall v3 — staged production authority

`TLP-HALL-001` owns the rebuild of `/hall`.

This directory is the technical/art-production authority for Hall v3 while the lane is open. It does **not** make Hall v2 production authority, and it does not authorize a production WebGL scene before the required visual/runtime gates are passed.

The current machine phase and gate state live in [`hall-v3-contract.json`](hall-v3-contract.json). Prose cannot silently advance a Hall gate.

## Current phase — Pushkin vertical slice active

Foundation, Reference Bible, metric greybox, Camera Approval and the material / lighting / export gate are completed. The machine contract now activates **`pushkinVerticalSlice`** and keeps every later Hall gate blocked.

Frozen authority entering the slice:

- **H3 — selected topology**;
- **H1 — topology reserve benchmark**;
- **H2 — topology reject**;
- **R1 — approved guided camera rig**;
- **R3 — camera reserve**;
- **R0/R2 — camera rejects**;
- **L0 minimal runtime lighting — selected Pushkin baseline**;
- **UV0 — selected surface-material channel, accepted at `1.5 m / UV unit`**;
- **UV1 — preserved optional static-bake reserve**;
- **current L1 external-lightmap bake — rejected**;
- **production texture encoding — deferred to measured Pushkin-slice evidence**.

The selected R1 variable witness is `pushkinViewing`: position `[8.0, 2.5, 1.60]`, target/destination `[11.15, 5.45, 1.95]`, lens `28 mm`. The other five guided H3 witnesses remain frozen.

`camera-rigs.json` remains immutable camera candidate evidence. `camera-decision.json` owns R1 selection and `camera-gate-promotion.json` owns the Camera Approval → Gate 4 transition. `material-spike.json` remains immutable candidate/evidence authority with null decision fields; `material-decision.json` owns the selected delivery semantics; [`material-gate-promotion.json`](material-gate-promotion.json) owns the separate Gate 4 → Pushkin transition.

## Current source authority

- [`REFERENCE_BIBLE.md`](REFERENCE_BIBLE.md), [`SPATIAL_BRIEF.md`](SPATIAL_BRIEF.md), [`reference-bible.json`](reference-bible.json) — completed reference/metric evidence;
- [`greybox-tooling.json`](greybox-tooling.json), [`greybox-layouts.json`](greybox-layouts.json), [`greybox-candidates.json`](greybox-candidates.json), [`greybox-decision.json`](greybox-decision.json) — frozen topology evidence and decision;
- [`camera-rigs.json`](camera-rigs.json), [`camera-decision.json`](camera-decision.json), [`camera-gate-promotion.json`](camera-gate-promotion.json) — immutable camera evidence, R1 decision and promotion;
- [`material-spike.json`](material-spike.json) — accepted material/light/export candidate and visual-evidence contract;
- [`material-decision.json`](material-decision.json) — selected L0/UV0/export/material semantics and rejected current L1 bake;
- [`material-gate-promotion.json`](material-gate-promotion.json) — machine transition into `pushkinVerticalSlice` plus the bounded next-gate scope;
- `scripts/hall-greybox/generate-candidates.py`, `scripts/hall-camera/generate-camera-candidates.py`, `scripts/hall-material/*` — frozen reproducibility/evidence generators;
- `scripts/validate-hall-topology-selection-provenance.ts` — frozen shootout provenance;
- `scripts/validate-hall-material-transport.ts` — phase-independent raw/optimized/semantic/GPU transport guard;
- `scripts/validate-hall-post-material-authority.ts` — persistent current authority after Gate-4 promotion;
- `.github/workflows/hall-greybox-tooling.yml` — exact-head Blender/export/browser regeneration barrier.

Earlier camera/material phase-specific validators remain in the repository for forensic reproduction of their original gates. They are not current-phase authority after material promotion.

## Production boundary

- `/hall` remains a lightweight DOM placeholder.
- `src/components/hall/*` remains legacy evidence only.
- Three.js/R3F remains out of the dormant `/hall` dependency graph.
- H3 topology, R1 camera and selected L0/UV0 delivery may not drift inside the Pushkin lane without reopening the relevant earlier gate.
- No generated `.blend`, QA PNG/SVG evidence or GLB becomes production web authority merely by existing in Actions.
- Accepted 256px PNG proof maps remain evidence only, not production texture assets or encoding authority.
- The current L1 external-lightmap bake remains rejected and may not be silently reused as approved.
- No rights-uncleared documentary media is allowed into a production Hall manifest.
- AI may not impersonate a historical facsimile, signature, manuscript or museum object, and may not substitute for missing documentary rights.
- FPS/free-walk, hover whispers, dust, mirror floor and effect-driven rescue remain non-goals.

## Completed gates

### Gate 0 — foundation — completed

Lightweight `/hall`, legacy isolation, Three/R3F isolation and stale public-concept exclusion remain permanent invariants.

### Gate 1 — Reference Bible — completed

Institutional references, accessibility dimensions, TAKE/AVOID evidence and visual acceptance boundaries are fixed inputs rather than styling suggestions.

### Gate 2 — metric greybox — completed

Blender 4.5.12 LTS, metre-scale scenes and equal neutral evidence produced H1/H2/H3. H3 is selected, H1 reserve and H2 rejected. Frozen H3 layout fingerprint: `5d5d0ddd8b150aa64afb73a2a3d9e00c6005e99fc935a6d4707a49ecd475fe65`.

### Gate 3 — Camera Approval — completed

R1 is selected, R3 retained as reserve and R0/R2 rejected. Any later change to H3 or R1 requires reopening the relevant earlier gate with new evidence.

### Gate 4 — material / lighting / export — completed

Accepted exact-head evidence and the separate decision establish:

- L0 minimal runtime lighting selected;
- UV0 surface mapping selected at accepted metre scale;
- UV1 optional/reserved, not mandatory;
- current L1 bake rejected for darkness while its transport remains technically proven;
- Blender 4.5.12 → Khronos → preservation-safe `gltfpack@1.2.0` (`-cc -kn -km -ke -kv -vpf`) → Khronos selected;
- baseColor=sRGB color; normal/roughness=Non-Color data; explicit tangents; stone metallic `0`; any future lightmap linear on UV1;
- final production texture encoding deliberately deferred.

Two machine-green visual artifacts were manually rejected before the accepted Gate-4 evidence, so machine green remains necessary but not sufficient for Hall visual acceptance.

## Gate 5 — Pushkin vertical slice — active

This gate is deliberately **offline/source-first**. It does not authorize production WebGL integration by itself.

### First bounded ordering

1. **Rights/provenance record first for documentary hero assets.** [`RIGHTS_REGISTER.md`](RIGHTS_REGISTER.md) requires source identity, rights basis, credit, source URL/access date and verification. Only `approved` documentary records may enter a production Hall manifest.
2. Acquire/verify one bounded Pushkin portrait/document set. Pending or ambiguous rights block that asset; AI is not a substitute for missing rights.
3. Assemble one complete Pushkin exhibit using Blender/source authority on frozen H3/R1/L0. React/Three is not the modeller.
4. Author near-final materials on selected UV0 and compare final production texture encoding using measured slice evidence rather than assuming PNG/KTX2.
5. Produce fixed stills, close material crops, desktop/mobile framing and a 20–30 s offline camera sequence, including no-effects baseline and raw-vs-optimized comparison.
6. Calibrate first-slice transfer, decode, GPU-memory and frame-time budgets from the representative slice.
7. If the offline sequence is not compelling or hero provenance is unresolved, the slice does **not** advance to WebGL integration.

### Allowed in this gate

- explicit Pushkin rights/provenance registration;
- one complete offline Pushkin exhibit;
- rights-cleared portrait/documentary media;
- near-final material authoring on UV0;
- final production texture encoding comparison;
- fixed still / offline camera evidence;
- raw-to-optimized Pushkin asset validation;
- first-slice performance budget calibration.

### Forbidden in this gate

- full-Hall lookdev;
- H3 topology redesign;
- R1 redesign without reopening Camera Approval;
- current L1 bake as approved delivery;
- rights-uncleared documentary media;
- AI-generated fake historical facsimiles/signatures/manuscripts;
- production Three/R3F/WebGL Hall activation;
- automatic promotion of `offlineVisualApproval`, `webVerticalSlice` or `fullMuseumScaleOut`.

## Later gates — blocked

`offlineVisualApproval`, `webVerticalSlice` and `fullMuseumScaleOut` remain blocked. A complete Pushkin exhibit still requires rights-cleared documentary assets, offline visual acceptance and separately measured runtime/fallback evidence before browser integration.

## Production order

`reference bible → metric greybox → topology decision → camera evidence → camera decision → camera gate promotion → material/light/export evidence → material delivery decision → material gate promotion → Pushkin vertical slice → offline visual approval → optimized runtime asset → web vertical slice → remaining exhibits → advanced modes`

Skipping a gate is a blocker, not an acceleration.

## Documents

- [`hall-v3-contract.json`](hall-v3-contract.json)
- [`material-gate-promotion.json`](material-gate-promotion.json)
- [`material-decision.json`](material-decision.json)
- [`material-spike.json`](material-spike.json)
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

`TLP-HALL-001` remains open. The lane closes only after the Pushkin slice is completed, offline visual approval passes, runtime/fallback certification passes, web vertical-slice approval passes and the production `/hall` placeholder is safely replaced with the separately approved Hall experience.
