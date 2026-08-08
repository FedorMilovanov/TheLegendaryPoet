# Hall v3 — art direction

## Intent

Hall v3 is a digital literary museum, not a game lobby, sci-fi gallery, theme park or decorative card wall.

The desired character is monumental but human-scaled: civic museum / literary pantheon, historically serious, quiet enough that portraits and documentary objects remain the focus.

## Non-negotiable visual rules

- Architecture must work in neutral grey before materials and effects.
- Realistic material response comes from geometry, bevels/normals, UVs, physically plausible roughness and lighting — not from metallic stone, mirror floors or bloom.
- Brand cyan belongs primarily to interface/brand language. It must not become the default architectural light.
- Gold/brass is secondary and restrained, not an outline around every object.
- Each poet gets an exhibit composition, not a generic card in a glowing frame.
- Documentary objects must be real, identified and rights-cleared. AI facsimiles, fake signatures and invented manuscripts are forbidden.
- No mandatory holograms, lasers, floating network lines, starfields, magic dust or other sci-fi shorthand.
- No religious altar/church simulation. Monumental rotunda/dome references may inform proportion and daylight, but poets are not staged as objects of worship.

## Reference-bible method

References are collected by function rather than by mood alone:

1. plan / circulation;
2. section / vertical proportion;
3. rotunda or central-room reveal;
4. portrait-gallery spacing;
5. stone and plaster response;
6. brass/bronze detail;
7. museum lighting;
8. archival-object display;
9. signage / plaques;
10. camera composition;
11. mobile framing;
12. accessibility / quiet navigation.

Every retained reference receives:

- `TAKE` — the exact useful property;
- `AVOID` — elements that must not migrate into Hall;
- `WHY` — how the reference solves a Hall problem;
- source URL / institution / author where known.

AI concept art may be stored separately as exploratory material and must be labelled as such.

## Spatial programme status

Previous concepts included a long neoclassical nave and later a domed four-wing “Temple of Russian Poetry”. Neither is current authority.

The current ten-poet corpus suggests a possible central space plus chronological galleries, but the number of galleries, their shape and their assignment remain **provisional until the reference and greybox gates approve them**.

No public copy or runtime code may promise:

- four wings;
- a specific dome/oculus form;
- a Soviet/contemporary wing;
- a fixed poet ordering in physical space;
- statues/busts;
- free-walk/FPS interaction.

## Exhibit hierarchy

Baseline exhibit composition:

1. hero portrait or historically authoritative likeness;
2. name and dates;
3. one restrained quotation or identifying line;
4. at most one primary documentary object in the first view;
5. DOM affordance to open deeper biography/works/research.

Additional documents and relationships appear after intentional user action, not as visual clutter in the room.

## Poet individuality

Individuality is expressed through curation, scale, lighting emphasis, documentary choice and subtle material/detail variation. It is **not** expressed by turning each poet into a different genre room.

A unified museum language outranks per-poet gimmicks.

## Camera language

Baseline navigation is directed and compositional:

- approved Blender cameras or exported camera anchors;
- scroll/trackpad/swipe or explicit destination selection;
- optional small look freedom only after the composition remains protected;
- no baseline pointer lock or WASD.

The user should not be able to accidentally view unfinished backsides, clip into architecture or destroy the intended composition.

## Effect test

For every approved shot, create a baseline with:

- bloom off;
- vignette off;
- screen-space AO off;
- particles off;
- fake volumetric rays off.

If the scene stops looking premium, the underlying art is not ready.

## Historical dignity

No exhibit uses sensational death imagery as atmosphere. Death documents, medical/legal materials and morally difficult episodes follow the same evidence/dignity standards as the rest of the site.
