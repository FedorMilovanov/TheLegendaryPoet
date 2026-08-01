# BRAND EMBLEM — SVG / MOTION ENGINEERING MARATHON 2026

Status: active research baseline for the 20+ pass emblem marathon.

## Visual authority

The only primary artistic authority is the immutable square image stored at:

`qa/reference/brand-emblem-canonical-reference.webp`

The pinned bytes show a **full-length hooded figure**: a small high pointed hood above a long widening triangular cloak, a deep black face void, restrained upper cowl, predominantly vertical fabric mass, icy edge light and electric-blue aura behind the hood and both outer sides.

An earlier prose description incorrectly called this image a close-up bust. That text is rejected. When prose and the immutable image disagree, the image plus its SHA-256 are authoritative.

`Siluette dans la brume sombre.png` is supplemental mood material only. It must not replace the pinned reference or influence approval scoring.

## Engineering conclusion

The emblem should remain a layered inline SVG, not a raster wrapper and not a canvas/WebGL replacement. The production architecture will use:

1. one canonical authored SVG geometry source;
2. semantic layers for silhouette, hood shell, inner hood, void, cowl, vertical cloak mass, secondary folds, rim, aura field and restrained texture;
3. pointer input captured once at the outer interactive element;
4. one requestAnimationFrame write phase with no layout read after style mutation;
5. normalized pointer coordinates passed through damped motion values rather than direct twitchy translation;
6. compositor-friendly transforms for large-layer depth;
7. restrained filter animation only for selected aura primitives;
8. no perpetual idle loop in the header icon;
9. explicit hover, focus-visible, pointer-leave, pointer-cancel and reduced-motion states;
10. deterministic Playwright reference matrices and runtime performance evidence.

## Prohibited shortcuts

- No `<image>`, base64 raster, canvas screenshot or CSS background hidden inside the emblem.
- No tracing the old SVG and calling it reference-derived.
- No score increase without a new exact candidate/reference matrix.
- No glow used to conceal incorrect silhouette or cloth construction.
- No identical radial fold wedges.
- No single flat `scale()` presented as an epic interaction.
- No pointer handler that performs repeated geometry reads and writes in the same frame.
- No animated `d` morph for the whole figure at header size.
- No uncontrolled animated blur over the whole SVG.
- No permanent `will-change` on every path.
- No bust-shaped redesign derived from the rejected prose description.

## Motion system target

The hover should read as awakening, not wobbling:

- **Approach:** aura wakes first, then figure mass, then rim and cloth detail.
- **Presence:** the full-length silhouette gains depth without losing its long vertical stance.
- **Cloth:** outer cloak, central mass and selected folds separate by different damped amounts; no periodic idle breathing.
- **Void:** the black face cavity deepens through tiny inverse parallax and local contrast, never by exposing features.
- **Energy:** curved aura branches gain opacity and limited organic displacement while the silhouette remains stable.
- **Exit:** spring return with no snap and no residual inline variables.
- **Keyboard:** focus-visible receives a deliberate non-pointer awakening state.
- **Reduced motion:** removes parallax, lift, displacement and cloth separation; a short opacity/rim emphasis may remain.

## Performance budget

At the live header size:

- one pointer geometry read on enter/resize, not on every pointer frame;
- at most one scheduled rAF callback at a time;
- zero React state updates during pointer movement;
- no allocations inside the hot write loop;
- no full-document layout caused by the emblem;
- no continuous animation while idle;
- no lower-page brand instances running animation when not interacted with;
- no more than a small fixed number of filtered groups;
- stable high-refresh behavior based on elapsed time rather than frame count.

## Visual QA contract

Every artistic pass must produce and inspect:

- reference/candidate at 256, 192, 128, 96, 64, 56 and 44 px;
- optical micro candidate at 32, 24 and 16 px;
- idle, entry, full awakening, pointer top-left, top-right, lower-left and lower-right;
- keyboard focus-visible;
- pointer leave after full settling;
- reduced-motion state;
- actual live header and footer;
- Chromium and WebKit screenshots in the same pinned environment.

Acceptance remains `not-reference-approved` until the owner accepts the exact visual evidence.

## 24-pass programme

1. Reference-byte identity and supplemental-reference separation.
2. Measured full-length crop, silhouette and negative-space landmarks.
3. Overall figure height, hem width and vertical-axis reset.
4. Small high hood outer contour and apex placement.
5. Face void width, depth and lower shape.
6. Inner hood layering and apex seam.
7. Restrained cowl mass without X/bow/necktie reading.
8. Left outer cloak edge from shoulder to hem.
9. Right outer cloak edge and asymmetric cloth interruptions.
10. Central long vertical fabric mass.
11. Secondary fold compression and sparse diagonal overlap.
12. Almost-black tonal hierarchy and local contrast.
13. Icy rim continuity from hood into both outer cloak edges.
14. Aura macro-field placement behind hood and full side silhouette.
15. Aura branch irregularity, dark interruptions and lower-side decay.
16. Clean dark hem and icon-safe triangular silhouette.
17. 96/64/56/44 px optical correction.
18. Dedicated 32/24/16 px micro redraw.
19. Pointer physics foundation and cached bounds.
20. Layer depth and void response.
21. Full-length cloth awakening without idle breathing.
22. Aura turbulence/displacement and phased rim drawing.
23. Focus-visible, touch and reduced-motion states.
24. Performance trace, visual regression, live-site evidence and final owner gate.

Each numbered pass is a real review gate, not version-number inflation. Several passes may share one atomic commit only when the comparison evidence still makes every decision independently inspectable.

## Primary and official source run (69 links)

### SVG platform and specifications

1. https://www.w3.org/TR/SVG/
2. https://www.w3.org/TR/SVG2/intro.html
3. https://www.w3.org/TR/SVG2/interact.html
4. https://www.w3.org/TR/SVG2/coords.html
5. https://www.w3.org/TR/SVG2/paths.html
6. https://www.w3.org/TR/SVG2/painting.html
7. https://www.w3.org/TR/SVG2/render.html
8. https://www.w3.org/TR/SVG2/struct.html
9. https://www.w3.org/TR/filter-effects-1/
10. https://www.w3.org/TR/css-transforms-1/
11. https://www.w3.org/TR/css-transforms-2/
12. https://www.w3.org/TR/pointerevents3/
13. https://www.w3.org/TR/web-animations-1/
14. https://www.w3.org/TR/mediaqueries-5/
15. https://www.w3.org/TR/wai-aria-1.2/

### MDN SVG, filters, interaction and rendering

16. https://developer.mozilla.org/en-US/docs/Web/SVG
17. https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_in_HTML
18. https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/path
19. https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/mask
20. https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/clipPath
21. https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feTurbulence
22. https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feDisplacementMap
23. https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feGaussianBlur
24. https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feComposite
25. https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feColorMatrix
26. https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feMerge
27. https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feMorphology
28. https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/linearGradient
29. https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/radialGradient
30. https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getBBox
31. https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
32. https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
33. https://developer.mozilla.org/en-US/docs/Web/API/Window/cancelAnimationFrame
34. https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent
35. https://developer.mozilla.org/en-US/docs/Web/API/Resize_Observer_API
36. https://developer.mozilla.org/en-US/docs/Web/CSS/transform-box
37. https://developer.mozilla.org/en-US/docs/Web/CSS/transform-origin
38. https://developer.mozilla.org/en-US/docs/Web/CSS/will-change
39. https://developer.mozilla.org/en-US/docs/Web/CSS/filter
40. https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events
41. https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
42. https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/img_role
43. https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Text_labels_and_names

### Motion for React

44. https://motion.dev/docs/react
45. https://motion.dev/docs/react-svg-animation
46. https://motion.dev/docs/react-gestures
47. https://motion.dev/docs/react-accessibility
48. https://motion.dev/docs/react-use-reduced-motion
49. https://motion.dev/docs/react-use-animation-frame
50. https://motion.dev/docs/react-use-motion-value
51. https://motion.dev/docs/react-use-spring
52. https://motion.dev/docs/react-use-transform
53. https://motion.dev/docs/react-motion-config

### Runtime profiling and deterministic QA

54. https://developer.chrome.com/docs/devtools/performance
55. https://developer.chrome.com/docs/devtools/performance/reference
56. https://developer.chrome.com/docs/devtools/rendering/performance
57. https://developer.chrome.com/docs/devtools/layers
58. https://developer.chrome.com/docs/devtools/css/animations
59. https://developer.chrome.com/blog/hardware-accelerated-animations
60. https://playwright.dev/docs/test-snapshots
61. https://playwright.dev/docs/screenshots
62. https://playwright.dev/docs/emulation
63. https://playwright.dev/docs/trace-viewer
64. https://playwright.dev/docs/test-projects

### React ownership and hot-loop discipline

65. https://react.dev/reference/react/useEffect
66. https://react.dev/reference/react/useLayoutEffect
67. https://react.dev/reference/react/useRef
68. https://react.dev/reference/react/useMemo
69. https://react.dev/reference/react/memo

## Research decision

The next geometry pass is not another glow polish and not a bust reset. It is a measured full-length silhouette pass against the pinned square reference: figure height, small hood placement, long cloak taper, clean hem, icy outer rim and irregular side aura. The current v17 production geometry remains in place until a candidate is visibly superior in exact comparison matrices.
