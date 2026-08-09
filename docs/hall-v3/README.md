# Hall v3 — staged production authority

`TLP-HALL-001` owns the rebuild of `/hall`.

This directory is the technical/art-production authority for Hall v3 while the lane is open. It does **not** make Hall v2 production authority, and it does not authorize a production WebGL scene before the required visual/runtime gates are passed.

The current machine phase and gate state live in [`hall-v3-contract.json`](hall-v3-contract.json). Prose cannot silently advance a Hall gate.

## Current phase — Pushkin vertical slice active, source bytes verified, documentary rights still blocked

Foundation, Reference Bible, metric greybox, Camera Approval and the material / lighting / export gate are completed. The machine contract activates **`pushkinVerticalSlice`** and keeps every later Hall gate blocked.

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

The Pushkin source lane is explicitly three-layered:

1. [`pushkin-rights.json`](pushkin-rights.json) — canonical documentary object/reproduction/intended-use rights records;
2. [`pushkin-slice.json`](pushkin-slice.json) — one-exhibit H3/R1/L0 source/offline contract;
3. [`pushkin-acquisition.json`](pushkin-acquisition.json) — exact source routes, verified byte identity and institutional/human blockers.

No documentary file is **approved** yet. The Kiprensky 1827 portrait and 1833 `Eugene Onegin` edition remain `rights-pending`, but their exact Commons originals have now been materialized in an isolated GitHub runner and independently bound to exact byte identities: portrait `sha256:316d5f366a46f23cd0a181e570f2d09a6b0d12bc368dab18fdb394b8b8b8bf4b` (10,862,180 bytes; JPEG 3455×4000) and Onegin `sha256:d629c10943cbf6428eabb194ee5c17c1b763c27108a2238eaf72fadb275643e5` (5,433,794 bytes; PDF 324 pages). The official Pushkin House archival record `Ф. 244, оп. 12, ед. хр. 6` remains the preferred manuscript object-provenance candidate and is `source-verified`, but its digital copy requires an institutional request that remains `not-submitted`. The previous weak autograph mirror remains `blocked` as a deliberate negative control.

## Current source authority

- [`REFERENCE_BIBLE.md`](REFERENCE_BIBLE.md), [`SPATIAL_BRIEF.md`](SPATIAL_BRIEF.md), [`reference-bible.json`](reference-bible.json) — completed reference/metric evidence;
- [`greybox-tooling.json`](greybox-tooling.json), [`greybox-layouts.json`](greybox-layouts.json), [`greybox-candidates.json`](greybox-candidates.json), [`greybox-decision.json`](greybox-decision.json) — frozen topology evidence and decision;
- [`camera-rigs.json`](camera-rigs.json), [`camera-decision.json`](camera-decision.json), [`camera-gate-promotion.json`](camera-gate-promotion.json) — immutable camera evidence, R1 decision and promotion;
- [`material-spike.json`](material-spike.json) — accepted material/light/export candidate and visual-evidence contract;
- [`material-decision.json`](material-decision.json) — selected L0/UV0/export/material semantics and rejected current L1 bake;
- [`material-gate-promotion.json`](material-gate-promotion.json) — machine transition into `pushkinVerticalSlice` plus the bounded next-gate scope;
- [`pushkin-rights.json`](pushkin-rights.json) — fail-closed documentary object/reproduction/jurisdiction/use registry; non-`approved` records cannot ship;
- [`pushkin-slice.json`](pushkin-slice.json) — H3/R1/L0 one-exhibit source/offline contract, documentary role requirements, evidence contract and unset first-slice budgets;
- [`pushkin-acquisition.json`](pushkin-acquisition.json) — acquisition authority; distinguishes verified Commons source bytes, institutional copy required and do-not-acquire negative controls;
- `scripts/hall-pushkin/acquire-source-byte-evidence.mjs` — ephemeral source-byte probe; verifies exact Wikimedia host, file identity, dimensions/pages and SHA-256 and deletes temporary media;
- `.github/workflows/hall-pushkin-source-byte-evidence.yml` — exact-head source-byte revalidation; uploads only JSON evidence, never documentary media;
- `scripts/hall-greybox/generate-candidates.py`, `scripts/hall-camera/generate-camera-candidates.py`, `scripts/hall-material/*` — frozen reproducibility/evidence generators;
- `scripts/validate-hall-topology-selection-provenance.ts` — frozen shootout provenance;
- `scripts/validate-hall-material-transport.ts` — phase-independent raw/optimized/semantic/GPU transport guard;
- `scripts/validate-hall-post-material-authority.ts` — persistent current authority after Gate-4 promotion;
- `scripts/validate-hall-pushkin-rights.ts` — Pushkin rights/source semantic authority;
- `scripts/validate-hall-pushkin-rights-policy-schema.ts` — literal canonical `RIGHTS_REGISTER.md` record-shape and evidence-consistency guard;
- `scripts/validate-hall-pushkin-acquisition.ts` — exact byte-identity and external-dependency guard; requires evidence-backed hashes and forbids fabricated institutional approval/runtime paths before approval;
- `.github/workflows/hall-greybox-tooling.yml` — exact-head rights/schema/acquisition source barrier plus Blender/export/browser regeneration barrier.

Earlier camera/material phase-specific validators remain in the repository for forensic reproduction of their original gates. They are not current-phase authority after material promotion.

## Production boundary

- `/hall` remains a lightweight DOM placeholder.
- `src/components/hall/*` remains legacy evidence only.
- Three.js/R3F remains out of the dormant `/hall` dependency graph.
- H3 topology, R1 camera and selected L0/UV0 delivery may not drift inside the Pushkin lane without reopening the relevant earlier gate.
- No generated `.blend`, QA PNG/SVG evidence or GLB becomes production web authority merely by existing in Actions.
- Accepted 256px PNG proof maps remain evidence only, not production texture assets or encoding authority.
- The current L1 external-lightmap bake remains rejected and may not be silently reused as approved.
- No `candidate`, `source-verified`, `rights-pending` or `blocked` documentary record is eligible for a production Hall manifest; only independently `approved` records may enter it.
- A remote original URL, Commons file page, PDF preview, reported size, MIME or metadata checksum is **not** the source-byte identity. A `sourceFileHash` is valid only after actual bytes were acquired and hashed; two Commons records now satisfy that byte-level requirement while remaining rights-pending.
- Successful byte acquisition is not a reproduction licence or intended-use approval.
- Museum/catalogue object identity and rights in a particular digital reproduction remain separate evidence questions.
- An institutional copy request may be recorded as required, but an agent may not fabricate its submission, fulfilment, permission or approval.
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

### Current rights/acquisition state

Current production-approved documentary assets: **0**. Current exact documentary source-byte hashes: **2**.

- `pushkin-kiprensky-1827-portrait` — object provenance `source-verified`; exact Commons JPEG bytes verified at 10,862,180 bytes / 3455×4000 / `sha256:316d5f366a46f23cd0a181e570f2d09a6b0d12bc368dab18fdb394b8b8b8bf4b`; reproduction/use remains `rights-pending`; `runtimeAssetPath=null`.
- `pushkin-onegin-1833-edition` — object provenance `source-verified`; exact Commons PDF bytes verified at 5,433,794 bytes / 324 pages / `sha256:d629c10943cbf6428eabb194ee5c17c1b763c27108a2238eaf72fadb275643e5`; reproduction/use remains `rights-pending`; `runtimeAssetPath=null`.
- `pushkin-house-onegin-self-portrait-1824` — official Pushkin House object provenance `source-verified` at `Ф. 244, оп. 12, ед. хр. 6`; reproduction/use remains `rights-pending`; acquisition state is `institutional-copy-request-required`; request status is `not-submitted`; no file/hash/runtime path.
- `pushkin-onegin-autograph-weak-mirror` — remains `blocked` and `do-not-acquire-current-weak-source`; retained only as negative-control evidence.

`pushkin-slice.json` therefore keeps `productionManifestAllowed=false`, and `pushkin-acquisition.json` keeps `blenderExhibitMayConsumeDocumentaryMedia=false` and `productionWebglMayBegin=false`.

### Current bounded ordering

1. Independently revalidate the two recorded Commons hashes when their canonical byte identity changes or before relying on them as evidence; the exact-head byte workflow performs this automatically.
2. Resolve final credit and intended-use/reproduction rights independently from object provenance and byte identity.
3. For Pushkin House, a human/owner decides intended use and handles any required institutional copy request; the agent may preserve the blocker but may not fabricate submission or permission.
4. Promote only records satisfying the full canonical approval contract to `approved` and only then assign Hall runtime paths.
5. Only after approved documentary media exist may one complete Pushkin exhibit consume them in Blender/source authority.
6. Produce 8–12 fixed stills, close material crops, desktop/mobile framing and a 20–30 s offline camera sequence, including no-effects baseline and raw-vs-optimized comparison.
7. Calibrate first-slice transfer, decode, GPU-memory and frame-time budgets from the representative slice.
8. If the offline sequence is not compelling or hero provenance/rights remain unresolved, the slice does **not** advance to WebGL integration.

### Allowed in this gate

- independent source-byte revalidation against recorded SHA-256;
- final credit/intended-use disposition;
- explicit institutional copy-request dependency handling by a human/owner;
- promotion of only fully approved documentary records;
- one complete offline Pushkin exhibit after required media are approved;
- rights-cleared portrait/documentary media;
- near-final material authoring on UV0;
- final production texture encoding comparison;
- fixed still / offline camera evidence;
- raw-to-optimized Pushkin asset validation;
- first-slice performance budget calibration.

### Forbidden in this gate

- treating metadata checksum, reported file size or remote preview as acquired source bytes/hash;
- changing a recorded hash without actual-byte evidence;
- fabricating an archive request or permission;
- inferring digital-reproduction rights from object age, public visibility or catalogue presence;
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

`reference bible → metric greybox → topology decision → camera evidence → camera decision → camera gate promotion → material/light/export evidence → material delivery decision → material gate promotion → Pushkin rights/source authority → Pushkin exact source-byte verification → rights/credit disposition → Pushkin offline slice → offline visual approval → optimized runtime asset → web vertical slice → remaining exhibits → advanced modes`

Skipping a gate is a blocker, not an acceleration.

## Documents

- [`hall-v3-contract.json`](hall-v3-contract.json)
- [`pushkin-rights.json`](pushkin-rights.json)
- [`pushkin-slice.json`](pushkin-slice.json)
- [`pushkin-acquisition.json`](pushkin-acquisition.json)
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
