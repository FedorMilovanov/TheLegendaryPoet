# Hall v3 — AI usage policy

AI is a production assistant, not the visual authority for Hall v3.

## AI may

- search, cluster and annotate reference candidates;
- propose alternate spatial briefs for human review;
- generate temporary concept art clearly labelled as concept art;
- generate Blender/Python scripts for deterministic repetitive operations;
- help create blockout candidates;
- propose naming/collection cleanup;
- inspect screenshots/renders for likely regressions;
- assist with mesh statistics, topology diagnostics and export reports;
- generate temporary secondary-asset candidates that subsequently pass human cleanup and the normal asset pipeline;
- help write validators and compare pre/post optimization contracts.

## AI may not be the final authority for

- architectural proportions;
- certified camera composition;
- historical portrait likeness in a hero 3D sculpture;
- topology quality;
- UV quality;
- physical material values;
- rights/provenance;
- historical document authenticity;
- final visual acceptance.

## Forbidden shortcuts

- one-shot text/image-to-3D output committed as final architecture;
- AI-generated signatures, manuscripts, facsimiles or archival objects shown as genuine evidence;
- using an AI render as proof that the hidden/back geometry is correct;
- accepting a mesh because its front view looks good while other views/topology were not inspected;
- adding runtime bloom/fog/glow because an AI-generated asset does not survive neutral lighting;
- allowing an agent to change approved Blender architecture in React for implementation convenience;
- allowing an agent to certify its own generated visual output.

## AI-generated mesh intake

Any generated mesh is `candidate/raw` until it passes:

1. multi-view inspection;
2. dimensions/scale check;
3. non-manifold/topology inspection;
4. shading/normals check;
5. retopology/remesh decision;
6. UV/material rebuild as needed;
7. source/licence check;
8. export/optimizer validation;
9. human visual acceptance.

For hero historical likenesses, absence of a trustworthy source asset is preferable to a weak generated sculpture.

## Scripted Blender changes

AI-authored Blender scripts are allowed when the desired state is already specified. The script must be deterministic enough to review and rerun; it must not silently decide art direction.

Good examples:

- create named export collections;
- rename selected nodes to an approved table;
- generate LOD helpers from approved settings;
- check transforms/UV presence;
- batch export approved collections.

Bad examples:

- “make the rotunda more beautiful” by procedurally changing proportions;
- random ornament generation in the final source scene;
- automatically moving certified cameras to improve a score produced by the same agent.

## Verification principle

Every AI-assisted transformation needs an independent verifier appropriate to its risk:

- source diff / scene report;
- fixed camera render;
- mesh statistics;
- glTF validator;
- contract snapshot;
- rights record;
- human visual approval.

The more subjective the result, the less meaningful self-verification by the generating model becomes.
