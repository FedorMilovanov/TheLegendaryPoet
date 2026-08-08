# Hall v3 — Blender scene contract

## Source authority

The `.blend` scene is the visual/spatial source of truth for Hall architecture. Optimized GLB files are derived delivery artifacts and must never become the editing source.

Large source assets, high-resolution scans, EXRs, caches and working renders belong in controlled art storage, not in the Product Git history unless a separate owner decision explicitly approves them.

## Units and coordinate discipline

- Model in real-world metric scale.
- `1 Blender unit = 1 metre` for authored architecture.
- Apply/normalize transforms deliberately before export; negative/non-uniform scale must not survive accidentally on runtime-critical nodes.
- Human proxy geometry must exist during greybox so doors, plaques, portrait heights and circulation are judged against a person, not an empty render.

Exact camera eye height and FOV are art-direction decisions made during greybox and then frozen in the camera contract; they are not hard-coded here before visual proof.

## Collection naming

Use stable semantic collections, for example:

```text
COLL_CORE
COLL_GALLERY_<ID>
COLL_EXHIBITS_<ID>
COLL_LIGHTING
COLL_CAMERAS
COLL_EXPORT_HELPERS
```

Do not encode temporary visual guesses such as `FINAL_DOME_V7` into runtime contracts.

## Runtime node naming

Names consumed by the web runtime are APIs and must be stable:

```text
ARCH_<semantic-id>
EXHIBIT_<poet-id>
ANCHOR_<poet-id>
CAM_<sequence>_<semantic-id>
PORTAL_<semantic-id>
```

Poet IDs use the canonical Product IDs, e.g.:

```text
EXHIBIT_alexander-pushkin
ANCHOR_alexander-pushkin
```

Do not derive poet identity from image filenames, display names or array order.

## Custom properties / glTF extras

Blender custom properties may be exported to glTF `extras` only for small stable runtime metadata, for example:

```text
poetId = alexander-pushkin
interactive = true
zone = xix
```

Every property consumed by runtime must be listed in the asset manifest contract and tested after optimization. Optimizers are allowed to rewrite geometry; they are not allowed to silently destroy application identity.

## Cameras

Cameras are authored and approved in Blender.

Camera nodes use stable names such as:

```text
CAM_01_entrance
CAM_02_reveal
CAM_03_center
CAM_10_pushkin_approach
CAM_11_pushkin_view
```

The web layer may interpolate between approved cameras/anchors, but must not invent the primary composition from arbitrary React constants.

For every certified camera record:

- intended viewport class;
- lens/FOV;
- transform;
- near/far requirements;
- safe DOM-overlay areas;
- reduced-motion cut destination.

## Geometry ownership

Architecture belongs in Blender, not JSX primitives.

The following are source-scene concerns:

- walls and floors;
- portals;
- columns/pilasters;
- coffers/cornices/mouldings;
- exhibit frames/pedestals where they are architectural;
- collision/camera bounds where needed;
- UVs and bake surfaces.

React/Three may create temporary debug helpers but must not become the canonical modeller.

## Bevels, normals and topology

- Hero hard-surface edges need physically plausible bevels; razor-sharp CG edges are not accepted by default.
- Shading normals must be inspected under neutral lighting.
- Non-manifold geometry, accidental internal faces, extreme long-thin triangles and zero-area faces are export blockers for runtime-critical assets.
- AI-generated meshes are raw source candidates until topology and shading checks pass.

## UV contract

### UV0

Used for ordinary material textures:

- base color;
- normal;
- roughness;
- metallic when applicable.

### UV1

Reserved for an approved unique static-bake/lightmap strategy when the lighting spike selects one.

Do not assume a generic Blender lightmap automatically becomes a standard glTF material feature. The delivery strategy must be explicitly implemented and tested in the Hall asset layer.

## Color-space contract

- baseColor/emissive color textures: sRGB;
- normal, roughness, metallic, AO and other data textures: non-color / `NoColorSpace` in Three.js;
- HDR environment data follows the renderer/loader's documented linear workflow.

The legacy Hall helper that treated all maps as sRGB is not reusable authority.

## Repetition and instancing

Repeated geometry is **eligible** for instancing, not automatically instanced.

Choose between instancing and merged/static unique geometry based on the approved lighting/bake strategy. Do not preserve instancing if it forces a custom shader or destroys unique baked illumination.

## Chunk boundaries

Logical spatial zones should align with runtime loading/culling boundaries where practical:

- core/entry/central space;
- gallery zones;
- optional exhibit-detail assets.

One monolithic full-museum GLB is not the baseline design.

## Export preflight

Before export, automated or scripted checks should eventually prove at least:

- required node/camera names exist and are unique;
- canonical poet IDs are valid;
- scale is sane;
- UV sets required by the selected pipeline exist;
- missing textures are rejected;
- no unapproved source paths leak into runtime;
- export collections contain only intended nodes.

The final Blender preflight implementation is part of the post-foundation asset spike, not this documentation wave.
