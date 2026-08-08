# Hall v3 — runtime asset pipeline

## Principle

Source assets and delivery assets are different products.

```text
Blender source
→ source preflight
→ raw GLB
→ Khronos/glTF validation
→ contract snapshot
→ optimization/compression
→ validation again
→ contract snapshot again
→ visual comparison
→ budget report
→ runtime manifest
```

A smaller file is not a successful optimization if it changes identity, UVs, materials, camera data or the approved look.

## Canonical runtime format

Hall v3 targets glTF 2.0 / GLB for geometry and material delivery unless a later measured spike proves a different format is materially better.

No custom glTF extension is allowed merely to avoid designing a small explicit application-side binding contract.

## Required pre/post optimization contract

For each chunk, capture and compare at least:

- required named nodes;
- required camera nodes;
- canonical exhibit `poetId` extras;
- UV set counts on nodes that need them;
- material count and required semantic bindings;
- animation names if any are later approved;
- texture references;
- scene bounds/scale;
- triangle and draw-material statistics.

Optimization fails if a required contract item disappears.

## Optimizer preservation

Tools such as `gltfpack`/Meshopt are candidates, not authorities.

When application metadata is stored in node names or `extras`, the optimization command must preserve the required data (for example, options equivalent to preserving named nodes and extras). The exact command is pinned only after the export spike proves the selected tool/version.

Do not rely on undocumented optimizer defaults.

## Geometry compression

Meshopt is the first candidate because it integrates well with glTF/Three.js and can reduce geometry transfer/runtime cost. Draco may be compared on real Hall chunks if needed.

The winner is chosen from measured:

- transfer size;
- decode cost;
- browser/device support;
- visual/geometry fidelity;
- pipeline reliability.

## Texture delivery

KTX2/Basis is a candidate for GPU-friendly runtime delivery, especially for ordinary PBR textures. It is not a blanket rule for every image.

Evaluate separately:

- baseColor;
- normal;
- roughness/metalness/AO;
- baked illumination/lightmap;
- photographic portraits;
- archival documents.

Photographic/document assets may remain AVIF/WebP/JPEG where DOM/image delivery is superior to GPU texture residency.

Source textures remain lossless/high-quality in art storage; delivery compression is reversible by rebuilding from source, not by editing compressed output.

## Static lighting delivery

The lighting spike must choose one explicit strategy before museum scale-out.

Possible baseline candidates:

1. physically plausible PBR + environment/minimal realtime lights;
2. external baked lightmap bound by the Hall asset manifest to `MeshStandardMaterial.lightMap`/approved UV channel;
3. more aggressively baked static shell where the material/lighting trade-off is acceptable.

Do not assume Blender baking is automatically represented as a standard glTF lightmap.

If candidate 2 is chosen, the runtime manifest owns bindings explicitly, e.g. conceptually:

```json
{
  "node": "ARCH_rotunda_shell",
  "texture": "/hall/v3/light/core-rotunda.ktx2",
  "uvChannel": 1
}
```

The real schema is created after the spike, not invented prematurely.

## Chunking

Baseline delivery is progressive:

- lightweight `/hall` DOM shell first;
- core Hall chunk only after explicit entry;
- gallery chunk on intent/proximity;
- heavy exhibit detail on demand/prefetch window.

`Preload all` for the full museum is forbidden as a baseline strategy.

## Cache/version identity

Runtime assets must be content-addressable or tied to an explicit manifest revision/hash so stale HTML/runtime code cannot silently bind incompatible geometry metadata.

The final cache naming scheme is selected with the web vertical slice.

## Validation

The asset spike must eventually produce executable validators for:

- glTF validity;
- required names/extras preservation;
- canonical poet-ID mapping;
- texture/color-space contract;
- file/scene budgets;
- no unresolved rights-blocked exhibit assets;
- raw-vs-optimized visual sanity screenshots.

Documentation is not a substitute for those validators; it defines what they must prove.
