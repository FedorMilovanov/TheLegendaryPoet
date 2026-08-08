# Hall v3 — production foundation

`TLP-HALL-001` owns the rebuild of `/hall`.

This directory is the technical/art-production authority for Hall v3 while the lane is open. It does **not** make the current Hall v2 prototype production authority, and it does not authorize a new WebGL scene before the visual gates below are passed.

## Current production boundary

- `/hall` remains a lightweight DOM placeholder.
- `src/components/hall/*` is legacy implementation evidence only.
- No Hall v2 FPS, hover-whisper, dust, mirror-floor or post-processing behavior is a required Hall v3 feature.
- Three.js/R3F must remain out of the `/hall` route chunk until the user explicitly enters an approved v3 experience.
- Early architectural concept art stays off the production `/hall` route until it has passed the reference/greybox/visual gates; dormant-route presentation must not masquerade as the approved Hall.

## Authority layers

1. **Art/reference bible** — visual language, references, exclusions and approved shots.
2. **Blender source scene** — metric architecture, geometry, UVs, cameras, light/bake source and node naming.
3. **Asset manifest** — runtime files, hashes, node IDs, exhibit bindings, optional lightmap bindings and budgets.
4. **Canonical poet library** — poet identity/content; Blender must not become a second CMS.
5. **Rights register** — provenance and publication permission for every documentary exhibit asset.
6. **Web runtime** — loading, camera direction, DOM overlays, quality tiers, reduced-motion behavior and fallback.

A lower layer must not silently repair a higher-layer defect. React does not fix architecture. Post-processing does not fix materials. AI does not approve its own output.

## Mandatory production order

`reference bible → metric greybox → camera approval → material/lighting/export spike → Pushkin vertical slice → offline visual approval → optimized runtime asset → web vertical slice → remaining exhibits → advanced modes`

Skipping a gate is a blocker, not an acceleration.

## Gate 0 — foundation

Before new 3D code:

- this documentation set exists and is registered;
- Hall v2 is explicitly legacy;
- the route cannot accidentally import Hall v2;
- project checks no longer make obsolete Hall-v2 interaction behavior current architecture authority;
- `TLP-HALL-001` is registered in `docs/project-contract.json` and `docs/CURRENT_STATE.md`.

## Gate 1 — references and spatial brief

Produce a large annotated real-world reference set grouped by architecture, museum display, materials, lighting, signage, camera composition and mobile framing. Each useful reference records `TAKE / AVOID / WHY`; AI concept art may support ideation but cannot be the only spatial reference.

No final number of wings, dome form or exhibit layout is promised before this gate and the greybox gate are approved.

## Gate 2 — Blender greybox

- real-world scale;
- plan, section and elevations;
- fixed approved camera candidates;
- neutral materials only;
- no bloom, fog, particles, gold glow or decorative rescue.

If the entrance, reveal, circulation and one exhibit approach are weak in grey, geometry returns to work.

## Gate 3 — material / lighting / export spike

One small architectural bay proves:

- PBR color-space rules;
- UV0/UV1 strategy;
- static-light delivery strategy;
- raw GLB → validation → optimization → validation round-trip;
- required node names/extras survive optimization;
- desktop/mobile browser behavior is viable.

Do not bake the full museum before this decision.

## Gate 4 — Pushkin vertical slice

One finished slice contains part of the central space, one transition/portal and one complete Pushkin exhibit with rights-cleared documentary material. It must pass `VISUAL_ACCEPTANCE.md` before scale-out.

## Gate 5 — web vertical slice

Only after Gate 4:

- load approved optimized assets;
- use a guided camera path first;
- keep text/navigation in accessible DOM;
- support reduced motion and a non-WebGL/weak-device fallback;
- prove chunked loading and resource cleanup.

FPS/free-walk, poet-connection mode, timeline animation and ambient audio are later features, not baseline requirements.

## Documents

- [`ART_DIRECTION.md`](ART_DIRECTION.md)
- [`SCENE_CONTRACT.md`](SCENE_CONTRACT.md)
- [`ASSET_PIPELINE.md`](ASSET_PIPELINE.md)
- [`VISUAL_ACCEPTANCE.md`](VISUAL_ACCEPTANCE.md)
- [`AI_USAGE_POLICY.md`](AI_USAGE_POLICY.md)
- [`PERFORMANCE_BUDGET.md`](PERFORMANCE_BUDGET.md)
- [`RIGHTS_REGISTER.md`](RIGHTS_REGISTER.md)
- [`LEGACY_RETIREMENT.md`](LEGACY_RETIREMENT.md)

## Closure

The foundation wave does not close `TLP-HALL-001`. The lane closes only after the owner-approved Hall architecture is implemented, delivery/fallback contracts are certified, production `/hall` has replaced the placeholder safely and resulting exact-head evidence is recorded in AuditRepo.
