# Hall v3 foundation contract

Status: active architecture lane `TLP-HALL-001` / Product #369.  
Scope of this document: governance and production gates only. It does **not** approve a final museum design and does not authorize a new WebGL scene.

## 1. Current production boundary

`/hall` must remain a lightweight ordinary page until a separately approved Hall v3 runtime exists.

The retired prototype under `src/components/hall/` is **legacy implementation evidence**. Its rotunda, rail camera, FPS/free-walk controls, pointer lock, whisper audio, dust particles, lighting and interaction choices are not Hall v3 product requirements. No production page or route module may import that directory while this foundation state is active.

Do not cosmetically repair Hall v2. Reuse an old technical idea only after it independently survives the current Hall v3 design/runtime gate.

## 2. Source authority

Every visual decision begins outside React/WebGL with an annotated reference set.

A reference entry must record:

- stable reference id;
- subject and intended design function;
- creator / institution / repository when known;
- source or object URL;
- date or honest date range;
- rights/reuse state;
- whether it is architecture reference, material reference, documentary exhibit candidate, editorial reconstruction reference, or mood-only inspiration;
- exact limitation: what the reference does **not** prove.

Mood boards and generated concept images can propose direction but never become historical evidence. A photograph of one building cannot silently become the claim that the final Hall reproduces that building.

The first visual authority is an owner-approved annotated reference set. The second is an owner-approved metric Blender greybox. JSX geometry is never the architecture authority.

## 3. Asset identity and provenance

Every production-bound 3D or image asset must have a stable id before optimization.

Recommended id form:

`hall-v3:<phase-or-zone>:<asset-name>`

For every accepted asset preserve a ledger with:

- stable asset id;
- source file name and source location;
- authoring application/version when relevant;
- source SHA-256;
- exported GLB/image SHA-256;
- optimized production SHA-256;
- creator and rights decision;
- transformation history (crop, restoration, retopology, bake, texture conversion, AI-assisted operation);
- approved narrative/visual role.

Renaming a file does not create new provenance. A downloaded archive image or Drive file is not publication-safe merely because it exists in the workspace.

## 4. Metric greybox gate

The next geometry step is `METRIC_GREYBOX`, produced in Blender or another owner-approved DCC, not JSX.

Before detailed modeling, the greybox must establish and record:

- metric scale and human reference;
- entrance, primary circulation and exit logic;
- ceiling/room proportions;
- exhibit viewing distances;
- collision/navigation assumptions;
- camera start position and controlled viewing path candidates;
- plausible mobile/desktop framing;
- zones only when they have an approved narrative function.

No number of wings, rotunda, dome, monument, staircase or historical period zoning is production truth before this gate is manually approved.

## 5. Camera gate

Camera direction is approved from the metric greybox before high-detail assets.

The camera sheet must record:

- start pose;
- FOV and near/far planes;
- primary authored viewpoints;
- mobile framing constraints;
- whether movement is guided, bounded-orbit, rail-based or another approved model;
- accessibility alternative when spatial movement is unavailable or reduced motion is requested.

FPS/free-walk and pointer lock are **not defaults**. They require a later explicit product decision supported by usability evidence.

## 6. Materials, UVs and color space

Hall v3 uses physically coherent materials first; post-processing cannot rescue unfinished assets.

Authoring/export rules:

- real-world scale is retained through export;
- transforms are intentionally applied and nonuniform negative scale is eliminated before final export;
- `UV0` is the canonical material UV set;
- `UV1` is reserved when a later lightmap/baked-lighting workflow explicitly needs it;
- base-color and emissive color textures are treated as sRGB;
- normal, roughness, metallic, occlusion and data textures are treated as linear/non-color data;
- ORM channel packing, if used, must be documented and identical before/after optimization;
- normal-map tangent convention must remain consistent across Blender/export/runtime;
- texture tiling density and texel density are reviewed in the approved camera views, not only in a texture inspector;
- no runtime-generated UV repair is accepted as production cleanup.

Material identity should survive export with stable material names so an optimized GLB can be compared against the approved source.

## 7. Lighting contract

Lighting is approved in a dedicated material/lighting spike after greybox approval.

The spike must prove:

- readable faces/exhibits without crushed shadows;
- sufficient contrast for navigation and text overlays;
- stable appearance in the approved camera views;
- explicit decision between baked, environment, direct and mixed lighting;
- no dependence on runtime Bloom, SSAO or excessive post-processing to hide weak geometry/materials;
- a reduced-effects path if later runtime effects materially affect accessibility or performance.

No production lighting style is declared by the current placeholder.

## 8. Rights, historical objects and AI

Every archive photograph, manuscript, book cover, sculpture reference, texture scan, HDRI, font, 3D model and audio object needs a reuse decision appropriate to its actual production use.

Required states are at least:

- `APPROVED-PRODUCTION`;
- `LINK-ONLY`;
- `RESEARCH-ONLY`;
- `HOLD`;
- `REJECTED`.

`located`, `downloaded`, `publicly visible`, `in Google Drive`, `old manifest approved` and `public-domain underlying work` are not interchangeable with permission to redistribute a particular scan/model.

AI-generated or AI-assisted material must be recorded in the asset ledger. It may serve as concept/reference or an explicitly labelled editorial reconstruction; it may not masquerade as an archival object, autograph, museum artifact or documentary photograph.

No fake manuscript text, fake signatures, fake inscriptions or invented historical objects are allowed.

## 9. Export and optimizer preservation

The owner-approved DCC source is the visual source of truth. Web optimization is a delivery transform.

Before an optimized asset can replace its approved source export, record both hashes and prove that optimization preserves:

- stable node names / asset ids used by runtime selection;
- scene hierarchy required by interaction;
- material assignments;
- UV sets;
- vertex colors/extras intentionally used by runtime;
- animation names and ranges if later introduced;
- camera/object anchors intentionally exposed to runtime;
- bounds and orientation within an agreed tolerance.

GLB optimization may use mesh/geometry compression only after this equivalence check exists. KTX2 texture delivery may be introduced only with explicit color-space and channel-semantic verification.

Never lower visual/source fidelity in the Blender master merely to match a web optimizer limitation; narrow the runtime asset instead.

## 10. Performance contract

The foundation wave keeps the existing `/hall` route budget unchanged at **8,000 bytes** and forbids Three.js/R3F from that route.

Before any future WebGL vertical slice merges, measure first and register a separate owner-approved budget for:

- route JS;
- initial GLB bytes;
- initial texture bytes;
- total first-view transfer;
- peak texture/GPU memory estimate;
- draw calls and triangle counts in approved views;
- long-task/frame-time behavior on the project browser/device matrix;
- lazy loading of non-first-view exhibits.

Do not raise the existing application or route budgets merely because a first 3D export is too large. Optimize/narrow the slice, or explicitly reopen the architecture decision.

## 11. Pushkin vertical slice

After reference, metric-greybox, camera and material/lighting gates, the first production-quality exhibit is a bounded `PUSHKIN_VERTICAL_SLICE`.

The slice exists to validate the whole pipeline, not to imply the rest of the museum is complete. It should include only enough architecture, material, lighting and one rights-cleared Pushkin exhibit to test:

- visual scale;
- camera/viewing behavior;
- documentary truthfulness;
- caption/source treatment;
- optimized GLB/KTX2 delivery;
- responsive framing;
- reduced-motion/non-WebGL fallback;
- performance in the real application shell.

Do not build all poets/eras before this slice passes.

## 12. Offline visual acceptance

Before a WebGL implementation becomes the product authority, owner review is performed on deterministic offline renders from the approved DCC source.

Minimum review set:

- entrance / first view;
- primary exhibit view;
- transition/circulation view;
- desktop wide framing;
- narrow/mobile framing proxy;
- neutral/reduced-effects lighting reference where relevant.

Review records exact source SHA/revision and approved/rejected comments. A new export after material geometry/camera changes requires a new visual review; old screenshots cannot bless new bytes.

## 13. Minimal web runtime gate

Only after the offline `PUSHKIN_VERTICAL_SLICE` is approved may a minimal Hall v3 web runtime be proposed.

That runtime must:

- consume exported assets rather than remodel architecture in JSX;
- keep route loading lazy;
- preserve ordinary navigation/focus ownership;
- provide a useful fallback when WebGL, motion or audio is unavailable;
- introduce interaction only when it serves the approved slice;
- avoid FPS/free-walk, whisper audio and effect stacks unless separately justified;
- pass route/build/browser budgets on one exact head.

The legacy `src/components/hall/*` code remains evidence only until any individual concept is deliberately reaccepted under this contract.

## 14. Production order

Canonical order for Hall v3:

1. `ANNOTATED_REFERENCES`;
2. `METRIC_GREYBOX`;
3. `CAMERA_APPROVAL`;
4. `MATERIAL_LIGHTING_EXPORT_SPIKE`;
5. `PUSHKIN_VERTICAL_SLICE`;
6. `OFFLINE_VISUAL_APPROVAL`;
7. `OPTIMIZED_GLB_KTX2` equivalence and delivery proof;
8. `MINIMAL_WEB_RUNTIME`;
9. remaining exhibits/zones only after the vertical slice proves the pipeline.

Skipping a gate requires an explicit owner decision recorded with the reason. Completing this foundation document does not mean Hall v3 itself is complete.
