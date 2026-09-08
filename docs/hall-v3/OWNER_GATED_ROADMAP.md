# Hall v3 — bounded roadmap after browser proof

The historical architecture root `TLP-HALL-001` / Product #369 remains closed. Hall work advances only through later bounded transactions with explicit authority and exact-head evidence.

## Current state

Product #463 established an isolated H3/R1/L0/UV0 browser proof and merged as `060103d081485074bbf59e1bf16a2bae1a5d6e29`.

On 2026-09-08 the project owner explicitly directed Hall implementation to continue into a real production web slice. Product #465 owns that transition. The machine contract therefore advances to:

- foundation: completed;
- referenceBible: completed;
- metricGreybox: completed;
- cameraApproval: completed;
- materialLightingExportSpike: completed;
- pushkinVerticalSlice: completed;
- offlineVisualApproval: blocked for documentary-media approval;
- webVerticalSlice: active;
- fullMuseumScaleOut: blocked.

The owner direction is machine-recorded in `docs/hall-v3/web-vertical-slice-owner-direction.json`.

## Production web-slice authority

Product #465 may activate Three/WebGL on production `/hall` only within these bounds:

- H3 topology, R1 guided camera, L0 minimal runtime lighting and UV0 remain frozen;
- Hall v2 remains forensic/non-authoritative;
- Three is route-isolated and loaded only after `/hall` mounts;
- no FPS/free-walk;
- deterministic reduced-motion behavior;
- semantic fallback for unavailable/lost WebGL;
- neutral non-facsimile exhibit proxies are allowed;
- rights-pending documentary media are excluded from production requests and manifests;
- no full-museum preload or scale-out.

This owner direction authorizes the **technical web slice**, not documentary rights, documentary credits, or a claim that historical exhibit presentation is finally approved.

## Documentary boundary

Kiprensky, Onegin and any later manuscript/object source remain governed by their rights/provenance records. Source-byte availability is not permission. Public-domain age or catalogue availability is not by itself final production disposition. AI may not impersonate a historical facsimile, autograph, manuscript or museum object.

The production slice therefore uses neutral geometric stand-ins until a later documentary transaction independently proves and records its own source/rights/credit decision.

## Exact-head acceptance for Product #465

A mergeable production web slice requires all of the following on one exact PR head:

1. project contracts and typecheck;
2. production build and route budget;
3. Hall machine-contract validation;
4. production `/hall` Chromium WebGL witness;
5. Android and WebKit/iPhone route witness;
6. guided-camera navigation witness;
7. reduced-motion deterministic-cut witness;
8. semantic fallback witness for WebGL failure/context loss;
9. confirmation that no documentary media are fetched;
10. merge-certification on the same head;
11. zero review/thread debt and current-main race check.

Historical green from Product #463 is architecture evidence only and cannot replace Product #465 exact-head production-route evidence.

## Later sequence

After the first production web slice is accepted, later bounded transactions may proceed in this order where materially applicable:

`documentary rights/credit disposition → approved production derivatives → documentary presentation approval → integrate approved exhibit media → expand additional exhibits/poets → measured full-museum scale-out`

The sequence may be split into smaller independent transactions; it must not be collapsed into one unreviewable mega-PR.

## Permanent boundaries

Even after the first production web slice:

- legacy Hall v2 never regains authority;
- H3/R1/L0/UV0 cannot drift silently;
- rejected L1 cannot be silently promoted;
- rights-pending documentary bytes cannot ship;
- fake autographs/facsimiles remain forbidden;
- `fullMuseumScaleOut` does not self-promote from a successful first slice;
- production budgets must be measured from the actual browser/runtime surface being promoted.

## Closure interpretation

Product #369 remains closed as the architecture root. Product #463 is closed as the isolated browser proof. Product #465 is the bounded owner-directed production web-slice transaction. Future Hall work after #465 remains roadmap work owned by new concrete issues, not by reopening the historical root.
