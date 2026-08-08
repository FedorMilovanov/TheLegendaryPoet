# Hall v3 — staged production authority

`TLP-HALL-001` owns the rebuild of `/hall`.

This directory is the technical/art-production authority for Hall v3 while the lane is open. It does **not** make the Hall v2 prototype production authority, and it does not authorize a new WebGL scene before the visual gates below are passed.

The current machine phase and gate state live in [`hall-v3-contract.json`](hall-v3-contract.json). Agents must update that contract explicitly when advancing a gate; prose alone cannot silently advance Hall production state.

## Current phase — Reference Bible

Gate 0 / foundation is completed. Gate 1 / Reference Bible is active.

Current source authority for this phase:

- [`REFERENCE_BIBLE.md`](REFERENCE_BIBLE.md) — annotated institutional/conservation references with `TAKE / AVOID / WHY / SOURCE`;
- [`SPATIAL_BRIEF.md`](SPATIAL_BRIEF.md) — common metric/camera/evidence criteria for the later H1/H2/H3 greybox shootout;
- [`reference-bible.json`](reference-bible.json) — machine-readable sources, metrics, hypotheses, rejection rules, data boundaries and explicit non-decisions.

`metricGreybox` and every later gate remain blocked. This phase does not authorize Blender geometry, GLB production assets, a WebGL runtime or a chosen museum topology.

## Current production boundary

- `/hall` remains a lightweight DOM placeholder.
- `src/components/hall/*` is legacy implementation evidence only.
- No Hall v2 FPS, hover-whisper, dust, mirror-floor or post-processing behavior is a required Hall v3 feature.
- Three.js/R3F must remain out of the `/hall` route chunk until the user explicitly enters an approved v3 experience.
- Early architectural concept art stays off the production `/hall` route until it has passed the reference/greybox/visual gates; dormant-route presentation must not masquerade as the approved Hall.

## Authority layers

1. **Art/reference bible** — visual language, evidence, exclusions, metric spatial brief and approved comparison criteria.
2. **Blender source scene** — later metric architecture, geometry, UVs, cameras, light/bake source and node naming.
3. **Asset manifest** — later runtime files, hashes, node IDs, exhibit bindings, optional lightmap bindings and budgets.
4. **Canonical poet library** — poet identity/content; Blender must not become a second CMS.
5. **Rights register** — provenance and publication permission for every documentary exhibit asset.
6. **Web runtime** — loading, camera direction, DOM overlays, quality tiers, reduced-motion behavior and fallback.

A lower layer must not silently repair a higher-layer defect. React does not fix architecture. Post-processing does not fix materials. AI does not approve its own output.

## Mandatory production order

`reference bible → metric greybox → camera approval → material/lighting/export spike → Pushkin vertical slice → offline visual approval → optimized runtime asset → web vertical slice → remaining exhibits → advanced modes`

Skipping a gate is a blocker, not an acceleration.

## Gate 0 — foundation — completed

Foundation proved and permanently guards:

- Hall-v3 authority is registered;
- Hall v2 is explicitly legacy/non-authoritative;
- production `/hall` cannot accidentally import Hall v2 or Three/R3F while dormant;
- obsolete Hall-v2 interaction behavior no longer defines current architecture;
- stale public concept art and temple/pantheon promises are blocked by validation;
- the route remains within its lightweight shell budget.

These invariants continue to run while later phases advance.

## Gate 1 — references and spatial brief — active

The current wave converts research into an annotated real-world evidence set grouped by design problem. Each useful reference records `TAKE / AVOID / WHY / SOURCE`; a machine contract rejects unannotated source drift and premature topology decisions.

The companion spatial brief defines:

- H1/H2/H3 as **comparison hypotheses, not approvals**;
- real-metre accessibility/viewing witnesses;
- identical camera/mobile/evidence outputs for every later greybox candidate;
- automatic rejection rules before materials;
- object-first Pushkin exhibit grammar plus authoritative accessible DOM context;
- a boundary between canonical poet data and legacy visual-concept metadata.

No final number of wings, dome form, exhibit topology or camera rig is promised in this phase.

### Gate 1 exit

Gate 1 may be marked completed only in a separate exact-head transaction after this evidence/brief package is merged and recorded. That next transaction may activate `metricGreybox`; the present wave must leave it blocked.

## Gate 2 — Blender greybox — blocked

When explicitly activated later:

- real-world scale;
- plan, section and elevations;
- fixed common camera candidates;
- neutral materials only;
- no bloom, fog, particles, gold glow or decorative rescue;
- at least three materially different spatial hypotheses compared under the same evidence package.

If the entrance, reveal, circulation and one exhibit approach are weak in grey, geometry returns to work.

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
- [`ART_DIRECTION.md`](ART_DIRECTION.md)
- [`SCENE_CONTRACT.md`](SCENE_CONTRACT.md)
- [`ASSET_PIPELINE.md`](ASSET_PIPELINE.md)
- [`VISUAL_ACCEPTANCE.md`](VISUAL_ACCEPTANCE.md)
- [`AI_USAGE_POLICY.md`](AI_USAGE_POLICY.md)
- [`PERFORMANCE_BUDGET.md`](PERFORMANCE_BUDGET.md)
- [`RIGHTS_REGISTER.md`](RIGHTS_REGISTER.md)
- [`LEGACY_RETIREMENT.md`](LEGACY_RETIREMENT.md)

## Closure

The Reference Bible wave does not close `TLP-HALL-001`. The lane closes only after the owner-approved Hall architecture is implemented, delivery/fallback contracts are certified, production `/hall` has replaced the placeholder safely and resulting exact-head evidence is recorded in AuditRepo.
