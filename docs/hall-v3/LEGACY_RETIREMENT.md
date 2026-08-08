# Hall v3 — Hall v2 legacy retirement map

## Status

`src/components/hall/*` is retained temporarily as forensic/technical evidence from Hall v2. It is **not** current visual authority, is not imported by production `/hall`, and is excluded from the current TypeScript contract while retained.

That exclusion is deliberate: dormant implementation evidence must not constrain current typecheck/dependency evolution merely because it still lives under `src`. The Hall foundation validator also prevents current production source from importing the excluded directory.

Do not repair Hall v2 cosmetically. Any reusable idea must be extracted into a v3 owner only after independent current verification.

## Keep as knowledge, not product requirements

The following lessons remain useful:

- R3F router context does not cross the Canvas reconciler boundary automatically;
- route-level lazy loading must keep Three.js out of the normal Hall shell;
- frame-loop allocations should be avoided;
- overlays must own input while open;
- audio/resource cleanup needs explicit ownership;
- adaptive quality/fallback must be planned;
- WebGL/DOM transitions need deliberate bridging rather than assumed shared layout state.

These lessons may be reimplemented in v3 when the approved runtime actually needs them.

## Explicitly retired as baseline requirements

- long straight nave geometry;
- JSX-authored museum architecture;
- `POET_ORDER` as physical-space authority;
- deriving poet identity from portrait filename basenames;
- generic `PoetNiche` gold-frame layout;
- fake/autotyped “autographs”;
- hover-triggered whisper audio;
- FPS/pointer-lock/WASD baseline;
- `F`/`M` Hall shortcut contract;
- rail-dolly camera tied to the old nave coordinates;
- rotating dust as mandatory atmosphere;
- mirror-like black floor;
- cyan architectural glow as museum language;
- old N8AO/Bloom/Vignette look as required grading;
- `Preload all` full-scene strategy.

## Validator and typecheck retirement

`scripts/validate-hall-audio-runtime.ts` is a Hall-v2 validator. It must not run inside the mandatory current `validate:interaction-runtime` chain once `scripts/validate-hall-foundation.ts` protects the dormant-route/legacy-isolation boundary.

Likewise, the retained Hall-v2 source directory must remain excluded from `tsconfig.json` while it is legacy evidence. A future approved Hall-v3 runtime gets its own current source/type contract; it does not reactivate Hall v2 by removing this exclusion.

The old validator/source may remain temporarily for forensic reference, but green output from them is not Hall-v3 evidence.

## Code deletion timing

Do not delete all legacy Hall files merely to make the tree look clean before v3 proves replacements.

Delete or archive Hall-v2 implementation code when all of the following are true:

1. the Pushkin web vertical slice has re-proved every genuinely reusable runtime lesson;
2. no current source imports Hall-v2 modules;
3. no current validator/document relies on executable Hall-v2 code;
4. useful historical research/reference notes have been moved to durable docs/evidence;
5. exact current branch/repo inventory confirms deletion cannot remove unique approved assets.

At that point, remove legacy code in one bounded retirement wave rather than letting dead executable code remain indefinitely.

## Migration rule

Do not copy old modules wholesale into `hall-v3`. Extraction means rebuilding the smallest needed mechanism against the new scene/asset contract.

Examples:

- reuse the lesson “pause camera control under overlay”, not the old rail controller;
- reuse the lesson “one shared audio owner”, not hover whispers;
- reuse adaptive-DPR measurements if still relevant, not the old visual stack;
- reuse poet canonical IDs, not `shortKeyFromPhoto`.
