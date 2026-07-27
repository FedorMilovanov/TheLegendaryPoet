import fs from 'node:fs';

function patch(filePath, replacements) {
  let source = fs.readFileSync(filePath, 'utf8');
  for (const [before, after, label] of replacements) {
    const first = source.indexOf(before);
    const last = source.lastIndexOf(before);
    if (first < 0) throw new Error(`${filePath}: missing ${label}`);
    if (first !== last) throw new Error(`${filePath}: ${label} is not unique`);
    source = source.slice(0, first) + after + source.slice(first + before.length);
  }
  fs.writeFileSync(filePath, source);
}

patch('src/components/essay/blocks.tsx', [
  [
    "import { asset } from '../../utils/asset';\nimport TiltCard from '../TiltCard';",
    "import { asset } from '../../utils/asset';\nimport { useNativeImageState } from '../../hooks/useNativeImageState';\nimport TiltCard from '../TiltCard';",
    'native image hook import',
  ],
  [
    "  const [open, setOpen] = useState(false);\n  const [loaded, setLoaded] = useState(false);\n  const [zoomed, setZoomed] = useState(false);",
    "  const [open, setOpen] = useState(false);\n  const [zoomed, setZoomed] = useState(false);",
    'synthetic-event-only loaded state',
  ],
  [
    "  const imageSrc = asset(block.src);\n  const frameClass =",
    "  const imageSrc = asset(block.src);\n  const { ref: imageRef, state: imageState, ready: imageReady } = useNativeImageState(imageSrc);\n  const frameClass =",
    'native image state binding',
  ],
  [
    `        {!loaded && (\n          <span className="absolute inset-0 overflow-hidden bg-[#0d0d0d]">\n            <span className="absolute inset-y-0 -left-1/2 w-1/2 animate-[shimmer_1.7s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.055] to-transparent motion-reduce:animate-none" />\n          </span>\n        )}`,
    `        {!imageReady && (\n          <span className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[#0d0d0d]">\n            {imageState === 'error' ? (\n              <span className="px-6 text-center text-[11px] uppercase tracking-[0.16em] text-luxury-gray-light/45">\n                Изображение временно недоступно\n              </span>\n            ) : (\n              <span className="absolute inset-y-0 -left-1/2 w-1/2 animate-[shimmer_1.7s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.055] to-transparent motion-reduce:animate-none" />\n            )}\n          </span>\n        )}`,
    'image loading placeholder',
  ],
  [
    `        <img\n          src={imageSrc}\n          alt={block.alt}\n          loading="lazy"\n          decoding="async"\n          sizes={sizes}\n          onLoad={() => setLoaded(true)}\n          className={\`h-full w-full object-cover grayscale-[0.08] transition-[opacity,transform,filter] duration-700 ease-out group-hover:scale-[1.022] group-hover:contrast-[1.045] \${loaded ? 'opacity-100' : 'opacity-0'}\`}\n          style={{ objectPosition: block.objectPosition || '50% 50%' }}\n        />`,
    `        <img\n          ref={imageRef}\n          src={imageSrc}\n          alt={block.alt}\n          loading="lazy"\n          decoding="async"\n          sizes={sizes}\n          data-image-state={imageState}\n          className={\`h-full w-full object-cover grayscale-[0.08] transition-[opacity,transform,filter] duration-700 ease-out group-hover:scale-[1.022] group-hover:contrast-[1.045] \${imageReady ? 'opacity-100' : 'opacity-0'}\`}\n          style={{ objectPosition: block.objectPosition || '50% 50%' }}\n        />`,
    'essay image element readiness contract',
  ],
]);

patch('qa/hover-stability.spec.mjs', [
  [
    `async function isPaintedImage(image) {\n  return image.evaluate((node) => {\n    const style = getComputedStyle(node);\n    return Number(style.opacity) > 0.01 && style.visibility !== 'hidden' && style.display !== 'none';\n  });\n}`,
    `async function isRenderableImage(image) {\n  return image.evaluate((node) => {\n    const style = getComputedStyle(node);\n    const rect = node.getBoundingClientRect();\n    return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;\n  });\n}`,
    'painted-image prefilter',
  ],
  [
    "    if (await image.isVisible() && await isPaintedImage(image)) sampledImages.push(image);",
    "    if (await image.isVisible() && await isRenderableImage(image)) sampledImages.push(image);",
    'renderable image sampling',
  ],
  [
    `async function samplePointerInteraction(page, image, finePointer) {`,
    `async function prepareImageForSampling(image, finePointer) {\n  await ensureNativeImageReady(image);\n  await expect.poll(\n    async () => (await imageSnapshot(image)).state,\n    { timeout: 4_000, message: 'component image state settled after native completion' },\n  ).not.toBe('loading');\n\n  let initial = await imageSnapshot(image);\n  expect(initial.state).not.toBe('failed');\n\n  if (initial.opacity <= 0.01) {\n    const className = await image.getAttribute('class') ?? '';\n    const intentionalReveal = /(?:group-hover|hover|group-focus-within|focus-visible):opacity-(?!0(?:\\s|$))/.test(className);\n\n    if (!intentionalReveal) {\n      await expect.poll(\n        async () => (await imageSnapshot(image)).opacity,\n        { timeout: 4_000, message: 'loaded interactive artwork became painted' },\n      ).toBeGreaterThan(0.01);\n      initial = await imageSnapshot(image);\n      return { initial, enforceOpacity: true };\n    }\n\n    if (finePointer) {\n      await image.hover();\n      await expect.poll(\n        async () => (await imageSnapshot(image)).opacity,\n        { timeout: 2_000, message: 'intentional hover-reveal artwork became painted' },\n      ).toBeGreaterThan(0.01);\n      initial = await imageSnapshot(image);\n    }\n    return { initial, enforceOpacity: false };\n  }\n\n  return { initial, enforceOpacity: true };\n}\n\nasync function samplePointerInteraction(page, image, finePointer) {`,
    'post-load painted-state preparation',
  ],
  [
    `function assertStableSamples(initial, samples) {\n  const minimumOpacity = Math.max(0.01, initial.opacity - 0.05);`,
    `function assertStableSamples(initial, samples, enforceOpacity) {\n  const minimumOpacity = Math.max(0.01, initial.opacity - 0.05);`,
    'conditional opacity assertion signature',
  ],
  [
    "    expect(sample.opacity).toBeGreaterThanOrEqual(minimumOpacity);",
    "    if (enforceOpacity) expect(sample.opacity).toBeGreaterThanOrEqual(minimumOpacity);",
    'conditional opacity stability assertion',
  ],
  [
    "    expect(sampledImages.length, `painted interactive artwork on ${surface.path}`).toBeGreaterThanOrEqual(surface.minimum);",
    "    expect(sampledImages.length, `renderable interactive artwork on ${surface.path}`).toBeGreaterThanOrEqual(surface.minimum);",
    'renderable artwork minimum',
  ],
  [
    `    for (const image of sampledImages) {\n      await ensureNativeImageReady(image);\n\n      const initial = await imageSnapshot(image);\n      expect(initial.opacity).toBeGreaterThan(0.01);\n      expect(initial.state).not.toBe('failed');\n      expect(initial.transitionProperty).not.toContain('all');\n      expect(initial.backfaceVisibility).toBe('hidden');\n      const samples = await samplePointerInteraction(page, image, finePointer);\n      assertStableSamples(initial, samples);`,
    `    for (const image of sampledImages) {\n      const { initial, enforceOpacity } = await prepareImageForSampling(image, finePointer);\n      expect(initial.transitionProperty).not.toContain('all');\n      expect(initial.backfaceVisibility).toBe('hidden');\n      const samples = await samplePointerInteraction(page, image, finePointer);\n      assertStableSamples(initial, samples, enforceOpacity);`,
    'prepared sampling loop',
  ],
]);

patch('scripts/validate-hover-stability.ts', [
  [
    `const sourceFiles = walk('src').filter((filePath) => /\\.(?:tsx?|css)$/.test(filePath));`,
    `const nativeImageHook = read('src/hooks/useNativeImageState.ts');\nfor (const [text, label] of [\n  ["image.addEventListener('load', synchronize)", 'native load listener'],\n  ["image.addEventListener('error', synchronize)", 'native error listener'],\n  ["image.naturalWidth > 0 ? 'ready' : 'error'", 'cached-image completeness synchronization'],\n]) {\n  if (!nativeImageHook.includes(text)) errors.push(\`src/hooks/useNativeImageState.ts: missing \${label}\`);\n}\n\nconst essayBlocks = read('src/components/essay/blocks.tsx');\nfor (const [text, label] of [\n  ["useNativeImageState(imageSrc)", 'shared native image readiness hook'],\n  ['data-image-state={imageState}', 'runtime image state marker'],\n  ["imageReady ? 'opacity-100' : 'opacity-0'", 'readiness-driven visibility'],\n]) {\n  if (!essayBlocks.includes(text)) errors.push(\`src/components/essay/blocks.tsx: missing \${label}\`);\n}\nif (essayBlocks.includes('onLoad={() => setLoaded(true)}')) {\n  errors.push('src/components/essay/blocks.tsx: synthetic onLoad must not be the sole readiness source');\n}\n\nconst sourceFiles = walk('src').filter((filePath) => /\\.(?:tsx?|css)$/.test(filePath));`,
    'native image readiness static contract',
  ],
  [
    `  ['initial.opacity - 0.05', 'relative opacity stability assertion'],`,
    `  ['initial.opacity - 0.05', 'relative opacity stability assertion'],\n  ['component image state settled after native completion', 'native/component readiness synchronization'],\n  ['loaded interactive artwork became painted', 'post-load painted-state assertion'],`,
    'runtime readiness validator requirements',
  ],
]);

console.log('Applied native image readiness and post-load hover QA contract');
