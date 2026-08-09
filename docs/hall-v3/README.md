# Hall v3 — staged production authority

`TLP-HALL-001` owns the rebuild of `/hall`.

This directory is the technical/art-production authority for Hall v3 while the lane is open. It does **not** make Hall v2 production authority, and it does not authorize a WebGL scene before the offline visual gates are passed.

The current machine phase and gate state live in [`hall-v3-contract.json`](hall-v3-contract.json). Prose cannot silently advance a Hall gate.

## Current phase — material / lighting / export decision selected; promotion pending

Foundation, Reference Bible, metric greybox and Camera Approval are completed. Gate 4 **`materialLightingExportSpike`** remains machine-active until a separate promotion transaction, but its measured delivery contract is selected in [`material-decision.json`](material-decision.json).

Frozen spatial authority:

- **H3 — selected topology**;
- **H1 — topology reserve benchmark**;
- **H2 — topology reject**;
- **R1 — approved guided camera rig**;
- **R3 — camera reserve**;
- **R0/R2 — camera rejects**.

The selected R1 variable witness is `pushkinViewing`: position `[8.0, 2.5, 1.60]`, target/destination `[11.15, 5.45, 1.95]`, lens `28 mm`. The other five guided H3 witnesses remain frozen.

`camera-rigs.json` stays immutable candidate evidence with `approvedRig=null`; `camera-decision.json` owns the human camera selection. [`camera-gate-promotion.json`](camera-gate-promotion.json) owns the machine transition from Camera Approval to Gate 4. `material-spike.json` remains immutable authoring/evidence authority with null decision fields; [`material-decision.json`](material-decision.json) separately owns the selected Gate-4 delivery contract. A later promotion record, not the decision record, must advance `pushkinVerticalSlice`.

## Current source authority

- [`REFERENCE_BIBLE.md`](REFERENCE_BIBLE.md), [`SPATIAL_BRIEF.md`](SPATIAL_BRIEF.md), [`reference-bible.json`](reference-bible.json) — completed reference/metric evidence;
- [`greybox-tooling.json`](greybox-tooling.json), [`greybox-layouts.json`](greybox-layouts.json), [`greybox-candidates.json`](greybox-candidates.json), [`greybox-decision.json`](greybox-decision.json) — frozen topology evidence and decision;
- [`camera-rigs.json`](camera-rigs.json), [`camera-decision.json`](camera-decision.json), [`camera-gate-promotion.json`](camera-gate-promotion.json) — immutable camera evidence, R1 decision and gate promotion;
- [`material-spike.json`](material-spike.json) — merged material/light/export candidate and visual-evidence contract;
- [`material-decision.json`](material-decision.json) — selected Gate-4 delivery semantics, accepted evidence identity, current L1 rejection and separate-promotion boundary;
- `scripts/hall-greybox/generate-candidates.py` and `scripts/hall-camera/generate-camera-candidates.py` — reproducibility generators only;
- `scripts/validate-hall-topology-selection-provenance.ts` — frozen shootout provenance;
- `scripts/validate-hall-post-camera-authority.ts` — persistent H3/R1 spatial authority;
- `scripts/validate-hall-material-spike.ts`, `scripts/validate-hall-material-transport.ts`, `scripts/hall-material/validate-visual-evidence.mjs` — Gate-4 candidate/transport/visual evidence guards;
- `scripts/validate-hall-material-decision.ts` — selected material-delivery decision authority;
- `.github/workflows/hall-greybox-tooling.yml` — exact-head Blender/export/browser regeneration barrier.

Earlier phase-specific validators remain in the repository for forensic reproduction of their original gates. Current persistent authority must retain H3/R1 plus the accepted material evidence and selected decision until a later gate explicitly supersedes them.

## Production boundary

- `/hall` remains a lightweight DOM placeholder.
- `src/components/hall/*` remains legacy evidence only.
- Three.js/R3F remains out of the dormant `/hall` dependency graph.
- H3 topology and R1 camera are frozen; Gate-4 selection may not redesign them.
- No generated `.blend`, QA PNG/SVG evidence or GLB becomes production web authority merely by existing in Actions.
- The accepted 256px PNG proof maps are evidence only, not production texture assets or encoding authority.
- The current L1 external-lightmap bake is rejected and may not be silently reused as approved.
- No rights-uncleared documentary media is allowed into the lane.
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

## Gate 4 — material / lighting / export spike — active, decision selected

The bounded representative H3 bay has now produced accepted DCC/export/browser evidence and a separate material-delivery decision. Gate 4 remains machine-active only because the repository requires a distinct promotion transaction before `pushkinVerticalSlice` becomes active.

Selected baseline for the first Pushkin vertical slice:

- **L0 minimal runtime lighting** — selected, no external lightmap required and zero realtime shadow lights in the proved baseline;
- **UV0** — surface material mapping with the accepted metre-scaled `1.5 m / UV unit` model;
- **UV1** — preserved as a reserved/optional static-bake channel, not mandatory;
- **current L1 external-lightmap bake** — rejected because the accepted exact-head evidence is too dark; the technical UV1/lightmap transport remains available for a future bounded repeat-spike if a real need appears;
- **glTF transport** — Blender 4.5.12 LTS → Khronos validation → preservation-safe `gltfpack@1.2.0` (`-cc -kn -km -ke -kv -vpf`) → Khronos revalidation, with names/materials/extras/UV0/UV1/tangents/camera/poetId/metric scale preserved;
- **material semantics** — baseColor is sRGB color, normal/roughness are Non-Color data, explicit tangents are required, stone metallic factor remains `0`, and any future external lightmap remains linear data on UV1;
- **production texture encoding** — deliberately deferred to the Pushkin vertical slice. QA PNG proof maps do not authorize a production PNG/KTX2 choice.

Two earlier machine-green material artifacts were manually rejected before the accepted visual evidence because one used invalid wall-face framing and the next exposed a hard repeat seam. Machine green is therefore not treated as visual acceptance by itself.

This decision still must **not**:

- activate `pushkinVerticalSlice` inside the decision transaction;
- texture/light the full Hall;
- add final Pushkin portrait/manuscript assets;
- introduce production Three/R3F/WebGL;
- redesign topology or camera;
- reuse the rejected current L1 bake as approved;
- use bloom/fog/particles as a substitute for material/light quality.

The only next Gate-4 transaction is the separate `materialLightingExportSpike → pushkinVerticalSlice` promotion record.

## Later gates — blocked

`pushkinVerticalSlice`, `offlineVisualApproval`, `webVerticalSlice` and `fullMuseumScaleOut` remain blocked until the machine contract is separately promoted. A complete Pushkin exhibit still requires rights-cleared documentary assets and separate visual approval before browser integration.

## Production order

`reference bible → metric greybox → topology decision → camera evidence → camera decision → camera gate promotion → material/light/export evidence → material delivery decision → material gate promotion → Pushkin vertical slice → offline visual approval → optimized runtime asset → web vertical slice → remaining exhibits → advanced modes`

Skipping a gate is a blocker, not an acceleration.

## Documents

- [`hall-v3-contract.json`](hall-v3-contract.json)
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

`TLP-HALL-001` remains open. The lane closes only after the selected material contract is promoted into the Pushkin-slice gate, the Pushkin slice is finished, offline visual approval passes, runtime/fallback certification passes and the production `/hall` placeholder is safely replaced with the separately approved Hall experience.
