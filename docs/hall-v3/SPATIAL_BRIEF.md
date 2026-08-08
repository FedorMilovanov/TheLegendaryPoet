# Hall v3 — Spatial Brief for the Metric Greybox Shootout

Status: **Reference Bible / completed; Metric Greybox / active**. This brief defines what the neutral Blender greyboxes must prove. It does not approve a building form or camera winner.

## Design question

Find a spatial system that can carry literary chronology, a strong first reveal, clear onward orientation, intimate object-led poet encounters and mobile/accessible viewing **without** depending on free-look navigation, giant HUD labels, ornament or post-processing.

The three starting hypotheses below must be compared at the same neutral quality. A better fourth option is allowed only if it is evaluated against the same evidence package in a later explicit contract update; the current machine candidate set remains H1/H2/H3.

## Hard evidence dimensions

Blender uses metres from the first blockout.

| Constraint | Evidence floor / guide | Greybox use |
| --- | ---: | --- |
| One-way clear route | 0.915 m | Absolute minimum witness, not a target corridor width |
| Two-way / stopping-friendly route | 1.525 m | Default minimum witness for a principal museum path where stopping is expected |
| Accessible viewing clearance | 0.76 × 1.22 m | Keep clear at an accessible side of a case/display |
| Clear headroom | 2.03 m | Absolute circulation witness |
| Sensitive paper light | ~50 lux or as low as practical | Later lighting evidence guide, not a hard production setpoint during greybox |

These values come from Smithsonian Accessible Exhibition Design and Canadian Conservation Institute paper-care guidance. They are minimum/evidence constraints, not a licence to make the museum cramped.

## Shared exhibit grammar

Every candidate must support the same object hierarchy for the first Pushkin test:

1. **Anchor:** one dominant Pushkin portrait with a deliberate background/light relationship.
2. **Evidence field:** at most a small number of secondary documentary objects in the first view.
3. **Controlled document pocket:** a plausible low-light position for paper/manuscript material without darkening the whole circulation route.
4. **Accessible context action:** biography, provenance, citations, transcript/visual description and long labels live in authoritative DOM rather than floating 3D HUD copy.
5. **Return/orientation:** leaving the close-looking position makes the next spatial choice obvious.

The greybox uses proxies, not rights-uncleared historical image files.

## H1 — Orientation court + chronological branches

**Question:** Can a strong central orientation/reveal space distribute visitors into chronological groups without becoming an empty monumental lobby?

**Potential strength**

- easiest high-level map;
- multiple destinations can be visible immediately;
- chronology can be expressed as route choice rather than forced sequence.

**Must prove**

- at least one next destination is legible from the orientation point;
- branch identity works with architecture/exhibit hierarchy, not giant floating labels;
- return path does not require long dead travel;
- the centre still has visual/circulation purpose with all UI hidden;
- mobile entry framing does not become an empty symmetrical void.

**Primary failure mode:** impressive centre + repetitive peripheral corridors.

## H2 — Directed chronological promenade + focus bays

**Question:** Can a primarily linear route communicate chronology while avoiding Hall v2's failed uniform nave?

**Potential strength**

- clearest guided-camera narrative;
- sequence can build historical progression naturally;
- compact first vertical slice.

**Must prove**

- deliberate compression/release and sightline changes instead of constant width;
- poet bays can be entered without blocking the principal route;
- later periods have direct cuts/shortcuts and do not require full prior traversal;
- no sequence of ten equivalent wall niches;
- the route remains understandable without FPS/free-look.

**Primary failure mode:** Hall v2 with better modelling.

## H3 — Asymmetric orientation + diagonal/curved trajectory + side focus rooms

**Question:** Can a less symmetrical museum produce stronger cinematic sightlines and anchor works while retaining clear wayfinding?

**Potential strength**

- strongest opportunity for a meaningful long view;
- less risk of ceremonial symmetry becoming the product concept;
- natural alternation between movement and close-looking rooms.

**Must prove**

- one clear establishing direction at entry;
- long view terminates on a meaningful exhibit/architectural anchor;
- side rooms return the visitor to an understandable orientation state;
- mobile portrait framing does not collapse into crossing walls/occlusion;
- asymmetry does not require UI arrows to explain the graph.

**Primary failure mode:** visually exciting but confusing spatial graph.

## Identical evidence package for every greybox candidate

Do not compare one polished candidate with two rough rejects. All candidates use the same neutral material, human proxy and candidate lens/FOV set.

Each candidate must eventually produce:

1. one dimensioned plan;
2. at least two sections;
3. entry/reveal camera;
4. orientation camera;
5. first-transition camera;
6. Pushkin approach camera;
7. Pushkin viewing camera;
8. reverse/exit camera;
9. at least three portrait-mobile crops from equivalent journey points;
10. top-down sightline/occlusion diagram;
11. approximate baseline route length and forced-turn count;
12. visible-next-destination note at every certified camera.

## Camera contract for the current greybox phase

Metric greybox still does not approve a camera rig. It fixes the witness positions that every candidate must support:

- `entryReveal`
- `orientation`
- `firstTransition`
- `pushkinApproach`
- `pushkinViewing`
- `reverseExit`

Before Camera Approval, each candidate uses the same small lens/FOV set once that candidate set is explicitly selected. Do not tune a unique flattering lens for one topology.

## Automatic rejection before materials

Reject a candidate if any of the following is true:

- its strongest image depends on a dome, ornament, bloom, fog, particles or dramatic light absent in neutral grey;
- intended cameras expose unfinished backs/sides of architecture;
- the first poet reads as a UI card attached to a wall rather than an exhibit composition;
- equivalent bays repeat without spatial hierarchy;
- route comprehension depends on FPS/free-look;
- large labels/HUD are needed for basic wayfinding;
- portrait-mobile framing has no viable crop without redesigning geometry;
- central/transition space has no job beyond spectacle;
- inaccessible clearances are being excused as a future polish task;
- a candidate survives only because more time has already been spent on it.

## Explicit non-decisions

This brief does not approve:

- H1, H2 or H3 as winner;
- a dome;
- a rotunda;
- four wings;
- a fixed era count/topology;
- exact room sizes above the evidence minima;
- final lenses/FOV;
- final materials;
- a final light strategy;
- a WebGL control model.

## Tooling boundary

The active tooling/preflight transaction pins Blender 4.5.12 from the official 4.5 LTS release archive and proves it headlessly in CI with the vendor checksum and a metre-scale save/reopen smoke scene. That exact pin is current greybox tooling authority, not permanent project doctrine; a later material/export gate may re-evaluate it explicitly. Absence of Blender in an assistant container is never permission to author architecture in JSX.

## Gate exit

Reference Bible is completed and metric greybox is active. Gate 2 completes only after comparable H1/H2/H3 neutral evidence exists and one candidate is selected or all are rejected with recorded reasons. The current tooling/preflight transaction alone does not complete Gate 2.
