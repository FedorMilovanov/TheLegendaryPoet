# Hall v3 — staged production authority

`TLP-HALL-001` owns the rebuild of `/hall`.

This directory is the technical/art-production authority for Hall v3 while the lane is open. It does **not** make Hall v2 production authority, and it does not authorize a WebGL scene before the visual gates below are passed.

The current machine phase and gate state live in [`hall-v3-contract.json`](hall-v3-contract.json). Agents must update that contract explicitly when advancing a gate; prose alone cannot silently advance Hall production state.

## Current phase — metric greybox candidate authoring

Gate 0 / foundation and Gate 1 / Reference Bible are completed. Gate 2 / metric greybox is active. The Blender toolchain has already been proven on exact-head CI; the current bounded transaction authors and generates **all three** H1/H2/H3 neutral candidates under one equal-comparison system.

Current source authority for this phase:

- [`REFERENCE_BIBLE.md`](REFERENCE_BIBLE.md) — completed institutional/conservation evidence;
- [`SPATIAL_BRIEF.md`](SPATIAL_BRIEF.md) — metric/camera/evidence criteria inherited by every candidate;
- [`reference-bible.json`](reference-bible.json) — completed evidence and explicit non-decisions;
- [`greybox-tooling.json`](greybox-tooling.json) — reproducible Blender 4.5.12 runtime/smoke contract;
- [`greybox-candidates.json`](greybox-candidates.json) — equal-comparison state, no approved candidate or camera rig;
- [`greybox-layouts.json`](greybox-layouts.json) — auditable H1/H2/H3 metre-scale source layouts;
- `scripts/hall-greybox/generate-candidates.py` — one deterministic Blender generator for all three layouts;
- `scripts/validate-hall-greybox-candidates.ts` — static plus generated-evidence contract;
- `.github/workflows/hall-greybox-tooling.yml` — one checksum-verified Blender run that proves tooling and generates all three comparison packages.

The common 35 mm lens is provisional comparison instrumentation only. `approvedRig` and `approvedCandidate` remain `null`.

## Current production boundary

- `/hall` remains a lightweight DOM placeholder.
- `src/components/hall/*` is legacy implementation evidence only.
- Three.js/R3F remains out of the dormant `/hall` dependency graph.
- No generated `.blend`, PNG/SVG comparison evidence or runtime GLB is committed as production web authority in this transaction.
- Candidate scenes contain proxy geometry only; no rights-uncleared documentary image becomes a source asset.
- No Hall v2 FPS, hover-whisper, dust, mirror-floor or post-processing behavior is a required Hall v3 feature.

## Authority layers

1. **Reference/evidence bible** — visual language, exclusions, spatial brief and comparison criteria.
2. **Greybox source specification** — metre-scale H1/H2/H3 layout data and deterministic Blender generator.
3. **Generated Blender evidence** — Actions artifacts used to inspect geometry, cameras, route metrics and mobile framing; not yet production asset authority.
4. **Later approved Blender scene** — only after a candidate decision and camera gate.
5. **Asset/runtime manifest** — later GLB/KTX2 files, hashes, exhibit bindings and budgets.
6. **Canonical poet library + rights register** — content/provenance remain outside Blender.
7. **Web runtime** — later loading, approved camera, accessible DOM, quality tiers, reduced motion and fallback.

A lower layer must not silently repair a higher-layer defect. React does not fix architecture. Post-processing does not fix materials. AI does not approve its own output.

## Mandatory production order

`reference bible → metric greybox → candidate decision → camera approval → material/lighting/export spike → Pushkin vertical slice → offline visual approval → optimized runtime asset → web vertical slice → remaining exhibits → advanced modes`

Skipping a gate is a blocker, not an acceleration.

## Gate 0 — foundation — completed

Foundation permanently guards Hall-v3 authority, the lightweight `/hall` shell, legacy isolation, Three/R3F isolation and stale public-concept exclusion.

## Gate 1 — references and spatial brief — completed

Reference Bible owns institutional `TAKE / AVOID / WHY / SOURCE` evidence, real-metre accessibility witnesses, H1/H2/H3 hypotheses, equal camera/mobile output requirements, automatic rejection rules, Pushkin proxy grammar and data-authority boundaries. It approved no dome, rotunda, wing count, topology or camera rig.

## Gate 2 — Blender metric greybox — active

### Tooling proof — completed

Exact-head CI already proved:

- Blender `4.5.12` from the official `4.5 LTS` release archive;
- vendor SHA-256 verification;
- headless execution with embedded auto-exec disabled and Python failures mapped to a failing process;
- `1 Blender unit = 1 metre`;
- stable scene naming, a 1.75 m proxy and `.blend` save/reopen;
- zero lookdev materials/lights and no render requirement in the tooling smoke scene.

### Current sub-wave — H1/H2/H3 neutral candidate authoring

All candidates are generated by the same Blender source code and must receive equal evidence quality:

- H1 — orientation court + chronological branches;
- H2 — directed chronological promenade + focus bays;
- H3 — asymmetric diagonal/curved trajectory + side focus rooms.

Common rules:

- metres from first blockout;
- one 1.75 m human proxy;
- provisional common 35 mm test lens and 1.65 m eye height;
- neutral Blender Workbench evidence only, with zero scene materials/lights;
- inherited 0.915 m one-way, 1.525 m stopping/two-way, 0.76×1.22 m viewing and 2.03 m headroom witnesses;
- one Pushkin proxy anchor + two documentary-case proxies + clear viewing pocket;
- six desktop witnesses: entry/reveal, orientation, first transition, Pushkin approach, Pushkin viewing, reverse/exit;
- three equivalent 9:16 mobile witnesses;
- dimensioned plan, two sections, sightline diagram, route length and forced-turn count;
- generated files carry SHA-256 and remain Actions artifacts.

The generated runtime validator rejects blocked sightlines, route probes below 0.915 m, missing stopping-friendly route evidence, obstructed Pushkin viewing clearance, missing comparison outputs, unequal lens/resolution, non-metric scenes or lookdev contamination.

This transaction **does not choose a winner**. If one candidate fails, repair/reject evidence is recorded; H1/H2/H3 are compared only after all surviving packages are genuinely inspectable.

## Gate 3 — material / lighting / export spike — blocked

A later small architectural bay must prove PBR colour spaces, UV strategy, static-light delivery, raw→optimized asset validation and browser viability. Do not bake or texture the full museum before that decision.

## Gate 4 — Pushkin vertical slice — blocked

A finished slice eventually contains part of the approved spatial system, one transition and one complete Pushkin exhibit with rights-cleared documentary material. It must pass `VISUAL_ACCEPTANCE.md` before scale-out.

## Gate 5 — web vertical slice — blocked

Only after offline visual approval may the web runtime load approved optimized assets, use an approved guided camera, retain authoritative accessible DOM, support reduced motion/fallback and prove resource cleanup.

FPS/free-walk, poet-connection mode, timeline animation and ambient audio remain later optional features.

## Documents

- [`hall-v3-contract.json`](hall-v3-contract.json)
- [`REFERENCE_BIBLE.md`](REFERENCE_BIBLE.md)
- [`SPATIAL_BRIEF.md`](SPATIAL_BRIEF.md)
- [`reference-bible.json`](reference-bible.json)
- [`greybox-tooling.json`](greybox-tooling.json)
- [`greybox-candidates.json`](greybox-candidates.json)
- [`greybox-layouts.json`](greybox-layouts.json)
- [`ART_DIRECTION.md`](ART_DIRECTION.md)
- [`SCENE_CONTRACT.md`](SCENE_CONTRACT.md)
- [`ASSET_PIPELINE.md`](ASSET_PIPELINE.md)
- [`VISUAL_ACCEPTANCE.md`](VISUAL_ACCEPTANCE.md)
- [`AI_USAGE_POLICY.md`](AI_USAGE_POLICY.md)
- [`PERFORMANCE_BUDGET.md`](PERFORMANCE_BUDGET.md)
- [`RIGHTS_REGISTER.md`](RIGHTS_REGISTER.md)
- [`LEGACY_RETIREMENT.md`](LEGACY_RETIREMENT.md)

## Closure

Candidate authoring does not close `TLP-HALL-001` and does not complete Gate 2 by itself. Gate 2 needs comparable generated H1/H2/H3 evidence and a separate explicit select/reject decision. The lane closes only after the approved Hall is implemented, delivery/fallback contracts are certified, production `/hall` safely replaces the placeholder and resulting exact-head evidence is recorded in AuditRepo.
