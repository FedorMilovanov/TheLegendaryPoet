# Hall v3 — visual acceptance

Technical correctness never substitutes for visual approval.

## Approval roles

- Automated checks may reject objective failures.
- AI may compare renders and surface likely regressions.
- Final art-direction approval remains human/owner approval.

No agent may certify its own generated scene merely because CI is green.

## Greybox acceptance

Before materials:

- entrance frame reads clearly;
- central/reveal composition has a deliberate focal hierarchy;
- circulation direction is understandable without HUD instructions;
- gallery transition is legible;
- one poet-exhibit approach works at human scale;
- no important target is consistently occluded by columns/portals;
- desktop and portrait-mobile framing both have viable compositions.

Required outputs include plan, section and a fixed set of rendered cameras.

If greybox is not convincing, do not add material detail to hide the problem.

## Material acceptance

One material lab/spike must prove:

- stone does not read as metal/plastic;
- roughness variation survives neutral light;
- bevels/normals read naturally at close and medium distance;
- brass/bronze remains secondary;
- texture scale is physically plausible;
- data-map color spaces are correct;
- there is no visible UV stretch/seam failure in certified shots.

## Lighting acceptance

The selected lighting strategy must retain the approved architecture without relying on decorative rescue.

Produce a baseline capture with:

- bloom off;
- vignette off;
- screen-space AO off;
- particles off;
- fake volumetric/god-ray meshes off.

The baseline must still read as a coherent premium museum.

## Pushkin vertical-slice acceptance

The first finished slice must include:

- part of the central architecture;
- a transition/portal into the exhibit context;
- one complete Pushkin exhibit;
- rights-cleared portrait/documentary material;
- final or near-final materials;
- selected lighting delivery;
- certified cameras;
- optimized runtime candidate.

Required evidence:

1. 8–12 fixed stills from approved views;
2. close material crop(s);
3. desktop and mobile framing;
4. 20–30 second offline camera sequence;
5. no-effects baseline;
6. raw-vs-optimized comparison.

If the offline sequence is not compelling, WebGL integration does not begin.

## Web vertical-slice acceptance

Browser output is compared to approved source renders for:

- composition/FOV drift;
- exposure/tone response;
- missing textures/lightmaps;
- incorrect color space;
- roughness/metalness drift;
- clipping or z-fighting;
- broken node/camera identity;
- DOM overlays covering protected visual areas.

Pixel identity between Cycles/Eevee and WebGL is not required; preservation of the approved visual hierarchy is.

## Motion acceptance

- primary motion is camera direction between approved compositions;
- animation must not be used to distract from weak static frames;
- reduced-motion mode must have a complete alternative navigation path using cuts/crossfades or direct destinations;
- uncontrolled free-look is not required for launch.

## Mobile acceptance

Mobile is art-directed separately, not treated as scaled desktop.

A weak device may receive a simplified scene or high-quality 2.5D fallback. A stable intentional fallback is preferable to low-frame-rate 3D.

## Automatic rejection conditions

Reject the visual candidate if any of the following is true:

- architecture is still being fixed in React/Three code;
- material realism depends on extreme metalness/mirror values for stone;
- fake historical objects are present;
- the scene only looks acceptable with bloom/fog/particles;
- camera can expose unfinished backsides in the baseline journey;
- mobile relies on the desktop composition without separate review;
- optimizer output changes the approved look materially;
- rights/provenance for a documentary hero asset is unresolved.
