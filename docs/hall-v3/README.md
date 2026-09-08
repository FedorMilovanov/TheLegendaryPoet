# Hall v3 — staged production authority

This directory is the permanent technical and art-production authority for Hall v3. The historical architecture root remains `TLP-HALL-001` / Product #369; later bounded transactions advance concrete gates without reopening that root.

## Current machine stage — owner-directed web vertical slice

The current machine contract is [`hall-v3-contract.json`](hall-v3-contract.json) with `phase=webVerticalSlice`.

- `foundation`: completed;
- `referenceBible`: completed;
- `metricGreybox`: completed;
- `cameraApproval`: completed;
- `materialLightingExportSpike`: completed;
- `pushkinVerticalSlice`: completed;
- `offlineVisualApproval`: blocked for documentary-media approval;
- `webVerticalSlice`: active;
- `fullMuseumScaleOut`: blocked.

The transition is owner-directed by [`web-vertical-slice-owner-direction.json`](web-vertical-slice-owner-direction.json), Product #465. It relies on the independently certified isolated browser proof from Product #463 / merge `060103d081485074bbf59e1bf16a2bae1a5d6e29`.

## Frozen authority

The production web slice keeps the previously frozen authority:

- **H3** selected topology, layout fingerprint `5d5d0ddd8b150aa64afb73a2a3d9e00c6005e99fc935a6d4707a49ecd475fe65`;
- **R1** guided camera; no FPS/free-walk;
- **L0 minimal runtime lighting**;
- **UV0** surface mapping;
- legacy Hall v2 remains non-authoritative;
- the rejected L1 bake is not promoted.

Any later change to H3/R1/L0/UV0 requires a new bounded authority transaction.

## Production `/hall`

The production route is no longer a text-only placeholder. It now owns a bounded Hall v3 web vertical slice:

- route-level lazy `HallPage`;
- secondary dynamic `three` import only after `/hall` mounts;
- geometry derived from canonical `greybox-layouts.json`;
- camera derived from `camera-decision.json`;
- L0/UV0 authority derived from `material-decision.json`;
- guided camera stops only;
- deterministic reduced-motion cuts;
- semantic fallback when WebGL is unavailable or the WebGL context is lost;
- neutral, clearly non-facsimile exhibit proxies while documentary production media remain unresolved;
- no full-museum preload.

The isolated proof contract remains in [`web-runtime-proof.json`](web-runtime-proof.json); it is evidence for the runtime architecture, not permission to ship documentary source bytes.

## Documentary and rights boundary

The web slice deliberately separates **runtime activation** from **documentary-media approval**.

- rights-pending portrait, publication and manuscript bytes do not enter the production runtime;
- byte availability is not permission;
- AI-generated historical facsimiles, autographs or manuscripts remain forbidden;
- neutral geometric proxies may occupy the approved exhibit positions without claiming to be historical objects;
- documentary rights/credits and documentary `offlineVisualApproval` remain separate later decisions;
- the optional Pushkin House candidate remains deferred unless an actually reusable source becomes available.

Current documentary source and provenance authority remains in `pushkin-rights.json`, `pushkin-acquisition.json`, `pushkin-rights-review.json` and `pushkin-owner-disposition.json`.

## Production acceptance contract

Product #465 must prove the production route itself, not merely the isolated harness:

- normal project typecheck/build/route budgets;
- exact-head Hall machine validator;
- Chromium production `/hall` WebGL success;
- Android and WebKit/iPhone route acceptance;
- guided navigation behavior;
- reduced-motion behavior;
- forced/unavailable WebGL semantic fallback;
- real context-loss fallback where supported;
- no rights-pending documentary asset request;
- route-level chunk isolation so unrelated routes do not preload Three;
- exact-head merge certification and Manual Browser QA.

## What remains after the first production web slice

The Hall is not yet the full museum. Later bounded transactions may address:

1. documentary production rights, attribution and final derivatives;
2. independent visual approval of the documentary presentation;
3. production exhibit-media integration after those decisions;
4. additional poets/exhibits and full-museum scale-out;
5. broader performance budgets once the museum expands beyond the first H3 slice.

`fullMuseumScaleOut` remains blocked until its own measured transaction.

## Historical closure

Product #369 remains terminal as the architecture root. Product #403 completed the source-based Pushkin offline exhibit. Product #463 proved the H3/R1/L0/UV0 browser runtime in isolation. Product #465 is the first owner-directed transaction that activates the bounded web vertical slice on production `/hall` while preserving the documentary-rights boundary.
