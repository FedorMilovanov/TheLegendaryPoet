# Hall v3 — staged production authority

`TLP-HALL-001` owns the rebuild of `/hall`.

This directory is the technical/art-production authority for Hall v3 while the lane is open. It does **not** make Hall v2 production authority, and it does not authorize a WebGL scene before the visual gates below are passed.

The current machine phase and gate state live in [`hall-v3-contract.json`](hall-v3-contract.json). Agents must update that contract explicitly when advancing a gate; prose alone cannot silently advance Hall production state.

## Current phase — metric greybox tooling/preflight

Gate 0 / foundation and Gate 1 / Reference Bible are completed. Gate 2 / metric greybox is active, but the current bounded transaction proves the modelling toolchain **before** H1/H2/H3 geometry is authored.

Current source authority for this phase:

- [`REFERENCE_BIBLE.md`](REFERENCE_BIBLE.md) — completed annotated institutional/conservation evidence;
- [`SPATIAL_BRIEF.md`](SPATIAL_BRIEF.md) — inherited metric/camera/evidence criteria for H1/H2/H3;
- [`reference-bible.json`](reference-bible.json) — completed machine-readable evidence and explicit non-decisions;
- [`greybox-tooling.json`](greybox-tooling.json) — exact reproducible Blender runtime and smoke-scene contract;
- [`greybox-candidates.json`](greybox-candidates.json) — equal-comparison manifest for H1/H2/H3, all currently `unbuilt` with no winner;
- `scripts/hall-greybox/blender-tooling-preflight.py` — headless metre-scale save/reopen smoke test;
- `.github/workflows/hall-greybox-tooling.yml` — checksum-verified Blender runtime witness.

The pinned Blender version is a reproducible tool for this active greybox phase, not permanent project doctrine. A later material/export gate may re-evaluate the tool pin with explicit evidence.

## Current production boundary

- `/hall` remains a lightweight DOM placeholder.
- `src/components/hall/*` is legacy implementation evidence only.
- No Hall v2 FPS, hover-whisper, dust, mirror-floor or post-processing behavior is a required Hall v3 feature.
- Three.js/R3F remains out of the dormant `/hall` dependency graph.
- No `.blend`, GLB, generated render or tooling smoke artifact is committed as production web authority in this tooling transaction.
- Early concept art stays off production `/hall`; dormant-route presentation must not masquerade as approved architecture.

## Authority layers

1. **Art/reference bible** — visual language, evidence, exclusions, metric spatial brief and comparison criteria.
2. **Blender source scene** — metric architecture, geometry, cameras and later UV/light source after candidate authoring begins.
3. **Asset manifest** — later runtime files, hashes, node IDs, exhibit bindings and budgets.
4. **Canonical poet library** — poet identity/content; Blender must not become a second CMS.
5. **Rights register** — provenance and publication permission for documentary exhibit assets.
6. **Web runtime** — later loading, approved camera direction, DOM overlays, quality tiers, reduced motion and fallback.

A lower layer must not silently repair a higher-layer defect. React does not fix architecture. Post-processing does not fix materials. AI does not approve its own output.

## Mandatory production order

`reference bible → metric greybox → camera approval → material/lighting/export spike → Pushkin vertical slice → offline visual approval → optimized runtime asset → web vertical slice → remaining exhibits → advanced modes`

Skipping a gate is a blocker, not an acceleration.

## Gate 0 — foundation — completed

Foundation permanently guards:

- Hall-v3 authority registration;
- Hall v2 as legacy/non-authoritative;
- dormant `/hall` isolation from Hall v2 and Three/R3F;
- retirement of obsolete Hall-v2 behavior as current architecture;
- stale public concept/temple/pantheon promise exclusion;
- the lightweight Hall shell budget.

## Gate 1 — references and spatial brief — completed

The Reference Bible now owns:

- institutional `TAKE / AVOID / WHY / SOURCE` evidence;
- H1/H2/H3 as comparison hypotheses, not approvals;
- real-metre accessibility/viewing witnesses;
- identical camera/mobile/evidence outputs for candidate comparison;
- automatic rejection rules before materials;
- object-first Pushkin exhibit grammar plus authoritative accessible DOM context;
- canonical-data versus legacy-visual-metadata boundaries.

No dome, rotunda, wing count, era topology or camera rig was approved by Gate 1.

## Gate 2 — Blender metric greybox — active

### Current sub-wave: tooling preflight

Before serious geometry, the repository proves that its DCC path is reproducible:

- Blender `4.5.12` from the official `4.5 LTS` release archive is pinned for this phase;
- the vendor checksum index is fetched and the Linux archive is verified with SHA-256;
- Blender runs headlessly with embedded auto-execution disabled and Python exceptions mapped to a failing exit code;
- one smoke scene proves `1 Blender unit = 1 metre`, stable collection/object naming, a common 1.75 m human proxy and `.blend` save/reopen round-trip;
- the smoke scene intentionally has no lookdev materials, lighting or render requirement;
- generated smoke `.blend` and JSON are CI evidence artifacts, not committed Product source assets.

This tooling proof does **not** choose a topology or camera.

### Candidate authoring after tooling proof

H1, H2 and H3 must then be authored as three materially different neutral greyboxes under the same rules:

- real-world scale and inherited clearance witnesses;
- same human proxy;
- same later-approved candidate lens/FOV set;
- dimensioned plan and at least two sections;
- entry/reveal, orientation, first transition, Pushkin approach/view, reverse/exit witnesses;
- at least three portrait-mobile crops;
- top-down sightline/occlusion diagram;
- route length, forced-turn count and visible-next-destination notes;
- no ornament, bloom, fog, particles, gold glow or decorative rescue.

All three start `unbuilt`. `approvedCandidate`, topology and camera rig remain `null` until comparable evidence exists.

If the entrance, reveal, circulation and Pushkin approach are weak in neutral grey, geometry returns to work.

## Gate 3 — material / lighting / export spike — blocked

One small architectural bay must later prove:

- PBR color-space rules;
- UV0/UV1 strategy;
- static-light delivery strategy;
- raw GLB → validation → optimization → validation round-trip;
- required node names/extras survive optimization;
- desktop/mobile browser behavior is viable.

Do not bake the full museum before this decision.

## Gate 4 — Pushkin vertical slice — blocked

One finished slice eventually contains part of the approved spatial system, one transition and one complete Pushkin exhibit with rights-cleared documentary material. It must pass `VISUAL_ACCEPTANCE.md` before scale-out.

## Gate 5 — web vertical slice — blocked

Only after offline visual approval:

- load approved optimized assets;
- use an approved guided camera path first;
- keep text/navigation in accessible DOM;
- support reduced motion and a non-WebGL/weak-device fallback;
- prove chunked loading and resource cleanup.

FPS/free-walk, poet-connection mode, timeline animation and ambient audio are later features, not baseline requirements.

## Documents

- [`hall-v3-contract.json`](hall-v3-contract.json)
- [`REFERENCE_BIBLE.md`](REFERENCE_BIBLE.md)
- [`SPATIAL_BRIEF.md`](SPATIAL_BRIEF.md)
- [`reference-bible.json`](reference-bible.json)
- [`greybox-tooling.json`](greybox-tooling.json)
- [`greybox-candidates.json`](greybox-candidates.json)
- [`ART_DIRECTION.md`](ART_DIRECTION.md)
- [`SCENE_CONTRACT.md`](SCENE_CONTRACT.md)
- [`ASSET_PIPELINE.md`](ASSET_PIPELINE.md)
- [`VISUAL_ACCEPTANCE.md`](VISUAL_ACCEPTANCE.md)
- [`AI_USAGE_POLICY.md`](AI_USAGE_POLICY.md)
- [`PERFORMANCE_BUDGET.md`](PERFORMANCE_BUDGET.md)
- [`RIGHTS_REGISTER.md`](RIGHTS_REGISTER.md)
- [`LEGACY_RETIREMENT.md`](LEGACY_RETIREMENT.md)

## Closure

This tooling/preflight wave does not close `TLP-HALL-001` and does not complete Gate 2. The lane closes only after the owner-approved Hall architecture is implemented, delivery/fallback contracts are certified, production `/hall` has replaced the placeholder safely and resulting exact-head evidence is recorded in AuditRepo.
